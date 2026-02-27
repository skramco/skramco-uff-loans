import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

/**
 * Vesta Webhook Receiver — Channel-Aware Architecture
 *
 * Dispatches: eventType × channel → template + recipients
 *   - Retail  → LO email (from loanOriginator)
 *   - Wholesale → Broker email (from partnerBrokers[].emailAddress)
 *
 * URL: https://pvzqgboffydqeqzeiysx.supabase.co/functions/v1/vesta-webhook
 */

// ─── Types ───────────────────────────────────────────────────────────────────

type Channel = "Retail" | "Wholesale" | "Unknown";

interface VestaWebhookPayload {
  id: string;
  type: string;
  loanId: string;
  newLoanStage?: string;
  loanChannel?: string;
  sourceType?: string;
  userId?: string;
  timestamp?: string;
  retries?: number;
  version?: string;
  [key: string]: any;
}

interface VestaConfig {
  apiUrl: string;
  apiKey: string;
  apiVersion: string;
}

interface LoanDetails {
  loanNumber: string;
  channel: Channel;
  borrowerName: string;
  borrowerFirstName: string;
  borrowerEmail: string;
  borrowerPhone: string;
  loFullName: string;
  loEmail: string;
  loPhone: string;
  loNmlsId: string;
  brokerName: string;
  brokerEmail: string;
  brokerCompany: string;
  brokerPhone: string;
  brokerNmlsId: string;
  propertyAddress: string;
  loanAmount: number | null;
  loanType: string;
  loanPurpose: string;
  loanStage: string;
  underwriterNote: string;
  denyReasons: string[];
  raw: Record<string, any>;
}

interface EmailResult {
  subject: string;
  html: string;
  recipients: string[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function formatCurrency(value: number | undefined | null): string {
  if (value == null) return "--";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
}

function resolveChannel(webhook: VestaWebhookPayload, loan: LoanDetails | null): Channel {
  const ch = webhook.loanChannel || loan?.channel || "";
  if (/retail/i.test(ch)) return "Retail";
  if (/wholesale/i.test(ch)) return "Wholesale";
  return "Unknown";
}

function formatTimestamp(ts?: string): string {
  const d = ts ? new Date(ts) : new Date();
  return d.toLocaleString("en-US", { timeZone: "America/Chicago", month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }) + " CT";
}

// ─── Vesta API Config ────────────────────────────────────────────────────────

async function getVestaConfig(): Promise<VestaConfig> {
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data } = await supabase.from("admin_settings").select("vesta_environment").eq("id", 1).maybeSingle();
    const env = data?.vesta_environment || "dev";
    if (env === "production") {
      return {
        apiUrl: Deno.env.get("VESTA_PROD_API_URL") || "https://uff.vesta.com/api/v1",
        apiKey: Deno.env.get("VESTA_PROD_API_KEY") || "",
        apiVersion: Deno.env.get("VESTA_PROD_API_VERSION") || "26.1",
      };
    }
    return {
      apiUrl: Deno.env.get("VESTA_DEV_API_URL") || "https://uff.beta.vesta.com/api/v1",
      apiKey: Deno.env.get("VESTA_DEV_API_KEY") || Deno.env.get("VESTA_API_KEY") || "",
      apiVersion: Deno.env.get("VESTA_DEV_API_VERSION") || Deno.env.get("VESTA_API_VERSION") || "26.1",
    };
  } catch {
    return {
      apiUrl: Deno.env.get("VESTA_API_URL") || "https://uff.beta.vesta.com/api/v1",
      apiKey: Deno.env.get("VESTA_API_KEY") || "",
      apiVersion: Deno.env.get("VESTA_API_VERSION") || "26.1",
    };
  }
}

function getVestaLoanUrl(apiUrl: string, loanId: string): string | undefined {
  if (!apiUrl || !loanId) return undefined;
  return `${apiUrl.replace(/\/api\/v\d+\/?$/, "")}/loans/${loanId}`;
}

// ─── Fetch Loan Details ──────────────────────────────────────────────────────

