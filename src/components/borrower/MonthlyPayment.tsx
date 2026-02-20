import { formatCurrencyExact } from './formatters';

interface MonthlyPaymentProps {
  loan: any;
}

export default function MonthlyPayment({ loan }: MonthlyPaymentProps) {
  const pi = loan.mortgagePrincipalAndInterestMonthlyPayment || 0;
  const tax = loan.propertyTaxMonthlyPayment || 0;
  const insurance = loan.homeInsuranceMonthlyPayment || 0;
  const mi = loan.mortgageInsuranceMonthlyPayment || 0;
  const total = loan.totalHousingExpenses || (pi + tax + insurance + mi);

  const items = [
    { label: 'Principal & Interest', amount: pi, color: 'bg-red-500' },
    { label: 'Property Tax', amount: tax, color: 'bg-emerald-500' },
    { label: 'Home Insurance', amount: insurance, color: 'bg-amber-500' },
  ];

  if (mi > 0) {
    items.push({ label: 'Mortgage Insurance', amount: mi, color: 'bg-rose-400' });
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-1">Monthly Payment</h3>
      <p className="text-sm text-gray-500 mb-6">Estimated total housing expense</p>

      <div className="text-center mb-6">
        <p className="text-4xl font-bold text-gray-900">{formatCurrencyExact(total)}</p>
        <p className="text-sm text-gray-500 mt-1">per month</p>
      </div>

      <div className="flex rounded-full overflow-hidden h-3 mb-6">
        {items.map((item) => {
          const pct = total > 0 ? (item.amount / total) * 100 : 0;
          return (
            <div
              key={item.label}
              className={`${item.color} transition-all`}
              style={{ width: `${pct}%` }}
            />
          );
        })}
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${item.color}`} />
              <span className="text-sm text-gray-600">{item.label}</span>
            </div>
            <span className="text-sm font-semibold text-gray-900">
              {formatCurrencyExact(item.amount)}
            </span>
          </div>
        ))}
        <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700">Total</span>
          <span className="text-sm font-bold text-gray-900">{formatCurrencyExact(total)}</span>
        </div>
      </div>
    </div>
  );
}
