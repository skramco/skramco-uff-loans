import { TrendingUp, Wallet, CreditCard, PieChart, Briefcase } from 'lucide-react';
import { formatCurrency, formatCurrencyExact, formatPercent, camelToTitle } from './formatters';

interface FinancialSummaryProps {
  loan: any;
}

export default function FinancialSummary({ loan }: FinancialSummaryProps) {
  const totalIncome = loan.totalMonthlyIncome;
  const totalAssets = loan.totalAssetsValue;
  const totalLiabilities = loan.totalMonthlyLiabilities;
  const dti = loan.debtToIncomeRatio;
  const housingRatio = loan.housingExpensesToIncomeRatio;
  const reserves = loan.monthsOfReservesAvailableEstimate;

  const incomes: any[] = loan.incomes || [];
  const assets: any[] = loan.assets || [];
  const liabilities: any[] = loan.liabilities || [];

  const incomeTypeLabels: Record<string, string> = {
    Employment: 'Employment',
    DividendsInterest: 'Dividends & Interest',
    AutomobileAllowance: 'Auto Allowance',
    NotesReceivableInstallment: 'Notes Receivable',
    Trust: 'Trust Income',
    SocialSecurity: 'Social Security',
    Pension: 'Pension',
    Rental: 'Rental Income',
    SelfEmployment: 'Self-Employment',
  };

  const assetTypeLabels: Record<string, string> = {
    CheckingAccount: 'Checking',
    SavingsAccount: 'Savings',
    CertificateOfDepositTimeDeposit: 'Certificate of Deposit',
    MutualFund: 'Mutual Fund',
    TrustAccount: 'Trust Account',
    RetirementFund: 'Retirement',
    Stock: 'Stock',
    Bond: 'Bond',
  };

  const liabilityTypeLabels: Record<string, string> = {
    SecuredInstallment: 'Installment Loan',
    RevolvingCreditLine: 'Revolving Credit',
    MortgageLoan: 'Mortgage',
    StudentLoan: 'Student Loan',
    AutoLoan: 'Auto Loan',
    Unsecured: 'Unsecured Loan',
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Financial Summary</h3>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <RatioCard
          label="Monthly Income"
          value={formatCurrencyExact(totalIncome)}
          icon={<TrendingUp className="w-4 h-4" />}
          accent="bg-emerald-50 text-emerald-600"
        />
        <RatioCard
          label="Total Assets"
          value={formatCurrency(totalAssets)}
          icon={<Wallet className="w-4 h-4" />}
          accent="bg-red-50 text-red-600"
        />
        <RatioCard
          label="Housing Ratio"
          value={housingRatio != null ? formatPercent(housingRatio, 1) : '--'}
          icon={<PieChart className="w-4 h-4" />}
          accent="bg-amber-50 text-amber-600"
        />
        <RatioCard
          label="Debt-to-Income"
          value={dti != null ? formatPercent(dti, 1) : '--'}
          icon={<CreditCard className="w-4 h-4" />}
          accent="bg-rose-50 text-rose-600"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {incomes.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-emerald-500" />
              Income
            </h4>
            <div className="space-y-2">
              {incomes.map((inc, idx) => (
                <div key={inc.id || idx} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm text-gray-800">
                      {incomeTypeLabels[inc.incomeType] || camelToTitle(inc.incomeType || '')}
                    </p>
                    {inc.employer?.name && (
                      <p className="text-xs text-gray-500">{inc.employer.name}</p>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatCurrencyExact(inc.totalCalculatedStatedMonthlyIncome)}/mo
                  </span>
                </div>
              ))}
              {totalIncome != null && (
                <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                  <span className="text-sm font-semibold text-gray-700">Total</span>
                  <span className="text-sm font-bold text-gray-900">{formatCurrencyExact(totalIncome)}/mo</span>
                </div>
              )}
            </div>
          </div>
        )}

        {assets.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-red-500" />
              Assets
            </h4>
            <div className="space-y-2">
              {assets.map((asset, idx) => (
                <div key={asset.id || idx} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm text-gray-800">
                      {assetTypeLabels[asset.assetType] || camelToTitle(asset.assetType || '')}
                    </p>
                    {asset.institutionName && (
                      <p className="text-xs text-gray-500">{asset.institutionName}</p>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatCurrency(asset.assetValue)}
                  </span>
                </div>
              ))}
              {totalAssets != null && (
                <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                  <span className="text-sm font-semibold text-gray-700">Total</span>
                  <span className="text-sm font-bold text-gray-900">{formatCurrency(totalAssets)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {liabilities.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-rose-500" />
              Liabilities
            </h4>
            <div className="space-y-2">
              {liabilities.map((liab, idx) => (
                <div key={liab.id || idx} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm text-gray-800">
                      {liabilityTypeLabels[liab.liabilityType] || camelToTitle(liab.liabilityType || '')}
                    </p>
                    {liab.creditorName && (
                      <p className="text-xs text-gray-500">{liab.creditorName}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      {formatCurrencyExact(liab.monthlyPaymentAmount)}/mo
                    </p>
                    {liab.unpaidBalanceAmount != null && (
                      <p className="text-xs text-gray-500">
                        Bal: {formatCurrency(liab.unpaidBalanceAmount)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {totalLiabilities != null && (
                <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                  <span className="text-sm font-semibold text-gray-700">Total Monthly</span>
                  <span className="text-sm font-bold text-gray-900">{formatCurrencyExact(totalLiabilities)}/mo</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {reserves != null && (
        <div className="mt-6 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Months of Reserves Available</span>
            <span className="text-sm font-bold text-gray-900">{reserves}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function RatioCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${accent}`}>
        {icon}
      </div>
      <p className="text-xs text-gray-500 font-medium mb-1">{label}</p>
      <p className="text-lg font-bold text-gray-900">{value}</p>
    </div>
  );
}
