import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface PreApprovalEmailRequest {
  recipientEmail: string;
  recipientName?: string;
  loan: Record<string, any>;
}

function formatCurrency(value: number | undefined | null): string {
  if (value == null) return "--";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(
  value: number | undefined | null,
  decimals = 2,
): string {
  if (value == null) return "--";
  return `${value.toFixed(decimals)}%`;
}

function buildLetterHtml(loan: Record<string, any>, companyName: string): string {
  const borrowers = loan.borrowers || [];
  const primary = borrowers[0] || {};
  const coBorrower = borrowers[1];

  const borrowerName =
    loan.primaryBorrowerFullName ||
    primary.fullName ||
    [primary.firstName, primary.middleName, primary.lastName]
      .filter(Boolean)
      .join(" ") ||
    "Borrower";

  const coBorrowerName = coBorrower
    ? coBorrower.fullName ||
      [coBorrower.firstName, coBorrower.lastName].filter(Boolean).join(" ")
    : null;

  const property = loan.subjectProperty || {};
  const address = property.address || {};
  const fullAddress = [
    address.line || address.fullStreetAddress,
    address.city,
    address.stateCode,
    address.zipCode,
  ]
    .filter(Boolean)
    .join(", ");

  const product = loan.loanProduct || {};
  const originator = loan.loanOriginator || {};
  const termMonths = product.loanTermMonthsCount;
  const termYears = termMonths ? Math.round(termMonths / 12) : null;

  const propertyTypeLabels: Record<string, string> = {
    SingleFamily: "Single Family Residence",
    Condominium: "Condominium",
    Townhouse: "Townhouse",
    MultiFamily: "Multi-Family",
    ManufacturedHousing: "Manufactured Home",
    Cooperative: "Cooperative",
  };

  const occupancyLabels: Record<string, string> = {
    PrimaryResidence: "Primary Residence",
    SecondHome: "Second Home",
    InvestmentProperty: "Investment Property",
  };

  const today = new Date();
  const expDate = new Date(today);
  expDate.setDate(expDate.getDate() + 90);
  const issueDate = today.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const expirationDate = expDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const purchasePrice =
    loan.salesContractPurchasePrice || property.actualValueAmount;
  const pType = property.propertyType
    ? propertyTypeLabels[property.propertyType] || property.propertyType
    : "";
  const oType = property.intendedUsageType
    ? occupancyLabels[property.intendedUsageType] ||
      property.intendedUsageType
    : "";

  const summaryRows: string[] = [];
  summaryRows.push(
    `<tr><td style="padding:8px 12px;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">Pre-Approved Amount</td><td style="padding:8px 12px;font-size:18px;font-weight:700;color:#0f172a;">${formatCurrency(loan.loanAmount)}</td></tr>`,
  );
  summaryRows.push(
    `<tr><td style="padding:8px 12px;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">Maximum Purchase Price</td><td style="padding:8px 12px;font-size:18px;font-weight:700;color:#0f172a;">${formatCurrency(purchasePrice)}</td></tr>`,
  );
  if (product.mortgageType) {
    summaryRows.push(
      `<tr><td style="padding:8px 12px;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">Loan Type</td><td style="padding:8px 12px;font-weight:600;color:#1e293b;">${product.mortgageType}</td></tr>`,
    );
  }
  if (termYears) {
    summaryRows.push(
      `<tr><td style="padding:8px 12px;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">Loan Term</td><td style="padding:8px 12px;font-weight:600;color:#1e293b;">${termYears}-Year Fixed</td></tr>`,
    );
  }
  if (product.noteRate != null) {
    summaryRows.push(
      `<tr><td style="padding:8px 12px;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">Interest Rate</td><td style="padding:8px 12px;font-weight:600;color:#1e293b;">${formatPercent(product.noteRate)}</td></tr>`,
    );
  }
  if (loan.downPaymentAmount != null) {
    const dpStr = `${formatCurrency(loan.downPaymentAmount)}${loan.downPaymentPercentage != null ? ` (${formatPercent(loan.downPaymentPercentage, 1)})` : ""}`;
    summaryRows.push(
      `<tr><td style="padding:8px 12px;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">Down Payment</td><td style="padding:8px 12px;font-weight:600;color:#1e293b;">${dpStr}</td></tr>`,
    );
  }
  if (loan.loanToValueRatio != null) {
    summaryRows.push(
      `<tr><td style="padding:8px 12px;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">Loan-to-Value</td><td style="padding:8px 12px;font-weight:600;color:#1e293b;">${formatPercent(loan.loanToValueRatio)}</td></tr>`,
    );
  }

  const propDetails = [pType, oType].filter(Boolean).join(" | ");
  const propertyBlock = fullAddress
    ? `<div style="background:#eff6ff;border:1px solid #dbeafe;border-radius:8px;padding:16px;margin:24px 0;">
        <p style="color:#2563eb;font-size:12px;font-weight:600;margin:0 0 4px;">Subject Property</p>
        <p style="font-weight:600;color:#0f172a;margin:0;">${fullAddress}</p>
        ${propDetails ? `<p style="color:#64748b;font-size:13px;margin:6px 0 0;">${propDetails}</p>` : ""}
      </div>`
    : "";

  const qualStr = "been thoroughly vetted and has demonstrated strong financial qualifications. Income, assets, and debt obligations have been verified and meet all applicable lending guidelines for this loan program";

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:'Helvetica Neue',Arial,sans-serif;line-height:1.6;color:#334155;margin:0;padding:0;">
<div style="max-width:650px;margin:0 auto;padding:40px 32px;">

  <div style="border-bottom:4px solid #1e293b;padding-bottom:24px;margin-bottom:32px;">
    <table width="100%"><tr>
      <td><h1 style="font-size:22px;font-weight:700;color:#1e293b;margin:0;">${companyName}</h1>
      ${originator.organizationBranchName ? `<p style="font-size:13px;color:#64748b;margin:4px 0 0;">${originator.organizationBranchName}</p>` : ""}
      </td>
      <td style="text-align:right;font-size:13px;color:#64748b;">
        ${loan.loanNumber ? `<p style="margin:0;">Loan #${loan.loanNumber}</p>` : ""}
        <p style="margin:0;">${issueDate}</p>
      </td>
    </tr></table>
  </div>

  <div style="text-align:center;margin-bottom:32px;">
    <div style="display:inline-block;background:#1e293b;color:white;padding:12px 32px;border-radius:8px;">
      <h2 style="margin:0;font-size:18px;letter-spacing:0.05em;text-transform:uppercase;">Pre-Approval Letter</h2>
    </div>
  </div>

  <p>To Whom It May Concern,</p>

  <p>This letter confirms that <strong style="color:#0f172a;">${borrowerName}</strong>${coBorrowerName ? ` and <strong style="color:#0f172a;">${coBorrowerName}</strong>` : ""} ${coBorrowerName ? "have" : "has"} been pre-approved for mortgage financing based on a thorough review of their financial qualifications, including credit history, income verification, assets, and debt obligations.</p>

  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:24px;margin:24px 0;">
    <h3 style="font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 16px;">Pre-Approval Summary</h3>
    <table width="100%" style="border-collapse:collapse;">${summaryRows.join("")}</table>
  </div>

  ${propertyBlock}

  <p>This pre-approval is based on the information provided by the borrower${coBorrowerName ? "s" : ""} and is subject to the following conditions:</p>

  <ul style="color:#475569;">
    <li>Satisfactory appraisal of the subject property at or above the agreed purchase price</li>
    <li>Clear title and satisfactory title insurance commitment</li>
    <li>No material change in the borrower${coBorrowerName ? "s'" : "'s"} financial condition, employment status, or credit profile prior to closing</li>
    <li>Property must meet all applicable lending guidelines and be in acceptable condition</li>
    <li>Verification that the property is free of environmental hazards and structural defects</li>
    <li>Satisfactory homeowner's insurance coverage</li>
    <li>All required documentation must be provided and verified prior to final loan approval</li>
  </ul>

  <p>The borrower${coBorrowerName ? "s have" : " has"} ${qualStr}.</p>

  <p>This pre-approval letter is valid through <strong style="color:#0f172a;">${expirationDate}</strong> and is subject to final underwriting approval. We are confident in ${coBorrowerName ? "these borrowers'" : "this borrower's"} ability to secure financing and complete a timely closing.</p>

  <p>Please do not hesitate to contact me directly with any questions regarding this pre-approval or the borrower${coBorrowerName ? "s'" : "'s"} qualifications.</p>

  <div style="margin-top:40px;padding-top:20px;border-top:1px solid #e2e8f0;">
    <p style="margin:0 0 20px;">Sincerely,</p>
    ${originator.fullName ? `<p style="font-size:16px;font-weight:600;color:#0f172a;margin:0;">${originator.fullName}</p>` : ""}
    <p style="font-size:13px;color:#475569;margin:2px 0;">Loan Officer</p>
    ${originator.nmlsId ? `<p style="font-size:13px;color:#64748b;margin:2px 0;">NMLS# ${originator.nmlsId}</p>` : ""}
    <p style="font-size:14px;font-weight:600;color:#334155;margin:8px 0 0;">${companyName}</p>
    <p style="font-size:13px;color:#64748b;margin:4px 0 0;">
      ${[originator.email, originator.phoneNumber].filter(Boolean).join(" | ")}
    </p>
  </div>

  <div style="margin-top:40px;padding-top:16px;border-top:1px solid #f1f5f9;font-size:11px;color:#94a3b8;line-height:1.5;">
    <p>This pre-approval letter is not a commitment to lend. Final loan approval is subject to satisfactory completion of the underwriting process, including but not limited to property appraisal, title review, and verification of all borrower information. Interest rates and terms are subject to change without notice. This letter does not guarantee any specific interest rate or loan terms. Equal Housing Lender.</p>
  </div>

</div>
</body>
</html>`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const companyName = Deno.env.get("COMPANY_NAME") || "HomeLoanAgents";

    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY environment variable is not set");
    }

    const payload: PreApprovalEmailRequest = await req.json();
    const { recipientEmail, recipientName, loan } = payload;

    if (!recipientEmail) {
      throw new Error("Recipient email is required");
    }

    const borrowerName =
      loan.primaryBorrowerFullName ||
      loan.borrowers?.[0]?.fullName ||
      "Borrower";

    const letterHtml = buildLetterHtml(loan, companyName);

    const greeting = recipientName ? `Dear ${recipientName},` : "Hello,";
    const emailHtml = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:'Helvetica Neue',Arial,sans-serif;color:#334155;margin:0;padding:0;">
<div style="max-width:650px;margin:0 auto;padding:32px;">
  <p>${greeting}</p>
  <p>Please find the pre-approval letter for <strong>${borrowerName}</strong> attached below. This letter confirms the borrower's qualification for mortgage financing and may be included with any purchase offer.</p>
  <p>If you have any questions about this pre-approval, please contact the loan officer listed in the letter.</p>
  <hr style="border:none;border-top:2px solid #e2e8f0;margin:24px 0;">
  ${letterHtml}
</div>
</body>
</html>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: `${companyName} <noreply@homeloanagents.com>`,
        to: [recipientEmail],
        subject: `Pre-Approval Letter - ${borrowerName} | ${companyName}`,
        html: emailHtml,
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      throw new Error(result.message || "Failed to send email via Resend");
    }

    return new Response(
      JSON.stringify({ success: true, message: "Pre-approval letter sent", result }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error sending pre-approval email:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
