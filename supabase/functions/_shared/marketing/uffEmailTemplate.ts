/**
 * UFF email chrome — white header, 3px red accent, real footer links only.
 * Logo always sits on white. Do not invent View online / Preferences / unsubscribe pages.
 */

export const UFF_EMAIL = {
  logoUrl: "https://uff.loans/UFF_Logo_Main_2026.png",
  brandRed: "#E10404",
  ink: "#1f292e",
  body: "#37474f",
  muted: "#6b7280",
  canvas: "#f5f6f8",
  card: "#ffffff",
  hairline: "#e8ebee",
  footerBg: "#f8f9fa",
  font: "Arial, Helvetica, sans-serif",
  companyName: "United Fidelity Funding",
  nmls: "34381",
  address: "1300 NW Briarcliff Pkwy #275, Kansas City, MO 64116",
  phone: "(855) 95-EAGLE",
  phoneTel: "+18559532453",
  siteUrl: "https://uff.loans",
  contactUrl: "https://uff.loans/contact",
  privacyUrl: "https://uff.loans/privacy-policy",
  loginUrl: "https://uff.loans/login",
  myLoanUrl: "https://uff.loans/my-loan",
  wholesaleSiteUrl: "https://uff.pro",
  wholesaleContactUrl: "https://uff.pro/contact",
  wholesaleLicensingUrl: "https://uff.pro/licensing",
  portalUrl: "https://go.uff.pro",
  nmlsUrl:
    "https://www.nmlsconsumeraccess.org/EntityDetails.aspx/COMPANY/34381",
} as const;

export type UffFooterLink = { href: string; label: string };

/** Borrower-site pages that exist in LoansWebsiteUFF App.tsx. */
export const BORROWER_FOOTER_LINKS: UffFooterLink[] = [
  { href: UFF_EMAIL.siteUrl, label: "Home" },
  { href: UFF_EMAIL.contactUrl, label: "Contact" },
  { href: UFF_EMAIL.privacyUrl, label: "Privacy Policy" },
  { href: UFF_EMAIL.loginUrl, label: "Sign in" },
];

/** Marketing / broker-facing. Public site is uff.pro; PRO Portal is go.uff.pro. */
export const MARKETING_FOOTER_LINKS: UffFooterLink[] = [
  { href: UFF_EMAIL.wholesaleSiteUrl, label: "Home" },
  { href: UFF_EMAIL.wholesaleContactUrl, label: "Contact" },
  { href: UFF_EMAIL.wholesaleLicensingUrl, label: "Licensing" },
  { href: UFF_EMAIL.portalUrl, label: "PRO Portal" },
];

/** Broker / wholesale loan notices — same public site as marketing (uff.pro). */
export const WHOLESALE_FOOTER_LINKS: UffFooterLink[] = MARKETING_FOOTER_LINKS;

/** Retail LO notices: borrower site (uff.loans) plus PRO Portal. */
export const RETAIL_LO_FOOTER_LINKS: UffFooterLink[] = [
  { href: UFF_EMAIL.portalUrl, label: "PRO Portal" },
  { href: UFF_EMAIL.siteUrl, label: "Home" },
  { href: UFF_EMAIL.contactUrl, label: "Contact" },
  { href: UFF_EMAIL.privacyUrl, label: "Privacy Policy" },
];

/** Internal LO / ops notices. */
export const OPS_FOOTER_LINKS: UffFooterLink[] = [
  { href: UFF_EMAIL.portalUrl, label: "PRO Portal" },
  { href: UFF_EMAIL.contactUrl, label: "Contact" },
];

export const UFF_HERO_PLACEHOLDER = "<!-- UFF_HERO_IMAGE -->";

/** ActiveCampaign contact merge tags — must pass through to AC unchanged. */
export const AC_ACCOUNT_EXECUTIVE_TAGS = {
  name: "%AE-NAME%",
  title: "%AE-TITLE%",
  email: "%AE-EMAIL%",
  phone: "%AE-PHONE%",
} as const;