async function fetchLoanDetails(loanId: string): Promise<LoanDetails | null> {
  try {
    const config = await getVestaConfig();
    if (!config.apiUrl || !config.apiKey) { console.error("Vesta API not configured"); return null; }
    const baseUrl = config.apiUrl.replace(/\/+$/, "");
    const loanUrl = `${baseUrl}/loans/${encodeURIComponent(loanId)}`;
    console.log(`Fetching loan from Vesta: ${loanUrl}`);
    const response = await fetch(loanUrl, {
      method: "GET",
      headers: { Accept: "application/json", Authorization: `Token ${config.apiKey}`, "x-Api-Version": config.apiVersion },
    });
    if (!response.ok) { console.error(`Vesta API error (${response.status}): ${await response.text()}`); return null; }
    const loan = await response.json();

    // Log raw keys for debugging partnerBrokers structure
    console.log("Vesta loan keys:", Object.keys(loan || {}).join(", "));
    if (loan?.partnerBrokers) console.log("partnerBrokers:", JSON.stringify(loan.partnerBrokers).slice(0, 500));

    const borrower = loan?.borrowers?.[0] || {};
    const borrowerName = [borrower.firstName, borrower.lastName].filter(Boolean).join(" ") || "Borrower";
    const borrowerPhone = borrower.phoneNumbers?.find(
      (p: any) => p.type?.toLowerCase() === "mobile" || p.type?.toLowerCase() === "cell"
    )?.number || borrower.phoneNumbers?.[0]?.number || "";

    const lo = loan?.loanOriginator || {};
    const addr = loan?.subjectProperty?.address || {};
    const propertyAddress = [addr.line || addr.streetAddress, addr.city, addr.state, addr.zipCode].filter(Boolean).join(", ");
    const loanProduct = loan?.loanProduct || {};

    // Extract partner broker info (Wholesale channel)
    const broker = loan?.partnerBrokers?.[0] || {};
    const loanChannel = loan?.loanChannel || loan?.channel || "";

    return {
      loanNumber: loan?.loanNumber || "",
      channel: /retail/i.test(loanChannel) ? "Retail" : /wholesale/i.test(loanChannel) ? "Wholesale" : "Unknown",
      borrowerName,
      borrowerFirstName: borrower.firstName || borrowerName.split(" ")[0] || "there",
      borrowerEmail: borrower.email || borrower.emailAddress || "",
      borrowerPhone,
      loFullName: lo.fullName || lo.name || "",
      loEmail: lo.email || lo.emailAddress || "",
      loPhone: lo.phoneNumber || lo.phone || "",
      loNmlsId: lo.nmlsId || "",
      brokerName: broker.fullName || broker.name || [broker.firstName, broker.lastName].filter(Boolean).join(" ") || "",
      brokerEmail: broker.emailAddress || broker.email || "",
      brokerCompany: broker.companyName || broker.company || "",
      brokerPhone: broker.phoneNumber || broker.phone || "",
      brokerNmlsId: broker.nmlsId || "",
      propertyAddress,
      loanAmount: loan?.loanAmount || loanProduct?.loanAmount || null,
      loanType: loanProduct?.mortgageType || loan?.loanType || "",
      loanPurpose: loan?.loanPurpose || loanProduct?.loanPurpose || "",
      loanStage: loan?.loanStage || loan?.stage || "",
      underwriterNote: loan?.underwriterNote || loan?.underwriterNotes || "",
      denyReasons: Array.isArray(loan?.latestLoanDecisionDenyReasons) ? loan.latestLoanDecisionDenyReasons.map((r: any) => typeof r === "string" ? r : r?.reason || r?.description || r?.name || JSON.stringify(r)) : [],
      raw: loan,
    };
  } catch (err: any) {
    console.error("Failed to fetch loan details:", err.message);
    return null;
  }
}

// ─── Fetch Objective Conditions ──────────────────────────────────────────────

interface ConditionItem {
  id: string;
  entityType: string;
  conditionTiming: string | null;
  conditionStatus: string;
  conditionAtFaultUsers: string[];
  instructionsOverride: string;
  conditionCategory?: string;
  objectiveName?: string;
  externalFacingMessage?: string;
  [key: string]: any;
}

const TIMING_ORDER = ["PriorToApproval", "PriorToDocs", "PriorToClosing", "PriorToFunding", "PostFunding"];
const TIMING_LABELS: Record<string, string> = {
  PriorToApproval: "Prior to Approval",
  PriorToDocs: "Prior to Docs",
  PriorToClosing: "Prior to Closing",
  PriorToFunding: "Prior to Funding",
  PostFunding: "Post Funding",
};

function groupConditionsByTiming(conditions: ConditionItem[]): { timing: string; label: string; items: ConditionItem[] }[] {
  const groups: Record<string, ConditionItem[]> = {};
  for (const c of conditions) {
    const key = c.conditionTiming || "Other";
    if (!groups[key]) groups[key] = [];
    groups[key].push(c);
  }
  return Object.entries(groups)
    .sort((a, b) => {
      const ai = TIMING_ORDER.indexOf(a[0]);
      const bi = TIMING_ORDER.indexOf(b[0]);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    })
    .map(([key, items]) => ({ timing: key, label: TIMING_LABELS[key] || key, items }));
}

async function fetchObjectiveConditions(loanId: string): Promise<ConditionItem[]> {
  try {
    const config = await getVestaConfig();
    if (!config.apiUrl || !config.apiKey) { console.error("Vesta API not configured for conditions"); return []; }
    const baseUrl = config.apiUrl.replace(/\/+$/, "");
    const url = `${baseUrl}/loans/${encodeURIComponent(loanId)}/objective-conditions`;
    console.log(`Fetching conditions: ${url}`);
    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json", Authorization: `Token ${config.apiKey}`, "x-Api-Version": config.apiVersion },
    });
    if (!response.ok) { console.error(`Conditions API error (${response.status}): ${await response.text()}`); return []; }
    const conditions = await response.json();
    console.log(`Fetched ${Array.isArray(conditions) ? conditions.length : 0} conditions`);
    return Array.isArray(conditions) ? conditions : [];
  } catch (err: any) {
    console.error("Failed to fetch conditions:", err.message);
    return [];
  }
}

// ─── Email Shared Components ─────────────────────────────────────────────────

const companyName = "United Fidelity Funding";
const year = new Date().getFullYear();

const stageChangeIcon = `<table role="presentation" cellspacing="0" cellpadding="0" align="center" style="margin-bottom:16px;"><tr><td style="width:64px;height:64px;background-color:rgba(255,255,255,0.15);border-radius:50%;text-align:center;line-height:64px;font-size:32px;">&#x1F504;</td></tr></table>`;

