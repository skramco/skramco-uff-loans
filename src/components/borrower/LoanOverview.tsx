import { DollarSign, Home, ArrowDown, Target } from 'lucide-react';
import { formatCurrency, formatPercent } from './formatters';

interface LoanOverviewProps {
  loan: any;
}

export default function LoanOverview({ loan }: LoanOverviewProps) {
  const loanNumber = loan.loanNumber;
  const loanAmount = loan.loanAmount;
  const purchasePrice = loan.salesContractPurchasePrice;
  const downPayment = loan.downPaymentAmount;
  const downPaymentPct = loan.downPaymentPercentage;
  const ltv = loan.loanToValueRatio;
  const currentStage = loan.currentLoanStage;
  const loanPurpose = loan.loanPurpose;
  const loanType = loan.loanProduct?.mortgageType || loan.loanType;

  const stageColorMap: Record<string, string> = {
    Origination: 'bg-red-100 text-red-800',
    Processing: 'bg-amber-100 text-amber-800',
    Underwriting: 'bg-orange-100 text-orange-800',
    Docs: 'bg-teal-100 text-teal-800',
    Funding: 'bg-green-100 text-green-800',
    'Post Closing': 'bg-emerald-100 text-emerald-800',
  };
  const stageColor = stageColorMap[currentStage] || 'bg-gray-100 text-gray-800';

  const stats = [
    {
      label: 'Loan Amount',
      value: formatCurrency(loanAmount),
      icon: DollarSign,
      accent: 'text-red-600 bg-red-50',
    },
    {
      label: purchasePrice ? 'Purchase Price' : 'Property Value',
      value: formatCurrency(purchasePrice || loan.subjectProperty?.actualValueAmount),
      icon: Home,
      accent: 'text-emerald-600 bg-emerald-50',
    },
    {
      label: 'Down Payment',
      value: downPayment ? `${formatCurrency(downPayment)} (${formatPercent(downPaymentPct, 1)})` : '--',
      icon: ArrowDown,
      accent: 'text-teal-600 bg-teal-50',
    },
    {
      label: 'LTV Ratio',
      value: formatPercent(ltv),
      icon: Target,
      accent: 'text-amber-600 bg-amber-50',
    },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-5 sm:px-8 sm:py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-slate-400 text-sm mb-1">Loan #{loanNumber}</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              {formatCurrency(loanAmount)}
            </h2>
            <div className="flex items-center gap-3 mt-2">
              {loanType && (
                <span className="text-slate-300 text-sm">{loanType}</span>
              )}
              {loanPurpose && (
                <>
                  <span className="text-slate-500">|</span>
                  <span className="text-slate-300 text-sm">{loanPurpose}</span>
                </>
              )}
            </div>
          </div>
          <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${stageColor}`}>
            {currentStage}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-gray-100">
        {stats.map((stat) => (
          <div key={stat.label} className="px-4 py-5 sm:px-6">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${stat.accent}`}>
                <stat.icon className="w-3.5 h-3.5" />
              </div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{stat.label}</p>
            </div>
            <p className="text-lg font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
