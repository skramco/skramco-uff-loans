/**
 * Creates broker landing pages on uff.pro (ProWebsiteUFF) via GitHub API.
 * Each marketing campaign gets content/campaigns/{slug}.json + /lp/{slug} route.
 */

import { callOpenAI } from "./openaiClient.ts";
import { PRO_PORTAL_PRODUCT_CONTEXT } from "./proPortalContext.ts";
import type { GeneratedCampaignContent } from "./types.ts";

export const LANDING_PAGE_PLACEHOLDER = "{{LANDING_PAGE_URL}}";

export interface ProLandingPageResult {
  slug: string;
  url: string;
  githubPath: string;
  githubCommit?: string;
  skipped?: boolean;
  reason?: string;
}

export interface CampaignLandingPageJson {
  slug: string;
  title: string;
  subtitle: string;
  campaignId: string;
  campaignType: string;
  publishedAt: string;
  heroImageUrl?: string | null;
  keyTakeaways: string[];
  sections: Array<{ heading: string; body: string; bullets?: string[] }>;
  ctaLabel: string;
  secondaryCtaLabel?: string;
  metaDescription: string;
}

function getProLandingBaseUrl(): string {
  return (Deno.env.get("PRO_LANDING_BASE_URL") || "https://www.uff.pro").replace(/\/$/, "");
}

function getGitHubRepo(): string {
  return Deno.env.get("PRO_WEBSITE_GITHUB_REPO") || "skramco/skramco-uff-pro";
}

function getGitHubBranch(): string {
  return Deno.env.get("PRO_WEBSITE_GITHUB_BRANCH") || "main";
}

export function slugifyCampaignTitle(title: string, campaignId: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  const suffix = campaignId.replace(/-/g, "").slice(0, 8);
  return `${base || "campaign"}-${suffix}`;
}

function encodeBase64Utf8(content: string): string {
  const bytes = new TextEncoder().encode(content);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

async function githubGetFileSha(path: string): Promise<string | null> {
  const token = Deno.env.get("GITHUB_TOKEN");
  if (!token) return null;
  const repo = getGitHubRepo();
  const branch = getGitHubBranch();
  const url = `https://api.github.com/repos/${repo}/contents/${path}?ref=${encodeURIComponent(branch)}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub get file failed: ${res.status} ${text.slice(0, 200)}`);
  }
  const data = await responseJson(res);
  return typeof data.sha === "string" ? data.sha : null;
}

async function responseJson(res: Response): Promise<Record<string, unknown>> {
  return (await res.json()) as Record<string, unknown>;
}

