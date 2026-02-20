import { Calendar } from 'lucide-react';
import { formatDate } from './formatters';

interface KeyDatesProps {
  loan: any;
}

export default function KeyDates({ loan }: KeyDatesProps) {
  const dates: { label: string; value: string | null }[] = [
    { label: 'Application Date', value: loan.fileCreatedDate || loan.createdAt },
    { label: 'TRID Triggered', value: loan.tridTriggeredDate },
    { label: 'LE Must Be Sent By', value: loan.loanEstimateNeedsToBeSentDate },
    { label: 'Rate Lock Requested', value: loan.loanProduct?.rateLockRequestedDate },
    { label: 'Application Signed', value: loan.loanOriginatorSignedApplicationDate },
  ].filter((d) => d.value);

  if (dates.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-5">Key Dates</h3>
      <div className="space-y-3">
        {dates.map((d) => (
          <div key={d.label} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-sm">{d.label}</span>
            </div>
            <span className="text-sm font-medium text-gray-900">{formatDate(d.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
