import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {
  BORROWER_FOOTER_LINKS,
  OPS_FOOTER_LINKS,
  UFF_EMAIL,
  detailTable,
  statusBanner,
  wrapUffEmail,
} from "../_shared/marketing/uffEmailTemplate.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ApplicationEmailRequest {
  applicationType: "simple" | "urla";
  applicantName: string;
  applicantEmail: string;
  applicationNumber: string;
  viewToken?: string;
  applicationData: {
    loanAmount?: number;
    propertyValue?: string | number;
    propertyAddress?: string;
    propertyCity?: string;
    propertyState?: string;
    annualIncome?: number;
    monthlyIncome?: number;
    loanType?: string;
    loanPurpose?: string;
    employerName?: string;
    totalAssets?: number;
    totalMonthlyDebt?: number;
    downPayment?: number;
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const companyEmail = Deno.env.get("COMPANY_EMAIL") || "mark.ramirez@uff.loans";
    const companyName = "United Fidelity Funding";
    const fromAddress = `${companyName} <noreply@uff.loans>`;
    const notifFromAddress = `${companyName} <notifications@uff.loans>`;

    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY environment variable is not set");
    }

    const payload: ApplicationEmailRequest = await req.json();
    const { applicationType, applicantName, applicantEmail, applicationNumber, applicationData } = payload;

    const fmt = (n?: number) => n ? `$${n.toLocaleString()}` : "N/A";
    const submittedDate = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    const firstName = applicantName.split(" ")[0] || applicantName;

    const purposeText = applicationData.loanPurpose?.toLowerCase() || "";
    let journeyMessage = "We know that applying for a mortgage is a big step, and we don't take your trust lightly.";
    let subjectLine = "your home loan";
    if (purposeText.includes("purchase") || purposeText.includes("buy")) {
      journeyMessage = "Buying a home is one of life's biggest milestones, and we're honored that you've chosen us to help make it happen.";
      subjectLine = "your new home";
    } else if (purposeText.includes("refinance")) {
      journeyMessage = "Refinancing is a smart financial move, and we're here to make sure you get the best possible outcome.";
      subjectLine = "your refinance";
    } else if (purposeText.includes("cash")) {
      journeyMessage = "Tapping into your home's equity is a powerful financial tool, and we're here to help you use it wisely.";
      subjectLine = "your cash-out refinance";
    }

    const applicantEmailHtml = wrapUffEmail({
      heading: "We've received your application",
      preheader: `We've received your application, ${firstName} — here's what happens next.`,
      kicker: "UFF LOANS",
      bodyHtml: `
        <p style="font-family:${UFF_EMAIL.font};font-size:16px;color:${UFF_EMAIL.body};margin:0 0 16px;line-height:1.65;">Hi ${firstName},</p>
        <p style="font-family:${UFF_EMAIL.font};font-size:16px;color:${UFF_EMAIL.body};margin:0 0 16px;line-height:1.65;">Thank you for submitting your application with ${companyName}. ${journeyMessage}</p>
        ${statusBanner("Next step", "A dedicated loan officer will call you within 4 business hours from an (855) number. If we miss you, we'll follow up by email.")}
        ${detailTable([
          ["Application #", applicationNumber],
          ["Purpose", applicationData.loanPurpose || ""],
          ["Loan type", applicationData.loanType || ""],
          ["Property", applicationData.propertyAddress || ""],
          ["Down payment", applicationData.downPayment ? fmt(applicationData.downPayment) : ""],
          ["Submitted", submittedDate],
        ])}
        <p style="font-family:${UFF_EMAIL.font};font-size:15px;color:${UFF_EMAIL.body};margin:0 0 12px;line-height:1.65;">You can sign in anytime to check status, view conditions, and upload documents.</p>
        <p style="font-family:${UFF_EMAIL.font};font-size:14px;color:${UFF_EMAIL.muted};margin:0 0 8px;line-height:1.6;">Questions before we call? ${UFF_EMAIL.phone} · ${companyEmail}</p>
        <p style="font-family:${UFF_EMAIL.font};font-size:15px;color:${UFF_EMAIL.body};margin:24px 0 0;line-height:1.7;">Talk soon,<br><strong style="color:${UFF_EMAIL.ink};">The ${companyName} Team</strong></p>
      `,
      ctaUrl: UFF_EMAIL.loginUrl,
      ctaLabel: "Sign in to your loan",
      logoHref: UFF_EMAIL.siteUrl,
      footerLinks: BORROWER_FOOTER_LINKS,
    });

    const companyEmailHtml = wrapUffEmail({
      heading: "New mortgage application",
      preheader: `${applicantName} submitted a ${applicationType} application.`,
      kicker: "INTERNAL NOTICE",
      bodyHtml: `
        ${statusBanner("Action needed", "Review and contact the applicant within 24 hours.")}
        ${detailTable([
          ["Application #", applicationNumber],
          ["Name", applicantName],
          ["Email", applicantEmail],
          ["Type", applicationType === "urla" ? "URLA (Comprehensive)" : "Simple Application"],
          ["Loan amount", applicationData.loanAmount ? fmt(applicationData.loanAmount) : ""],
          ["Property", applicationData.propertyAddress || ""],
          ["Loan type", applicationData.loanType || ""],
          ["Annual income", applicationData.annualIncome ? fmt(applicationData.annualIncome) : ""],
          ["Employer", applicationData.employerName || ""],
          ["Submitted", new Date().toLocaleString()],
        ])}
      `,
      logoHref: UFF_EMAIL.siteUrl,
      footerLinks: OPS_FOOTER_LINKS,
    });

    const emailPromises = [];

    emailPromises.push(
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [applicantEmail],
          subject: `We've received your application for ${subjectLine}, ${firstName}`,
          html: applicantEmailHtml,
        }),
      })
    );

    emailPromises.push(
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: notifFromAddress,
          to: [companyEmail],
          subject: `New ${applicationType.toUpperCase()} Application — ${applicantName}`,
          html: companyEmailHtml,
        }),
      })
    );

    const results = await Promise.all(emailPromises);
    const responses = await Promise.all(results.map((r) => r.json()));

    return new Response(
      JSON.stringify({
        success: true,
        message: "Emails sent successfully",
        results: responses,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error sending emails:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
