import { AlertCircle } from 'lucide-react';

interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  hint?: string;
  className?: string;
}

export default function FormField({ label, error, required, children, hint, className = '' }: FormFieldProps) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {hint && !error && (
        <p className="mt-1 text-xs text-gray-500">{hint}</p>
      )}
      {error && (
        <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  );
}

interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  maxLength?: number;
  disabled?: boolean;
  error?: boolean;
}

export function TextInput({ value, onChange, placeholder, type = 'text', maxLength, disabled, error }: TextInputProps) {
  return (
    <input
      type={type}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      disabled={disabled}
      className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors ${
        error ? 'border-red-300 bg-red-50' : 'border-gray-300'
      } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
    />
  );
}

interface NumberInputProps {
  value: number | undefined;
  onChange: (value: number) => void;
  placeholder?: string;
  min?: number;
  step?: number;
  prefix?: string;
  suffix?: string;
  disabled?: boolean;
  error?: boolean;
}

export function NumberInput({ value, onChange, placeholder, min = 0, step = 1, prefix, suffix, disabled, error }: NumberInputProps) {
  return (
    <div className="relative">
      {prefix && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">{prefix}</span>
      )}
      <input
        type="number"
        value={value ?? ''}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        placeholder={placeholder}
        min={min}
        step={step}
        disabled={disabled}
        className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors ${
          prefix ? 'pl-7' : ''
        } ${suffix ? 'pr-8' : ''} ${error ? 'border-red-300 bg-red-50' : 'border-gray-300'} ${
          disabled ? 'bg-gray-100 cursor-not-allowed' : ''
        }`}
      />
      {suffix && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">{suffix}</span>
      )}
    </div>
  );
}

interface SelectInputProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
}

export function SelectInput({ value, onChange, options, placeholder, disabled, error }: SelectInputProps) {
  return (
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors ${
        error ? 'border-red-300 bg-red-50' : 'border-gray-300'
      } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

interface CheckboxInputProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}

export function CheckboxInput({ checked, onChange, label, disabled }: CheckboxInputProps) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <input
        type="checkbox"
        checked={checked || false}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
      />
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  );
}

// ── Masked Inputs ──────────────────────────────────────────────────

interface MaskedInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
}

function formatPhone(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

export function PhoneInput({ value, onChange, placeholder = '(555) 123-4567', disabled, error }: MaskedInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
    onChange(digits);
  };
  return (
    <input
      type="tel"
      value={formatPhone(value || '')}
      onChange={handleChange}
      placeholder={placeholder}
      disabled={disabled}
      className={inputClass(error, disabled)}
    />
  );
}

function formatSSN(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 9);
  if (d.length <= 3) return d;
  if (d.length <= 5) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}`;
}

export function SSNInput({ value, onChange, placeholder = '***-**-****', disabled, error }: MaskedInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 9);
    onChange(digits);
  };
  return (
    <input
      type="text"
      inputMode="numeric"
      value={formatSSN(value || '')}
      onChange={handleChange}
      placeholder={placeholder}
      disabled={disabled}
      className={inputClass(error, disabled)}
    />
  );
}

function formatDateMask(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

export function DateMaskInput({ value, onChange, placeholder = 'MM/DD/YYYY', disabled, error }: MaskedInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 8);
    onChange(digits);
  };
  return (
    <input
      type="text"
      inputMode="numeric"
      value={formatDateMask(value || '')}
      onChange={handleChange}
      placeholder={placeholder}
      disabled={disabled}
      className={inputClass(error, disabled)}
    />
  );
}

export function ZipInput({ value, onChange, placeholder = '12345', disabled, error }: MaskedInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 5);
    onChange(digits);
  };
  return (
    <input
      type="text"
      inputMode="numeric"
      value={value || ''}
      onChange={handleChange}
      placeholder={placeholder}
      maxLength={5}
      disabled={disabled}
      className={inputClass(error, disabled)}
    />
  );
}

function formatCurrency(num: number | undefined): string {
  if (num === undefined || num === null) return '';
  if (num === 0) return '0';
  return num.toLocaleString('en-US');
}

interface CurrencyInputProps {
  value: number | undefined;
  onChange: (value: number) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
}

export function CurrencyInput({ value, onChange, placeholder = '0', disabled, error }: CurrencyInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9.]/g, '');
    const parts = raw.split('.');
    const cleaned = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : raw;
    onChange(parseFloat(cleaned) || 0);
  };
  const handleBlur = () => {
    if (value !== undefined) onChange(value);
  };
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
      <input
        type="text"
        inputMode="decimal"
        value={formatCurrency(value)}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        className={`${inputClass(error, disabled)} pl-7`}
      />
    </div>
  );
}

