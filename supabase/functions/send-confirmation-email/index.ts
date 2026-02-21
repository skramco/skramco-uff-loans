import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";

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

function getBodyContent(
  actionType: string,
  firstName: string,
  confirmUrl: string
): string {
  if (actionType === "signup") {
    return `
      <p style="font-family: Arial, sans-serif; font-size: 17px; color: #1f2937; margin: 0 0 20px; line-height: 1.6;">
        Hi ${firstName},
      </p>
      <p style="font-family: Arial, sans-serif; font-size: 15px; color: #4b5563; margin: 0 0 16px; line-height: 1.7;">
        Thank you for starting your mortgage application with United Fidelity Funding! We're excited to help you find the perfect loan for your needs.
      </p>
      <p style="font-family: Arial, sans-serif; font-size: 15px; color: #4b5563; margin: 0 0 30px; line-height: 1.7;">
        To get started, please confirm your email address by clicking the button below. This will activate your account and take you right back to your application.
      </p>

      <!-- CTA Button (Outlook-compatible) -->
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td align="center" style="padding: 8px 0 32px;">
            <!--[if mso]>
            <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${confirmUrl}" style="height:52px;v-text-anchor:middle;width:280px;" arcsize="10%" strokecolor="#b91c1c" fillcolor="#dc2626">
              <w:anchorlock/>
              <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;">Confirm Email &amp; Continue</center>
            </v:roundrect>
            <![endif]-->
            <!--[if !mso]><!-->
            <a href="${confirmUrl}" style="display: inline-block; background-color: #dc2626; color: #ffffff; font-family: Arial, sans-serif; font-size: 16px; font-weight: 600; text-decoration: none; padding: 16px 48px; border-radius: 8px; mso-hide: all;">
              Confirm Email &amp; Continue
            </a>
            <!--<![endif]-->
          </td>
        </tr>
      </table>

      <!-- What's Next Section -->
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="#fef2f2" style="background-color: #fef2f2; margin-bottom: 24px;">
        <tr>
          <td style="padding: 24px;">
            <p style="font-family: Arial, sans-serif; font-size: 14px; font-weight: 700; color: #991b1b; margin: 0 0 16px; text-transform: uppercase; letter-spacing: 0.5px;">What happens next</p>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
              <tr>
                <td style="padding: 6px 0; vertical-align: top; width: 28px; font-family: Arial, sans-serif; font-size: 12px; font-weight: 700; color: #dc2626;">1.</td>
                <td style="padding: 6px 0 6px 4px; font-family: Arial, sans-serif; font-size: 14px; color: #4b5563; line-height: 1.5;">Confirm your email (click the button above)</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; vertical-align: top; width: 28px; font-family: Arial, sans-serif; font-size: 12px; font-weight: 700; color: #dc2626;">2.</td>
                <td style="padding: 6px 0 6px 4px; font-family: Arial, sans-serif; font-size: 14px; color: #4b5563; line-height: 1.5;">Complete your loan application at your own pace</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; vertical-align: top; width: 28px; font-family: Arial, sans-serif; font-size: 12px; font-weight: 700; color: #dc2626;">3.</td>
                <td style="padding: 6px 0 6px 4px; font-family: Arial, sans-serif; font-size: 14px; color: #4b5563; line-height: 1.5;">Your progress is saved automatically — come back anytime</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; vertical-align: top; width: 28px; font-family: Arial, sans-serif; font-size: 12px; font-weight: 700; color: #dc2626;">4.</td>
                <td style="padding: 6px 0 6px 4px; font-family: Arial, sans-serif; font-size: 14px; color: #4b5563; line-height: 1.5;">Submit when ready — a loan officer will reach out within 24 hours</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `;
  }

  // Password reset / magic link / email change
  const buttonLabel =
    actionType === "recovery" || actionType === "reset"
      ? "Reset My Password"
      : actionType === "email_change"
        ? "Confirm New Email"
        : "Sign In";

  return `
    <p style="font-family: Arial, sans-serif; font-size: 17px; color: #1f2937; margin: 0 0 20px; line-height: 1.6;">
      Hi ${firstName},
    </p>
    <p style="font-family: Arial, sans-serif; font-size: 15px; color: #4b5563; margin: 0 0 30px; line-height: 1.7;">
      Click the button below to continue. This link will expire in 24 hours.
    </p>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
      <tr>
        <td align="center" style="padding: 8px 0 32px;">
          <!--[if mso]>
          <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${confirmUrl}" style="height:52px;v-text-anchor:middle;width:280px;" arcsize="10%" strokecolor="#b91c1c" fillcolor="#dc2626">
            <w:anchorlock/>
            <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;">${buttonLabel}</center>
          </v:roundrect>
          <![endif]-->
          <!--[if !mso]><!-->
          <a href="${confirmUrl}" style="display: inline-block; background-color: #dc2626; color: #ffffff; font-family: Arial, sans-serif; font-size: 16px; font-weight: 600; text-decoration: none; padding: 16px 48px; border-radius: 8px; mso-hide: all;">
            ${buttonLabel}
          </a>
          <!--<![endif]-->
        </td>
      </tr>
    </table>
  `;
}