// Outlook-safe button using VML fallback
function outlookButton(url: string, label: string): string {
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:28px 0;"><tr><td align="center">
<!--[if mso]>
<v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${url}" style="height:48px;v-text-anchor:middle;width:260px;" arcsize="17%" strokecolor="#dc2626" fillcolor="#dc2626">
<w:anchorlock/><center style="color:#ffffff;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;">${label}</center>
</v:roundrect>
<![endif]-->
<!--[if !mso]><!-->
<a href="${url}" target="_blank" style="display:inline-block;background-color:#dc2626;color:#ffffff;font-family:Arial,sans-serif;font-size:16px;font-weight:700;text-decoration:none;padding:14px 40px;border-radius:8px;letter-spacing:0.3px;mso-hide:all;">${label}</a>
<!--<![endif]-->
</td></tr></table>`;
}

function wrapEmail(heading: string, preheader: string, bodyContent: string, losUrl?: string, buttonLabel?: string): string {
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
<body style="margin:0;padding:0;background-color:#f8f9fa;font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;">
  <span style="display:none;max-height:0;overflow:hidden;">${preheader}</span>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f8f9fa;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" class="email-container" width="600" cellspacing="0" cellpadding="0" bgcolor="#ffffff" style="background-color:#ffffff;">
          <tr>
            <td bgcolor="#dc2626" style="background-color:#dc2626;padding:40px 40px 30px;text-align:center;">
              ${stageChangeIcon}
              <h1 style="color:#ffffff;font-family:Arial,sans-serif;font-size:26px;font-weight:700;margin:0 0 8px;">${heading}</h1>
              <p style="color:#fecaca;font-family:Arial,sans-serif;font-size:15px;margin:0;">${preheader}</p>
            </td>
          </tr>
          <tr>
            <td class="email-body" style="padding:40px;">
              ${bodyContent}
              ${losUrl ? outlookButton(losUrl, buttonLabel || "View Loan in LOS \u2192") : ""}
              <p style="font-family:Arial,sans-serif;font-size:15px;color:#4b5563;margin:0;line-height:1.7;">Warm regards,<br><strong style="color:#1f2937;">The ${companyName} Team</strong></p>
            </td>
          </tr>
          <tr>
            <td bgcolor="#f9fafb" style="background-color:#f9fafb;padding:24px 40px;border-top:1px solid #e5e7eb;">
              <p style="font-family:Arial,sans-serif;font-size:11px;color:#9ca3af;margin:0 0 8px;line-height:1.6;text-align:center;">${companyName} Corp., NMLS #34381 | 1300 NW Briarcliff Pkwy #275, Kansas City, MO 64116</p>
              <p style="font-family:Arial,sans-serif;font-size:11px;color:#9ca3af;margin:0 0 8px;line-height:1.6;text-align:center;">Licensed in 39 states. <a href="https://www.nmlsconsumeraccess.org/EntityDetails.aspx/COMPANY/34381" style="color:#9ca3af;text-decoration:underline;">NMLS Consumer Access</a>.</p>
              <p style="font-family:Arial,sans-serif;font-size:11px;color:#9ca3af;margin:0;line-height:1.6;text-align:center;">Equal Housing Lender. &copy; ${year} ${companyName} Corp. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Shared: Stage Colors & Detail Row Builder ───────────────────────────────

const stageColors: Record<string, { bg: string; border: string; text: string }> = {
  "Prospect": { bg: "#f9fafb", border: "#6b7280", text: "#374151" },
  "Pre-Qualification": { bg: "#eff6ff", border: "#2563eb", text: "#1e40af" },
  "Pre-Approval": { bg: "#eff6ff", border: "#2563eb", text: "#1e40af" },
  "Application": { bg: "#eff6ff", border: "#2563eb", text: "#1e40af" },
  "Processing": { bg: "#fefce8", border: "#eab308", text: "#854d0e" },
  "Underwriting": { bg: "#fefce8", border: "#eab308", text: "#854d0e" },
  "Conditional Approval": { bg: "#f0fdf4", border: "#16a34a", text: "#166534" },
  "Clear to Close": { bg: "#f0fdf4", border: "#16a34a", text: "#166534" },
  "Closing": { bg: "#f0fdf4", border: "#16a34a", text: "#166534" },
  "Funded": { bg: "#f0fdf4", border: "#16a34a", text: "#166534" },
  "Suspended": { bg: "#fef2f2", border: "#dc2626", text: "#991b1b" },
  "Denied": { bg: "#fef2f2", border: "#dc2626", text: "#991b1b" },
  "Withdrawn": { bg: "#fef2f2", border: "#dc2626", text: "#991b1b" },
};

function detailRow(label: string, value: string): string {
  if (!value) return "";
  return `<tr><td style="padding:8px 0;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:13px;">${label}</td><td style="padding:8px 0;border-bottom:1px solid #e2e8f0;color:#0f172a;font-size:13px;font-weight:600;text-align:right;">${value}</td></tr>`;
}

function stageBlock(newStage: string, previousStage?: string): string {
  const colors = stageColors[newStage] || { bg: "#eff6ff", border: "#2563eb", text: "#1e40af" };
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:24px;"><tr>
    <td style="background-color:${colors.bg};border-left:4px solid ${colors.border};padding:24px;">
      <p style="font-family:Arial,sans-serif;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:${colors.text};margin:0 0 4px;">New Loan Stage</p>
      <p style="font-family:Arial,sans-serif;font-size:24px;font-weight:700;color:${colors.text};margin:0;">${newStage}</p>
      ${previousStage && previousStage !== newStage ? `<p style="font-family:Arial,sans-serif;font-size:13px;color:#6b7280;margin:8px 0 0;">Previously: ${previousStage}</p>` : ""}
    </td>
  </tr></table>`;
}

