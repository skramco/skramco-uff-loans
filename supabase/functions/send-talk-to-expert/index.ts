import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface TalkToExpertRequest {
  name: string;
  phone?: string;
  email: string;
  preferredContact: "phone" | "email";
  preferredTime: string;
  source?: string;
}

const INTERNAL_TO = "talktoanexpert@uff.loans";
const DEFAULT_FROM_EMAIL = "UFF Website <notifications@uff.loans>";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildInternalSummaryEmail(payload: TalkToExpertRequest): { subject: string; html: string } {
  const submittedAt = new Date().toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const safeName = escapeHtml(payload.name);
  const safeEmail = escapeHtml(payload.email);
  const safePhone = escapeHtml(payload.phone || "Not provided");
  const safeMethod = payload.preferredContact === "phone" ? "Phone" : "Email";
  const safeTime = escapeHtml(payload.preferredTime);
  const safeSource = escapeHtml(payload.source || "website");

  return {
    subject: `Talk to an expert request: ${payload.name}`,
    html: `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:24px;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
      <tr>
        <td style="padding:20px 24px;background:#0f172a;color:#ffffff;">
          <h2 style="margin:0;font-size:20px;">New Talk to an Expert Submission</h2>
        </td>
      </tr>
      <tr>
        <td style="padding:24px;">
          <p style="margin:0 0 16px;font-size:14px;color:#475569;">A new request was submitted from the website.</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
            <tr><td style="padding:8px 0;color:#64748b;width:180px;">Name</td><td style="padding:8px 0;font-weight:600;">${safeName}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b;">Email</td><td style="padding:8px 0;font-weight:600;">${safeEmail}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b;">Phone</td><td style="padding:8px 0;font-weight:600;">${safePhone}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b;">Preferred Contact Method</td><td style="padding:8px 0;font-weight:600;">${safeMethod}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b;">Preferred Contact Time</td><td style="padding:8px 0;font-weight:600;">${safeTime}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b;">Source</td><td style="padding:8px 0;font-weight:600;">${safeSource}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b;">Submitted</td><td style="padding:8px 0;font-weight:600;">${submittedAt}</td></tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`,
  };
}

function buildBorrowerConfirmationEmail(payload: TalkToExpertRequest): { subject: string; html: string } {
  const firstName = payload.name.trim().split(" ")[0] || "there";
  const methodText = payload.preferredContact === "phone" ? "phone call" : "email";
  const safeFirstName = escapeHtml(firstName);
  const safeTime = escapeHtml(payload.preferredTime);
  const safeEmail = escapeHtml(payload.email);
  const safePhone = escapeHtml(payload.phone || "Not provided");

  return {
    subject: "We received your request - United Fidelity Funding",
    html: `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="max-width:640px;width:100%;">
            <tr>
              <td style="background:linear-gradient(135deg,#0f172a,#1e3a8a);padding:28px 32px;border-radius:12px 12px 0 0;">
                <p style="margin:0;font-size:12px;color:#bfdbfe;letter-spacing:0.08em;text-transform:uppercase;">United Fidelity Funding</p>
                <h1 style="margin:8px 0 0;color:#ffffff;font-size:24px;line-height:1.3;">Thanks for reaching out</h1>
              </td>
            </tr>
            <tr>
              <td style="background:#ffffff;padding:30px 32px;">
                <p style="margin:0 0 14px;color:#334155;font-size:15px;line-height:1.7;">Hi ${safeFirstName},</p>
                <p style="margin:0 0 14px;color:#334155;font-size:15px;line-height:1.7;">
                  We received your "Talk to an expert" request and our team will contact you by <strong>${methodText}</strong> during your preferred time window: <strong>${safeTime}</strong>.
                </p>
                <p style="margin:0 0 18px;color:#334155;font-size:15px;line-height:1.7;">
                  If you need to update your request, reply to this email or call us directly at (855) 95-EAGLE.
                </p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;">
                  <tr>
                    <td style="padding:14px 16px;">
                      <p style="margin:0 0 8px;font-size:12px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">Your request details</p>
                      <p style="margin:0 0 4px;font-size:14px;color:#0f172a;"><strong>Email:</strong> ${safeEmail}</p>
                      <p style="margin:0;font-size:14px;color:#0f172a;"><strong>Phone:</strong> ${safePhone}</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="background:#f8fafc;padding:18px 32px;border-top:1px solid #e2e8f0;border-radius:0 0 12px 12px;">
                <p style="margin:0;color:#64748b;font-size:12px;line-height:1.6;">
                  United Fidelity Funding Corp. | NMLS #34381<br />
                  1300 NW Briarcliff Pkwy #275, Kansas City, MO 64116
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`,
  };
}

async function sendResendEmail(
  resendApiKey: string,
  from: string,
  to: string[],
  subject: string,
  html: string,
  replyTo?: string
) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${resendApiKey}`,
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      html,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  });

  const result = await response.json();
  if (!response.ok) {
    return { success: false, message: result?.message || "Failed to send email" };
  }

  return { success: true, id: result?.id as string | undefined };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ success: false, message: "Email service not configured." }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload: TalkToExpertRequest = await req.json();
    if (!payload.name?.trim() || !payload.email?.trim() || !payload.preferredTime?.trim()) {
      return new Response(
        JSON.stringify({ success: false, message: "Name, email, and preferred time are required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (payload.preferredContact === "phone" && !payload.phone?.trim()) {
      return new Response(
        JSON.stringify({ success: false, message: "Phone number is required when phone is preferred." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || DEFAULT_FROM_EMAIL;

    const internalEmail = buildInternalSummaryEmail(payload);
    const internalResult = await sendResendEmail(
      resendApiKey,
      fromEmail,
      [INTERNAL_TO],
      internalEmail.subject,
      internalEmail.html,
      payload.email
    );

    if (!internalResult.success) {
      return new Response(
        JSON.stringify({ success: false, message: internalResult.message }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const borrowerEmail = buildBorrowerConfirmationEmail(payload);
    const borrowerResult = await sendResendEmail(
      resendApiKey,
      fromEmail,
      [payload.email.trim()],
      borrowerEmail.subject,
      borrowerEmail.html,
      INTERNAL_TO
    );

    if (!borrowerResult.success) {
      return new Response(
        JSON.stringify({ success: false, message: borrowerResult.message }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        internalEmailId: internalResult.id,
        borrowerEmailId: borrowerResult.id,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, message: error?.message || "Unexpected server error." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