function inputClass(error?: boolean, disabled?: boolean): string {
  return `w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors ${
    error ? 'border-red-300 bg-red-50' : 'border-gray-300'
  } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`;
}

// ── State Lists ────────────────────────────────────────────────────

export const US_STATES = [
  { value: 'AL', label: 'AL' }, { value: 'AK', label: 'AK' }, { value: 'AZ', label: 'AZ' },
  { value: 'AR', label: 'AR' }, { value: 'CA', label: 'CA' }, { value: 'CO', label: 'CO' },
  { value: 'CT', label: 'CT' }, { value: 'DE', label: 'DE' }, { value: 'DC', label: 'DC' },
  { value: 'FL', label: 'FL' }, { value: 'GA', label: 'GA' }, { value: 'HI', label: 'HI' },
  { value: 'ID', label: 'ID' }, { value: 'IL', label: 'IL' }, { value: 'IN', label: 'IN' },
  { value: 'IA', label: 'IA' }, { value: 'KS', label: 'KS' }, { value: 'KY', label: 'KY' },
  { value: 'LA', label: 'LA' }, { value: 'ME', label: 'ME' }, { value: 'MD', label: 'MD' },
  { value: 'MA', label: 'MA' }, { value: 'MI', label: 'MI' }, { value: 'MN', label: 'MN' },
  { value: 'MS', label: 'MS' }, { value: 'MO', label: 'MO' }, { value: 'MT', label: 'MT' },
  { value: 'NE', label: 'NE' }, { value: 'NV', label: 'NV' }, { value: 'NH', label: 'NH' },
  { value: 'NJ', label: 'NJ' }, { value: 'NM', label: 'NM' }, { value: 'NY', label: 'NY' },
  { value: 'NC', label: 'NC' }, { value: 'ND', label: 'ND' }, { value: 'OH', label: 'OH' },
  { value: 'OK', label: 'OK' }, { value: 'OR', label: 'OR' }, { value: 'PA', label: 'PA' },
  { value: 'RI', label: 'RI' }, { value: 'SC', label: 'SC' }, { value: 'SD', label: 'SD' },
  { value: 'TN', label: 'TN' }, { value: 'TX', label: 'TX' }, { value: 'UT', label: 'UT' },
  { value: 'VT', label: 'VT' }, { value: 'VA', label: 'VA' }, { value: 'WA', label: 'WA' },
  { value: 'WV', label: 'WV' }, { value: 'WI', label: 'WI' }, { value: 'WY', label: 'WY' },
];

export const UFF_LICENSED_STATES = [
  { value: 'AL', label: 'AL' }, { value: 'AZ', label: 'AZ' }, { value: 'AR', label: 'AR' },
  { value: 'CA', label: 'CA' }, { value: 'CO', label: 'CO' }, { value: 'CT', label: 'CT' },
  { value: 'DC', label: 'DC' }, { value: 'DE', label: 'DE' }, { value: 'FL', label: 'FL' },
  { value: 'GA', label: 'GA' }, { value: 'IL', label: 'IL' }, { value: 'IN', label: 'IN' },
  { value: 'IA', label: 'IA' }, { value: 'KS', label: 'KS' }, { value: 'KY', label: 'KY' },
  { value: 'LA', label: 'LA' }, { value: 'MD', label: 'MD' }, { value: 'MA', label: 'MA' },
  { value: 'MI', label: 'MI' }, { value: 'MN', label: 'MN' }, { value: 'MS', label: 'MS' },
  { value: 'MO', label: 'MO' }, { value: 'NE', label: 'NE' }, { value: 'NJ', label: 'NJ' },
  { value: 'NM', label: 'NM' }, { value: 'NC', label: 'NC' }, { value: 'OH', label: 'OH' },
  { value: 'OK', label: 'OK' }, { value: 'OR', label: 'OR' }, { value: 'PA', label: 'PA' },
  { value: 'SC', label: 'SC' }, { value: 'TN', label: 'TN' }, { value: 'TX', label: 'TX' },
  { value: 'UT', label: 'UT' }, { value: 'VA', label: 'VA' }, { value: 'WA', label: 'WA' },
  { value: 'WV', label: 'WV' }, { value: 'WI', label: 'WI' }, { value: 'WY', label: 'WY' },
];
