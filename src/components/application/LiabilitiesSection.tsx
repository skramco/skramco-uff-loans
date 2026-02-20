import type { LiabilitiesSection as LiabilitiesData } from '../../types';
import type { ValidationErrors } from '../../hooks/useApplicationForm';
import FormField, { NumberInput } from './FormField';

interface Props {
  data: LiabilitiesData;
  errors: ValidationErrors;
  onChange: (field: string, value: any) => void;
  totalMonthlyIncome?: number;
  disabled?: boolean;
}

export default function LiabilitiesSection({ data, errors, onChange, totalMonthlyIncome, disabled }: Props) {
  const calculatedTotal = (data.creditCardDebt || 0) + (data.carLoans || 0) + (data.studentLoans || 0) + (data.otherDebts || 0) + (data.alimonyChildSupport || 0);
  const displayDebt = data.totalMonthlyDebt ?? calculatedTotal;
  const dtiRatio = totalMonthlyIncome && totalMonthlyIncome > 0 && displayDebt > 0
    ? ((displayDebt / totalMonthlyIncome) * 100).toFixed(1)
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Liabilities</h3>
        <p className="text-sm text-gray-500">Monthly debt obligations and recurring payments</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Credit Card Payments" hint="Total minimum monthly payments">
          <NumberInput
            value={data.creditCardDebt}
            onChange={(v) => onChange('creditCardDebt', v)}
            prefix="$"
            placeholder="0"
            disabled={disabled}
          />
        </FormField>
        <FormField label="Auto Loans" hint="Monthly car loan payments">
          <NumberInput
            value={data.carLoans}
            onChange={(v) => onChange('carLoans', v)}
            prefix="$"
            placeholder="0"
            disabled={disabled}
          />
        </FormField>
        <FormField label="Student Loans" hint="Monthly student loan payments">
          <NumberInput
            value={data.studentLoans}
            onChange={(v) => onChange('studentLoans', v)}
            prefix="$"
            placeholder="0"
            disabled={disabled}
          />
        </FormField>
        <FormField label="Other Monthly Debts" hint="Personal loans, medical debt, etc.">
          <NumberInput
            value={data.otherDebts}
            onChange={(v) => onChange('otherDebts', v)}
            prefix="$"
            placeholder="0"
            disabled={disabled}
          />
        </FormField>
        <FormField label="Alimony / Child Support">
          <NumberInput
            value={data.alimonyChildSupport}
            onChange={(v) => onChange('alimonyChildSupport', v)}
            prefix="$"
            placeholder="0"
            disabled={disabled}
          />
        </FormField>
      </div>

      <div className="border-t pt-6">
        <FormField label="Total Monthly Debt" required error={errors.totalMonthlyDebt} hint="Sum of all monthly obligations">
          <NumberInput
            value={data.totalMonthlyDebt !== undefined ? data.totalMonthlyDebt : (calculatedTotal > 0 ? calculatedTotal : undefined)}
            onChange={(v) => onChange('totalMonthlyDebt', v)}
            prefix="$"
            placeholder="0"
            disabled={disabled}
            error={!!errors.totalMonthlyDebt}
          />
        </FormField>
      </div>

      {dtiRatio && (
        <div className={`rounded-lg p-4 flex items-center gap-3 ${
          parseFloat(dtiRatio) <= 36 ? 'bg-green-50 border border-green-200' :
          parseFloat(dtiRatio) <= 43 ? 'bg-amber-50 border border-amber-200' :
          'bg-red-50 border border-red-200'
        }`}>
          <div>
            <p className="text-sm text-gray-600">Debt-to-Income Ratio</p>
            <p className="text-xl font-bold text-gray-900">{dtiRatio}%</p>
            <p className="text-xs text-gray-500 mt-1">
              {parseFloat(dtiRatio) <= 36 ? 'Excellent - well within most lender requirements' :
               parseFloat(dtiRatio) <= 43 ? 'Acceptable - meets standard qualification threshold' :
               'High - may limit loan options or require additional documentation'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
