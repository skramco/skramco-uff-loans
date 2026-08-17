import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {
  OPS_FOOTER_LINKS,
  UFF_EMAIL,
  detailTable,
  escapeHtml,
  statusBanner,
  wrapUffEmail,
} from "../_shared/marketing/uffEmailTemplate.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ConditionQuestionRequest {
  borrowerName: string;
  borrowerEmail: string;
  loanOfficerName: string;
  loanOfficerEmail: string;
  loanNumber: string;
  propertyAddress: string;
  conditionName: string;
  conditionInstructions: string;
  conditionTiming: string;
  conditionStatus: string;
  question: string;
}

function buildEmailHtml(payload: ConditionQuestionRequest): string {
  const date = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const statusLabel =
    payload.conditionStatus === "NotReadyToApprove"
      ? "Action Needed"
      : payload.conditionStatus === "ReadyToApprove"
      ? "Under Review"
      : payload.conditionStatus === "Approved"
      ? "Approved"
      : payload.conditionStatus;

  const loFirst = payload.loanOfficerName ? escapeHtml(payload.loanOfficerName.split(" ")[0]) : "";
  const borrower = escapeHtml(payload.borrowerName);
  const question = escapeHtml(payload.question).replace(/\n/g, "<br/>");

  return wrapUffEmail({
    heading: "Borrower question about a loan condition",
    preheader: `${payload.borrowerName} asked a question about ${payload.conditionName || "a condition"}.`,
    kicker: "BORROWER PORTAL",
    bodyHtml: `
      <p style="font-family:${UFF_EMAIL.font};font-size:16px;color:${UFF_EMAIL.body};margin:0 0 16px;line-height:1.65;">Hi${loFirst ? ` ${loFirst}` : ""},</p>
      <p style="font-family:${UFF_EMAIL.font};font-size:16px;color:${UFF_EMAIL.body};margin:0 0 16px;line-height:1.65;">
        <strong>${borrower}</strong> has a question about a condition on their loan. Reply to this email to respond directly.
      </p>
      ${detailTable([
        ["Loan number", payload.loanNumber || ""],
        ["Borrower", payload.borrowerName],
        ["Borrower email", payload.borrowerEmail],
        ["Property", payload.propertyAddress || ""],
        ["Condition", payload.conditionName || ""],
        ["Timing", payload.conditionTiming || ""],
        ["Status", statusLabel],
      ])}
      ${statusBanner("Borrower's question", question, UFF_EMAIL.canvas, UFF_EMAIL.hairline, UFF_EMAIL.muted)}
      <p style="font-family:${UFF_EMAIL.font};font-size:13px;color:${UFF_EMAIL.muted};margin:0;">Sent on ${date}</p>
    `,
    logoHref: UFF_EMAIL.portalUrl,
    footerLinks: OPS_FOOTER_LINKS,
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: true, message: "Email service not configured" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload: ConditionQuestionRequest = await req.json();

    if (!payload.loanOfficerEmail || !payload.question?.trim()) {
      return new Response(
        JSON.stringify({ error: true, message: "Loan officer email and question are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const html = buildEmailHtml(payload);

    const borrowerFirst = payload.borrowerName?.split(" ")[0] || "Borrower";
    const subject = `Question from ${payload.borrowerName} - ${payload.conditionName || "Loan Condition"}${payload.loanNumber ? ` (Loan #${payload.loanNumber})` : ""}`;

    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "noreply@uff.loans";
    const fromName = Deno.env.get("RESEND_FROM_NAME") || "UFF Borrower Portal";

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: `${fromName} <${fromEmail}>`,
        to: [payload.loanOfficerEmail],
        reply_to: payload.borrowerEmail || undefined,
        subject,
        html,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      return new Response(
        JSON.stringify({ error: true, message: `Email send failed: ${errorText}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const emailResult = await emailResponse.json();

    return new Response(
      JSON.stringify({ success: true, emailId: emailResult.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: true, message: `Server error: ${err.message}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