function detailsTable(rows: string): string {
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:24px;"><tr><td style="padding:20px;">
    <p style="font-family:Arial,sans-serif;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#64748b;margin:0 0 12px;">Loan Details</p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">${rows}</table>
  </td></tr></table>`;
}

const apiWarningHtml = `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#fef2f2;border-left:4px solid #dc2626;margin-bottom:24px;"><tr><td style="padding:16px 20px;"><p style="font-family:Arial,sans-serif;font-size:14px;color:#991b1b;margin:0;line-height:1.6;"><strong>Note:</strong> Could not fetch full loan details from Vesta API. Only webhook data is shown above.</p></td></tr></table>`;

// ═══════════════════════════════════════════════════════════════════════════════
// ─── CHANNEL-SPECIFIC EMAIL BUILDERS ─────────────────────────────────────────
// Architecture: Each event type has a builder per channel.
// Register new event types by adding to the `eventHandlers` map below.
// ═══════════════════════════════════════════════════════════════════════════════

// ── LoanStageChanged: RETAIL (LO-focused) ────────────────────────────────────

function buildRetailStageChanged(webhook: VestaWebhookPayload, loan: LoanDetails | null, losUrl?: string): EmailResult {
  const newStage = webhook.newLoanStage || "Unknown";
  const loanNumber = loan?.loanNumber || "";
  const borrowerName = loan?.borrowerName || "Borrower";
  const loFirst = loan?.loFullName?.split(" ")[0] || "Team";

  const rows = [
    detailRow("Loan Number", loanNumber),
    detailRow("Borrower", borrowerName),
    detailRow("Borrower Email", loan?.borrowerEmail || ""),
    detailRow("Borrower Phone", loan?.borrowerPhone || ""),
    detailRow("Property", loan?.propertyAddress || ""),
    detailRow("Loan Amount", loan?.loanAmount ? formatCurrency(loan.loanAmount) : ""),
    detailRow("Loan Type", loan?.loanType || ""),
    detailRow("Purpose", loan?.loanPurpose || ""),
    detailRow("Updated", formatTimestamp(webhook.timestamp)),
  ].join("");

  const body = `<p style="font-family:Arial,sans-serif;font-size:17px;color:#1f2937;margin:0 0 16px;line-height:1.6;">Hi ${loFirst},</p>
    <p style="font-family:Arial,sans-serif;font-size:15px;color:#4b5563;margin:0 0 24px;line-height:1.7;">A loan stage change has occurred${loanNumber ? ` on Loan #<strong>${loanNumber}</strong>` : ""}. Here are the details:</p>
    ${stageBlock(newStage, loan?.loanStage)}
    ${detailsTable(rows)}
    ${!loan ? apiWarningHtml : ""}`;

  const recipients: string[] = [];
  if (loan?.loEmail) recipients.push(loan.loEmail);

  return {
    subject: `Loan Stage Changed: ${newStage}${loanNumber ? ` \u2014 Loan #${loanNumber}` : ""} \u2014 ${borrowerName}`,
    html: wrapEmail("Loan Stage Changed", `${borrowerName} \u2192 ${newStage}`, body, losUrl),
    recipients,
  };
}

// ── LoanStageChanged: WHOLESALE (Broker-focused) ─────────────────────────────

function buildWholesaleStageChanged(webhook: VestaWebhookPayload, loan: LoanDetails | null, losUrl?: string): EmailResult {
  const newStage = webhook.newLoanStage || "Unknown";
  const loanNumber = loan?.loanNumber || "";
  const borrowerName = loan?.borrowerName || "Borrower";
  const brokerFirst = loan?.brokerName?.split(" ")[0] || "Partner";

  const rows = [
    detailRow("Loan Number", loanNumber),
    detailRow("Borrower", borrowerName),
    detailRow("Property", loan?.propertyAddress || ""),
    detailRow("Loan Amount", loan?.loanAmount ? formatCurrency(loan.loanAmount) : ""),
    detailRow("Loan Type", loan?.loanType || ""),
    detailRow("Purpose", loan?.loanPurpose || ""),
    detailRow("Broker LO", loan?.loFullName || ""),
    detailRow("LO Email", loan?.loEmail || ""),
    detailRow("LO Phone", loan?.loPhone || ""),
    detailRow("Updated", formatTimestamp(webhook.timestamp)),
  ].join("");

  const body = `<p style="font-family:Arial,sans-serif;font-size:17px;color:#1f2937;margin:0 0 16px;line-height:1.6;">Hi ${brokerFirst},</p>
    <p style="font-family:Arial,sans-serif;font-size:15px;color:#4b5563;margin:0 0 24px;line-height:1.7;">A loan you submitted to ${companyName} has moved to a new stage${loanNumber ? ` (Loan #<strong>${loanNumber}</strong>)` : ""}.</p>
    ${stageBlock(newStage, loan?.loanStage)}
    ${detailsTable(rows)}
    ${!loan ? apiWarningHtml : ""}`;

  const recipients: string[] = [];
  if (loan?.brokerEmail) recipients.push(loan.brokerEmail);

  return {
    subject: `[UFF] Stage Update: ${newStage}${loanNumber ? ` \u2014 Loan #${loanNumber}` : ""} \u2014 ${borrowerName}`,
    html: wrapEmail("Loan Stage Update", `${borrowerName} \u2192 ${newStage}`, body, losUrl, "View Loan in PRO Portal \u2192"),
    recipients,
  };
}

// ── UnderwriterDecision: Shared Config ─────────────────────────────────────────

type Decision = "ConditionallyApprove" | "ClearToClose" | "Deny" | "Suspend";

interface DecisionConfig {
  heading: string;
  preheader: (borrowerName: string, loanNumber: string) => string;
  subjectPrefix: string;
  icon: string;
  headerBg: string;
  headerTextColor: string;
  accentColor: string;
  greetingLine: (firstName: string, loanNumber: string) => string;
}

const decisionConfigs: Record<Decision, DecisionConfig> = {
  ConditionallyApprove: {
    heading: "Conditionally Approved!",
    preheader: (b, ln) => `Great news — Loan #${ln} for ${b} has been conditionally approved`,
    subjectPrefix: "Conditionally Approved",
    icon: "&#x1F389;",
    headerBg: "#16a34a",
    headerTextColor: "#ffffff",
    accentColor: "#16a34a",
    greetingLine: (f, ln) => `Great news! Loan${ln ? ` #<strong>${ln}</strong>` : ""} has been <strong>conditionally approved</strong> by underwriting. There are conditions that need to be satisfied before we can move forward. Please review the conditions below:`,
  },
  ClearToClose: {
    heading: "Clear to Close!",
    preheader: (b, ln) => `Exciting — Loan #${ln} for ${b} is Clear to Close!`,
    subjectPrefix: "Clear to Close",
    icon: "&#x1F3C1;",
    headerBg: "#059669",
    headerTextColor: "#ffffff",
    accentColor: "#059669",
    greetingLine: (f, ln) => `Incredible news! Loan${ln ? ` #<strong>${ln}</strong>` : ""} is <strong>Clear to Close</strong>! This is the final step before closing documents are sent out — the finish line is right around the corner. Here are the remaining items:`,
  },
  Deny: {
    heading: "Loan Decision: Denied",
    preheader: (b, ln) => `Loan #${ln} for ${b} — Underwriter Decision: Denied`,
    subjectPrefix: "Decision: Denied",
    icon: "&#x26D4;",
    headerBg: "#6b7280",
    headerTextColor: "#ffffff",
    accentColor: "#6b7280",
    greetingLine: (f, ln) => `Loan${ln ? ` #<strong>${ln}</strong>` : ""} has received an underwriting decision of <strong>Denied</strong>. Please review the conditions and underwriter notes below for details.`,
  },
  Suspend: {
    heading: "Loan Decision: Suspended",
    preheader: (b, ln) => `Loan #${ln} for ${b} — Underwriter Decision: Suspended`,
    subjectPrefix: "Decision: Suspended",
    icon: "&#x23F8;&#xFE0F;",
    headerBg: "#d97706",
    headerTextColor: "#ffffff",
    accentColor: "#d97706",
    greetingLine: (f, ln) => `Loan${ln ? ` #<strong>${ln}</strong>` : ""} has been <strong>Suspended</strong> by underwriting. This means the file needs additional information or corrections before it can be re-reviewed. Please review the conditions below:`,
  },
};