export async function pushFileToGitHub(
  path: string,
  content: string,
  commitMessage: string
): Promise<{ sha?: string; commitSha?: string }> {
  const token = Deno.env.get("GITHUB_TOKEN");
  if (!token) {
    throw new Error("GITHUB_TOKEN not configured — required to publish ProWebsiteUFF landing pages");
  }

  const repo = getGitHubRepo();
  const branch = getGitHubBranch();
  const sha = await githubGetFileSha(path);

  const body: Record<string, unknown> = {
    message: commitMessage,
    content: encodeBase64Utf8(content),
    branch,
  };
  if (sha) body.sha = sha;

  const res = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub push failed: ${res.status} ${text.slice(0, 300)}`);
  }

  const data = await responseJson(res);
  const commit = data.commit as Record<string, unknown> | undefined;
  return {
    sha: typeof data.content === "object" && data.content && "sha" in (data.content as object)
      ? String((data.content as Record<string, unknown>).sha)
      : undefined,
    commitSha: commit?.sha ? String(commit.sha) : undefined,
  };
}

async function generateLandingPageJson(
  campaignId: string,
  content: GeneratedCampaignContent
): Promise<CampaignLandingPageJson> {
  const slug = slugifyCampaignTitle(content.title, campaignId);
  const systemPrompt = `You write broker-facing landing page content for United Fidelity Funding (UFF) wholesale mortgage.
Return JSON only. Content must be practical, specific, and valuable for mortgage brokers — not generic marketing fluff.
Do not promise specific rates or guaranteed approvals. NMLS 34381. Audience: wholesale brokers using PRO Portal.

${PRO_PORTAL_PRODUCT_CONTEXT}`;

  const userPrompt = `Create landing page content expanding on this email campaign topic.

Campaign type: ${content.campaign_type}
Title: ${content.title}
Summary: ${content.internal_summary}
Email subject: ${content.email_subject}
Email body excerpt: ${stripHtml(content.email_html).slice(0, 2000)}

Return JSON:
{
  "title": "string (compelling H1, can match email title)",
  "subtitle": "string (1-2 sentences)",
  "metaDescription": "string (150-160 chars for SEO)",
  "keyTakeaways": ["3-5 actionable bullet strings for brokers"],
  "sections": [
    { "heading": "string", "body": "string (2-4 sentences)", "bullets": ["optional tips"] }
  ],
  "secondaryCtaLabel": "Become a UFF Partner"
}`;

  const raw = await callOpenAI(systemPrompt, userPrompt);
  const parsed = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] ?? raw) as Record<string, unknown>;

  const sections = Array.isArray(parsed.sections)
    ? (parsed.sections as Array<Record<string, unknown>>).map((s) => ({
        heading: String(s.heading ?? "Overview"),
        body: String(s.body ?? ""),
        bullets: Array.isArray(s.bullets) ? s.bullets.map(String) : undefined,
      }))
    : [];

  return {
    slug,
    title: String(parsed.title ?? content.title),
    subtitle: String(parsed.subtitle ?? content.preview_text ?? content.internal_summary),
    campaignId,
    campaignType: content.campaign_type,
    publishedAt: new Date().toISOString(),
    heroImageUrl: null,
    keyTakeaways: Array.isArray(parsed.keyTakeaways)
      ? parsed.keyTakeaways.map(String).slice(0, 6)
      : [],
    sections: sections.slice(0, 6),
    ctaLabel: content.call_to_action || "Log in to PRO Portal",
    secondaryCtaLabel: String(parsed.secondaryCtaLabel ?? "Become a UFF Partner"),
    metaDescription: String(parsed.metaDescription ?? content.preview_text ?? content.title).slice(
      0,
      160
    ),
  };
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export function buildLandingPageUrl(slug: string): string {
  return `${getProLandingBaseUrl()}/lp/${slug}`;
}

/** Point all links in email body fragment to the campaign landing page. */
export function rewriteBodyLinksForLanding(bodyHtml: string, landingUrl: string): string {
  let out = bodyHtml.replaceAll(LANDING_PAGE_PLACEHOLDER, landingUrl);

  out = out.replace(/<a\s+([^>]*?)href=["']([^"']+)["']([^>]*)>/gi, (match, pre, href, post) => {
    const h = href.trim().toLowerCase();
    if (h.startsWith("mailto:") || h.startsWith("tel:") || h.startsWith("#")) return match;
    return `<a ${pre}href="${landingUrl}"${post}>`;
  });

  return out;
}

export function rewritePlainTextLinksForLanding(text: string, landingUrl: string): string {
  let out = text.replaceAll(LANDING_PAGE_PLACEHOLDER, landingUrl);
  out = out.replace(/https?:\/\/[^\s]+/g, landingUrl);
  if (!out.includes(landingUrl)) {
    out = `${out.trim()}\n\nRead more: ${landingUrl}`;
  }
  return out;
}

/** Ensure LinkedIn caption includes the campaign landing page URL (single CTA link). */
export function rewriteLinkedInPostForLanding(text: string, landingUrl: string): string {
  let out = text.replaceAll(LANDING_PAGE_PLACEHOLDER, landingUrl).trim();
  if (!out.includes(landingUrl)) {
    out = `${out}\n\n${landingUrl}`;
  }
  return out;
}

export async function createAndPublishProLandingPage(
  campaignId: string,
  content: GeneratedCampaignContent
): Promise<ProLandingPageResult> {
  if (!Deno.env.get("GITHUB_TOKEN")) {
    const slug = slugifyCampaignTitle(content.title, campaignId);
    return {
      slug,
      url: buildLandingPageUrl(slug),
      githubPath: `content/campaigns/${slug}.json`,
      skipped: true,
      reason: "GITHUB_TOKEN not configured",
    };
  }

  const landing = await generateLandingPageJson(campaignId, content);
  const githubPath = `content/campaigns/${landing.slug}.json`;
  const json = `${JSON.stringify(landing, null, 2)}\n`;

  const { commitSha } = await pushFileToGitHub(
    githubPath,
    json,
    `marketing: add landing page ${landing.slug} (${content.campaign_type})`
  );

  return {
    slug: landing.slug,
    url: buildLandingPageUrl(landing.slug),
    githubPath,
    githubCommit: commitSha,
  };
}

export async function updateLandingPageHeroImage(
  slug: string,
  heroImageUrl: string
): Promise<void> {
  if (!Deno.env.get("GITHUB_TOKEN")) return;

  const githubPath = `content/campaigns/${slug}.json`;
  const sha = await githubGetFileSha(githubPath);
  if (!sha) return;

  const token = Deno.env.get("GITHUB_TOKEN")!;
  const repo = getGitHubRepo();
  const branch = getGitHubBranch();
  const getRes = await fetch(
    `https://api.github.com/repos/${repo}/contents/${githubPath}?ref=${encodeURIComponent(branch)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }
  );
  if (!getRes.ok) return;

  const fileData = await responseJson(getRes);
  const encoded = typeof fileData.content === "string" ? fileData.content.replace(/\n/g, "") : "";
  const decoded = new TextDecoder().decode(
    Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0))
  );
  const landing = JSON.parse(decoded) as CampaignLandingPageJson;
  landing.heroImageUrl = heroImageUrl;

  await pushFileToGitHub(
    githubPath,
    `${JSON.stringify(landing, null, 2)}\n`,
    `marketing: add hero image to landing page ${slug}`
  );
}

export function isProLandingConfigured(): boolean {
  return !!Deno.env.get("GITHUB_TOKEN");
}
