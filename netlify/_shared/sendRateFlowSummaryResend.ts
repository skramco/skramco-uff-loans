/**
 * Shared Resend logic for /start "Send summary" (Netlify function + Vite dev proxy).
 * Do not import from client src/.
 */

export const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const DEFAULT_FROM = "UFF Website <notifications@uff.loans>";
const DEFAULT_INTERNAL_TO = "loans@uff.loans";

const INTENT_LABEL: Record<string, string> = {
  buy: "Buy a home",
  refi: "Refinance",
  equity: "Cash out",
};

const PROPERTY_LABEL: Record<string, string> = {
  single: "Single-family",
  condo: "Condo",
  townhouse: "Townhouse",
  multi: "2–4 unit",
};

const CREDIT_LABEL: Record<string, string> = {
  excellent: "Excellent (740+)",
  good: "Good (700–739)",
  fair: "Fair (660–699)",
  below: "Below average (below 660)",
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function fmtUsd(n: unknown): string {
  let x: number;
  if (typeof n === "number") x = n;
  else if (typeof n === "string") x = parseFloat(n.replace(/,/g, ""));
  else x = Number(n);
  if (Number.isNaN(x)) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(x);
}

function fmtPct(n: unknown): string {
  const x = typeof n === "number" ? n : Number(n);
  if (Number.isNaN(x)) return "—";
  return `${x.toFixed(3)}%`;
}

function summarizeLead(lead: Record<string, unknown>): { rows: string; disclaimer: string } {
  const intent = String(lead.intent || "");
  const zip = String(lead.zip || "");
  const pt = String(lead.propertyType || "");
  const credit = String(lead.creditRange || "");
  const vet = lead.isVeteran === true ? "Yes" : "No";

  const r = lead.results && typeof lead.results === "object" ? (lead.results as Record<string, unknown>) : {};

  const rows: string[] = [
    `<tr><td style="padding:8px 0;color:#64748b;width:200px;">Goal</td><td style="padding:8px 0;font-weight:600;">${escapeHtml(INTENT_LABEL[intent] || intent || "—")}</td></tr>`,
    `<tr><td style="padding:8px 0;color:#64748b;">ZIP</td><td style="padding:8px 0;font-weight:600;">${escapeHtml(zip)}</td></tr>`,
    `<tr><td style="padding:8px 0;color:#64748b;">Property type</td><td style="padding:8px 0;font-weight:600;">${escapeHtml(PROPERTY_LABEL[pt] || pt || "—")}</td></tr>`,
    `<tr><td style="padding:8px 0;color:#64748b;">Credit band</td><td style="padding:8px 0;font-weight:600;">${escapeHtml(CREDIT_LABEL[credit] || credit || "—")}</td></tr>`,
    `<tr><td style="padding:8px 0;color:#64748b;">Veteran</td><td style="padding:8px 0;font-weight:600;">${escapeHtml(vet)}</td></tr>`,
  ];

  if (intent === "buy") {
    rows.push(
      `<tr><td style="padding:8px 0;color:#64748b;">Home price</td><td style="padding:8px 0;font-weight:600;">${escapeHtml(fmtUsd(lead.homePrice))}</td></tr>`,
      `<tr><td style="padding:8px 0;color:#64748b;">Down payment</td><td style="padding:8px 0;font-weight:600;">${escapeHtml(fmtUsd(lead.downPayment))}</td></tr>`
    );
  } else {
    rows.push(
      `<tr><td style="padding:8px 0;color:#64748b;">Home value</td><td style="padding:8px 0;font-weight:600;">${escapeHtml(fmtUsd(lead.homeValue))}</td></tr>`,
      `<tr><td style="padding:8px 0;color:#64748b;">Loan balance</td><td style="padding:8px 0;font-weight:600;">${escapeHtml(fmtUsd(lead.currentBalance))}</td></tr>`
    );
  }

  rows.push(
    `<tr><td style="padding:8px 0;color:#64748b;">Est. loan</td><td style="padding:8px 0;font-weight:600;">${escapeHtml(fmtUsd(r.loan))}</td></tr>`,
    `<tr><td style="padding:8px 0;color:#64748b;">Rate range (illustrative)</td><td style="padding:8px 0;font-weight:600;">${escapeHtml(fmtPct(r.lowRate))} – ${escapeHtml(fmtPct(r.highRate))}</td></tr>`,
    `<tr><td style="padding:8px 0;color:#64748b;">Est. monthly (PITI range)</td><td style="padding:8px 0;font-weight:600;">${escapeHtml(fmtUsd(r.totalLow))} – ${escapeHtml(fmtUsd(r.totalHigh))}</td></tr>`,
    `<tr><td style="padding:8px 0;color:#64748b;">Est. cash to close (range)</td><td style="padding:8px 0;font-weight:600;">${escapeHtml(fmtUsd(r.ctcLow))} – ${escapeHtml(fmtUsd(r.ctcHigh))}</td></tr>`
  );

  const disclaimer =
    "These figures are educational estimates only, not a loan approval or offer. Rates and costs depend on verification, appraisal, market conditions, and underwriting.";

  return { rows: rows.join(""), disclaimer };
}

function buildInternalHtml(email: string, lead: Record<string, unknown>): string {
  const { rows, disclaimer } = summarizeLead(lead);
  const when = new Date().toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  const safeEmail = escapeHtml(email.trim());
  return `<!DOCTYPE html>
<html lang="en"><body style="margin:0;padding:24px;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:680px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:10px;">
<tr><td style="padding:20px 24px;background:#0f172a;color:#fff;"><h2 style="margin:0;font-size:18px;">Pre-app flow — summary emailed</h2></td></tr>
<tr><td style="padding:24px;">
<p style="margin:0 0 16px;font-size:14px;color:#475569;">Visitor requested a copy of their /start summary.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;border-collapse:collapse;">
<tr><td style="padding:8px 0;color:#64748b;">Email</td><td style="padding:8px 0;font-weight:600;">${safeEmail}</td></tr>
<tr><td style="padding:8px 0;color:#64748b;">Submitted</td><td style="padding:8px 0;font-weight:600;">${escapeHtml(when)}</td></tr>
</table>
<p style="margin:24px 0 8px;font-size:13px;font-weight:700;color:#334155;">Inputs &amp; estimates</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;border-collapse:collapse;">${rows}</table>
<p style="margin:16px 0 0;font-size:12px;color:#64748b;line-height:1.5;">${escapeHtml(disclaimer)}</p>
</td></tr></table></body></html>`;
}

function buildBorrowerHtml(email: string, lead: Record<string, unknown>): string {
  const first = email.trim().split("@")[0] || "there";
  const safeFirst = escapeHtml(first);
  const { rows, disclaimer } = summarizeLead(lead);
  return `<!DOCTYPE html>
<html lang="en"><body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="640" cellpadding="0" cellspacing="0" style="max-width:640px;width:100%;">
<tr><td style="background:linear-gradient(135deg,#0f172a,#1e3a8a);padding:28px 32px;border-radius:12px 12px 0 0;">
<p style="margin:0;font-size:12px;color:#bfdbfe;letter-spacing:0.08em;text-transform:uppercase;">United Fidelity Funding</p>
<h1 style="margin:8px 0 0;color:#fff;font-size:22px;">Hi ${safeFirst}, here is your summary</h1>
</td></tr>
<tr><td style="background:#fff;padding:28px 32px;border:1px solid #e2e8f0;border-top:none;">
<p style="margin:0 0 20px;color:#475569;font-size:15px;line-height:1.6;">Thanks for using our pre-application experience. Below are the assumptions you entered and the illustrative range we showed on screen.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;border-collapse:collapse;">${rows}</table>
<p style="margin:20px 0 0;font-size:12px;color:#64748b;line-height:1.6;">${escapeHtml(disclaimer)}</p>
<p style="margin:20px 0 0;font-size:14px;color:#0f172a;">Questions? Call <strong>(855) 95-EAGLE</strong> or reply to this email.</p>
</td></tr>
<tr><td style="background:#f8fafc;padding:18px 32px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;">
<p style="margin:0;color:#64748b;font-size:12px;line-height:1.6;">United Fidelity Funding Corp. | NMLS #34381<br />1300 NW Briarcliff Pkwy #275, Kansas City, MO 64116</p>
</td></tr>
</table></td></tr></table></body></html>`;
}

async function sendResend(
  apiKey: string,
  from: string,
  to: string[],
  subject: string,
  html: string,
  replyToAddresses?: string[]
): Promise<{ ok: true; id?: string } | { ok: false; message: string }> {
  const body: Record<string, unknown> = { from, to, subject, html };
  if (replyToAddresses?.length) body.reply_to = replyToAddresses;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(body),
  });

  const result = (await response.json()) as { message?: string; id?: string };
  if (!response.ok) {
    return { ok: false, message: result?.message || "Failed to send email" };
  }
  return { ok: true, id: result.id };
}

