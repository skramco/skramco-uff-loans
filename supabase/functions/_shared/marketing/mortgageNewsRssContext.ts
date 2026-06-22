/**
 * Same-day mortgage market headlines from industry RSS feeds.
 * Used for daily_rate_update — skips generation when no headlines published today (ET).
 */

import { formatLinkedInCaption } from "./linkedinPostFormat.ts";

export const MORTGAGE_NEWS_FEEDS = [
  { name: "Mortgage News Daily", url: "https://www.mortgagenewsdaily.com/rss/full" },
  { name: "HousingWire Mortgage", url: "https://www.housingwire.com/mortgage/feed/" },
  { name: "National Mortgage News", url: "https://www.nationalmortgagenews.com/feed" },
  { name: "Mortgage Professional (US)", url: "https://www.mpamag.com/us/rss" },
  {
    name: "Inside Mortgage Finance — Originations",
    url: "https://www.insidemortgagefinance.com/rss/topic/1580-originations",
  },
] as const;

export class DailyMarketBriefingUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DailyMarketBriefingUnavailableError";
  }
}

export interface MortgageNewsItem {
  source: string;
  title: string;
  link: string;
  publishedAt: string;
  excerpt: string;
}

const FETCH_TIMEOUT_MS = 14_000;
const MAX_ITEMS_PER_FEED = 6;
const MAX_TOTAL_ITEMS = 14;

/** Calendar date YYYY-MM-DD in America/New_York. */
export function getEtYmd(ref: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(ref);
}

/** Human-readable date for broker-facing copy (Eastern). */
export function getTodayBriefingDateLabel(ref: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(ref);
}

const DATE_BANNER_STYLE =
  'font-family:Arial,sans-serif;font-size:14px;color:#64748b;line-height:1.5;margin:0 0 20px;padding:12px 16px;background:#f8fafc;border-left:4px solid #dc2626;border-radius:4px;';

function contentIncludesDate(text: string, dateLabel: string, ymd: string): boolean {
  const lower = text.toLowerCase();
  return lower.includes(dateLabel.toLowerCase()) || lower.includes(ymd);
}

/** Ensures recipients see this briefing is from today (ET). */
export function enforceDailyBriefingDateFields(
  campaign: {
    title?: string;
    email_subject?: string;
    preview_text?: string;
    email_html?: string;
    email_text?: string;
    linkedin_post?: string;
    internal_summary?: string;
  },
  ref: Date = new Date()
): void {
  const dateLabel = getTodayBriefingDateLabel(ref);
  const ymd = getEtYmd(ref);
  const dateBannerHtml = `<p style="${DATE_BANNER_STYLE}"><strong style="color:#0f172a;">${dateLabel}</strong> · End-of-day wholesale market briefing</p>`;
  const dateLinePlain = `${dateLabel} — End-of-day wholesale market briefing\n\n`;

  campaign.title = `Market Briefing — ${dateLabel}`;

  const subjectBase = (campaign.email_subject ?? "Today's mortgage market briefing").replace(
    /^(Market Briefing[^—]*—\s*)?/i,
    ""
  );
  campaign.email_subject = contentIncludesDate(campaign.email_subject ?? "", dateLabel, ymd)
    ? campaign.email_subject!
    : `Market Briefing — ${dateLabel}: ${subjectBase}`.slice(0, 150);

  if (!contentIncludesDate(campaign.preview_text ?? "", dateLabel, ymd)) {
    campaign.preview_text = `Today's briefing for ${dateLabel}. ${campaign.preview_text ?? ""}`.slice(
      0,
      200
    );
  }

  if (campaign.email_html && !contentIncludesDate(campaign.email_html, dateLabel, ymd)) {
    campaign.email_html = dateBannerHtml + campaign.email_html;
  }

  if (campaign.email_text && !contentIncludesDate(campaign.email_text, dateLabel, ymd)) {
    campaign.email_text = dateLinePlain + campaign.email_text;
  }

  if (campaign.linkedin_post && !contentIncludesDate(campaign.linkedin_post, dateLabel, ymd)) {
    campaign.linkedin_post = formatLinkedInCaption(`${dateLabel} — ${campaign.linkedin_post}`).slice(
      0,
      3000
    );
  }

  if (campaign.internal_summary && !contentIncludesDate(campaign.internal_summary, dateLabel, ymd)) {
    campaign.internal_summary = `${dateLabel}: ${campaign.internal_summary}`;
  }
}

export function getDailyBriefingDatePromptBlock(ref: Date = new Date()): string {
  const dateLabel = getTodayBriefingDateLabel(ref);
  const ymd = getEtYmd(ref);
  return `
REQUIRED DATE (America/New_York — must appear so brokers know this is TODAY's briefing):
- Briefing date: ${dateLabel} (${ymd})
- title: MUST be "Market Briefing — ${dateLabel}"
- email_subject: MUST start with "Market Briefing — ${dateLabel}:"
- preview_text: MUST mention "Today's briefing for ${dateLabel}"
- email_html: First visible element MUST be a short date line: "${dateLabel} · End-of-day wholesale market briefing"
- email_text: First line MUST be "${dateLabel} — End-of-day wholesale market briefing"
- linkedin_post: Open with "${dateLabel} —" before the insight
`.trim();
}

