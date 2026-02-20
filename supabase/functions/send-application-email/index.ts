import "jsr:@supabase/functions-js/edge-runtime.d.ts";

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
  viewToken: string;
  applicationData: {
    loanAmount?: number;
    propertyValue?: number;
    propertyAddress?: string;
    annualIncome?: number;
    monthlyIncome?: number;
    loanType?: string;
    employerName?: string;
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
    const companyEmail = Deno.env.get("COMPANY_EMAIL");
    const companyName = Deno.env.get("COMPANY_NAME") || "HomeLoanAgents";
    const resendTemplateId = Deno.env.get("RESEND_TEMPLATE_ID");
    const appUrl = Deno.env.get("APP_URL") || "https://eqirdhtkkbvuaktqfrnv.supabase.co";

    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY environment variable is not set");
    }

    if (!companyEmail) {
      throw new Error("COMPANY_EMAIL environment variable is not set");
    }

    const payload: ApplicationEmailRequest = await req.json();
    const { applicationType, applicantName, applicantEmail, applicationNumber, viewToken, applicationData } = payload;

    // Generate view application URL
    const viewApplicationUrl = `${appUrl}/view-application?token=${viewToken}`;

    const applicantEmailHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .app-number { background: #dbeafe; color: #1e40af; padding: 15px; border-radius: 8px; text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0; }
    .section { margin: 20px 0; }
    .section h3 { color: #1d4ed8; margin-bottom: 10px; }
    .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
    .label { font-weight: bold; color: #4b5563; }
    .value { color: #111827; }
    .footer { text-align: center; color: #6b7280; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; }
    .steps { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .step { margin: 15px 0; padding-left: 30px; position: relative; }
    .step::before { content: "✓"; position: absolute; left: 0; color: #1d4ed8; font-weight: bold; font-size: 18px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${companyName}</h1>
      <p>Thank You for Your Application!</p>
    </div>
    <div class="content">
      <p>Dear ${applicantName},</p>

      <p>Thank you for submitting your mortgage application with ${companyName}. We have received your ${applicationType === "urla" ? "comprehensive URLA" : ""} application and our team is reviewing it.</p>

      <div class="app-number">
        Application #${applicationNumber}
      </div>

      <p>Please save this application number for your records. You can reference it when contacting us about your application status.</p>

      <div class="section">
        <h3>Application Summary</h3>
        ${applicationData.loanAmount ? `<div class="info-row"><span class="label">Loan Amount:</span><span class="value">$${applicationData.loanAmount.toLocaleString()}</span></div>` : ""}
        ${applicationData.propertyValue ? `<div class="info-row"><span class="label">Property Value:</span><span class="value">$${applicationData.propertyValue.toLocaleString()}</span></div>` : ""}
        ${applicationData.propertyAddress ? `<div class="info-row"><span class="label">Property Address:</span><span class="value">${applicationData.propertyAddress}</span></div>` : ""}
        ${applicationData.loanType ? `<div class="info-row"><span class="label">Loan Type:</span><span class="value">${applicationData.loanType.toUpperCase()}</span></div>` : ""}
      </div>

      <div class="steps">
        <h3>What Happens Next?</h3>
        <div class="step">Our loan officer will review your application within 24 hours</div>
        <div class="step">We'll contact you to discuss next steps and required documentation</div>
        <div class="step">You'll receive your pre-approval letter (typically 3-5 business days)</div>
        <div class="step">Start shopping for your dream home with confidence!</div>
      </div>

      <p>If you have any questions in the meantime, please don't hesitate to reach out to us at <a href="mailto:${companyEmail}">${companyEmail}</a>.</p>

      <p>We look forward to helping you secure your home loan!</p>

      <p>Best regards,<br>
      <strong>${companyName} Team</strong></p>
    </div>
    <div class="footer">
      <p>This is an automated confirmation email. Please do not reply to this message.</p>
      <p>&copy; ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;

    const companyEmailHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #fef2f2; padding: 30px; border-radius: 0 0 8px 8px; }
    .app-number { background: #fee2e2; color: #991b1b; padding: 15px; border-radius: 8px; text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0; }
    .section { margin: 20px 0; background: white; padding: 20px; border-radius: 8px; }
    .section h3 { color: #dc2626; margin-bottom: 15px; }
    .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
    .label { font-weight: bold; color: #4b5563; }
    .value { color: #111827; }
    .alert { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .footer { text-align: center; color: #6b7280; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔔 New Mortgage Application</h1>
      <p>Action Required</p>
    </div>
    <div class="content">
      <div class="alert">
        <strong>⚡ New ${applicationType === "urla" ? "URLA" : "Simple"} Application Submitted</strong><br>
        Please review and contact the applicant within 24 hours.
      </div>

      <div class="app-number">
        Application #${applicationNumber}
      </div>

      <div class="section">
        <h3>Applicant Information</h3>
        <div class="info-row"><span class="label">Name:</span><span class="value">${applicantName}</span></div>
        <div class="info-row"><span class="label">Email:</span><span class="value">${applicantEmail}</span></div>
        <div class="info-row"><span class="label">Application Type:</span><span class="value">${applicationType === "urla" ? "URLA (Comprehensive)" : "Simple Application"}</span></div>
        <div class="info-row"><span class="label">Submitted:</span><span class="value">${new Date().toLocaleString()}</span></div>
      </div>

      <div class="section">
        <h3>Loan Details</h3>
        ${applicationData.loanAmount ? `<div class="info-row"><span class="label">Loan Amount:</span><span class="value">$${applicationData.loanAmount.toLocaleString()}</span></div>` : ""}
        ${applicationData.propertyValue ? `<div class="info-row"><span class="label">Property Value:</span><span class="value">$${applicationData.propertyValue.toLocaleString()}</span></div>` : ""}
        ${applicationData.propertyAddress ? `<div class="info-row"><span class="label">Property Address:</span><span class="value">${applicationData.propertyAddress}</span></div>` : ""}
        ${applicationData.loanType ? `<div class="info-row"><span class="label">Loan Type:</span><span class="value">${applicationData.loanType.toUpperCase()}</span></div>` : ""}
        ${applicationData.annualIncome ? `<div class="info-row"><span class="label">Annual Income:</span><span class="value">$${applicationData.annualIncome.toLocaleString()}</span></div>` : ""}
        ${applicationData.monthlyIncome ? `<div class="info-row"><span class="label">Monthly Income:</span><span class="value">$${applicationData.monthlyIncome.toLocaleString()}</span></div>` : ""}
        ${applicationData.employerName ? `<div class="info-row"><span class="label">Employer:</span><span class="value">${applicationData.employerName}</span></div>` : ""}
      </div>

      <p><strong>Action Required:</strong> Log in to your Supabase dashboard to review the complete application details in the ${applicationType === "urla" ? "urla_applications" : "mortgage_applications"} table.</p>
    </div>
    <div class="footer">
      <p>This is an automated notification from your ${companyName} application system.</p>
    </div>
  </div>
</body>
</html>
    `;

    const emailPromises = [];

    // If template ID is provided, use Resend template with variables
    if (resendTemplateId) {
      emailPromises.push(
        fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: `${companyName} <noreply@homeloanagents.com>`,
            to: [applicantEmail],
            subject: `Thank you for your home loan application!`,
            template: resendTemplateId,
            template_data: {
              applicant_name: applicantName,
              application_id: applicationNumber,
              submission_date: new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }),
              view_application_url: viewApplicationUrl,
            },
          }),
        })
      );
    } else {
      // Fallback to HTML email
      emailPromises.push(
        fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: `${companyName} <noreply@homeloanagents.com>`,
            to: [applicantEmail],
            subject: `Application Received - #${applicationNumber}`,
            html: applicantEmailHtml,
          }),
        })
      );
    }

    emailPromises.push(
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: `${companyName} Notifications <notifications@homeloanagents.com>`,
          to: [companyEmail],
          subject: `🔔 New ${applicationType.toUpperCase()} Application - ${applicantName}`,
          html: companyEmailHtml,
        }),
      })
    );

    const results = await Promise.all(emailPromises);

    const responses = await Promise.all(results.map(r => r.json()));

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