export type RateFlowSummaryEnv = {
  RESEND_API_KEY?: string;
  RESEND_FROM_EMAIL?: string;
  RATE_FLOW_SUMMARY_TO?: string;
};

export async function processRateFlowSummary(
  rawBody: unknown,
  env: RateFlowSummaryEnv
): Promise<{ success: true } | { success: false; status: number; message: string }> {
  const apiKey = env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { success: false, status: 503, message: "Email service not configured." };
  }

  if (!rawBody || typeof rawBody !== "object") {
    return { success: false, status: 400, message: "Invalid request body." };
  }

  const body = rawBody as Record<string, unknown>;
  const email = typeof body.email === "string" ? body.email : "";
  if (!isValidEmail(email)) {
    return { success: false, status: 400, message: "A valid email is required." };
  }

  const lead = body.lead;
  if (!lead || typeof lead !== "object" || Array.isArray(lead)) {
    return { success: false, status: 400, message: "Summary data is required." };
  }

  const leadObj = lead as Record<string, unknown>;
  const internalTo = (env.RATE_FLOW_SUMMARY_TO?.trim() || DEFAULT_INTERNAL_TO);
  const from = env.RESEND_FROM_EMAIL?.trim() || DEFAULT_FROM;
  const safeEmail = email.trim();

  const internalHtml = buildInternalHtml(safeEmail, leadObj);
  const internalSend = await sendResend(apiKey, from, [internalTo], `Pre-app summary requested: ${safeEmail}`, internalHtml, [safeEmail]);

  if (!internalSend.ok) {
    return { success: false, status: 502, message: internalSend.message };
  }

  const borrowerHtml = buildBorrowerHtml(safeEmail, leadObj);
  const borrowerSubject = "Your personalized options from United Fidelity Funding";
  const borrowerSend = await sendResend(apiKey, from, [safeEmail], borrowerSubject, borrowerHtml, [internalTo]);

  if (!borrowerSend.ok) {
    return { success: false, status: 502, message: borrowerSend.message };
  }

  return { success: true };
}
