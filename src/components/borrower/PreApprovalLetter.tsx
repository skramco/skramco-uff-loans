import { forwardRef } from 'react';
import { formatCurrency, formatPercent, formatDate } from './formatters';

interface PreApprovalLetterProps {
  loan: any;
  companyName?: string;
}

function extractLetterData(loan: any) {
  const borrowers: any[] = loan.borrowers || [];
  const primary = borrowers[0];
  const coBorrower = borrowers[1];

  const borrowerName =
    loan.primaryBorrowerFullName ||
    primary?.fullName ||
    [primary?.firstName, primary?.middleName, primary?.lastName].filter(Boolean).join(' ') ||
    'Borrower';

  const coBorrowerName = coBorrower
    ? coBorrower.fullName || [coBorrower.firstName, coBorrower.lastName].filter(Boolean).join(' ')
    : null;

  const property = loan.subjectProperty;
  const address = property?.address;
  const fullAddress = address
    ? [address.line || address.fullStreetAddress, address.city, address.stateCode, address.zipCode]
        .filter(Boolean)
        .join(', ')
    : null;

  const product = loan.loanProduct;
  const originator = loan.loanOriginator;
  const termMonths = product?.loanTermMonthsCount;
  const termYears = termMonths ? Math.round(termMonths / 12) : null;

  const propertyTypeLabels: Record<string, string> = {
    SingleFamily: 'Single Family Residence',
    Condominium: 'Condominium',
    Townhouse: 'Townhouse',
    MultiFamily: 'Multi-Family',
    ManufacturedHousing: 'Manufactured Home',
    Cooperative: 'Cooperative',
  };

  const occupancyLabels: Record<string, string> = {
    PrimaryResidence: 'Primary Residence',
    SecondHome: 'Second Home',
    InvestmentProperty: 'Investment Property',
  };

  const today = new Date();
  const expirationDate = new Date(today);
  expirationDate.setDate(expirationDate.getDate() + 90);

  return {
    borrowerName,
    coBorrowerName,
    loanNumber: loan.loanNumber,
    loanAmount: loan.loanAmount,
    purchasePrice: loan.salesContractPurchasePrice || property?.actualValueAmount,
    downPayment: loan.downPaymentAmount,
    downPaymentPct: loan.downPaymentPercentage,
    ltv: loan.loanToValueRatio,
    noteRate: product?.noteRate,
    mortgageType: product?.mortgageType,
    termYears,
    termMonths,
    programName: product?.programName,
    amortizationType: product?.loanAmortizationType,
    propertyAddress: fullAddress,
    propertyType: property?.propertyType ? propertyTypeLabels[property.propertyType] || property.propertyType : null,
    occupancyType: property?.intendedUsageType ? occupancyLabels[property.intendedUsageType] || property.intendedUsageType : null,
    totalMonthlyIncome: loan.totalMonthlyIncome,
    totalAssets: loan.totalAssetsValue,
    dti: loan.debtToIncomeRatio,
    originatorName: originator?.fullName,
    originatorEmail: originator?.email,
    originatorPhone: originator?.phoneNumber,
    originatorNmls: originator?.nmlsId,
    branchName: originator?.organizationBranchName,
    issueDate: today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    expirationDate: expirationDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
  };
}

