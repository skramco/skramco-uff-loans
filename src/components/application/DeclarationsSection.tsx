import type { DeclarationsSection as DeclarationsData, LoanApplicationData } from '../../types';
import type { ValidationErrors } from '../../hooks/useApplicationForm';
import { CheckboxInput } from './FormField';
import { CheckCircle, DollarSign, Briefcase, FileText, MapPin } from 'lucide-react';

interface Props {
  data: DeclarationsData;
  errors: ValidationErrors;
  onChange: (field: string, value: any) => void;
  fullFormData: LoanApplicationData;
  disabled?: boolean;
}

function SummaryCard({ icon: Icon, title, items }: { icon: any; title: string; items: { label: string; value: string }[] }) {
  const visibleItems = items.filter((i) => i.value);
  if (visibleItems.length === 0) return null;

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-red-600" />
        <h5 className="font-semibold text-gray-900 text-sm">{title}</h5>
      </div>
      <div className="space-y-1.5">
        {visibleItems.map((item, idx) => (
          <div key={idx} className="flex justify-between text-sm">
            <span className="text-gray-500">{item.label}</span>
            <span className="text-gray-900 font-medium">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DeclarationsSection({ data, onChange, fullFormData, disabled }: Props) {
  const pi = fullFormData.personalInfo || {};
  const emp = fullFormData.employment || {};
  const prop = fullFormData.property || {};
  const ld = fullFormData.loanDetails || {};

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Review & Declarations</h3>
        <p className="text-sm text-gray-500">Review your application and answer the declaration questions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SummaryCard
          icon={CheckCircle}
          title="Personal Information"
          items={[
            { label: 'Name', value: [pi.firstName, pi.lastName].filter(Boolean).join(' ') },
            { label: 'Email', value: pi.email || '' },
            { label: 'Phone', value: pi.phone || '' },
            { label: 'Address', value: [pi.currentAddress, pi.currentCity, pi.currentState, pi.currentZip].filter(Boolean).join(', ') },
          ]}
        />
        <SummaryCard
          icon={Briefcase}
          title="Employment"
          items={[
            { label: 'Employer', value: emp.employerName || '' },
            { label: 'Position', value: emp.position || '' },
            { label: 'Monthly Income', value: emp.totalMonthlyIncome ? `$${emp.totalMonthlyIncome.toLocaleString()}` : '' },
          ]}
        />
        <SummaryCard
          icon={MapPin}
          title="Property"
          items={[
            { label: 'Address', value: [prop.address, prop.city, prop.state, prop.zip].filter(Boolean).join(', ') },
            { label: 'Value', value: prop.propertyValue ? `$${prop.propertyValue.toLocaleString()}` : '' },
            { label: 'Type', value: prop.propertyType || '' },
          ]}
        />
        <SummaryCard
          icon={DollarSign}
          title="Loan Details"
          items={[
            { label: 'Purpose', value: ld.loanPurpose || '' },
            { label: 'Amount', value: ld.loanAmount ? `$${ld.loanAmount.toLocaleString()}` : '' },
            { label: 'Type', value: ld.loanType || '' },
            { label: 'Down Payment', value: ld.downPayment ? `$${ld.downPayment.toLocaleString()}` : '' },
          ]}
        />
      </div>

      <div className="border-t pt-6">
        <h4 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-red-600" />
          Declarations
        </h4>
        <p className="text-sm text-gray-500 mb-4">Please answer the following questions honestly. These are required by federal law.</p>

        <div className="space-y-4 bg-gray-50 rounded-lg p-5">
          <CheckboxInput
            checked={data.outstandingJudgments || false}
            onChange={(v) => onChange('outstandingJudgments', v)}
            label="Are there any outstanding judgments against you?"
            disabled={disabled}
          />
          <CheckboxInput
            checked={data.bankruptcyLast7Years || false}
            onChange={(v) => onChange('bankruptcyLast7Years', v)}
            label="Have you declared bankruptcy within the past 7 years?"
            disabled={disabled}
          />
          <CheckboxInput
            checked={data.foreclosureLast7Years || false}
            onChange={(v) => onChange('foreclosureLast7Years', v)}
            label="Have you had property foreclosed upon in the last 7 years?"
            disabled={disabled}
          />
          <CheckboxInput
            checked={data.lawsuitParty || false}
            onChange={(v) => onChange('lawsuitParty', v)}
            label="Are you a party to a lawsuit?"
            disabled={disabled}
          />
          <CheckboxInput
            checked={data.delinquentFederalDebt || false}
            onChange={(v) => onChange('delinquentFederalDebt', v)}
            label="Are you presently delinquent on any federal debt?"
            disabled={disabled}
          />
          <CheckboxInput
            checked={data.alimonyObligation || false}
            onChange={(v) => onChange('alimonyObligation', v)}
            label="Are you obligated to pay alimony, child support, or separate maintenance?"
            disabled={disabled}
          />
          <CheckboxInput
            checked={data.downPaymentBorrowed || false}
            onChange={(v) => onChange('downPaymentBorrowed', v)}
            label="Is any part of the down payment borrowed?"
            disabled={disabled}
          />
        </div>
      </div>

      <div className="border-t pt-6">
        <h4 className="text-md font-semibold text-gray-800 mb-4">Citizenship & Military</h4>
        <div className="space-y-4 bg-gray-50 rounded-lg p-5">
          <CheckboxInput
            checked={data.usCitizen ?? true}
            onChange={(v) => onChange('usCitizen', v)}
            label="Are you a U.S. citizen?"
            disabled={disabled}
          />
          <CheckboxInput
            checked={data.currentlyServing || false}
            onChange={(v) => onChange('currentlyServing', v)}
            label="Are you currently serving on active military duty?"
            disabled={disabled}
          />
          <CheckboxInput
            checked={data.previouslyServed || false}
            onChange={(v) => onChange('previouslyServed', v)}
            label="Have you previously served in the U.S. Armed Forces?"
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
}
