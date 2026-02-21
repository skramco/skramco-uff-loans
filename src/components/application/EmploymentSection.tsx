import type { EmploymentSection as EmploymentData } from '../../types';
import type { ValidationErrors } from '../../hooks/useApplicationForm';
import FormField, { TextInput, NumberInput, CheckboxInput, PhoneInput, DateMaskInput, CurrencyInput } from './FormField';
import { DollarSign } from 'lucide-react';

interface Props {
  data: EmploymentData;
  errors: ValidationErrors;
  onChange: (field: string, value: any) => void;
  disabled?: boolean;
}

export default function EmploymentSection({ data, errors, onChange, disabled }: Props) {
  const totalIncome = (data.baseIncome || 0) + (data.overtime || 0) + (data.bonus || 0) + (data.commission || 0) + (data.otherIncome || 0);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Employment & Income</h3>
        <p className="text-sm text-gray-500">Current employment information and monthly income</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Employer Name" required error={errors.employerName}>
          <TextInput
            value={data.employerName || ''}
            onChange={(v) => onChange('employerName', v)}
            placeholder="Company Inc."
            disabled={disabled}
            error={!!errors.employerName}
          />
        </FormField>
        <FormField label="Position / Title" required error={errors.position}>
          <TextInput
            value={data.position || ''}
            onChange={(v) => onChange('position', v)}
            placeholder="Software Engineer"
            disabled={disabled}
            error={!!errors.position}
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField label="Employer Phone">
          <PhoneInput
            value={data.employerPhone || ''}
            onChange={(v) => onChange('employerPhone', v)}
            disabled={disabled}
          />
        </FormField>
        <FormField label="Years Employed">
          <NumberInput
            value={data.yearsEmployed}
            onChange={(v) => onChange('yearsEmployed', v)}
            placeholder="0"
            step={0.5}
            disabled={disabled}
          />
        </FormField>
        <FormField label="Start Date">
          <DateMaskInput
            value={data.employmentStartDate || ''}
            onChange={(v) => onChange('employmentStartDate', v)}
            disabled={disabled}
          />
        </FormField>
      </div>

      <CheckboxInput
        checked={data.selfEmployed || false}
        onChange={(v) => onChange('selfEmployed', v)}
        label="I am self-employed"
        disabled={disabled}
      />

      <div className="border-t pt-6">
        <h4 className="text-md font-semibold text-gray-800 mb-4">Monthly Income</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Base Monthly Income" required error={errors.baseIncome}>
            <CurrencyInput
              value={data.baseIncome}
              onChange={(v) => onChange('baseIncome', v)}
              disabled={disabled}
              error={!!errors.baseIncome}
            />
          </FormField>
          <FormField label="Overtime">
            <CurrencyInput
              value={data.overtime}
              onChange={(v) => onChange('overtime', v)}
              disabled={disabled}
            />
          </FormField>
          <FormField label="Bonus">
            <CurrencyInput
              value={data.bonus}
              onChange={(v) => onChange('bonus', v)}
              disabled={disabled}
            />
          </FormField>
          <FormField label="Commission">
            <CurrencyInput
              value={data.commission}
              onChange={(v) => onChange('commission', v)}
              disabled={disabled}
            />
          </FormField>
          <FormField label="Other Income">
            <CurrencyInput
              value={data.otherIncome}
              onChange={(v) => onChange('otherIncome', v)}
              disabled={disabled}
            />
          </FormField>
        </div>

        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <DollarSign className="w-5 h-5 text-red-600" />
          <div>
            <p className="text-sm text-gray-600">Total Monthly Income</p>
            <p className="text-xl font-bold text-gray-900">${totalIncome.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
