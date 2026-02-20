import { URLAApplication } from '../../types';

interface Section1aProps {
  formData: Partial<URLAApplication>;
  onChange: (field: keyof URLAApplication, value: any) => void;
}

export default function Section1a({ formData, onChange }: Section1aProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Section 1a: Borrower Information</h2>
        <p className="text-sm text-gray-600">Provide your legal name as it appears on your government-issued ID</p>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            First Name *
          </label>
          <input
            type="text"
            value={formData.borrower_first_name || ''}
            onChange={(e) => onChange('borrower_first_name', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3d7a9c] focus:border-transparent"
            placeholder="John"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Middle Name
          </label>
          <input
            type="text"
            value={formData.borrower_middle_name || ''}
            onChange={(e) => onChange('borrower_middle_name', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3d7a9c] focus:border-transparent"
            placeholder="M"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Suffix
          </label>
          <select
            value={formData.borrower_suffix || ''}
            onChange={(e) => onChange('borrower_suffix', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3d7a9c] focus:border-transparent"
          >
            <option value="">None</option>
            <option value="Jr.">Jr.</option>
            <option value="Sr.">Sr.</option>
            <option value="II">II</option>
            <option value="III">III</option>
            <option value="IV">IV</option>
          </select>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Last Name *
          </label>
          <input
            type="text"
            value={formData.borrower_last_name || ''}
            onChange={(e) => onChange('borrower_last_name', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3d7a9c] focus:border-transparent"
            placeholder="Doe"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Date of Birth *
          </label>
          <input
            type="date"
            value={formData.borrower_dob || ''}
            onChange={(e) => onChange('borrower_dob', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3d7a9c] focus:border-transparent"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Email Address *
          </label>
          <input
            type="email"
            value={formData.borrower_email || ''}
            onChange={(e) => onChange('borrower_email', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3d7a9c] focus:border-transparent"
            placeholder="john@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Phone Number *
          </label>
          <input
            type="tel"
            value={formData.borrower_phone || ''}
            onChange={(e) => onChange('borrower_phone', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3d7a9c] focus:border-transparent"
            placeholder="(555) 123-4567"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Current Address *
        </label>
        <input
          type="text"
          value={formData.borrower_current_address || ''}
          onChange={(e) => onChange('borrower_current_address', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3d7a9c] focus:border-transparent"
          placeholder="123 Main St, Apt 4B"
        />
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            City *
          </label>
          <input
            type="text"
            value={formData.borrower_current_city || ''}
            onChange={(e) => onChange('borrower_current_city', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3d7a9c] focus:border-transparent"
            placeholder="New York"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            State *
          </label>
          <input
            type="text"
            value={formData.borrower_current_state || ''}
            onChange={(e) => onChange('borrower_current_state', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3d7a9c] focus:border-transparent"
            placeholder="NY"
            maxLength={2}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            ZIP Code *
          </label>
          <input
            type="text"
            value={formData.borrower_current_zip || ''}
            onChange={(e) => onChange('borrower_current_zip', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3d7a9c] focus:border-transparent"
            placeholder="10001"
            maxLength={10}
          />
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Years at Address *
          </label>
          <input
            type="number"
            value={formData.borrower_years_at_address || ''}
            onChange={(e) => onChange('borrower_years_at_address', Number(e.target.value))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3d7a9c] focus:border-transparent"
            min="0"
            placeholder="2"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Housing Status *
          </label>
          <select
            value={formData.borrower_housing_status || 'rent'}
            onChange={(e) => onChange('borrower_housing_status', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3d7a9c] focus:border-transparent"
          >
            <option value="rent">Rent</option>
            <option value="own">Own</option>
            <option value="living_rent_free">Living Rent Free</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Monthly Rent/Mortgage
          </label>
          <input
            type="number"
            value={formData.borrower_monthly_rent || ''}
            onChange={(e) => onChange('borrower_monthly_rent', Number(e.target.value))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3d7a9c] focus:border-transparent"
            placeholder="1500"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Marital Status *
          </label>
          <select
            value={formData.borrower_marital_status || ''}
            onChange={(e) => onChange('borrower_marital_status', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3d7a9c] focus:border-transparent"
          >
            <option value="">Select...</option>
            <option value="married">Married</option>
            <option value="separated">Separated</option>
            <option value="unmarried">Unmarried</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Number of Dependents
          </label>
          <input
            type="number"
            value={formData.borrower_dependents_count || ''}
            onChange={(e) => onChange('borrower_dependents_count', Number(e.target.value))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3d7a9c] focus:border-transparent"
            min="0"
            placeholder="0"
          />
        </div>
      </div>

      {(formData.borrower_dependents_count || 0) > 0 && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Ages of Dependents (comma-separated)
          </label>
          <input
            type="text"
            value={formData.borrower_dependents_ages || ''}
            onChange={(e) => onChange('borrower_dependents_ages', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3d7a9c] focus:border-transparent"
            placeholder="5, 8, 12"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Citizenship Status *
        </label>
        <select
          value={formData.borrower_citizenship || ''}
          onChange={(e) => onChange('borrower_citizenship', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3d7a9c] focus:border-transparent"
        >
          <option value="">Select...</option>
          <option value="us_citizen">U.S. Citizen</option>
          <option value="permanent_resident">Permanent Resident Alien</option>
          <option value="non_permanent_resident">Non-Permanent Resident Alien</option>
        </select>
      </div>
    </div>
  );
}
