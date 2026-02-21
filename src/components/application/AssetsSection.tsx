import { useEffect } from 'react';
import type { AssetsSection as AssetsData } from '../../types';
import type { ValidationErrors } from '../../hooks/useApplicationForm';
import FormField, { CurrencyInput, TextInput } from './FormField';

interface Props {
  data: AssetsData;
  errors: ValidationErrors;
  onChange: (field: string, value: any) => void;
  disabled?: boolean;
}

export default function AssetsSection({ data, errors, onChange, disabled }: Props) {
  const calculatedTotal = (data.checkingAccounts || 0) + (data.savingsAccounts || 0) + (data.retirementAccounts || 0) + (data.otherAssets || 0) + (data.giftFunds || 0);

  useEffect(() => {
    if (calculatedTotal > 0 && data.totalAssets !== calculatedTotal) {
      onChange('totalAssets', calculatedTotal);
    }
  }, [data.checkingAccounts, data.savingsAccounts, data.retirementAccounts, data.otherAssets, data.giftFunds]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Assets</h3>
        <p className="text-sm text-gray-500">List your financial assets including bank accounts, investments, and other holdings</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Checking Accounts" hint="Total balance across all checking accounts">
          <CurrencyInput
            value={data.checkingAccounts}
            onChange={(v) => onChange('checkingAccounts', v)}
            disabled={disabled}
          />
        </FormField>
        <FormField label="Savings Accounts" hint="Total balance across all savings accounts">
          <CurrencyInput
            value={data.savingsAccounts}
            onChange={(v) => onChange('savingsAccounts', v)}
            disabled={disabled}
          />
        </FormField>
        <FormField label="Retirement Accounts" hint="401(k), IRA, Roth IRA, etc.">
          <CurrencyInput
            value={data.retirementAccounts}
            onChange={(v) => onChange('retirementAccounts', v)}
            disabled={disabled}
          />
        </FormField>
        <FormField label="Other Assets" hint="Stocks, bonds, mutual funds, etc.">
          <CurrencyInput
            value={data.otherAssets}
            onChange={(v) => onChange('otherAssets', v)}
            disabled={disabled}
          />
        </FormField>
      </div>

      <div className="border-t pt-6">
        <h4 className="text-md font-semibold text-gray-800 mb-4">Gift Funds</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Gift Amount">
            <CurrencyInput
              value={data.giftFunds}
              onChange={(v) => onChange('giftFunds', v)}
              disabled={disabled}
            />
          </FormField>
          <FormField label="Gift Source" hint="e.g., Parent, Relative, Employer">
            <TextInput
              value={data.giftSource || ''}
              onChange={(v) => onChange('giftSource', v)}
              placeholder="Source of gift funds"
              disabled={disabled}
            />
          </FormField>
        </div>
      </div>

      <div className="border-t pt-6">
        <FormField label="Total Assets" required error={errors.totalAssets} hint="Enter your total asset value, or leave the individual fields above to auto-calculate">
          <CurrencyInput
            value={data.totalAssets !== undefined ? data.totalAssets : (calculatedTotal > 0 ? calculatedTotal : undefined)}
            onChange={(v) => onChange('totalAssets', v)}
            disabled={disabled}
            error={!!errors.totalAssets}
          />
        </FormField>
      </div>
    </div>
  );
}
