import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";
import {
  BORROWER_FOOTER_LINKS,
  UFF_EMAIL,
  wrapUffEmail,
} from "../_shared/marketing/uffEmailTemplate.ts";

/**
 * Supabase Auth "Send Email" Hook
 *
 * Intercepts ALL auth emails (signup confirmation, password reset, magic link, etc.)
 * and sends branded UFF templates via Resend instead of the default Supabase emails.
 *
 * Setup:
 * 1. Deploy: supabase functions deploy send-confirmation-email --no-verify-jwt
 * 2. Set secrets: RESEND_API_KEY, SEND_EMAIL_HOOK_SECRET
 * 3. In Supabase Dashboard → Auth → Hooks → "Send Email" → HTTPS → paste function URL
 * 4. Generate webhook secret in dashboard and set as SEND_EMAIL_HOOK_SECRET
 */

const resendApiKey = Deno.env.get("RESEND_API_KEY") as string;
const hookSecret = (Deno.env.get("SEND_EMAIL_HOOK_SECRET") as string).replace(
  "v1,whsec_",
  ""
);

interface AuthEmailPayload {
  user: {
    email: string;
    user_metadata?: {
      first_name?: string;
      last_name?: string;
    };
  };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to: string;
    email_action_type: string;
    site_url: string;
  };
}

function getSubjectAndHeading(actionType: string): {
  subject: string;
  heading: string;
  preheader: string;
} {
  switch (actionType) {
    case "signup":
      return {
        subject: "Confirm your email — let's get your loan started!",
        heading: "Welcome to UFF!",
        preheader: "Your home loan journey starts here",
      };
    case "recovery":
    case "reset":
      return {
        subject: "Reset your password — United Fidelity Funding",
        heading: "Reset Your Password",
        preheader: "Click the link below to reset your password",
      };
    case "magiclink":
      return {
        subject: "Your login link — United Fidelity Funding",
        heading: "Sign In to UFF",
        preheader: "Click the link below to sign in",
      };
    case "email_change":
      return {
        subject: "Confirm your new email — United Fidelity Funding",
        heading: "Confirm Email Change",
        preheader: "Please confirm your new email address",
      };
    default:
      return {
        subject: "Action required — United Fidelity Funding",
        heading: "Action Required",
        preheader: "Please click the link below to continue",
      };
  }
}

function getBodyContent(actionType: string, firstName: string): string {
  if (actionType === "signup") {
    return `
      <p style="font-family:${UFF_EMAIL.font};font-size:16px;color:${UFF_EMAIL.body};margin:0 0 16px;line-height:1.65;">
        Hi ${firstName},
      </p>
      <p style="font-family:${UFF_EMAIL.font};font-size:16px;color:${UFF_EMAIL.body};margin:0 0 16px;line-height:1.65;">
        Thank you for starting your mortgage application with United Fidelity Funding. Confirm your email to activate your account and return to your application.
      </p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 8px;background-color:${UFF_EMAIL.canvas};border:1px solid ${UFF_EMAIL.hairline};">
        <tr>
          <td style="padding:20px;">
            <p style="font-family:${UFF_EMAIL.font};font-size:11px;font-weight:700;color:${UFF_EMAIL.muted};margin:0 0 12px;text-transform:uppercase;letter-spacing:0.08em;">What happens next</p>
            <p style="font-family:${UFF_EMAIL.font};font-size:14px;color:${UFF_EMAIL.body};margin:0 0 8px;line-height:1.6;">1. Confirm your email with the button below</p>
            <p style="font-family:${UFF_EMAIL.font};font-size:14px;color:${UFF_EMAIL.body};margin:0 0 8px;line-height:1.6;">2. Complete your application at your own pace</p>
            <p style="font-family:${UFF_EMAIL.font};font-size:14px;color:${UFF_EMAIL.body};margin:0 0 8px;line-height:1.6;">3. Your progress is saved automatically</p>
            <p style="font-family:${UFF_EMAIL.font};font-size:14px;color:${UFF_EMAIL.body};margin:0;line-height:1.6;">4. Submit when ready — a loan officer will reach out within 24 hours</p>
          </td>
        </tr>
      </table>
    `;
  }

  return `
    <p style="font-family:${UFF_EMAIL.font};font-size:16px;color:${UFF_EMAIL.body};margin:0 0 16px;line-height:1.65;">
      Hi ${firstName},
    </p>
    <p style="font-family:${UFF_EMAIL.font};font-size:16px;color:${UFF_EMAIL.body};margin:0 0 8px;line-height:1.65;">
      Click the button below to continue. This link will expire in 24 hours.
    </p>
  `;
}

function buildEmailHtml(
  actionType: string,
  firstName: string,
  confirmUrl: string
): string {
  const { heading, preheader } = getSubjectAndHeading(actionType);
  const ctaLabel =
    actionType === "signup"
      ? "Confirm email & continue"
      : actionType === "recovery" || actionType === "reset"
        ? "Reset my password"
        : actionType === "email_change"
          ? "Confirm new email"
          : "Sign in";

  return wrapUffEmail({
    heading,
    preheader,
    kicker: "UFF LOANS",
    bodyHtml: getBodyContent(actionType, firstName),
    ctaUrl: confirmUrl,
    ctaLabel,
    helpHtml: `<p style="font-family:${UFF_EMAIL.font};font-size:14px;color:${UFF_EMAIL.muted};margin:16px 0 0;line-height:1.6;">Questions? Call us at <a href="tel:${UFF_EMAIL.phoneTel}" style="color:${UFF_EMAIL.brandRed};text-decoration:none;font-weight:600;">${UFF_EMAIL.phone}</a>.</p>
<p style="font-family:${UFF_EMAIL.font};font-size:15px;color:${UFF_EMAIL.body};margin:20px 0 0;line-height:1.7;">Warm regards,<br><strong style="color:${UFF_EMAIL.ink};">The United Fidelity Funding Team</strong></p>`,
    logoHref: UFF_EMAIL.siteUrl,
    footerLinks: BORROWER_FOOTER_LINKS,
  });
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const payload = await req.text();
  const headers = Object.fromEntries(req.headers);
  const wh = new Webhook(hookSecret);

  try {
    const {
      user,
      email_data: { token_hash, redirect_to, email_action_type },
    } = wh.verify(payload, headers) as AuthEmailPayload;

    const firstName = user.user_metadata?.first_name || "there";
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";

    // Build the verification URL that Supabase expects
    const confirmUrl = `${supabaseUrl}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`;

    const { subject } = getSubjectAndHeading(email_action_type);
    const html = buildEmailHtml(email_action_type, firstName, confirmUrl);

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "United Fidelity Funding <noreply@uff.loans>",
        to: [user.email],
        subject,
        html,
      }),
    });

    if (!resendResponse.ok) {
      const errData = await resendResponse.json();
      console.error("Resend error:", errData);
      throw { code: resendResponse.status, message: errData.message || "Resend API error" };
    }

    console.log(`Sent ${email_action_type} email to ${user.email}`);
  } catch (error: any) {
    console.error("Send email hook error:", error);
    return new Response(
      JSON.stringify({
        error: {
          http_code: error.code || 500,
          message: error.message || "Internal error sending email",
        },
      }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  return new Response(JSON.stringify({}), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
