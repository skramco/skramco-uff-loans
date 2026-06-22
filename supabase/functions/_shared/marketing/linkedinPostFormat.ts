import { PRO_PORTAL_PUBLIC_PAGE_URL } from "./proPortalContext.ts";

export const LANDING_PAGE_PLACEHOLDER = "{{LANDING_PAGE_URL}}";

/** Replaced with https://www.uff.pro/pro-portal at generation; landing URL applied on approval. */
export const LINKEDIN_PRO_PORTAL_PLACEHOLDER = "{{PRO_PORTAL_URL}}";

const URL_RE = /https?:\/\/[^\s]+/g;

function isHashtagLine(line: string): boolean {
  const t = line.trim();
  if (!t) return false;
  const tags = t.match(/#[A-Za-z0-9_]+/g) ?? [];
  const nonTag = t.replace(/#[A-Za-z0-9_]+/g, "").trim();
  if (tags.length >= 2) return true;
  if (tags.length >= 1 && nonTag.length < 20) return true;
  return t.startsWith("#") && nonTag.length === 0;
}

/**
 * Enforce LinkedIn caption order:
 * 1. Educational body (no URLs/hashtags)
 * 2. Landing page link
 * 3. Hashtags
 * 4. PRO Portal link (bottom)
 */
export function formatLinkedInCaption(
  raw: string,
  opts: { landingUrl?: string; proPortalUrl?: string } = {}
): string {
  const landing = opts.landingUrl ?? LANDING_PAGE_PLACEHOLDER;
  const proPortal = opts.proPortalUrl ?? LINKEDIN_PRO_PORTAL_PLACEHOLDER;

  let text = raw.trim();
  text = text.replaceAll(PRO_PORTAL_PUBLIC_PAGE_URL, proPortal);

  const bodyLines: string[] = [];
  const hashtagLines: string[] = [];

  for (const line of text.split("\n")) {
    const stripped = line
      .replaceAll(LANDING_PAGE_PLACEHOLDER, "")
      .replaceAll(LINKEDIN_PRO_PORTAL_PLACEHOLDER, "")
      .replace(URL_RE, "")
      .replace(/Read the full broker resource:?\s*/gi, "")
      .replace(/Log in to PRO Portal[^\n]*/gi, "")
      .trim();

    if (!stripped && !line.trim()) {
      if (hashtagLines.length === 0) bodyLines.push("");
      continue;
    }

    if (isHashtagLine(line)) {
      hashtagLines.push(line.trim());
    } else if (stripped) {
      bodyLines.push(
        line
          .replaceAll(LANDING_PAGE_PLACEHOLDER, "")
          .replaceAll(LINKEDIN_PRO_PORTAL_PLACEHOLDER, "")
          .replace(URL_RE, "")
          .trimEnd()
      );
    }
  }

  let body = bodyLines
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const hashtags = hashtagLines.join("\n").trim();

  const sections = [
    body,
    `Read the full broker resource:\n${landing}`,
    hashtags,
    `Log in to PRO Portal for pricing & pipeline:\n${proPortal}`,
  ].filter((s) => s.length > 0);

  return sections.join("\n\n").slice(0, 3000);
}