function resolveDecision(webhook: VestaWebhookPayload): Decision {
  const d = webhook.decision || "";
  if (/conditionally/i.test(d)) return "ConditionallyApprove";
  if (/clear/i.test(d)) return "ClearToClose";
  if (/deny|denied/i.test(d)) return "Deny";
  if (/suspend/i.test(d)) return "Suspend";
  return "ConditionallyApprove"; // safe fallback
}

// ── Build conditions HTML grouped by timing ──

function buildConditionsHtml(conditions: ConditionItem[], accentColor: string): string {
  if (!conditions.length) return `<p style="font-family:Arial,sans-serif;font-size:14px;color:#64748b;margin:0 0 24px;font-style:italic;">No conditions returned from the system.</p>`;
  const groups = groupConditionsByTiming(conditions);
  let html = "";
  for (const group of groups) {
    html += `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:16px;">
      <tr><td style="padding:10px 16px;background-color:#f1f5f9;border-left:4px solid ${accentColor};font-family:Arial,sans-serif;font-size:13px;font-weight:700;color:#334155;text-transform:uppercase;letter-spacing:0.5px;">${group.label} <span style="font-weight:400;color:#64748b;text-transform:none;letter-spacing:0;">(${group.items.length})</span></td></tr>`;
    for (const c of group.items) {
      const name = c.instructionsOverride || c.externalFacingMessage || c.objectiveName || "Condition";
      const category = c.conditionCategory || c.entityType || "";
      html += `<tr><td style="padding:10px 16px 10px 28px;border-bottom:1px solid #e2e8f0;">
        <p style="font-family:Arial,sans-serif;font-size:14px;color:#1e293b;margin:0 0 4px;line-height:1.5;">${name}</p>
        ${category ? `<span style="font-family:Arial,sans-serif;font-size:11px;color:#64748b;background-color:#f1f5f9;padding:2px 8px;border-radius:4px;">${category}</span>` : ""}
      </td></tr>`;
    }
    html += `</table>`;
  }
  return html;
}

function buildUnderwriterNoteHtml(note: string): string {
  if (!note) return "";
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:24px 0;background-color:#fffbeb;border:1px solid #fde68a;border-radius:8px;">
    <tr><td style="padding:20px;">
      <p style="font-family:Arial,sans-serif;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#92400e;margin:0 0 8px;">Underwriter Notes / Comments</p>
      <p style="font-family:Arial,sans-serif;font-size:14px;color:#78350f;margin:0;line-height:1.7;white-space:pre-wrap;">${note}</p>
    </td></tr>
  </table>`;
}

function buildDenyReasonsHtml(reasons: string[]): string {
  if (!reasons.length) return `<p style="font-family:Arial,sans-serif;font-size:14px;color:#64748b;margin:0 0 24px;font-style:italic;">No denial reasons provided.</p>`;
  let html = `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:20px;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">`;
  html += `<tr><td style="padding:12px 16px;background-color:#f3f4f6;border-bottom:1px solid #e5e7eb;font-family:Arial,sans-serif;font-size:13px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:0.5px;">Denial Reasons (${reasons.length})</td></tr>`;
  for (let i = 0; i < reasons.length; i++) {
    const borderBottom = i < reasons.length - 1 ? "border-bottom:1px solid #e2e8f0;" : "";
    html += `<tr><td style="padding:12px 16px 12px 28px;${borderBottom}">
      <p style="font-family:Arial,sans-serif;font-size:14px;color:#1e293b;margin:0;line-height:1.5;">&#x2022; ${reasons[i]}</p>
    </td></tr>`;
  }
  html += `</table>`;
  return html;
}

// ── Shared decision email wrapper (overrides header color) ──