const PreApprovalLetter = forwardRef<HTMLDivElement, PreApprovalLetterProps>(
  ({ loan, companyName = 'United Fidelity Funding Corp' }, ref) => {
    const d = extractLetterData(loan);

    return (
      <div ref={ref} className="bg-white" id="preapproval-letter">
        <style>{`
          @media print {
            body * { visibility: hidden; }
            #preapproval-letter, #preapproval-letter * { visibility: visible; }
            #preapproval-letter {
              position: absolute; left: 0; top: 0; width: 100%;
              padding: 0.5in 0.75in;
              font-size: 11pt;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .no-print { display: none !important; }
          }
        `}</style>

        <div className="max-w-[8.5in] mx-auto px-8 py-10 print:p-0">
          <div className="border-b-4 border-slate-800 pb-6 mb-8 flex items-end justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{companyName}</h1>
              {d.branchName && (
                <p className="text-sm text-slate-500 mt-1">{d.branchName}</p>
              )}
            </div>
            <div className="text-right text-sm text-slate-500">
              {d.loanNumber && <p>Loan #{d.loanNumber}</p>}
              <p>{d.issueDate}</p>
            </div>
          </div>

          <div className="text-center mb-10">
            <div className="inline-block bg-slate-800 text-white px-8 py-3 rounded-lg">
              <h2 className="text-xl font-bold tracking-wide uppercase">Pre-Approval Letter</h2>
            </div>
          </div>

          <div className="mb-8">
            <p className="text-slate-700 leading-relaxed">To Whom It May Concern,</p>
          </div>

          <div className="space-y-5 text-slate-700 leading-relaxed">
            <p>
              This letter confirms that{' '}
              <span className="font-semibold text-slate-900">{d.borrowerName}</span>
              {d.coBorrowerName && (
                <> and <span className="font-semibold text-slate-900">{d.coBorrowerName}</span></>
              )}{' '}
              {d.coBorrowerName ? 'have' : 'has'} been pre-approved for mortgage financing
              based on a thorough review of {d.coBorrowerName ? 'their' : 'their'} financial qualifications,
              including credit history, income verification, assets, and debt obligations.
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 my-8">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
                Pre-Approval Summary
              </h3>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <SummaryRow label="Pre-Approved Amount" value={formatCurrency(d.loanAmount)} highlight />
                <SummaryRow
                  label="Maximum Purchase Price"
                  value={formatCurrency(d.purchasePrice)}
                  highlight
                />
                {d.mortgageType && (
                  <SummaryRow label="Loan Type" value={d.mortgageType} />
                )}
                {d.termYears && (
                  <SummaryRow label="Loan Term" value={`${d.termYears}-Year Fixed`} />
                )}
                {d.noteRate != null && (
                  <SummaryRow label="Interest Rate" value={formatPercent(d.noteRate)} />
                )}
                {d.downPayment != null && (
                  <SummaryRow
                    label="Down Payment"
                    value={`${formatCurrency(d.downPayment)}${d.downPaymentPct != null ? ` (${formatPercent(d.downPaymentPct, 1)})` : ''}`}
                  />
                )}
                {d.ltv != null && (
                  <SummaryRow label="Loan-to-Value" value={formatPercent(d.ltv)} />
                )}
                {d.programName && (
                  <SummaryRow label="Program" value={d.programName} />
                )}
              </div>
            </div>

            {d.propertyAddress && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-5 my-6">
                <p className="text-sm text-red-600 font-medium mb-1">Subject Property</p>
                <p className="font-semibold text-slate-900">{d.propertyAddress}</p>
                <div className="flex gap-4 mt-2 text-sm text-slate-600">
                  {d.propertyType && <span>{d.propertyType}</span>}
                  {d.propertyType && d.occupancyType && <span className="text-slate-300">|</span>}
                  {d.occupancyType && <span>{d.occupancyType}</span>}
                </div>
              </div>
            )}

            <p>
              This pre-approval is based on the information provided by the borrower{d.coBorrowerName ? 's' : ''} and
              is subject to the following conditions:
            </p>

            <ul className="list-disc list-outside ml-6 space-y-2 text-slate-600">
              <li>Satisfactory appraisal of the subject property at or above the agreed purchase price</li>
              <li>Clear title and satisfactory title insurance commitment</li>
              <li>No material change in the borrower{d.coBorrowerName ? 's\'' : '\'s'} financial condition, employment status, or credit profile prior to closing</li>
              <li>Property must meet all applicable lending guidelines and be in acceptable condition</li>
              <li>Verification that the property is free of environmental hazards and structural defects</li>
              <li>Satisfactory homeowner's insurance coverage</li>
              <li>All required documentation must be provided and verified prior to final loan approval</li>
            </ul>

            <p>
              The borrower{d.coBorrowerName ? 's have' : ' has'} been thoroughly vetted and
              {d.coBorrowerName ? ' have' : ' has'} demonstrated strong financial qualifications.
              Income, assets, and debt obligations have been verified and meet all applicable
              lending guidelines for this loan program.
            </p>

            <p>
              This pre-approval letter is valid through{' '}
              <span className="font-semibold text-slate-900">{d.expirationDate}</span>{' '}
              and is subject to final underwriting approval. We are confident in{' '}
              {d.coBorrowerName ? 'these borrowers\'' : 'this borrower\'s'} ability to secure financing
              and complete a timely closing.
            </p>

            <p>
              Please do not hesitate to contact me directly with any questions regarding this
              pre-approval or the borrower{d.coBorrowerName ? 's\'' : '\'s'} qualifications.
            </p>
          </div>

          <div className="mt-12 pt-6 border-t border-slate-200">
            <p className="text-slate-700 mb-1">Sincerely,</p>
            <div className="mt-6">
              {d.originatorName && (
                <p className="text-lg font-semibold text-slate-900">{d.originatorName}</p>
              )}
              <p className="text-sm text-slate-600">Loan Officer</p>
              {d.originatorNmls && (
                <p className="text-sm text-slate-500">NMLS# {d.originatorNmls}</p>
              )}
              <p className="text-sm font-medium text-slate-700 mt-1">{companyName}</p>
              <div className="flex flex-wrap gap-x-6 gap-y-1 mt-2 text-sm text-slate-500">
                {d.originatorEmail && <span>{d.originatorEmail}</span>}
                {d.originatorPhone && <span>{d.originatorPhone}</span>}
              </div>
            </div>
          </div>

          <div className="mt-10 pt-4 border-t border-slate-100 text-xs text-slate-400 leading-relaxed">
            <p>
              This pre-approval letter is not a commitment to lend. Final loan approval is subject to
              satisfactory completion of the underwriting process, including but not limited to property
              appraisal, title review, and verification of all borrower information. Interest rates and
              terms are subject to change without notice. This letter does not guarantee any specific
              interest rate or loan terms. Equal Housing Lender.
            </p>
          </div>
        </div>
      </div>
    );
  }
);

