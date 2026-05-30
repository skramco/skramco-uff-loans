/**
 * UFF marketing email shell — matches uff.loans / Resend transactional emails
 * (send-confirmation-email, vesta-webhook wrapEmail).
 */

export const UFF_EMAIL = {
  logoUrl: "https://uff.loans/UFF_Logo_Main_2026.png",
  brandRed: "#dc2626",
  brandRedLight: "#fecaca",
  pageBg: "#f8f9fa",
  cardBg: "#ffffff",
  footerBg: "#f9fafb",
  textPrimary: "#334155",
  textSecondary: "#4b5563",
  textMuted: "#6b7280",
  border: "#e5e7eb",
  companyName: "United Fidelity Funding",
  nmls: "34381",
  address: "1300 NW Briarcliff Pkwy #275, Kansas City, MO 64116",
  phone: "(855) 95-EAGLE",
  phoneTel: "+18559532453",
  nmlsUrl:
    "https://www.nmlsconsumeraccess.org/EntityDetails.aspx/COMPANY/34381",
} as const;

export const UFF_HERO_PLACEHOLDER = "<!-- UFF_HERO_IMAGE -->";

/** ActiveCampaign contact merge tags — must pass through to AC unchanged. */
export const AC_ACCOUNT_EXECUTIVE_TAGS = {
  name: "%AE-NAME%",
  title: "%AE-TITLE%",
  email: "%AE-EMAIL%",
  phone: "%AE-PHONE%",
} as const;