function envGet(key: string): string | undefined {
  const deno = (globalThis as {
    Deno?: { env: { get: (k: string) => string | undefined } };
  }).Deno;
  if (deno?.env) return deno.env.get(key);
  const nodeProc = (globalThis as {
    process?: { env?: Record<string, string | undefined> };
  }).process;
  return nodeProc?.env?.[key];
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildAccountExecutiveHtmlBlock(): string {
  const { name, title, email, phone } = AC_ACCOUNT_EXECUTIVE_TAGS;
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:28px 0 0;">
<tr>
  <td style="background-color:${UFF_EMAIL.canvas};border:1px solid ${UFF_EMAIL.hairline};padding:20px 24px;">
    <p style="font-family:${UFF_EMAIL.font};font-size:11px;font-weight:700;color:${UFF_EMAIL.muted};margin:0 0 12px;text-transform:uppercase;letter-spacing:0.08em;">
      Your Dedicated Account Executive
    </p>
    <p style="font-family:${UFF_EMAIL.font};font-size:17px;font-weight:700;color:${UFF_EMAIL.ink};margin:0 0 4px;line-height:1.4;">
      ${name}
    </p>
    <p style="font-family:${UFF_EMAIL.font};font-size:14px;color:${UFF_EMAIL.muted};margin:0 0 12px;line-height:1.5;">
      ${title}
    </p>
    <p style="font-family:${UFF_EMAIL.font};font-size:15px;margin:0 0 6px;line-height:1.5;">
      <a href="mailto:${email}" style="color:${UFF_EMAIL.brandRed};text-decoration:none;font-weight:600;">${email}</a>
    </p>
    <p style="font-family:${UFF_EMAIL.font};font-size:15px;margin:0;line-height:1.5;">
      <a href="tel:${phone}" style="color:${UFF_EMAIL.brandRed};text-decoration:none;font-weight:600;">${phone}</a>
    </p>
  </td>
</tr>
</table>`;
}

export function buildAccountExecutivePlainText(): string {
  const { name, title, email, phone } = AC_ACCOUNT_EXECUTIVE_TAGS;
  return [
    "",
    "Your Dedicated Account Executive",
    name,
    title,
    email,
    phone,
  ].join("\n");
}

/** Strip tags from an HTML body fragment for plain-text editing / LinkedIn sync. */
export function htmlFragmentToPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|li|tr)>/gi, "\n\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Wrap plain body copy into email paragraph HTML for the UFF shell. */
export function plainTextToEmailBodyHtml(text: string): string {
  return text
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const withBreaks = escapeHtml(block).replace(/\n/g, "<br/>");
      return `<p style="font-family:${UFF_EMAIL.font};font-size:16px;color:${UFF_EMAIL.body};margin:0 0 16px;line-height:1.65;">${withBreaks}</p>`;
    })
    .join("\n");
}

/** Strip accidental full-document HTML from AI body fragments. */
export function extractEmailBodyFragment(raw: string): string {
  let html = raw.trim();
  if (!html) return "";

  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) html = bodyMatch[1].trim();

  html = html
    .replace(/<!DOCTYPE[^>]*>/gi, "")
    .replace(/<\/?html[^>]*>/gi, "")
    .replace(/<head[\s\S]*?<\/head>/gi, "")
    .replace(/<\/?body[^>]*>/gi, "")
    .trim();

  return html;
}

export function buildHeroImageRow(imageUrl: string, alt: string): string {
  const safeAlt = escapeHtml(alt);
  const safeUrl = escapeHtml(imageUrl);
  return `<table role="presentation" data-uff-hero="1" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 24px;">
<tr><td align="center">
<img src="${safeUrl}" alt="${safeAlt}" width="520" style="max-width:100%;height:auto;display:block;border-radius:8px;" />
</td></tr></table>`;
}

export function buildCtaButton(url: string, label: string): string {
  const safeUrl = escapeHtml(url);
  const safeLabel = escapeHtml(label);
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 16px;">
  <tr>
    <td align="center">
      <!--[if mso]>
      <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${safeUrl}" style="height:48px;v-text-anchor:middle;width:280px;" arcsize="17%" stroke="f" fillcolor="${UFF_EMAIL.brandRed}">
        <w:anchorlock/>
        <center style="color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;">${safeLabel}</center>
      </v:roundrect>
      <![endif]-->
      <!--[if !mso]><!-->
      <a href="${safeUrl}" style="display:inline-block;background-color:${UFF_EMAIL.brandRed};color:#ffffff;text-decoration:none;font-family:${UFF_EMAIL.font};font-size:16px;font-weight:700;padding:14px 28px;border-radius:8px;box-sizing:border-box;">${safeLabel}</a>
      <!--<![endif]-->
    </td>
  </tr>
</table>
<p style="margin:0 0 16px;font-family:${UFF_EMAIL.font};font-size:13px;line-height:1.5;color:${UFF_EMAIL.muted};word-break:break-all;">
If the button doesn't work, copy this link:<br />
<a href="${safeUrl}" style="color:${UFF_EMAIL.brandRed};text-decoration:none;">${safeUrl}</a>
</p>`;
}

export function leadHtml(html: string): string {
  return `<p style="margin:0 0 24px;font-family:${UFF_EMAIL.font};font-size:16px;line-height:1.65;color:${UFF_EMAIL.body};">${html}</p>`;
}

export function mutedNote(html: string): string {
  return `<p style="margin:16px 0 0;font-family:${UFF_EMAIL.font};font-size:14px;line-height:1.6;color:${UFF_EMAIL.muted};">${html}</p>`;
}

export function statusBanner(
  label: string,
  message: string,
  background = "#fef2f2",
  border = UFF_EMAIL.brandRed,
  textColor = "#b00303",
): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;background-color:${background};border-left:4px solid ${border};">
  <tr>
    <td style="padding:14px 16px;">
      <div style="font-family:${UFF_EMAIL.font};font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${textColor};">${label}</div>
      <div style="font-family:${UFF_EMAIL.font};font-size:15px;color:${UFF_EMAIL.ink};margin-top:4px;line-height:1.5;">${message}</div>
    </td>
  </tr>
</table>`;
}

export function detailTable(rows: Array<[string, string]>): string {
  const body = rows
    .filter(([, value]) => Boolean(value))
    .map(
      ([label, value], i, arr) =>
        `<tr>
          <td style="padding:10px 0;${i < arr.length - 1 ? `border-bottom:1px solid ${UFF_EMAIL.hairline};` : ""}font-family:${UFF_EMAIL.font};font-size:14px;color:${UFF_EMAIL.muted};">${escapeHtml(label)}</td>
          <td style="padding:10px 0;${i < arr.length - 1 ? `border-bottom:1px solid ${UFF_EMAIL.hairline};` : ""}font-family:${UFF_EMAIL.font};font-size:14px;color:${UFF_EMAIL.ink};font-weight:600;text-align:right;">${value}</td>
        </tr>`,
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">${body}</table>`;
}

