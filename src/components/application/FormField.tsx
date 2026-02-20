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
  disabled?: boolean;
  error?: boolean;
}

export function NumberInput({ value, onChange, placeholder, min = 0, step = 1, prefix, disabled, error }: NumberInputProps) {
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
        } ${error ? 'border-red-300 bg-red-50' : 'border-gray-300'} ${
          disabled ? 'bg-gray-100 cursor-not-allowed' : ''
        }`}
      />
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
