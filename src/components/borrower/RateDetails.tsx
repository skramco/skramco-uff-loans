import { Lock } from 'lucide-react';
import { formatPercent, formatDate } from './formatters';

interface RateDetailsProps {
  loan: any;
}

export default function RateDetails({ loan }: RateDetailsProps) {
  const product = loan.loanProduct;
  if (!product) return null;

  const noteRate = product.noteRate;
  const apr = product.annualPercentageRate;
  const termMonths = product.loanTermMonthsCount;
  const termYears = termMonths ? Math.round(termMonths / 12) : null;
  const amortizationType = product.loanAmortizationType;
  const mortgageType = product.mortgageType;
  const programName = product.programName;
  const lienType = product.lienType;
  const rateLockStatus = product.rateLockStatus;
  const rateLockPeriod = product.rateLockPeriod;
  const rateExpiresAt = product.rateExpiresAt;
  const points = product.points;
  const investorName = product.investorName;

  const amortizationLabel = amortizationType
    ? amortizationType.replace(/([A-Z])/g, ' $1').trim()
    : null;

  const lockStatusColor =
    rateLockStatus === 'Locked'
      ? 'text-green-700 bg-green-50 border-green-200'
      : rateLockStatus === 'Requested'
      ? 'text-amber-700 bg-amber-50 border-amber-200'
      : 'text-gray-700 bg-gray-50 border-gray-200';

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-1">Rate & Product</h3>
      <p className="text-sm text-gray-500 mb-6">Your loan terms and rate details</p>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-red-50 rounded-xl p-4 text-center">
          <p className="text-xs text-red-600 font-medium uppercase tracking-wide mb-1">Note Rate</p>
          <p className="text-3xl font-bold text-red-900">{formatPercent(noteRate)}</p>
        </div>
        <div className="bg-slate-50 rounded-xl p-4 text-center">
          <p className="text-xs text-slate-600 font-medium uppercase tracking-wide mb-1">APR</p>
          <p className="text-3xl font-bold text-slate-900">{formatPercent(apr)}</p>
        </div>
      </div>

      {rateLockStatus && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-lg border mb-6 ${lockStatusColor}`}>
          <Lock className="w-4 h-4" />
          <span className="text-sm font-medium">
            Rate Lock: {rateLockStatus}
            {rateLockPeriod ? ` (${rateLockPeriod} days)` : ''}
          </span>
        </div>
      )}

      <div className="space-y-3">
        {termYears && (
          <DetailRow label="Loan Term" value={`${termYears} Years (${termMonths} months)`} />
        )}
        {amortizationLabel && (
          <DetailRow label="Amortization" value={amortizationLabel} />
        )}
        {mortgageType && (
          <DetailRow label="Mortgage Type" value={mortgageType} />
        )}
        {lienType && (
          <DetailRow label="Lien Position" value={lienType.replace(/([A-Z])/g, ' $1').trim()} />
        )}
        {investorName && (
          <DetailRow label="Investor" value={investorName} />
        )}
        {programName && (
          <DetailRow label="Program" value={programName} />
        )}
        {points != null && (
          <DetailRow label="Points" value={points.toString()} />
        )}
        {rateExpiresAt && (
          <DetailRow label="Rate Expires" value={formatDate(rateExpiresAt)} />
        )}
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between py-2 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900 text-right max-w-[60%]">{value}</span>
    </div>
  );
}
