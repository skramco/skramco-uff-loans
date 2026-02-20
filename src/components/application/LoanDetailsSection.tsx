import type { LoanDetailsSection as LoanDetailsData } from '../../types';
import type { ValidationErrors } from '../../hooks/useApplicationForm';
import FormField, { NumberInput, SelectInput } from './FormField';

interface Props {
  data: LoanDetailsData;
  errors: ValidationErrors;
  onChange: (field: string, value: any) => void;
  propertyValue?: number;
  disabled?: boolean;
}

export default function LoanDetailsSection({ data, errors, onChange, propertyValue, disabled }: Props) {
  const ltvRatio = propertyValue && propertyValue > 0 && data.loanAmount
    ? ((data.loanAmount / propertyValue) * 100).toFixed(1)
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Loan Details</h3>
        <p className="text-sm text-gray-500">Loan purpose, amount, and type</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Loan Purpose" required error={errors.loanPurpose}>
          <SelectInput
            value={data.loanPurpose || ''}
            onChange={(v) => onChange('loanPurpose', v)}
            placeholder="Select..."
            disabled={disabled}
            error={!!errors.loanPurpose}
            options={[
              { value: 'Purchase', label: 'Purchase' },
              { value: 'Refinance', label: 'Refinance' },
              { value: 'Cash-Out Refinance', label: 'Cash-Out Refinance' },
              { value: 'Other', label: 'Other' },
            ]}
          />
        </FormField>
        <FormField label="Loan Type">
          <SelectInput
            value={data.loanType || ''}
            onChange={(v) => onChange('loanType', v)}
            placeholder="Select..."
            disabled={disabled}
            options={[
              { value: 'Conventional', label: 'Conventional' },
              { value: 'FHA', label: 'FHA' },
              { value: 'VA', label: 'VA' },
              { value: 'USDA', label: 'USDA' },
              { value: 'Jumbo', label: 'Jumbo' },
            ]}
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Loan Amount" required error={errors.loanAmount}>
          <NumberInput
            value={data.loanAmount}
            onChange={(v) => onChange('loanAmount', v)}
            prefix="$"
            placeholder="0"
            disabled={disabled}
            error={!!errors.loanAmount}
          />
        </FormField>
        <FormField label="Down Payment">
          <NumberInput
            value={data.downPayment}
            onChange={(v) => onChange('downPayment', v)}
            prefix="$"
            placeholder="0"
            disabled={disabled}
          />
        </FormField>
      </div>

      {ltvRatio && (
        <div className={`rounded-lg p-4 ${
          parseFloat(ltvRatio) <= 80 ? 'bg-green-50 border border-green-200' :
          parseFloat(ltvRatio) <= 95 ? 'bg-amber-50 border border-amber-200' :
          'bg-red-50 border border-red-200'
        }`}>
          <p className="text-sm text-gray-600">Loan-to-Value Ratio</p>
          <p className="text-xl font-bold text-gray-900">{ltvRatio}%</p>
          <p className="text-xs text-gray-500 mt-1">
            {parseFloat(ltvRatio) <= 80 ? 'No private mortgage insurance (PMI) required' :
             parseFloat(ltvRatio) <= 95 ? 'PMI will likely be required' :
             'Very high LTV - limited loan options available'}
          </p>
        </div>
      )}
    </div>
  );
}
