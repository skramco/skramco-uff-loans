import type { PersonalInfoSection as PersonalInfoData } from '../../types';
import type { ValidationErrors } from '../../hooks/useApplicationForm';
import FormField, { TextInput, SelectInput, NumberInput, PhoneInput, DateMaskInput, ZipInput, CurrencyInput, US_STATES } from './FormField';

interface Props {
  data: PersonalInfoData;
  errors: ValidationErrors;
  onChange: (field: string, value: any) => void;
  disabled?: boolean;
}

export default function PersonalInfoSection({ data, errors, onChange, disabled }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Personal Information</h3>
        <p className="text-sm text-gray-500">Tell us about yourself</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField label="First Name" required error={errors.firstName}>
          <TextInput
            value={data.firstName || ''}
            onChange={(v) => onChange('firstName', v)}
            placeholder="John"
            disabled={disabled}
            error={!!errors.firstName}
          />
        </FormField>
        <FormField label="Middle Name">
          <TextInput
            value={data.middleName || ''}
            onChange={(v) => onChange('middleName', v)}
            placeholder="M."
            disabled={disabled}
          />
        </FormField>
        <FormField label="Last Name" required error={errors.lastName}>
          <TextInput
            value={data.lastName || ''}
            onChange={(v) => onChange('lastName', v)}
            placeholder="Doe"
            disabled={disabled}
            error={!!errors.lastName}
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Email Address" required error={errors.email}>
          <TextInput
            value={data.email || ''}
            onChange={(v) => onChange('email', v)}
            placeholder="john@example.com"
            type="email"
            disabled={disabled}
            error={!!errors.email}
          />
        </FormField>
        <FormField label="Phone Number" required error={errors.phone}>
          <PhoneInput
            value={data.phone || ''}
            onChange={(v) => onChange('phone', v)}
            disabled={disabled}
            error={!!errors.phone}
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField label="Date of Birth">
          <DateMaskInput
            value={data.dateOfBirth || ''}
            onChange={(v) => onChange('dateOfBirth', v)}
            disabled={disabled}
          />
        </FormField>
        <FormField label="Marital Status">
          <SelectInput
            value={data.maritalStatus || ''}
            onChange={(v) => onChange('maritalStatus', v)}
            placeholder="Select..."
            disabled={disabled}
            options={[
              { value: 'Married', label: 'Married' },
              { value: 'Separated', label: 'Separated' },
              { value: 'Unmarried', label: 'Unmarried' },
            ]}
          />
        </FormField>
        <FormField label="Citizenship">
          <SelectInput
            value={data.citizenship || ''}
            onChange={(v) => onChange('citizenship', v)}
            placeholder="Select..."
            disabled={disabled}
            options={[
              { value: 'U.S. Citizen', label: 'U.S. Citizen' },
              { value: 'Permanent Resident', label: 'Permanent Resident Alien' },
              { value: 'Non-Permanent Resident', label: 'Non-Permanent Resident Alien' },
            ]}
          />
        </FormField>
      </div>

      <div className="border-t pt-6">
        <h4 className="text-md font-semibold text-gray-800 mb-4">Current Address</h4>
        <div className="space-y-4">
          <FormField label="Street Address" required error={errors.currentAddress}>
            <TextInput
              value={data.currentAddress || ''}
              onChange={(v) => onChange('currentAddress', v)}
              placeholder="123 Main Street"
              disabled={disabled}
              error={!!errors.currentAddress}
            />
          </FormField>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <FormField label="City" required error={errors.currentCity} className="col-span-2 md:col-span-1">
              <TextInput
                value={data.currentCity || ''}
                onChange={(v) => onChange('currentCity', v)}
                placeholder="Anytown"
                disabled={disabled}
                error={!!errors.currentCity}
              />
            </FormField>
            <FormField label="State" required error={errors.currentState}>
              <SelectInput
                value={data.currentState || ''}
                onChange={(v) => onChange('currentState', v)}
                placeholder="Select..."
                disabled={disabled}
                error={!!errors.currentState}
                options={US_STATES}
              />
            </FormField>
            <FormField label="ZIP" required error={errors.currentZip}>
              <ZipInput
                value={data.currentZip || ''}
                onChange={(v) => onChange('currentZip', v)}
                disabled={disabled}
                error={!!errors.currentZip}
              />
            </FormField>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField label="Years at Address">
              <NumberInput
                value={data.yearsAtAddress}
                onChange={(v) => onChange('yearsAtAddress', v)}
                placeholder="0"
                step={0.5}
                disabled={disabled}
              />
            </FormField>
            <FormField label="Housing Status">
              <SelectInput
                value={data.housingStatus || ''}
                onChange={(v) => onChange('housingStatus', v)}
                placeholder="Select..."
                disabled={disabled}
                options={[
                  { value: 'Rent', label: 'Rent' },
                  { value: 'Own', label: 'Own' },
                  { value: 'Living Rent Free', label: 'Living Rent Free' },
                ]}
              />
            </FormField>
            <FormField label="Monthly Rent/Mortgage">
              <CurrencyInput
                value={data.monthlyRent}
                onChange={(v) => onChange('monthlyRent', v)}
                disabled={disabled}
              />
            </FormField>
          </div>
        </div>
      </div>
    </div>
  );
}
