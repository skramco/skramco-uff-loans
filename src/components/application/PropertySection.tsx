import type { PropertySection as PropertyData } from '../../types';
import type { ValidationErrors } from '../../hooks/useApplicationForm';
import FormField, { TextInput, NumberInput, SelectInput, CheckboxInput, ZipInput, CurrencyInput, UFF_LICENSED_STATES } from './FormField';

interface Props {
  data: PropertyData;
  errors: ValidationErrors;
  onChange: (field: string, value: any) => void;
  loanPurpose?: string;
  disabled?: boolean;
}

export default function PropertySection({ data, errors, onChange, loanPurpose, disabled }: Props) {
  const isRefi = loanPurpose === 'Refinance' || loanPurpose === 'Cash-Out Refinance';

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Property Information</h3>
        <p className="text-sm text-gray-500">
          {isRefi
            ? 'Details about the property you are refinancing'
            : 'Details about the property you are purchasing'}
        </p>
      </div>

      <FormField label="Property Address" required error={errors.address}>
        <TextInput
          value={data.address || ''}
          onChange={(v) => onChange('address', v)}
          placeholder="123 Main Street"
          disabled={disabled}
          error={!!errors.address}
        />
      </FormField>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <FormField label="City" required error={errors.city} className="col-span-2 md:col-span-1">
          <TextInput
            value={data.city || ''}
            onChange={(v) => onChange('city', v)}
            placeholder="Anytown"
            disabled={disabled}
            error={!!errors.city}
          />
        </FormField>
        <FormField label="State" required error={errors.state}>
          <SelectInput
            value={data.state || ''}
            onChange={(v) => onChange('state', v)}
            placeholder="Select..."
            disabled={disabled}
            error={!!errors.state}
            options={UFF_LICENSED_STATES}
          />
        </FormField>
        <FormField label="ZIP" required error={errors.zip}>
          <ZipInput
            value={data.zip || ''}
            onChange={(v) => onChange('zip', v)}
            disabled={disabled}
            error={!!errors.zip}
          />
        </FormField>
        <FormField label="County">
          <TextInput
            value={data.county || ''}
            onChange={(v) => onChange('county', v)}
            placeholder="County name"
            disabled={disabled}
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label={isRefi ? "Estimated Current Value" : "Estimated Property Value"} required error={errors.propertyValue}>
          <CurrencyInput
            value={data.propertyValue}
            onChange={(v) => onChange('propertyValue', v)}
            disabled={disabled}
            error={!!errors.propertyValue}
          />
        </FormField>
        <FormField label="Property Type">
          <SelectInput
            value={data.propertyType || ''}
            onChange={(v) => onChange('propertyType', v)}
            placeholder="Select..."
            disabled={disabled}
            options={[
              { value: 'Single Family', label: 'Single Family Residence' },
              { value: 'Condominium', label: 'Condominium' },
              { value: 'Townhouse', label: 'Townhouse' },
              { value: '2-4 Unit', label: '2-4 Unit Property' },
              { value: 'Manufactured Home', label: 'Manufactured/Mobile Home' },
            ]}
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Occupancy Type">
          <SelectInput
            value={data.occupancyType || ''}
            onChange={(v) => onChange('occupancyType', v)}
            placeholder="Select..."
            disabled={disabled}
            options={[
              { value: 'Primary Residence', label: 'Primary Residence' },
              { value: 'Second Home', label: 'Second Home' },
              { value: 'Investment', label: 'Investment Property' },
            ]}
          />
        </FormField>
        <FormField label="Number of Units">
          <NumberInput
            value={data.unitsCount}
            onChange={(v) => onChange('unitsCount', v)}
            placeholder="1"
            min={1}
            disabled={disabled}
          />
        </FormField>
      </div>

      <div className="space-y-3">
        <CheckboxInput
          checked={data.mixedUse || false}
          onChange={(v) => onChange('mixedUse', v)}
          label="This is a mixed-use property"
          disabled={disabled}
        />
        <CheckboxInput
          checked={data.manufacturedHome || false}
          onChange={(v) => onChange('manufacturedHome', v)}
          label="This is a manufactured home"
          disabled={disabled}
        />
      </div>
    </div>
  );
}