export function isSameEtDay(pubDate: string, ref: Date = new Date()): boolean {
  const parsed = new Date(pubDate);
  if (Number.isNaN(parsed.getTime())) return false;
  return getEtYmd(parsed) === getEtYmd(ref);
}

function stripHtml(html: string): string {
  return html
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function getTag(block: string, tag: string): string {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = block.match(re);
  if (!m) return "";
  return stripHtml(m[1]);
}

function parseRss2Items(xml: string, source: string): MortgageNewsItem[] {
  const items: MortgageNewsItem[] = [];
  const itemBlocks = xml.match(/<item[\s\S]*?<\/item>/gi) ?? [];
  for (const block of itemBlocks.slice(0, 25)) {
    const title = getTag(block, "title");
    const link = getTag(block, "link");
    const pubDate = getTag(block, "pubDate") || getTag(block, "dc:date");
    const description =
      getTag(block, "description") || getTag(block, "content:encoded") || getTag(block, "summary");
    if (!title || !pubDate) continue;
    items.push({
      source,
      title,
      link: link || "",
      publishedAt: pubDate,
      excerpt: description.slice(0, 400),
    });
  }
  return items;
}

function parseAtomEntries(xml: string, source: string): MortgageNewsItem[] {
  const items: MortgageNewsItem[] = [];
  const entryBlocks = xml.match(/<entry[\s\S]*?<\/entry>/gi) ?? [];
  for (const block of entryBlocks.slice(0, 25)) {
    const title = getTag(block, "title");
    let link = "";
    const linkHref = block.match(/<link[^>]+href=["']([^"']+)["']/i);
    if (linkHref) link = linkHref[1];
    const pubDate = getTag(block, "updated") || getTag(block, "published");
    const description =
      getTag(block, "summary") || getTag(block, "content") || getTag(block, "description");
    if (!title || !pubDate) continue;
    items.push({
      source,
      title,
      link,
      publishedAt: pubDate,
      excerpt: description.slice(0, 400),
    });
  }
  return items;
}

function parseFeedXml(xml: string, source: string): MortgageNewsItem[] {
  const lower = xml.slice(0, 2000).toLowerCase();
  if (lower.includes("<feed") && lower.includes("xmlns")) {
    return parseAtomEntries(xml, source);
  }
  return parseRss2Items(xml, source);
}

async function fetchFeedXml(url: string): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
        "User-Agent": "UFF-Marketing-Automation/1.0",
      },
    });
    if (!res.ok) return null;
    const text = await res.text();
    if (text.length < 200 || !/<(rss|feed|channel|item|entry)/i.test(text)) return null;
    return text;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchTodayMortgageHeadlines(
  ref: Date = new Date()
): Promise<MortgageNewsItem[]> {
  const todayEt = getEtYmd(ref);
  const allToday: MortgageNewsItem[] = [];

  const results = await Promise.all(
    MORTGAGE_NEWS_FEEDS.map(async (feed) => {
      const xml = await fetchFeedXml(feed.url);
      if (!xml) return [] as MortgageNewsItem[];
      const parsed = parseFeedXml(xml, feed.name);
      return parsed
        .filter((item) => isSameEtDay(item.publishedAt, ref))
        .slice(0, MAX_ITEMS_PER_FEED);
    })
  );

  for (const batch of results) {
    allToday.push(...batch);
  }

  allToday.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  return allToday.slice(0, MAX_TOTAL_ITEMS);
}

export function formatTodayHeadlinesForPrompt(
  items: MortgageNewsItem[],
  todayEt: string
): string {
  const lines: string[] = [
    `TODAY'S MORTGAGE MARKET HEADLINES (${todayEt}, America/New_York)`,
    "Source: industry RSS feeds listed below. Summarize ONLY these stories — do not invent news, rates, or Fed actions.",
    "Attribute themes to headlines (e.g. 'per Mortgage News Daily') without claiming UFF published the research.",
    "UFF does NOT offer a daily market subscription — this is a broker intelligence recap of public trade press.",
    "",
  ];

  for (const item of items) {
    lines.push(`- [${item.source}] ${item.title}`);
    if (item.link) lines.push(`  Link: ${item.link}`);
    lines.push(`  Published: ${item.publishedAt}`);
    if (item.excerpt) lines.push(`  Summary: ${item.excerpt}`);
    lines.push("");
  }

  lines.push(
    "Write for wholesale brokers: what changed today, who to call, lock/pricing posture, product/scenario angles.",
    "If FRED figures are included separately, cite their observation dates — do not treat weekly PMMS as 'today's move' unless dated today."
  );

  return lines.join("\n");
}

export const DAILY_MARKET_BRIEFING_PROMPT_RULES = `
DAILY MARKET BRIEFING RULES (same-day only):
- Recipients must immediately see today's full date (weekday, month, day, year) in title, subject, preview, and the first line of the email body.
- Lead with TODAY's headlines from the RSS block — this email must reflect current-day market news, not a generic rate template.
- Do NOT fabricate headlines, rate moves, or economic releases not supported by the provided sources.
- Do NOT claim UFF publishes daily commentary, rate alerts, or research subscriptions.
- Connect news to broker actions (lock timing, refi outreach, purchase pipeline, product fit) without promising UFF rates.
- One practical numbered action list for brokers; CTA to PRO Portal for pricing/scenarios only.
`.trim();
