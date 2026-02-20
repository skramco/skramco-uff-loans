import { useState } from 'react';
import { ChevronDown, ChevronUp, Send, Check, Save, Loader, User, Briefcase, Wallet, CreditCard, MapPin, FileText, ClipboardCheck } from 'lucide-react';
import type { LoanApplicationData } from '../../types';
import type { SectionKey } from '../../hooks/useApplicationForm';
import { SECTION_ORDER, SECTION_LABELS, validateSection, isSectionValid } from '../../hooks/useApplicationForm';
import PersonalInfoSection from './PersonalInfoSection';
import EmploymentSection from './EmploymentSection';
import AssetsSection from './AssetsSection';
import LiabilitiesSection from './LiabilitiesSection';
import PropertySection from './PropertySection';
import LoanDetailsSection from './LoanDetailsSection';
import DeclarationsSection from './DeclarationsSection';

const SECTION_ICONS = [User, Briefcase, Wallet, CreditCard, MapPin, FileText, ClipboardCheck];

interface Props {
  formData: LoanApplicationData;
  saving: boolean;
  lastSaved: Date | null;
  onUpdateSection: (section: SectionKey, field: string, value: any) => void;
  onSubmit: () => void;
  submitting: boolean;
  disabled?: boolean;
}

export default function DirectMode({
  formData,
  saving,
  lastSaved,
  onUpdateSection,
  onSubmit,
  submitting,
  disabled,
}: Props) {
  const [expandedSections, setExpandedSections] = useState<Set<SectionKey>>(new Set(['personalInfo']));

  function toggleSection(key: SectionKey) {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  function expandAll() {
    setExpandedSections(new Set(SECTION_ORDER));
  }

  function collapseAll() {
    setExpandedSections(new Set());
  }

  function renderSectionContent(key: SectionKey) {
    const sectionData = formData[key] || {};
    const errors = validateSection(key, formData);

    switch (key) {
      case 'personalInfo':
        return (
          <PersonalInfoSection
            data={sectionData as any}
            errors={errors}
            onChange={(f, v) => onUpdateSection('personalInfo', f, v)}
            disabled={disabled}
          />
        );
      case 'employment':
        return (
          <EmploymentSection
            data={sectionData as any}
            errors={errors}
            onChange={(f, v) => onUpdateSection('employment', f, v)}
            disabled={disabled}
          />
        );
      case 'assets':
        return (
          <AssetsSection
            data={sectionData as any}
            errors={errors}
            onChange={(f, v) => onUpdateSection('assets', f, v)}
            disabled={disabled}
          />
        );
      case 'liabilities':
        return (
          <LiabilitiesSection
            data={sectionData as any}
            errors={errors}
            onChange={(f, v) => onUpdateSection('liabilities', f, v)}
            totalMonthlyIncome={formData.employment?.totalMonthlyIncome}
            disabled={disabled}
          />
        );
      case 'property':
        return (
          <PropertySection
            data={sectionData as any}
            errors={errors}
            onChange={(f, v) => onUpdateSection('property', f, v)}
            disabled={disabled}
          />
        );
      case 'loanDetails':
        return (
          <LoanDetailsSection
            data={sectionData as any}
            errors={errors}
            onChange={(f, v) => onUpdateSection('loanDetails', f, v)}
            propertyValue={formData.property?.propertyValue}
            disabled={disabled}
          />
        );
      case 'declarations':
        return (
          <DeclarationsSection
            data={sectionData as any}
            errors={errors}
            onChange={(f, v) => onUpdateSection('declarations', f, v)}
            fullFormData={formData}
            disabled={disabled}
          />
        );
      default:
        return null;
    }
  }

  const allValid = SECTION_ORDER.every((key) => isSectionValid(key, formData));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          {saving && (
            <span className="flex items-center gap-1 text-red-600">
              <Loader className="w-3 h-3 animate-spin" />
              Saving...
            </span>
          )}
          {!saving && lastSaved && (
            <span className="flex items-center gap-1 text-green-600">
              <Save className="w-3 h-3" />
              Saved {lastSaved.toLocaleTimeString()}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={expandAll}
            className="text-sm text-red-600 hover:text-red-700 font-medium"
          >
            Expand All
          </button>
          <span className="text-gray-300">|</span>
          <button
            onClick={collapseAll}
            className="text-sm text-red-600 hover:text-red-700 font-medium"
          >
            Collapse All
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {SECTION_ORDER.map((key, idx) => {
          const Icon = SECTION_ICONS[idx];
          const isExpanded = expandedSections.has(key);
          const valid = isSectionValid(key, formData);
          const hasData = Object.values(formData[key] || {}).some((v) => v !== undefined && v !== null && v !== '' && v !== 0);

          return (
            <div
              key={key}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden transition-all"
            >
              <button
                onClick={() => toggleSection(key)}
                className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    valid && hasData
                      ? 'bg-green-100 text-green-600'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {valid && hasData ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">{SECTION_LABELS[key]}</p>
                    <p className="text-xs text-gray-500">Section {idx + 1} of {SECTION_ORDER.length}</p>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>

              {isExpanded && (
                <div className="px-5 pb-6 border-t border-gray-100 pt-4">
                  {renderSectionContent(key)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex justify-end">
        <button
          onClick={onSubmit}
          disabled={!allValid || submitting || disabled}
          className="flex items-center gap-2 px-8 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Submit Application
            </>
          )}
        </button>
      </div>
    </div>
  );
}