export function signOffHtml(name = `The ${UFF_EMAIL.companyName} Team`): string {
  return `<p style="font-family:${UFF_EMAIL.font};font-size:15px;color:${UFF_EMAIL.body};margin:24px 0 0;line-height:1.7;">Warm regards,<br><strong style="color:${UFF_EMAIL.ink};">${name}</strong></p>`;
}

function footerLinksHtml(links: UffFooterLink[]): string {
  const items = [
    ...links.map(
      (link) =>
        `<a href="${escapeHtml(link.href)}" style="color:${UFF_EMAIL.muted};text-decoration:none;">${escapeHtml(link.label)}</a>`,
    ),
    `<a href="${UFF_EMAIL.nmlsUrl}" style="color:${UFF_EMAIL.muted};text-decoration:none;">NMLS Consumer Access</a>`,
  ];
  return items.join("&nbsp; · &nbsp;");
}

export function wrapUffEmail(opts: {
  title?: string;
  heading: string;
  preheader: string;
  kicker?: string;
  bodyHtml: string;
  ctaUrl?: string;
  ctaLabel?: string;
  helpHtml?: string;
  logoHref?: string;
  footerLinks?: UffFooterLink[];
}): string {
  const year = new Date().getFullYear();
  const heading = opts.heading;
  const preheader = opts.preheader;
  const title = opts.title || heading;
  const kicker = opts.kicker || "UNITED FIDELITY FUNDING";
  const logoHref = opts.logoHref ?? UFF_EMAIL.siteUrl;
  const footerLinks = opts.footerLinks ?? BORROWER_FOOTER_LINKS;
  const ctaBlock =
    opts.ctaUrl && opts.ctaLabel ? buildCtaButton(opts.ctaUrl, opts.ctaLabel) : "";
  const help = opts.helpHtml || "";
  const logoOpen = logoHref
    ? `<a href="${escapeHtml(logoHref)}" style="text-decoration:none;">`
    : "";
  const logoClose = logoHref ? "</a>" : "";

  return `<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8" />
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>${escapeHtml(title)}</title>
  <!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch><o:AllowPNG/></o:OfficeDocumentSettings></xml><![endif]-->
  <style>
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; }
      .email-body { padding: 24px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${UFF_EMAIL.canvas};font-family:${UFF_EMAIL.font};">
  <span style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(preheader)}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${UFF_EMAIL.canvas};">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" class="email-container" width="600" cellpadding="0" cellspacing="0" style="background-color:${UFF_EMAIL.card};border:1px solid ${UFF_EMAIL.hairline};">

          <tr>
            <td style="padding:28px 40px 20px;background-color:${UFF_EMAIL.card};">
              ${logoOpen}
                <img src="${UFF_EMAIL.logoUrl}" width="160" alt="${UFF_EMAIL.companyName}" style="display:block;border:0;outline:none;max-width:160px;height:auto;" />
              ${logoClose}
            </td>
          </tr>

          <tr>
            <td style="background-color:${UFF_EMAIL.brandRed};height:3px;font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <tr>
            <td class="email-body" style="padding:36px 40px 40px;">
              <p style="margin:0 0 8px;font-family:${UFF_EMAIL.font};font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${UFF_EMAIL.muted};">${escapeHtml(kicker)}</p>
              <h1 style="margin:0 0 16px;font-family:${UFF_EMAIL.font};font-size:22px;line-height:1.25;font-weight:700;color:${UFF_EMAIL.ink};">${escapeHtml(heading)}</h1>
              ${opts.bodyHtml}
              ${ctaBlock}
              ${help}
            </td>
          </tr>

          <tr>
            <td style="background-color:${UFF_EMAIL.footerBg};border-top:1px solid ${UFF_EMAIL.hairline};padding:24px 40px 32px;text-align:center;">
              <p style="margin:0 0 16px;font-family:${UFF_EMAIL.font};font-size:13px;color:${UFF_EMAIL.muted};">
                ${footerLinksHtml(footerLinks)}
              </p>
              <p style="margin:0 0 6px;font-family:${UFF_EMAIL.font};font-size:11px;line-height:1.6;color:${UFF_EMAIL.muted};">
                ${UFF_EMAIL.companyName} Corp. · NMLS #${UFF_EMAIL.nmls} · Equal Housing Lender
              </p>
              <p style="margin:0 0 10px;font-family:${UFF_EMAIL.font};font-size:11px;line-height:1.6;color:${UFF_EMAIL.muted};">
                ${UFF_EMAIL.address}<br />
                <a href="tel:${UFF_EMAIL.phoneTel}" style="color:${UFF_EMAIL.muted};text-decoration:none;">${UFF_EMAIL.phone}</a>
              </p>
              <p style="margin:0 0 10px;font-family:${UFF_EMAIL.font};font-size:11px;line-height:1.6;color:${UFF_EMAIL.muted};">
                This is not a commitment to lend. Not all products are available in all states. Rates, terms, and programs are subject to change without notice. All loans are subject to credit and property approval.
              </p>
              <p style="margin:0;font-family:${UFF_EMAIL.font};font-size:11px;line-height:1.6;color:${UFF_EMAIL.muted};">
                Licensed in 39 states. &copy; ${year} ${UFF_EMAIL.companyName} Corp. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function wrapUffMarketingEmail(opts: {
  heading: string;
  preheader: string;
  bodyHtml: string;
  heroImageUrl?: string;
  ctaUrl?: string;
  ctaLabel?: string;
  includeSignoff?: boolean;
}): string {
  const heading = opts.heading;
  const preheader = opts.preheader;
  const bodyHtml = extractEmailBodyFragment(opts.bodyHtml);
  const heroBlock = opts.heroImageUrl
    ? buildHeroImageRow(opts.heroImageUrl, opts.heading)
    : UFF_HERO_PLACEHOLDER;

  const ctaUrl =
    opts.ctaUrl ||
    envGet("MARKETING_CTA_URL") ||
    envGet("PRO_PORTAL_URL") ||
    UFF_EMAIL.portalUrl;
  const ctaLabel = opts.ctaLabel || "Open PRO Portal";
  const ctaBlock =
    ctaLabel && ctaUrl ? buildCtaButton(ctaUrl, ctaLabel) : "";

  const signoff =
    opts.includeSignoff !== false
      ? `${buildAccountExecutiveHtmlBlock()}
<p style="font-family:${UFF_EMAIL.font};font-size:15px;color:${UFF_EMAIL.body};margin:24px 0 0;line-height:1.7;">
Questions? Reach out to your Account Executive above, or call UFF at
<a href="tel:${UFF_EMAIL.phoneTel}" style="color:${UFF_EMAIL.brandRed};text-decoration:none;font-weight:600;">${UFF_EMAIL.phone}</a>.
</p>`
      : "";

  return wrapUffEmail({
    heading,
    preheader,
    kicker: "UFF WHOLESALE",
    bodyHtml: `${heroBlock}${bodyHtml}${ctaBlock}${signoff}`,
    logoHref: UFF_EMAIL.wholesaleSiteUrl,
    footerLinks: MARKETING_FOOTER_LINKS,
  });
}

export function injectImageIntoHtml(
  html: string,
  imageUrl: string,
  alt: string
): string {
  const heroRow = buildHeroImageRow(imageUrl, alt);
  const markedHeroRe =
    /<table role="presentation"[^>]*data-uff-hero="1"[^>]*>[\s\S]*?<\/table>/gi;
  const legacyHeroRe =
    /<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 24px;">\s*<tr><td align="center">\s*<img[^>]*width="520"[^>]*>\s*<\/td><\/tr><\/table>/gi;

  let next = html
    .replaceAll(UFF_HERO_PLACEHOLDER, "")
    .replace(markedHeroRe, "")
    .replace(legacyHeroRe, "");

  const bodyOpen = next.match(/<td class="email-body"[^>]*>/);
  if (bodyOpen) {
    return next.replace(bodyOpen[0], `${bodyOpen[0]}${heroRow}`);
  }
  return `${heroRow}\n${next}`;
}

export function finalizeCampaignEmail(
  campaign: {
    title: string;
    email_subject: string;
    preview_text: string;
    email_html: string;
    email_text: string;
    call_to_action: string;
  },
  opts?: { heroImageUrl?: string; ctaUrl?: string }
): string {
  return wrapUffMarketingEmail({
    heading: campaign.title || campaign.email_subject,
    preheader: campaign.preview_text,
    bodyHtml: campaign.email_html,
    heroImageUrl: opts?.heroImageUrl,
    ctaLabel: campaign.call_to_action,
    ctaUrl: opts?.ctaUrl,
  });
}

/** Append AC Account Executive merge tags to plain-text body if missing. */
export function appendAccountExecutivePlainText(emailText: string): string {
  const block = buildAccountExecutivePlainText();
  if (emailText.includes("%AE-NAME%")) return emailText;
  return `${emailText.trim()}\n${block}`;
}
