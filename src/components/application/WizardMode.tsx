import { ChevronLeft, ChevronRight, Send, Check, User, Briefcase, Wallet, CreditCard, MapPin, FileText, ClipboardCheck, Save, Loader } from 'lucide-react';
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
  currentStep: number;
  saving: boolean;
  lastSaved: Date | null;
  onUpdateSection: (section: SectionKey, field: string, value: any) => void;
  onNext: () => void;
  onBack: () => void;
  onGoToStep: (step: number) => void;
  onSubmit: () => void;
  submitting: boolean;
  disabled?: boolean;
}

export default function WizardMode({
  formData,
  currentStep,
  saving,
  lastSaved,
  onUpdateSection,
  onNext,
  onBack,
  onGoToStep,
  onSubmit,
  submitting,
  disabled,
}: Props) {
  const currentSectionKey = SECTION_ORDER[currentStep];
  const errors = validateSection(currentSectionKey, formData);
  const isValid = Object.keys(errors).length === 0;
  const isLastStep = currentStep === SECTION_ORDER.length - 1;
  const progressPercent = ((currentStep + 1) / SECTION_ORDER.length) * 100;

  function renderSection() {
    const sectionKey = SECTION_ORDER[currentStep];
    const sectionData = formData[sectionKey] || {};
    const sectionErrors = errors;

    switch (sectionKey) {
      case 'personalInfo':
        return (
          <PersonalInfoSection
            data={sectionData as any}
            errors={sectionErrors}
            onChange={(f, v) => onUpdateSection('personalInfo', f, v)}
            disabled={disabled}
          />
        );
      case 'employment':
        return (
          <EmploymentSection
            data={sectionData as any}
            errors={sectionErrors}
            onChange={(f, v) => onUpdateSection('employment', f, v)}
            disabled={disabled}
          />
        );
      case 'assets':
        return (
          <AssetsSection
            data={sectionData as any}
            errors={sectionErrors}
            onChange={(f, v) => onUpdateSection('assets', f, v)}
            disabled={disabled}
          />
        );
      case 'liabilities':
        return (
          <LiabilitiesSection
            data={sectionData as any}
            errors={sectionErrors}
            onChange={(f, v) => onUpdateSection('liabilities', f, v)}
            totalMonthlyIncome={formData.employment?.totalMonthlyIncome}
            disabled={disabled}
          />
        );
      case 'property':
        return (
          <PropertySection
            data={sectionData as any}
            errors={sectionErrors}
            onChange={(f, v) => onUpdateSection('property', f, v)}
            disabled={disabled}
          />
        );
      case 'loanDetails':
        return (
          <LoanDetailsSection
            data={sectionData as any}
            errors={sectionErrors}
            onChange={(f, v) => onUpdateSection('loanDetails', f, v)}
            propertyValue={formData.property?.propertyValue}
            disabled={disabled}
          />
        );
      case 'declarations':
        return (
          <DeclarationsSection
            data={sectionData as any}
            errors={sectionErrors}
            onChange={(f, v) => onUpdateSection('declarations', f, v)}
            fullFormData={formData}
            disabled={disabled}
          />
        );
      default:
        return null;
    }
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-600">
            Step {currentStep + 1} of {SECTION_ORDER.length}
          </span>
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
        </div>

        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-red-600 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {SECTION_ORDER.map((key, idx) => {
          const Icon = SECTION_ICONS[idx];
          const valid = isSectionValid(key, formData);
          const isCurrent = idx === currentStep;
          const isPast = idx < currentStep;

          return (
            <button
              key={key}
              onClick={() => onGoToStep(idx)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                isCurrent
                  ? 'bg-red-600 text-white shadow-md'
                  : isPast && valid
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {isPast && valid ? (
                <Check className="w-4 h-4" />
              ) : (
                <Icon className="w-4 h-4" />
              )}
              <span className="hidden lg:inline">{SECTION_LABELS[key]}</span>
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 md:p-8 min-h-[400px]">
        {renderSection()}
      </div>

      <div className="flex items-center justify-between mt-6">
        <button
          onClick={onBack}
          disabled={currentStep === 0}
          className="flex items-center gap-2 px-5 py-2.5 text-gray-700 bg-gray-100 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>

        {isLastStep ? (
          <button
            onClick={onSubmit}
            disabled={submitting || disabled}
            className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
        ) : (
          <button
            onClick={onNext}
            disabled={!isValid}
            className="flex items-center gap-2 px-6 py-2.5 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Continue
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