PreApprovalLetter.displayName = 'PreApprovalLetter';
export default PreApprovalLetter;
export { extractLetterData };

export function buildPrintHtml(loan: any, companyName = 'United Fidelity Funding Corp'): string {
  const d = extractLetterData(loan);
  const fc = formatCurrency;
  const fp = formatPercent;

  const summaryRows: string[] = [];
  const addRow = (label: string, value: string, hl = false) => {
    summaryRows.push(`<div style="display:flex;flex-direction:column;"><span style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">${label}</span><span style="font-size:${hl ? '18px' : '15px'};font-weight:600;color:${hl ? '#0f172a' : '#1e293b'};">${value}</span></div>`);
  };
  addRow('Pre-Approved Amount', fc(d.loanAmount), true);
  addRow('Maximum Purchase Price', fc(d.purchasePrice), true);
  if (d.mortgageType) addRow('Loan Type', d.mortgageType);
  if (d.termYears) addRow('Loan Term', `${d.termYears}-Year Fixed`);
  if (d.noteRate != null) addRow('Interest Rate', fp(d.noteRate));
  if (d.downPayment != null) addRow('Down Payment', `${fc(d.downPayment)}${d.downPaymentPct != null ? ` (${fp(d.downPaymentPct, 1)})` : ''}`);
  if (d.ltv != null) addRow('Loan-to-Value', fp(d.ltv));
  if (d.programName) addRow('Program', d.programName);

  const propBlock = d.propertyAddress
    ? `<div style="background:#eff6ff;border:1px solid #dbeafe;border-radius:10px;padding:16px;margin:20px 0;">
        <p style="font-size:13px;color:#2563eb;font-weight:600;margin:0 0 4px;">Subject Property</p>
        <p style="font-weight:600;color:#0f172a;margin:0;">${d.propertyAddress}</p>
        <p style="color:#475569;font-size:13px;margin:6px 0 0;">${[d.propertyType, d.occupancyType].filter(Boolean).join(' | ')}</p>
      </div>`
    : '';

  const qualStr = 'been thoroughly vetted and has demonstrated strong financial qualifications. Income, assets, and debt obligations have been verified and meet all applicable lending guidelines for this loan program';
  const pl = d.coBorrowerName ? 's' : '';
  const plHave = d.coBorrowerName ? 's have' : ' has';
  const plPoss = d.coBorrowerName ? "s'" : "'s";
  const plThese = d.coBorrowerName ? "these borrowers'" : "this borrower's";
  const coLine = d.coBorrowerName ? ` and <strong style="color:#0f172a;">${d.coBorrowerName}</strong>` : '';

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Pre-Approval Letter - ${d.borrowerName}</title>
<style>
  @page { margin: 0.5in 0.75in; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 40px 32px; max-width: 8.5in; margin: 0 auto; }
  .no-print { position: fixed; top: 20px; right: 20px; z-index: 9999; }
  @media print { .no-print { display: none !important; } body { padding: 0; } }
</style></head><body>
<div class="no-print"><button onclick="window.print()" style="background:#1e293b;color:white;border:none;padding:12px 24px;border-radius:8px;font-size:14px;cursor:pointer;">Print / Save as PDF</button></div>
<div style="border-bottom:4px solid #1e293b;padding-bottom:24px;margin-bottom:32px;display:flex;justify-content:space-between;align-items:flex-end;">
  <div><h1 style="font-size:22px;font-weight:700;color:#1e293b;margin:0;">${companyName}</h1>${d.branchName ? `<p style="font-size:13px;color:#64748b;margin:4px 0 0;">${d.branchName}</p>` : ''}</div>
  <div style="text-align:right;font-size:13px;color:#64748b;">${d.loanNumber ? `<p style="margin:0;">Loan #${d.loanNumber}</p>` : ''}<p style="margin:0;">${d.issueDate}</p></div>
</div>
<div style="text-align:center;margin-bottom:36px;"><div style="display:inline-block;background:#1e293b;color:white;padding:12px 32px;border-radius:8px;"><h2 style="margin:0;font-size:18px;letter-spacing:0.05em;text-transform:uppercase;">Pre-Approval Letter</h2></div></div>
<p>To Whom It May Concern,</p>
<p>This letter confirms that <strong style="color:#0f172a;">${d.borrowerName}</strong>${coLine} ${d.coBorrowerName ? 'have' : 'has'} been pre-approved for mortgage financing based on a thorough review of their financial qualifications, including credit history, income verification, assets, and debt obligations.</p>
<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:24px;margin:24px 0;">
  <h3 style="font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 16px;">Pre-Approval Summary</h3>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px 32px;">${summaryRows.join('')}</div>
</div>
${propBlock}
<p>This pre-approval is based on the information provided by the borrower${pl} and is subject to the following conditions:</p>
<ul style="color:#475569;padding-left:24px;">
  <li>Satisfactory appraisal of the subject property at or above the agreed purchase price</li>
  <li>Clear title and satisfactory title insurance commitment</li>
  <li>No material change in the borrower${plPoss} financial condition, employment status, or credit profile prior to closing</li>
  <li>Property must meet all applicable lending guidelines and be in acceptable condition</li>
  <li>Verification that the property is free of environmental hazards and structural defects</li>
  <li>Satisfactory homeowner's insurance coverage</li>
  <li>All required documentation must be provided and verified prior to final loan approval</li>
</ul>
<p>The borrower${plHave} ${qualStr}.</p>
<p>This pre-approval letter is valid through <strong style="color:#0f172a;">${d.expirationDate}</strong> and is subject to final underwriting approval. We are confident in ${plThese} ability to secure financing and complete a timely closing.</p>
<p>Please do not hesitate to contact me directly with any questions regarding this pre-approval or the borrower${plPoss} qualifications.</p>
<div style="margin-top:40px;padding-top:20px;border-top:1px solid #e2e8f0;">
  <p style="margin:0 0 20px;">Sincerely,</p>
  ${d.originatorName ? `<p style="font-size:16px;font-weight:600;color:#0f172a;margin:0;">${d.originatorName}</p>` : ''}
  <p style="font-size:13px;color:#475569;margin:2px 0;">Loan Officer</p>
  ${d.originatorNmls ? `<p style="font-size:13px;color:#64748b;margin:2px 0;">NMLS# ${d.originatorNmls}</p>` : ''}
  <p style="font-size:14px;font-weight:600;color:#334155;margin:8px 0 0;">${companyName}</p>
  <p style="font-size:13px;color:#64748b;margin:4px 0 0;">${[d.originatorEmail, d.originatorPhone].filter(Boolean).join(' | ')}</p>
</div>
<div style="margin-top:40px;padding-top:16px;border-top:1px solid #f1f5f9;font-size:11px;color:#94a3b8;line-height:1.5;">
  <p>This pre-approval letter is not a commitment to lend. Final loan approval is subject to satisfactory completion of the underwriting process, including but not limited to property appraisal, title review, and verification of all borrower information. Interest rates and terms are subject to change without notice. This letter does not guarantee any specific interest rate or loan terms. Equal Housing Lender.</p>
</div>
</body></html>`;
}

function SummaryRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-slate-500 uppercase tracking-wide">{label}</span>
      <span className={`text-base font-semibold ${highlight ? 'text-slate-900 text-lg' : 'text-slate-800'}`}>
        {value}
      </span>
    </div>
  );
}