export function buildAccountExecutiveHtmlBlock(): string {
  const { name, title, email, phone } = AC_ACCOUNT_EXECUTIVE_TAGS;
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:28px 0 0;">
<tr>
  <td style="background-color:#f9fafb;border:1px solid ${UFF_EMAIL.border};border-radius:8px;padding:20px 24px;">
    <p style="font-family:Arial,sans-serif;font-size:12px;font-weight:700;color:${UFF_EMAIL.textMuted};margin:0 0 12px;text-transform:uppercase;letter-spacing:0.06em;">
      Your Dedicated Account Executive
    </p>
    <p style="font-family:Arial,sans-serif;font-size:17px;font-weight:700;color:#1f2937;margin:0 0 4px;line-height:1.4;">
      ${name}
    </p>
    <p style="font-family:Arial,sans-serif;font-size:14px;color:${UFF_EMAIL.textMuted};margin:0 0 12px;line-height:1.5;">
      ${title}
    </p>
    <p style="font-family:Arial,sans-serif;font-size:15px;margin:0 0 6px;line-height:1.5;">
      <a href="mailto:${email}" style="color:${UFF_EMAIL.brandRed};text-decoration:none;font-weight:600;">${email}</a>
    </p>
    <p style="font-family:Arial,sans-serif;font-size:15px;margin:0;line-height:1.5;">
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

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 24px;">
<tr><td align="center">
<img src="${safeUrl}" alt="${safeAlt}" width="520" style="max-width:100%;height:auto;display:block;border-radius:8px;" />
</td></tr></table>`;
}

export function buildCtaButton(url: string, label: string): string {
  const safeUrl = escapeHtml(url);
  const safeLabel = escapeHtml(label);
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:28px 0;">
<tr><td align="center">
<!--[if mso]>
<v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:office" href="${safeUrl}" style="height:48px;v-text-anchor:middle;width:280px;" arcsize="17%" strokecolor="${UFF_EMAIL.brandRed}" fillcolor="${UFF_EMAIL.brandRed}">
<w:anchorlock/><center style="color:#ffffff;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;">${safeLabel}</center>
</v:roundrect>
<![endif]-->
<!--[if !mso]><!-->
<a href="${safeUrl}" target="_blank" style="display:inline-block;background-color:${UFF_EMAIL.brandRed};color:#ffffff;font-family:Arial,sans-serif;font-size:16px;font-weight:700;text-decoration:none;padding:14px 40px;border-radius:8px;letter-spacing:0.3px;mso-hide:all;">${safeLabel}</a>
<!--<![endif]-->
</td></tr></table>`;
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
  const year = new Date().getFullYear();
  const heading = escapeHtml(opts.heading);
  const preheader = escapeHtml(opts.preheader);
  const bodyHtml = extractEmailBodyFragment(opts.bodyHtml);
  const heroBlock = opts.heroImageUrl
    ? buildHeroImageRow(opts.heroImageUrl, opts.heading)
    : UFF_HERO_PLACEHOLDER;

  const ctaUrl =
    opts.ctaUrl ||
    Deno.env.get("MARKETING_CTA_URL") ||
    Deno.env.get("PRO_PORTAL_URL") ||
    "https://uff.loans";
  const ctaLabel = opts.ctaLabel || "Visit PRO Portal";
  const ctaBlock =
    ctaLabel && ctaUrl ? buildCtaButton(ctaUrl, ctaLabel) : "";

  const signoff =
    opts.includeSignoff !== false
      ? `${buildAccountExecutiveHtmlBlock()}
<p style="font-family:Arial,sans-serif;font-size:15px;color:${UFF_EMAIL.textSecondary};margin:24px 0 0;line-height:1.7;">
Questions? Reach out to your Account Executive above, or call UFF at
<a href="tel:${UFF_EMAIL.phoneTel}" style="color:${UFF_EMAIL.brandRed};text-decoration:none;font-weight:600;">${UFF_EMAIL.phone}</a>.
</p>`
      : "";

  return `<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch><o:AllowPNG/></o:OfficeDocumentSettings></xml><![endif]-->
  <title>${heading}</title>
  <style>
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; }
      .email-body { padding: 24px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${UFF_EMAIL.pageBg};font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;">
  <span style="display:none;max-height:0;overflow:hidden;">${preheader}</span>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:${UFF_EMAIL.pageBg};">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" class="email-container" width="600" cellspacing="0" cellpadding="0" bgcolor="${UFF_EMAIL.cardBg}" style="background-color:${UFF_EMAIL.cardBg};">
          <tr>
            <td bgcolor="${UFF_EMAIL.brandRed}" style="background-color:${UFF_EMAIL.brandRed};padding:40px 40px 30px;text-align:center;">
              <img src="${UFF_EMAIL.logoUrl}" alt="${UFF_EMAIL.companyName}" width="200" style="max-width:200px;height:auto;margin-bottom:16px;display:block;margin-left:auto;margin-right:auto;" />
              <h1 style="color:#ffffff;font-family:Arial,sans-serif;font-size:26px;font-weight:700;margin:0 0 8px;line-height:1.3;">${heading}</h1>
              <p style="color:${UFF_EMAIL.brandRedLight};font-family:Arial,sans-serif;font-size:15px;margin:0;line-height:1.5;">${preheader}</p>
            </td>
          </tr>
          <tr>
            <td class="email-body" style="padding:40px;font-family:Arial,sans-serif;font-size:15px;color:${UFF_EMAIL.textPrimary};line-height:1.7;">
              ${heroBlock}
              ${bodyHtml}
              ${ctaBlock}
              ${signoff}
            </td>
          </tr>
          <tr>
            <td bgcolor="${UFF_EMAIL.footerBg}" style="background-color:${UFF_EMAIL.footerBg};padding:24px 40px;border-top:1px solid ${UFF_EMAIL.border};">
              <p style="font-family:Arial,sans-serif;font-size:11px;color:#9ca3af;margin:0 0 8px;line-height:1.6;text-align:center;">
                ${UFF_EMAIL.companyName} Corp., NMLS #${UFF_EMAIL.nmls} | ${UFF_EMAIL.address}
              </p>
              <p style="font-family:Arial,sans-serif;font-size:11px;color:#9ca3af;margin:0 0 8px;line-height:1.6;text-align:center;">
                Licensed in 39 states. For licensing information, visit
                <a href="${UFF_EMAIL.nmlsUrl}" style="color:#9ca3af;text-decoration:underline;">NMLS Consumer Access</a>.
              </p>
              <p style="font-family:Arial,sans-serif;font-size:11px;color:#9ca3af;margin:0;line-height:1.6;text-align:center;">
                Equal Housing Lender. &copy; ${year} ${UFF_EMAIL.companyName} Corp. All rights reserved.
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

export function injectImageIntoHtml(
  html: string,
  imageUrl: string,
  alt: string
): string {
  const heroRow = buildHeroImageRow(imageUrl, alt);
  if (html.includes(UFF_HERO_PLACEHOLDER)) {
    return html.replace(UFF_HERO_PLACEHOLDER, heroRow);
  }
  const bodyOpen = html.match(/<td class="email-body"[^>]*>/);
  if (bodyOpen) {
    return html.replace(bodyOpen[0], `${bodyOpen[0]}${heroRow}`);
  }
  return `${heroRow}\n${html}`;
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