function wrapDecisionEmail(config: DecisionConfig, preheader: string, bodyContent: string, losUrl?: string, buttonLabel?: string): string {
  const iconHtml = `<table role="presentation" cellspacing="0" cellpadding="0" align="center" style="margin-bottom:16px;"><tr><td style="width:64px;height:64px;background-color:rgba(255,255,255,0.15);border-radius:50%;text-align:center;line-height:64px;font-size:32px;">${config.icon}</td></tr></table>`;
  return `<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch><o:AllowPNG/></o:OfficeDocumentSettings></xml><![endif]-->
  <title>${config.heading}</title>
  <style>
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; }
      .email-body { padding: 24px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f8f9fa;font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;">
  <span style="display:none;max-height:0;overflow:hidden;">${preheader}</span>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f8f9fa;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" class="email-container" width="600" cellspacing="0" cellpadding="0" bgcolor="#ffffff" style="background-color:#ffffff;">
          <tr>
            <td bgcolor="${config.headerBg}" style="background-color:${config.headerBg};padding:40px 40px 30px;text-align:center;">
              ${iconHtml}
              <h1 style="color:${config.headerTextColor};font-family:Arial,sans-serif;font-size:26px;font-weight:700;margin:0 0 8px;">${config.heading}</h1>
              <p style="color:rgba(255,255,255,0.75);font-family:Arial,sans-serif;font-size:15px;margin:0;">${preheader}</p>
            </td>
          </tr>
          <tr>
            <td class="email-body" style="padding:40px;">
              ${bodyContent}
              ${losUrl ? outlookButton(losUrl, buttonLabel || "View Loan in LOS \u2192") : ""}
              <p style="font-family:Arial,sans-serif;font-size:15px;color:#4b5563;margin:0;line-height:1.7;">Warm regards,<br><strong style="color:#1f2937;">The ${companyName} Team</strong></p>
            </td>
          </tr>
          <tr>
            <td bgcolor="#f9fafb" style="background-color:#f9fafb;padding:24px 40px;border-top:1px solid #e5e7eb;">
              <p style="font-family:Arial,sans-serif;font-size:11px;color:#9ca3af;margin:0 0 8px;line-height:1.6;text-align:center;">${companyName} Corp., NMLS #34381 | 1300 NW Briarcliff Pkwy #275, Kansas City, MO 64116</p>
              <p style="font-family:Arial,sans-serif;font-size:11px;color:#9ca3af;margin:0 0 8px;line-height:1.6;text-align:center;">Licensed in 39 states. <a href="https://www.nmlsconsumeraccess.org/EntityDetails.aspx/COMPANY/34381" style="color:#9ca3af;text-decoration:underline;">NMLS Consumer Access</a>.</p>
              <p style="font-family:Arial,sans-serif;font-size:11px;color:#9ca3af;margin:0;line-height:1.6;text-align:center;">Equal Housing Lender. &copy; ${year} ${companyName} Corp. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── UnderwriterDecision: RETAIL (LO-focused) ──────────────────────────────────

function buildRetailUnderwriterDecision(webhook: VestaWebhookPayload, loan: LoanDetails | null, losUrl?: string, conditions?: ConditionItem[]): EmailResult {
  const decision = resolveDecision(webhook);
  const config = decisionConfigs[decision];
  const loanNumber = loan?.loanNumber || "";
  const borrowerName = loan?.borrowerName || "Borrower";
  const loFirst = loan?.loFullName?.split(" ")[0] || "Team";

  const rows = [
    detailRow("Loan Number", loanNumber),
    detailRow("Borrower", borrowerName),
    detailRow("Borrower Email", loan?.borrowerEmail || ""),
    detailRow("Borrower Phone", loan?.borrowerPhone || ""),
    detailRow("Property", loan?.propertyAddress || ""),
    detailRow("Loan Amount", loan?.loanAmount ? formatCurrency(loan.loanAmount) : ""),
    detailRow("Loan Type", loan?.loanType || ""),
    detailRow("Purpose", loan?.loanPurpose || ""),
    detailRow("Decision", webhook.decision || ""),
    detailRow("Updated", formatTimestamp(webhook.timestamp)),
  ].join("");

  const preheader = config.preheader(borrowerName, loanNumber);
  const uwNoteHtml = buildUnderwriterNoteHtml(loan?.underwriterNote || "");

  // Deny: show denial reasons, no conditions. All others: show conditions.
  let contentBlock = "";
  if (decision === "Deny") {
    const denyReasonsHtml = buildDenyReasonsHtml(loan?.denyReasons || []);
    contentBlock = `<p style="font-family:Arial,sans-serif;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#64748b;margin:0 0 12px;">Denial Reasons</p>
    ${denyReasonsHtml}`;
  } else {
    const conditionsHtml = buildConditionsHtml(conditions || [], config.accentColor);
    contentBlock = `<p style="font-family:Arial,sans-serif;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#64748b;margin:0 0 12px;">Conditions</p>
    ${conditionsHtml}`;
  }

  const body = `<p style="font-family:Arial,sans-serif;font-size:17px;color:#1f2937;margin:0 0 16px;line-height:1.6;">Hi ${loFirst},</p>
    <p style="font-family:Arial,sans-serif;font-size:15px;color:#4b5563;margin:0 0 24px;line-height:1.7;">${config.greetingLine(loFirst, loanNumber)}</p>
    ${detailsTable(rows)}
    ${contentBlock}
    ${uwNoteHtml}
    ${!loan ? apiWarningHtml : ""}`;

  const recipients: string[] = [];
  if (loan?.loEmail) recipients.push(loan.loEmail);

  return {
    subject: `${config.subjectPrefix}${loanNumber ? ` \u2014 Loan #${loanNumber}` : ""} \u2014 ${borrowerName}`,
    html: wrapDecisionEmail(config, preheader, body, losUrl),
    recipients,
  };
}

// ── UnderwriterDecision: WHOLESALE (Broker-focused) ───────────────────────────

function buildWholesaleUnderwriterDecision(webhook: VestaWebhookPayload, loan: LoanDetails | null, losUrl?: string, conditions?: ConditionItem[]): EmailResult {
  const decision = resolveDecision(webhook);
  const config = decisionConfigs[decision];
  const loanNumber = loan?.loanNumber || "";
  const borrowerName = loan?.borrowerName || "Borrower";
  const brokerFirst = loan?.brokerName?.split(" ")[0] || "Partner";

  const rows = [
    detailRow("Loan Number", loanNumber),
    detailRow("Borrower", borrowerName),
    detailRow("Property", loan?.propertyAddress || ""),
    detailRow("Loan Amount", loan?.loanAmount ? formatCurrency(loan.loanAmount) : ""),
    detailRow("Loan Type", loan?.loanType || ""),
    detailRow("Purpose", loan?.loanPurpose || ""),
    detailRow("Broker LO", loan?.loFullName || ""),
    detailRow("LO Email", loan?.loEmail || ""),
    detailRow("LO Phone", loan?.loPhone || ""),
    detailRow("Decision", webhook.decision || ""),
    detailRow("Updated", formatTimestamp(webhook.timestamp)),
  ].join("");

  const preheader = config.preheader(borrowerName, loanNumber);
  const uwNoteHtml = buildUnderwriterNoteHtml(loan?.underwriterNote || "");

  // Deny: show denial reasons, no conditions. All others: show conditions.
  let contentBlock = "";
  if (decision === "Deny") {
    const denyReasonsHtml = buildDenyReasonsHtml(loan?.denyReasons || []);
    contentBlock = `<p style="font-family:Arial,sans-serif;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#64748b;margin:0 0 12px;">Denial Reasons</p>
    ${denyReasonsHtml}`;
  } else {
    const conditionsHtml = buildConditionsHtml(conditions || [], config.accentColor);
    contentBlock = `<p style="font-family:Arial,sans-serif;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#64748b;margin:0 0 12px;">Conditions</p>
    ${conditionsHtml}`;
  }

  const body = `<p style="font-family:Arial,sans-serif;font-size:17px;color:#1f2937;margin:0 0 16px;line-height:1.6;">Hi ${brokerFirst},</p>
    <p style="font-family:Arial,sans-serif;font-size:15px;color:#4b5563;margin:0 0 24px;line-height:1.7;">${config.greetingLine(brokerFirst, loanNumber)}</p>
    ${detailsTable(rows)}
    ${contentBlock}
    ${uwNoteHtml}
    ${!loan ? apiWarningHtml : ""}`;

  const recipients: string[] = [];
  if (loan?.brokerEmail) recipients.push(loan.brokerEmail);

  return {
    subject: `[UFF] ${config.subjectPrefix}${loanNumber ? ` \u2014 Loan #${loanNumber}` : ""} \u2014 ${borrowerName}`,
    html: wrapDecisionEmail(config, preheader, body, losUrl, "View Loan in PRO Portal \u2192"),
    recipients,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── EVENT HANDLER REGISTRY ──────────────────────────────────────────────────
// Add new event types here. Each entry maps eventType → { Retail, Wholesale }.
// ═══════════════════════════════════════════════════════════════════════════════

type EmailBuilder = (webhook: VestaWebhookPayload, loan: LoanDetails | null, losUrl?: string, conditions?: ConditionItem[]) => EmailResult;

const eventHandlers: Record<string, Partial<Record<Channel, EmailBuilder>>> = {
  LoanStageChanged: {
    Retail: buildRetailStageChanged,
    Wholesale: buildWholesaleStageChanged,
  },
  UnderwriterDecision: {
    Retail: buildRetailUnderwriterDecision,
    Wholesale: buildWholesaleUnderwriterDecision,
  },
  // Future event types go here, e.g.:
  // LoanConditionAdded: { Retail: buildRetailConditionAdded, Wholesale: buildWholesaleConditionAdded },
};

// ─── Send Email via Resend ───────────────────────────────────────────────────

async function sendEmail(
  resendApiKey: string, to: string[], subject: string, html: string, replyTo?: string
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendApiKey}` },
      body: JSON.stringify({ from: `${companyName} <noreply@uff.loans>`, to, subject, html, reply_to: replyTo || undefined }),
    });
    const result = await res.json();
    if (!res.ok) { console.error("Resend error:", result); return { success: false, error: result.message || `Resend HTTP ${res.status}` }; }
    return { success: true, id: result.id };
  } catch (err: any) {
    console.error("Resend fetch error:", err);
    return { success: false, error: err.message };
  }
}

