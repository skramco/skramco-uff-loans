import { formatCurrency } from './formatters';

interface CashToCloseProps {
  loan: any;
}

export default function CashToClose({ loan }: CashToCloseProps) {
  const downPayment = loan.downPaymentAmount;
  const earnestMoney = loan.earnestMoneyDepositAmount;
  const closingCosts = loan.totalClosingCostsAmountEstimate;
  const lenderCredits = loan.totalLenderCredits;
  const sellerCredits = loan.totalInterestedPartyContributions;
  const totalAdjustments = loan.totalAdjustmentsAndOtherCredits;
  const escrowEstimate = loan.escrowInitialBalanceEstimate;
  const cashToClose = loan.requiredCashToCloseEstimate;
  const cashToCloseWithEarnest = loan.requiredCashToClosePlusUnsourcedEarnestMoneyEstimate;

  const hasData = downPayment != null || cashToClose != null;
  if (!hasData) return null;

  const lines: { label: string; amount: number | null; isCredit?: boolean; isBold?: boolean }[] = [
    { label: 'Down Payment', amount: downPayment },
    { label: 'Initial Escrow Payment', amount: escrowEstimate },
    { label: 'Estimated Closing Costs', amount: closingCosts },
  ];

  if (lenderCredits) {
    lines.push({ label: 'Lender Credits', amount: -Math.abs(lenderCredits), isCredit: true });
  }
  if (sellerCredits) {
    lines.push({ label: 'Seller Credits', amount: -Math.abs(sellerCredits), isCredit: true });
  }
  if (earnestMoney) {
    lines.push({ label: 'Earnest Money Deposit', amount: -Math.abs(earnestMoney), isCredit: true });
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-1">Cash to Close</h3>
      <p className="text-sm text-gray-500 mb-6">Estimated funds needed at closing</p>

      <div className="space-y-3">
        {lines.map((line) =>
          line.amount != null ? (
            <div key={line.label} className="flex items-center justify-between py-1.5">
              <span className="text-sm text-gray-600">{line.label}</span>
              <span
                className={`text-sm font-medium ${
                  line.isCredit ? 'text-green-700' : 'text-gray-900'
                }`}
              >
                {line.isCredit && line.amount < 0 ? '- ' : ''}
                {formatCurrency(Math.abs(line.amount))}
              </span>
            </div>
          ) : null
        )}
      </div>

      {cashToCloseWithEarnest != null && (
        <div className="mt-4 pt-4 border-t-2 border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-base font-semibold text-gray-900">
              Estimated Cash to Close
            </span>
            <span className="text-xl font-bold text-gray-900">
              {formatCurrency(cashToCloseWithEarnest)}
            </span>
          </div>
          {cashToClose != null && cashToClose !== cashToCloseWithEarnest && (
            <p className="text-xs text-gray-500 mt-1 text-right">
              ({formatCurrency(cashToClose)} excluding earnest money)
            </p>
          )}
        </div>
      )}
    </div>
  );
}
