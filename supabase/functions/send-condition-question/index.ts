import "jsr:@supabase/functions-js/edge-runtime.d.ts";

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
  const year = new Date().getFullYear();
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

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Borrower Question About Loan Condition</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1d4ed8,#1e40af);padding:32px 40px;border-radius:12px 12px 0 0;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.3px;">HomeLoanAgents</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Borrower Question Received</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background-color:#ffffff;padding:32px 40px;">

              <p style="margin:0 0 20px;color:#334155;font-size:15px;line-height:1.6;">
                Hi${payload.loanOfficerName ? " " + payload.loanOfficerName.split(" ")[0] : ""},
              </p>

              <p style="margin:0 0 24px;color:#334155;font-size:15px;line-height:1.6;">
                <strong>${payload.borrowerName}</strong> has a question about a condition on their loan. Please review the details below and respond at your earliest convenience.
              </p>

              <!-- Loan Info -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:20px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0 0 4px;color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Loan Details</p>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      ${payload.loanNumber ? `<tr><td style="padding:4px 0;color:#64748b;font-size:13px;width:120px;">Loan Number</td><td style="padding:4px 0;color:#0f172a;font-size:13px;font-weight:600;">${payload.loanNumber}</td></tr>` : ""}
                      <tr><td style="padding:4px 0;color:#64748b;font-size:13px;width:120px;">Borrower</td><td style="padding:4px 0;color:#0f172a;font-size:13px;font-weight:600;">${payload.borrowerName}</td></tr>
                      <tr><td style="padding:4px 0;color:#64748b;font-size:13px;width:120px;">Borrower Email</td><td style="padding:4px 0;color:#0f172a;font-size:13px;font-weight:600;">${payload.borrowerEmail}</td></tr>
                      ${payload.propertyAddress ? `<tr><td style="padding:4px 0;color:#64748b;font-size:13px;width:120px;">Property</td><td style="padding:4px 0;color:#0f172a;font-size:13px;font-weight:600;">${payload.propertyAddress}</td></tr>` : ""}
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Condition Info -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fffbeb;border:1px solid #fde68a;border-radius:8px;margin-bottom:20px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0 0 4px;color:#92400e;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Condition in Question</p>
                    <p style="margin:8px 0;color:#0f172a;font-size:14px;line-height:1.5;">${payload.conditionInstructions || payload.conditionName}</p>
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        ${payload.conditionTiming ? `<td style="padding-right:8px;"><span style="display:inline-block;background-color:#fef3c7;color:#92400e;font-size:11px;font-weight:600;padding:3px 8px;border-radius:4px;">${payload.conditionTiming}</span></td>` : ""}
                        <td><span style="display:inline-block;background-color:#dbeafe;color:#1e40af;font-size:11px;font-weight:600;padding:3px 8px;border-radius:4px;">${statusLabel}</span></td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Question -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#eff6ff;border-left:4px solid #3b82f6;border-radius:4px;margin-bottom:24px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0 0 4px;color:#1e40af;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Borrower's Question</p>
                    <p style="margin:8px 0 0;color:#0f172a;font-size:14px;line-height:1.6;white-space:pre-wrap;">${payload.question}</p>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;color:#334155;font-size:14px;line-height:1.6;">
                Simply reply to this email to respond directly to ${payload.borrowerName.split(" ")[0]}.
              </p>

              <p style="margin:0;color:#94a3b8;font-size:12px;">
                Sent on ${date}
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc;padding:24px 40px;border-radius:0 0 12px 12px;border-top:1px solid #e2e8f0;">
              <p style="margin:0 0 8px;color:#64748b;font-size:12px;text-align:center;line-height:1.5;">
                This email was sent from the HomeLoanAgents Borrower Portal.<br />
                The borrower submitted this question through the loan conditions page.
              </p>
              <p style="margin:0;color:#94a3b8;font-size:11px;text-align:center;line-height:1.5;">
                &copy; ${year} HomeLoanAgents. All rights reserved. NMLS #XXXXXX.<br />
                Equal Housing Lender. This is not a commitment to lend.
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

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: `HomeLoanAgents Portal <send@homeloanagents.com>`,
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
