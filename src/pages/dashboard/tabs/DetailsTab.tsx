import BorrowerInfo from '../../../components/borrower/BorrowerInfo';
import PropertyDetails from '../../../components/borrower/PropertyDetails';
import { extractBorrower, extractProperty, extractLoanOfficer, extractFinancials, extractLoanStatus } from '../../../services/loanDataHelpers';
import { formatCurrency, formatPercent, formatDate } from '../../../components/borrower/formatters';
import { DollarSign, Percent, Calendar, FileText, Lock, Building2 } from 'lucide-react';

interface Props {
  loan: any;
}

function InfoRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-semibold text-gray-900">{value}</span>
    </div>
  );
}

export default function DetailsTab({ loan }: Props) {
  const borrower = extractBorrower(loan);
  const property = extractProperty(loan);
  const loanOfficer = extractLoanOfficer(loan);
  const financials = extractFinancials(loan);
  const loanStatus = extractLoanStatus(loan);

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-2 gap-6">
        <BorrowerInfo loan={loan} />
        <PropertyDetails loan={loan} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-brand-600" />
            <h3 className="text-lg font-bold text-gray-900">Loan Terms</h3>
          </div>
          <div>
            <InfoRow label="Loan Amount" value={formatCurrency(financials.loanAmount)} />
            <InfoRow label="Interest Rate" value={financials.interestRate ? formatPercent(financials.interestRate, 3) : undefined} />
            <InfoRow label="APR" value={loan?.apr ? formatPercent(loan.apr, 3) : undefined} />
            <InfoRow label="Loan Term" value={financials.loanTerm ? `${Math.round(financials.loanTerm / 12)} Years (${financials.loanTerm} months)` : undefined} />
            <InfoRow label="Loan Type" value={financials.loanType} />
            <InfoRow label="Loan Purpose" value={financials.loanPurpose} />
            <InfoRow label="Amortization" value={loan?.loanAmortizationType || loan?.amortizationType} />
            <InfoRow label="Lien Position" value={loan?.lienType || loan?.lienPosition} />
            <InfoRow label="Down Payment" value={financials.downPayment ? formatCurrency(financials.downPayment) : undefined} />
            <InfoRow label="LTV" value={financials.ltv ? formatPercent(financials.ltv) : undefined} />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="w-5 h-5 text-brand-600" />
            <h3 className="text-lg font-bold text-gray-900">Rate Lock & Program</h3>
          </div>
          <div>
            <InfoRow label="Rate Lock Status" value={loan?.rateLockStatus || loan?.lockStatus || 'Not Locked'} />
            <InfoRow label="Lock Expiration" value={loanStatus.lockExpirationDate ? formatDate(loanStatus.lockExpirationDate) : undefined} />
            <InfoRow label="Investor" value={loan?.investorName || loan?.investor} />
            <InfoRow label="Program" value={loan?.programName || loan?.program} />
            <InfoRow label="Points" value={loan?.points ?? loan?.discountPoints} />
            <InfoRow label="Mortgage Insurance" value={financials.pmi > 0 ? formatCurrency(financials.pmi) + '/mo' : 'None'} />
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-brand-600" />
              <h3 className="text-lg font-bold text-gray-900">Key Dates</h3>
            </div>
            <div>
              <InfoRow label="Application Date" value={loanStatus.applicationDate ? formatDate(loanStatus.applicationDate) : undefined} />
              <InfoRow label="Expected Close Date" value={loanStatus.expectedCloseDate ? formatDate(loanStatus.expectedCloseDate) : undefined} />
              <InfoRow label="Rate Lock Requested" value={loan?.rateLockRequestedDate ? formatDate(loan.rateLockRequestedDate) : undefined} />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="w-5 h-5 text-brand-600" />
          <h3 className="text-lg font-bold text-gray-900">Loan Officer</h3>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {loanOfficer.fullName && (
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Name</p>
              <p className="text-sm font-semibold text-gray-900">{loanOfficer.fullName}</p>
            </div>
          )}
          {loanOfficer.nmls && (
            <div>
              <p className="text-xs text-gray-500 mb-0.5">NMLS#</p>
              <p className="text-sm font-semibold text-gray-900">{loanOfficer.nmls}</p>
            </div>
          )}
          {loanOfficer.email && (
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Email</p>
              <a href={`mailto:${loanOfficer.email}`} className="text-sm font-semibold text-brand-600 hover:text-brand-700">{loanOfficer.email}</a>
            </div>
          )}
          {loanOfficer.phone && (
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Phone</p>
              <a href={`tel:${loanOfficer.phone}`} className="text-sm font-semibold text-brand-600 hover:text-brand-700">{loanOfficer.phone}</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
