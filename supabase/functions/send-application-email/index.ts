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
  viewToken?: string;
  applicationData: {
    loanAmount?: number;
    propertyValue?: number;
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
    const companyEmail = Deno.env.get("COMPANY_EMAIL") || "loans@uff.loans";
    const companyName = "United Fidelity Funding";
    const fromAddress = `${companyName} <noreply@uff.loans>`;
    const notifFromAddress = `${companyName} <notifications@uff.loans>`;

    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY environment variable is not set");
    }

    const payload: ApplicationEmailRequest = await req.json();
    const { applicationType, applicantName, applicantEmail, applicationNumber, applicationData } = payload;

    const fmt = (n?: number) => n ? `$${n.toLocaleString()}` : 'N/A';
    const submittedDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    const logoUrl = "https://uff.loans/UFF_Logo_Main_2026.png";

    // Build detail rows only for fields that have data
    const detailRows: string[] = [];
    if (applicationData.loanPurpose) detailRows.push(`<tr><td style="padding:10px 0;border-bottom:1px solid #e5e7eb;font-family:Arial,sans-serif;font-size:14px;color:#6b7280;">Purpose</td><td style="padding:10px 0;border-bottom:1px solid #e5e7eb;font-family:Arial,sans-serif;font-size:14px;color:#111827;font-weight:600;text-align:right;">${applicationData.loanPurpose}</td></tr>`);
    if (applicationData.loanType) detailRows.push(`<tr><td style="padding:10px 0;border-bottom:1px solid #e5e7eb;font-family:Arial,sans-serif;font-size:14px;color:#6b7280;">Loan Type</td><td style="padding:10px 0;border-bottom:1px solid #e5e7eb;font-family:Arial,sans-serif;font-size:14px;color:#111827;font-weight:600;text-align:right;">${applicationData.loanType}</td></tr>`);
    if (applicationData.propertyAddress) detailRows.push(`<tr><td style="padding:10px 0;border-bottom:1px solid #e5e7eb;font-family:Arial,sans-serif;font-size:14px;color:#6b7280;">Property</td><td style="padding:10px 0;border-bottom:1px solid #e5e7eb;font-family:Arial,sans-serif;font-size:14px;color:#111827;font-weight:600;text-align:right;">${applicationData.propertyAddress}</td></tr>`);
    if (applicationData.downPayment) detailRows.push(`<tr><td style="padding:10px 0;border-bottom:1px solid #e5e7eb;font-family:Arial,sans-serif;font-size:14px;color:#6b7280;">Down Payment</td><td style="padding:10px 0;border-bottom:1px solid #e5e7eb;font-family:Arial,sans-serif;font-size:14px;color:#111827;font-weight:600;text-align:right;">${fmt(applicationData.downPayment)}</td></tr>`);
    if (applicationData.totalMonthlyDebt) detailRows.push(`<tr><td style="padding:10px 0;border-bottom:1px solid #e5e7eb;font-family:Arial,sans-serif;font-size:14px;color:#6b7280;">Monthly Debt</td><td style="padding:10px 0;border-bottom:1px solid #e5e7eb;font-family:Arial,sans-serif;font-size:14px;color:#111827;font-weight:600;text-align:right;">${fmt(applicationData.totalMonthlyDebt)}</td></tr>`);
    detailRows.push(`<tr><td style="padding:10px 0;font-family:Arial,sans-serif;font-size:14px;color:#6b7280;">Submitted</td><td style="padding:10px 0;font-family:Arial,sans-serif;font-size:14px;color:#111827;font-weight:600;text-align:right;">${submittedDate}</td></tr>`);

    // Extract first name for personal greeting
    const firstName = applicantName.split(' ')[0] || applicantName;

    // Build purpose-specific messaging
    const purposeText = applicationData.loanPurpose?.toLowerCase() || '';
    let journeyMessage = "We know that applying for a mortgage is a big step, and we don't take your trust lightly.";
    let subjectLine = "your home loan";
    if (purposeText.includes('purchase') || purposeText.includes('buy')) {
      journeyMessage = "Buying a home is one of life's biggest milestones, and we're honored that you've chosen us to help make it happen.";
      subjectLine = "your new home";
    } else if (purposeText.includes('refinance')) {
      journeyMessage = "Refinancing is a smart financial move, and we're here to make sure you get the best possible outcome.";
      subjectLine = "your refinance";
    } else if (purposeText.includes('cash')) {
      journeyMessage = "Tapping into your home's equity is a powerful financial tool, and we're here to help you use it wisely.";
      subjectLine = "your cash-out refinance";
    }

    const applicantEmailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Application Submitted</title>
  <!--[if !mso]><!-->
  <style>
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; }
      .email-body { padding: 24px !important; }
      .summary-cell { display: block !important; width: 100% !important; }
    }
  </style>
  <!--<![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif;">
  <span style="display: none; max-height: 0; overflow: hidden;">We've received your application, ${firstName} &mdash; here's exactly what happens next and how we'll take care of you.</span>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8f9fa;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" class="email-container" width="600" cellspacing="0" cellpadding="0" bgcolor="#ffffff" style="background-color: #ffffff;">

          <!-- Header with logo -->
          <tr>
            <td bgcolor="#dc2626" style="background-color: #dc2626; padding: 40px 40px 30px; text-align: center;">
              <img src="${logoUrl}" alt="United Fidelity Funding" width="200" style="max-width: 200px; height: auto; margin-bottom: 16px; display: block; margin-left: auto; margin-right: auto;" />
              <h1 style="color: #ffffff; font-family: Arial, sans-serif; font-size: 26px; font-weight: 700; margin: 0 0 8px;">We've Received Your Application</h1>
              <p style="color: #fecaca; font-family: Arial, sans-serif; font-size: 15px; margin: 0;">You're in great hands, ${firstName}.</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td class="email-body" style="padding: 40px;">

              <!-- Personal greeting -->
              <p style="font-family: Arial, sans-serif; font-size: 17px; color: #1f2937; margin: 0 0 16px; line-height: 1.6;">
                Hi ${firstName},
              </p>
              <p style="font-family: Arial, sans-serif; font-size: 15px; color: #4b5563; margin: 0 0 8px; line-height: 1.7;">
                Thank you for submitting your application with ${companyName}. ${journeyMessage}
              </p>
              <p style="font-family: Arial, sans-serif; font-size: 15px; color: #4b5563; margin: 0 0 28px; line-height: 1.7;">
                We want you to know exactly what's going to happen from here &mdash; no surprises, no guesswork. Here's your personal roadmap:
              </p>

              <!-- ============================================ -->
              <!-- YOUR DEDICATED LOAN OFFICER (highlight box)  -->
              <!-- ============================================ -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 28px;">
                <tr>
                  <td bgcolor="#fef2f2" style="background-color: #fef2f2; padding: 24px; border-left: 4px solid #dc2626;">
                    <p style="font-family: Arial, sans-serif; font-size: 16px; font-weight: 700; color: #991b1b; margin: 0 0 10px;">
                      &#128222; You'll Hear From Us Within 4 Business Hours
                    </p>
                    <p style="font-family: Arial, sans-serif; font-size: 14px; color: #4b5563; margin: 0 0 12px; line-height: 1.7;">
                      A <strong style="color:#1f2937;">dedicated loan officer</strong> is being assigned to your file right now. This is the same person who will guide you from start to finish &mdash; you won't be passed around between departments or have to repeat your story.
                    </p>
                    <p style="font-family: Arial, sans-serif; font-size: 14px; color: #4b5563; margin: 0 0 12px; line-height: 1.7;">
                      <strong style="color:#1f2937;">Your loan officer will call you first</strong> to introduce themselves, answer any questions, and walk you through the next steps together. If we can't reach you by phone, we'll follow up by email and text so you can respond at your convenience.
                    </p>
                    <p style="font-family: Arial, sans-serif; font-size: 13px; color: #6b7280; margin: 0; line-height: 1.6;">
                      <em>Look for a call from a (855) number &mdash; that's us! Save it so you always know when we're reaching out.</em>
                    </p>
                  </td>
                </tr>
              </table>

              <!-- ============================================ -->
              <!-- APPLICATION SNAPSHOT                          -->
              <!-- ============================================ -->
              <p style="font-family: Arial, sans-serif; font-size: 14px; font-weight: 700; color: #991b1b; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 0.5px;">Your Application Snapshot</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 28px;">
                <tr>
                  <td class="summary-cell" width="50%" style="padding: 4px;" valign="top">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="#f9fafb" style="background-color: #f9fafb;">
                      <tr><td style="padding: 16px; text-align: center;">
                        <p style="font-family: Arial, sans-serif; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; margin: 0 0 4px;">Loan Amount</p>
                        <p style="font-family: Arial, sans-serif; font-size: 20px; font-weight: 700; color: #111827; margin: 0 0 2px;">${fmt(applicationData.loanAmount)}</p>
                        <p style="font-family: Arial, sans-serif; font-size: 12px; color: #9ca3af; margin: 0;">${applicationData.loanPurpose || applicationData.loanType || '&nbsp;'}</p>
                      </td></tr>
                    </table>
                  </td>
                  <td class="summary-cell" width="50%" style="padding: 4px;" valign="top">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="#f9fafb" style="background-color: #f9fafb;">
                      <tr><td style="padding: 16px; text-align: center;">
                        <p style="font-family: Arial, sans-serif; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; margin: 0 0 4px;">Property Value</p>
                        <p style="font-family: Arial, sans-serif; font-size: 20px; font-weight: 700; color: #111827; margin: 0 0 2px;">${fmt(applicationData.propertyValue)}</p>
                        <p style="font-family: Arial, sans-serif; font-size: 12px; color: #9ca3af; margin: 0;">${[applicationData.propertyCity, applicationData.propertyState].filter(Boolean).join(', ') || '&nbsp;'}</p>
                      </td></tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Application Details -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="#f9fafb" style="background-color: #f9fafb; margin-bottom: 28px;">
                <tr>
                  <td style="padding: 20px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      ${detailRows.join('\n                      ')}
                    </table>
                  </td>
                </tr>
              </table>

              <!-- ============================================ -->
              <!-- YOUR ROADMAP TO CLOSING                      -->
              <!-- ============================================ -->
              <p style="font-family: Arial, sans-serif; font-size: 14px; font-weight: 700; color: #991b1b; margin: 0 0 16px; text-transform: uppercase; letter-spacing: 0.5px;">Your Roadmap to Closing</p>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 28px;">
                <!-- Step 1 -->
                <tr>
                  <td style="padding: 0 0 20px 0;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="44" valign="top" style="padding-right: 12px;">
                          <table role="presentation" cellspacing="0" cellpadding="0"><tr>
                            <td bgcolor="#dc2626" style="background-color: #dc2626; width: 32px; height: 32px; text-align: center; font-family: Arial, sans-serif; font-size: 14px; font-weight: 700; color: #ffffff; line-height: 32px;">1</td>
                          </tr></table>
                        </td>
                        <td valign="top">
                          <p style="font-family: Arial, sans-serif; font-size: 15px; font-weight: 700; color: #1f2937; margin: 0 0 4px;">Personal Introduction Call</p>
                          <p style="font-family: Arial, sans-serif; font-size: 13px; color: #6b7280; margin: 0 0 2px;">Within 4 business hours</p>
                          <p style="font-family: Arial, sans-serif; font-size: 14px; color: #4b5563; margin: 6px 0 0; line-height: 1.6;">Your dedicated loan officer will call to introduce themselves, confirm the details of your application, and answer any questions you have. This is a conversation, not a sales pitch &mdash; we want to understand your goals.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <!-- Step 2 -->
                <tr>
                  <td style="padding: 0 0 20px 0;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="44" valign="top" style="padding-right: 12px;">
                          <table role="presentation" cellspacing="0" cellpadding="0"><tr>
                            <td bgcolor="#dc2626" style="background-color: #dc2626; width: 32px; height: 32px; text-align: center; font-family: Arial, sans-serif; font-size: 14px; font-weight: 700; color: #ffffff; line-height: 32px;">2</td>
                          </tr></table>
                        </td>
                        <td valign="top">
                          <p style="font-family: Arial, sans-serif; font-size: 15px; font-weight: 700; color: #1f2937; margin: 0 0 4px;">Document Collection</p>
                          <p style="font-family: Arial, sans-serif; font-size: 13px; color: #6b7280; margin: 0 0 2px;">Days 1&ndash;5</p>
                          <p style="font-family: Arial, sans-serif; font-size: 14px; color: #4b5563; margin: 6px 0 0; line-height: 1.6;">We'll send you a simple, personalized checklist of documents we need. You can upload them securely through your borrower portal &mdash; no faxing, no mailing. Your loan officer will be available to help if you have questions about any item.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <!-- Step 3 -->
                <tr>
                  <td style="padding: 0 0 20px 0;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="44" valign="top" style="padding-right: 12px;">
                          <table role="presentation" cellspacing="0" cellpadding="0"><tr>
                            <td bgcolor="#dc2626" style="background-color: #dc2626; width: 32px; height: 32px; text-align: center; font-family: Arial, sans-serif; font-size: 14px; font-weight: 700; color: #ffffff; line-height: 32px;">3</td>
                          </tr></table>
                        </td>
                        <td valign="top">
                          <p style="font-family: Arial, sans-serif; font-size: 15px; font-weight: 700; color: #1f2937; margin: 0 0 4px;">Loan Processing &amp; Underwriting</p>
                          <p style="font-family: Arial, sans-serif; font-size: 13px; color: #6b7280; margin: 0 0 2px;">Days 5&ndash;15</p>
                          <p style="font-family: Arial, sans-serif; font-size: 14px; color: #4b5563; margin: 6px 0 0; line-height: 1.6;">Our processing team verifies your information and an underwriter reviews your file. During this time, we may reach out with a question or two &mdash; quick responses from you help keep things moving. We'll keep you updated at every stage so you're never left wondering.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <!-- Step 4 -->
                <tr>
                  <td style="padding: 0 0 20px 0;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="44" valign="top" style="padding-right: 12px;">
                          <table role="presentation" cellspacing="0" cellpadding="0"><tr>
                            <td bgcolor="#dc2626" style="background-color: #dc2626; width: 32px; height: 32px; text-align: center; font-family: Arial, sans-serif; font-size: 14px; font-weight: 700; color: #ffffff; line-height: 32px;">4</td>
                          </tr></table>
                        </td>
                        <td valign="top">
                          <p style="font-family: Arial, sans-serif; font-size: 15px; font-weight: 700; color: #1f2937; margin: 0 0 4px;">Conditional Approval</p>
                          <p style="font-family: Arial, sans-serif; font-size: 13px; color: #6b7280; margin: 0 0 2px;">Days 10&ndash;20</p>
                          <p style="font-family: Arial, sans-serif; font-size: 14px; color: #4b5563; margin: 6px 0 0; line-height: 1.6;">Once the underwriter is satisfied, you'll receive a conditional approval. This means you're approved pending a few final items (like an appraisal or updated document). Your loan officer will walk you through each condition personally.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <!-- Step 5 -->
                <tr>
                  <td style="padding: 0;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="44" valign="top" style="padding-right: 12px;">
                          <table role="presentation" cellspacing="0" cellpadding="0"><tr>
                            <td bgcolor="#16a34a" style="background-color: #16a34a; width: 32px; height: 32px; text-align: center; font-family: Arial, sans-serif; font-size: 14px; font-weight: 700; color: #ffffff; line-height: 32px;">5</td>
                          </tr></table>
                        </td>
                        <td valign="top">
                          <p style="font-family: Arial, sans-serif; font-size: 15px; font-weight: 700; color: #1f2937; margin: 0 0 4px;">Clear to Close &amp; Closing Day &#127881;</p>
                          <p style="font-family: Arial, sans-serif; font-size: 13px; color: #6b7280; margin: 0 0 2px;">Days 20&ndash;30</p>
                          <p style="font-family: Arial, sans-serif; font-size: 14px; color: #4b5563; margin: 6px 0 0; line-height: 1.6;">You'll receive your final Closing Disclosure at least 3 days before closing. On closing day, you'll sign your documents and receive your keys (or your new rate, if refinancing). We'll be there to make sure everything goes smoothly.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- ============================================ -->
              <!-- GET A HEAD START (document prep)             -->
              <!-- ============================================ -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 28px;">
                <tr>
                  <td bgcolor="#f0fdf4" style="background-color: #f0fdf4; padding: 24px; border-left: 4px solid #16a34a;">
                    <p style="font-family: Arial, sans-serif; font-size: 15px; font-weight: 700; color: #166534; margin: 0 0 10px;">
                      &#9989; Get a Head Start
                    </p>
                    <p style="font-family: Arial, sans-serif; font-size: 14px; color: #4b5563; margin: 0 0 12px; line-height: 1.7;">
                      While you wait for your loan officer's call, you can start gathering these common documents. Having them ready can speed up your approval:
                    </p>
                    <table role="presentation" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding: 3px 8px 3px 0; font-family: Arial, sans-serif; font-size: 14px; color: #166534; vertical-align: top;">&#10003;</td>
                        <td style="padding: 3px 0; font-family: Arial, sans-serif; font-size: 14px; color: #374151; line-height: 1.5;"><strong>Most recent 2 pay stubs</strong></td>
                      </tr>
                      <tr>
                        <td style="padding: 3px 8px 3px 0; font-family: Arial, sans-serif; font-size: 14px; color: #166534; vertical-align: top;">&#10003;</td>
                        <td style="padding: 3px 0; font-family: Arial, sans-serif; font-size: 14px; color: #374151; line-height: 1.5;"><strong>Last 2 years of W-2s</strong> (or tax returns if self-employed)</td>
                      </tr>
                      <tr>
                        <td style="padding: 3px 8px 3px 0; font-family: Arial, sans-serif; font-size: 14px; color: #166534; vertical-align: top;">&#10003;</td>
                        <td style="padding: 3px 0; font-family: Arial, sans-serif; font-size: 14px; color: #374151; line-height: 1.5;"><strong>Last 2 months of bank statements</strong> (all pages, all accounts)</td>
                      </tr>
                      <tr>
                        <td style="padding: 3px 8px 3px 0; font-family: Arial, sans-serif; font-size: 14px; color: #166534; vertical-align: top;">&#10003;</td>
                        <td style="padding: 3px 0; font-family: Arial, sans-serif; font-size: 14px; color: #374151; line-height: 1.5;"><strong>Government-issued photo ID</strong></td>
                      </tr>
                    </table>
                    <p style="font-family: Arial, sans-serif; font-size: 13px; color: #6b7280; margin: 12px 0 0; line-height: 1.6;">
                      <em>Don't worry if you're not sure about something &mdash; your loan officer will provide a personalized checklist tailored to your specific situation.</em>
                    </p>
                  </td>
                </tr>
              </table>

              <!-- ============================================ -->
              <!-- HOW WE'LL COMMUNICATE                        -->
              <!-- ============================================ -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 28px;">
                <tr>
                  <td bgcolor="#eff6ff" style="background-color: #eff6ff; padding: 24px; border-left: 4px solid #2563eb;">
                    <p style="font-family: Arial, sans-serif; font-size: 15px; font-weight: 700; color: #1e40af; margin: 0 0 10px;">
                      &#128172; How We'll Stay in Touch
                    </p>
                    <p style="font-family: Arial, sans-serif; font-size: 14px; color: #4b5563; margin: 0 0 12px; line-height: 1.7;">
                      We believe you should never have to wonder what's happening with your loan. Here's how we'll communicate:
                    </p>
                    <table role="presentation" cellspacing="0" cellpadding="0" width="100%">
                      <tr>
                        <td style="padding: 6px 0; font-family: Arial, sans-serif; font-size: 14px; color: #374151; line-height: 1.6;">
                          <strong>&#128222; Phone</strong> &mdash; Your loan officer will call for important updates and milestones. We'll always identify ourselves so you know it's us.
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-family: Arial, sans-serif; font-size: 14px; color: #374151; line-height: 1.6;">
                          <strong>&#128231; Email</strong> &mdash; You'll receive email updates at each stage of the process, plus secure links to upload documents and review disclosures.
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-family: Arial, sans-serif; font-size: 14px; color: #374151; line-height: 1.6;">
                          <strong>&#128241; Text</strong> &mdash; Quick updates and reminders via text, if you opt in. Great for time-sensitive items.
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-family: Arial, sans-serif; font-size: 14px; color: #374151; line-height: 1.6;">
                          <strong>&#127760; Borrower Portal</strong> &mdash; Log in anytime at <a href="https://uff.loans/login" style="color: #2563eb; text-decoration: none; font-weight: 600;">uff.loans</a> to check your status, view conditions, and upload documents securely.
                        </td>
                      </tr>
                    </table>
                    <p style="font-family: Arial, sans-serif; font-size: 13px; color: #6b7280; margin: 10px 0 0; line-height: 1.6;">
                      <em>You choose what works best for you. Just let your loan officer know your preferred method of communication.</em>
                    </p>
                  </td>
                </tr>
              </table>

              <!-- ============================================ -->
              <!-- YOUR INFORMATION IS SAFE                     -->
              <!-- ============================================ -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 28px;">
                <tr>
                  <td bgcolor="#f9fafb" style="background-color: #f9fafb; padding: 20px 24px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" width="100%">
                      <tr>
                        <td width="36" valign="top" style="padding-right: 12px; font-size: 20px;">&#128274;</td>
                        <td valign="top">
                          <p style="font-family: Arial, sans-serif; font-size: 14px; font-weight: 700; color: #1f2937; margin: 0 0 6px;">Your Information Is Safe With Us</p>
                          <p style="font-family: Arial, sans-serif; font-size: 13px; color: #6b7280; margin: 0; line-height: 1.6;">
                            Your personal and financial information is encrypted with bank-level security. Only your dedicated loan officer and our processing team have access to your file. We will <strong>never</strong> sell your information or share it with third parties for marketing purposes.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- ============================================ -->
              <!-- DIRECT CONTACT                               -->
              <!-- ============================================ -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="#dc2626" style="background-color: #dc2626; margin-bottom: 28px;">
                <tr>
                  <td style="padding: 24px; text-align: center;">
                    <p style="font-family: Arial, sans-serif; font-size: 16px; font-weight: 700; color: #ffffff; margin: 0 0 8px;">
                      Questions Before Your Loan Officer Calls?
                    </p>
                    <p style="font-family: Arial, sans-serif; font-size: 14px; color: #fecaca; margin: 0 0 16px; line-height: 1.6;">
                      Our team is available Monday&ndash;Friday, 8am&ndash;8pm CT and Saturday 9am&ndash;2pm CT.
                    </p>
                    <table role="presentation" cellspacing="0" cellpadding="0" align="center">
                      <tr>
                        <td style="padding: 0 8px;">
                          <a href="tel:+18559532453" style="font-family: Arial, sans-serif; font-size: 15px; color: #ffffff; text-decoration: none; font-weight: 700;">&#128222; (855) 95-EAGLE</a>
                        </td>
                        <td style="padding: 0 8px; color: #fecaca;">|</td>
                        <td style="padding: 0 8px;">
                          <a href="mailto:loans@uff.loans" style="font-family: Arial, sans-serif; font-size: 15px; color: #ffffff; text-decoration: none; font-weight: 700;">&#128231; loans@uff.loans</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Warm sign-off -->
              <p style="font-family: Arial, sans-serif; font-size: 15px; color: #4b5563; margin: 0 0 6px; line-height: 1.7;">
                ${firstName}, we know you have choices when it comes to your mortgage, and we're grateful you chose ${companyName}. We're going to work hard to earn your trust every step of the way.
              </p>
              <p style="font-family: Arial, sans-serif; font-size: 15px; color: #4b5563; margin: 0 0 0; line-height: 1.7;">
                Talk soon,<br>
                <strong style="color: #1f2937;">The ${companyName} Team</strong><br>
                <span style="font-size: 13px; color: #9ca3af;">Your dedicated loan officer will introduce themselves personally on your first call.</span>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td bgcolor="#f9fafb" style="background-color: #f9fafb; padding: 24px 40px; border-top: 1px solid #e5e7eb;">
              <p style="font-family: Arial, sans-serif; font-size: 11px; color: #9ca3af; margin: 0 0 8px; line-height: 1.6; text-align: center;">
                ${companyName} Corp., NMLS #34381 | 1300 NW Briarcliff Pkwy #275, Kansas City, MO 64116
              </p>
              <p style="font-family: Arial, sans-serif; font-size: 11px; color: #9ca3af; margin: 0 0 8px; line-height: 1.6; text-align: center;">
                Licensed in 39 states. For licensing information, visit
                <a href="https://www.nmlsconsumeraccess.org/EntityDetails.aspx/COMPANY/34381" style="color: #9ca3af; text-decoration: underline;">NMLS Consumer Access</a>.
              </p>
              <p style="font-family: Arial, sans-serif; font-size: 11px; color: #9ca3af; margin: 0; line-height: 1.6; text-align: center;">
                Equal Housing Lender. &copy; ${new Date().getFullYear()} ${companyName} Corp. All rights reserved.
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

    // Send borrower confirmation email
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

    // Send company notification email
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
          subject: `🔔 New ${applicationType.toUpperCase()} Application — ${applicantName}`,
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