// ─── Log webhook event to Supabase ───────────────────────────────────────────

async function logWebhookEvent(
  eventType: string, channel: string, rawPayload: Record<string, any>,
  loanDetails: LoanDetails | null, emailsSent: string[], errors: string[]
) {
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    await supabase.from("webhook_events").insert({
      source: "vesta",
      event_type: eventType,
      loan_id: rawPayload.loanId || null,
      loan_number: loanDetails?.loanNumber || null,
      payload: {
        webhook: rawPayload,
        channel,
        loanDetails: loanDetails ? {
          loanNumber: loanDetails.loanNumber,
          channel: loanDetails.channel,
          borrowerName: loanDetails.borrowerName,
          borrowerEmail: loanDetails.borrowerEmail,
          loFullName: loanDetails.loFullName,
          loEmail: loanDetails.loEmail,
          brokerName: loanDetails.brokerName,
          brokerEmail: loanDetails.brokerEmail,
          brokerCompany: loanDetails.brokerCompany,
          propertyAddress: loanDetails.propertyAddress,
          loanAmount: loanDetails.loanAmount,
          loanType: loanDetails.loanType,
          loanStage: loanDetails.loanStage,
        } : null,
        rawLoanKeys: loanDetails?.raw ? Object.keys(loanDetails.raw) : null,
      },
      emails_sent: emailsSent,
      errors: errors.length > 0 ? errors : null,
      received_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Failed to log webhook event:", err);
  }
}

// ─── Main Handler ────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  // NOTE: Vesta does not send custom auth headers on webhooks.

  let rawPayload: Record<string, any>;
  try { rawPayload = await req.json(); } catch { return jsonResponse({ error: "Invalid JSON body" }, 400); }

  const eventType = rawPayload.type || rawPayload.Type || rawPayload.eventType || rawPayload.EventType || rawPayload.event_type;
  if (!eventType) {
    console.error("No event type found:", JSON.stringify(rawPayload).slice(0, 1000));
    await logWebhookEvent("UNKNOWN", "Unknown", rawPayload, null, [], ["No event type field found"]);
    return jsonResponse({ error: "Missing event type", logged: true }, 400);
  }

  const loanId = rawPayload.loanId || rawPayload.LoanId || "";
  console.log(`Vesta webhook: ${eventType}, loanId: ${loanId}, channel: ${rawPayload.loanChannel || "?"}`);

  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    console.error("RESEND_API_KEY not configured");
    await logWebhookEvent(eventType, "Unknown", rawPayload, null, [], ["RESEND_API_KEY missing"]);
    return jsonResponse({ received: true, error: "Email service not configured" }, 200);
  }

  const emailsSent: string[] = [];
  const errors: string[] = [];
  const companyEmail = Deno.env.get("COMPANY_EMAIL") || "mark.ramirez@uff.loans";

  // Fetch loan details
  let loan: LoanDetails | null = null;
  if (loanId) {
    loan = await fetchLoanDetails(loanId);
    if (!loan) errors.push("Could not fetch loan details from Vesta API");
  }

  const channel = resolveChannel(rawPayload as VestaWebhookPayload, loan);
  console.log(`Resolved channel: ${channel}`);

  // Get Vesta LOS URL for button
  const vestaConfig = await getVestaConfig();
  const losUrl = getVestaLoanUrl(vestaConfig.apiUrl, loanId);

  // Fetch conditions for event types that need them
  const needsConditions = ["UnderwriterDecision"];
  let conditions: ConditionItem[] = [];
  if (needsConditions.includes(eventType) && loanId) {
    conditions = await fetchObjectiveConditions(loanId);
    console.log(`Fetched ${conditions.length} conditions for ${eventType}`);
  }

  // ── Dispatch to channel-specific handler ──
  const handlers = eventHandlers[eventType];
  if (handlers) {
    const builder = handlers[channel] || handlers["Retail"]; // fallback to Retail for Unknown
    if (builder) {
      const email = builder(rawPayload as VestaWebhookPayload, loan, losUrl, conditions);

      // Send to channel-specific recipients
      const sent = new Set<string>();
      for (const addr of email.recipients) {
        if (!addr || sent.has(addr.toLowerCase())) continue;
        sent.add(addr.toLowerCase());
        const result = await sendEmail(resendApiKey, [addr], email.subject, email.html);
        if (result.success) emailsSent.push(`${channel.toLowerCase()}:${addr}`);
        else errors.push(`${addr} failed: ${result.error}`);
      }

      // Send to company email (skip if already sent to that address)
      if (!sent.has(companyEmail.toLowerCase())) {
        const companyResult = await sendEmail(resendApiKey, [companyEmail], email.subject, email.html);
        if (companyResult.success) emailsSent.push(`company:${companyEmail}`);
        else errors.push(`company email failed: ${companyResult.error}`);
      }

      await logWebhookEvent(eventType, channel, rawPayload, loan, emailsSent, errors);
      return jsonResponse({
        received: true, eventType, channel,
        decision: rawPayload.decision || undefined,
        newLoanStage: rawPayload.newLoanStage || undefined,
        loanNumber: loan?.loanNumber || null,
        conditionsCount: conditions.length || undefined,
        emailsSent: emailsSent.length,
        errors: errors.length > 0 ? errors : undefined,
      });
    }
  }

  // ── Fallback for unregistered event types ──
  const fallbackSubject = `[Vesta] ${eventType}${loan?.loanNumber ? ` \u2014 Loan #${loan.loanNumber}` : ""} \u2014 ${loan?.borrowerName || "Unknown"}`;
  const fallbackHtml = wrapEmail(
    "Vesta Event Received", `Event: ${eventType}`,
    `<p style="font-family:Arial,sans-serif;font-size:15px;color:#334155;margin:0 0 16px;">A <strong>${eventType}</strong> event was received from Vesta.</p>
    ${detailsTable([
      detailRow("Event", eventType),
      detailRow("Channel", channel),
      detailRow("Loan #", loan?.loanNumber || ""),
      detailRow("Borrower", loan?.borrowerName || ""),
    ].join(""))}
    <p style="font-family:Arial,sans-serif;font-size:13px;color:#94a3b8;margin:0;">Received at ${new Date().toISOString()}</p>`,
    losUrl
  );
  const result = await sendEmail(resendApiKey, [companyEmail], fallbackSubject, fallbackHtml);
  if (result.success) emailsSent.push(`company:${companyEmail}`);
  else errors.push(`company email failed: ${result.error}`);

  await logWebhookEvent(eventType, channel, rawPayload, loan, emailsSent, errors);
  return jsonResponse({ received: true, eventType, channel, emailsSent: emailsSent.length, errors: errors.length > 0 ? errors : undefined });
});
