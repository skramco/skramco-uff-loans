import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {
  BORROWER_FOOTER_LINKS,
  OPS_FOOTER_LINKS,
  UFF_EMAIL,
  detailTable,
  wrapUffEmail,
} from "../_shared/marketing/uffEmailTemplate.ts";

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
    html: wrapUffEmail({
      heading: "New talk to an expert request",
      preheader: "A new request was submitted from the website.",
      kicker: "INTERNAL NOTICE",
      bodyHtml: `
        <p style="font-family:${UFF_EMAIL.font};font-size:16px;color:${UFF_EMAIL.body};margin:0 0 16px;line-height:1.65;">A new request was submitted from the website.</p>
        ${detailTable([
          ["Name", safeName],
          ["Email", safeEmail],
          ["Phone", safePhone],
          ["Preferred contact", safeMethod],
          ["Preferred time", safeTime],
          ["Source", safeSource],
          ["Submitted", submittedAt],
        ])}
      `,
      logoHref: UFF_EMAIL.siteUrl,
      footerLinks: OPS_FOOTER_LINKS,
    }),
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
    html: wrapUffEmail({
      heading: "Thanks for reaching out",
      preheader: "We received your request and will be in touch during your preferred window.",
      kicker: "UFF LOANS",
      bodyHtml: `
        <p style="font-family:${UFF_EMAIL.font};font-size:16px;color:${UFF_EMAIL.body};margin:0 0 16px;line-height:1.65;">Hi ${safeFirstName},</p>
        <p style="font-family:${UFF_EMAIL.font};font-size:16px;color:${UFF_EMAIL.body};margin:0 0 16px;line-height:1.65;">
          We received your request and our team will contact you by <strong>${methodText}</strong> during your preferred time window: <strong>${safeTime}</strong>.
        </p>
        ${detailTable([
          ["Email", safeEmail],
          ["Phone", safePhone],
        ])}
        <p style="font-family:${UFF_EMAIL.font};font-size:14px;color:${UFF_EMAIL.muted};margin:0;line-height:1.6;">
          If you need to update your request, reply to this email or call us at
          <a href="tel:${UFF_EMAIL.phoneTel}" style="color:${UFF_EMAIL.brandRed};text-decoration:none;">${UFF_EMAIL.phone}</a>.
        </p>
      `,
      ctaUrl: UFF_EMAIL.contactUrl,
      ctaLabel: "Contact UFF",
      logoHref: UFF_EMAIL.siteUrl,
      footerLinks: BORROWER_FOOTER_LINKS,
    }),
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