function buildEmailHtml(
  actionType: string,
  firstName: string,
  confirmUrl: string
): string {
  const { heading, preheader } = getSubjectAndHeading(actionType);
  const bodyContent = getBodyContent(actionType, firstName, confirmUrl);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${heading}</title>
  <!--[if !mso]><!-->
  <style>
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; }
      .email-body { padding: 24px !important; }
    }
  </style>
  <!--<![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif;">
  <span style="display: none; max-height: 0; overflow: hidden;">${preheader}</span>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8f9fa;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" class="email-container" width="600" cellspacing="0" cellpadding="0" bgcolor="#ffffff" style="background-color: #ffffff;">

          <!-- Header -->
          <tr>
            <td bgcolor="#dc2626" style="background-color: #dc2626; padding: 40px 40px 30px; text-align: center;">
              <img src="https://uff.loans/UFF_Logo_Main_2026.png" alt="United Fidelity Funding" width="200" style="max-width: 200px; height: auto; margin-bottom: 16px; display: block; margin-left: auto; margin-right: auto;" />
              <h1 style="color: #ffffff; font-family: Arial, sans-serif; font-size: 28px; font-weight: 700; margin: 0 0 8px;">${heading}</h1>
              <p style="color: #fecaca; font-family: Arial, sans-serif; font-size: 15px; margin: 0;">${preheader}</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td class="email-body" style="padding: 40px;">
              ${bodyContent}

              <p style="font-family: Arial, sans-serif; font-size: 14px; color: #6b7280; margin: 24px 0 8px; line-height: 1.6;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="font-family: Arial, sans-serif; font-size: 13px; color: #9ca3af; margin: 0 0 24px; word-break: break-all; line-height: 1.5;">
                ${confirmUrl}
              </p>

              <p style="font-family: Arial, sans-serif; font-size: 15px; color: #4b5563; margin: 0; line-height: 1.7;">
                Questions? Call us at <a href="tel:+18559532453" style="color: #dc2626; text-decoration: none; font-weight: 600;">(855) 95-EAGLE</a>.
              </p>

              <p style="font-family: Arial, sans-serif; font-size: 15px; color: #4b5563; margin: 20px 0 0; line-height: 1.7;">
                Warm regards,<br>
                <strong style="color: #1f2937;">The United Fidelity Funding Team</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td bgcolor="#f9fafb" style="background-color: #f9fafb; padding: 24px 40px; border-top: 1px solid #e5e7eb;">
              <p style="font-family: Arial, sans-serif; font-size: 11px; color: #9ca3af; margin: 0 0 8px; line-height: 1.6; text-align: center;">
                United Fidelity Funding Corp., NMLS #34381 | 1300 NW Briarcliff Pkwy #275, Kansas City, MO 64116
              </p>
              <p style="font-family: Arial, sans-serif; font-size: 11px; color: #9ca3af; margin: 0 0 8px; line-height: 1.6; text-align: center;">
                Licensed in 39 states. For licensing information, visit
                <a href="https://www.nmlsconsumeraccess.org/EntityDetails.aspx/COMPANY/34381" style="color: #9ca3af; text-decoration: underline;">NMLS Consumer Access</a>.
              </p>
              <p style="font-family: Arial, sans-serif; font-size: 11px; color: #9ca3af; margin: 0; line-height: 1.6; text-align: center;">
                Equal Housing Lender. &copy; ${new Date().getFullYear()} United Fidelity Funding Corp. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
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
