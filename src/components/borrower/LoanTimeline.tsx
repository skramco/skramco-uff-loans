import { CheckCircle2, Circle, Clock } from 'lucide-react';

interface LoanTimelineProps {
  loan: any;
}

const PIPELINE_STAGES = [
  'Origination',
  'Processing',
  'Underwriting',
  'Docs',
  'Funding',
  'Post Closing',
];

export default function LoanTimeline({ loan }: LoanTimelineProps) {
  const currentStage = loan.currentLoanStage;
  const stageData = loan.loanStages || [];

  const stageMap = new Map<string, any>();
  for (const s of stageData) {
    stageMap.set(s.templateName, s);
  }

  const currentIdx = PIPELINE_STAGES.indexOf(currentStage);

  function getStageStatus(stage: string, idx: number) {
    if (idx < currentIdx) return 'completed';
    if (idx === currentIdx) return 'current';
    return 'upcoming';
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Loan Progress</h3>

      <div className="hidden sm:flex items-center justify-between relative">
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 z-0" />
        <div
          className="absolute top-4 left-0 h-0.5 bg-red-600 z-0 transition-all duration-500"
          style={{
            width: currentIdx >= 0
              ? `${(currentIdx / (PIPELINE_STAGES.length - 1)) * 100}%`
              : '0%',
          }}
        />

        {PIPELINE_STAGES.map((stage, idx) => {
          const status = getStageStatus(stage, idx);
          return (
            <div key={stage} className="relative z-10 flex flex-col items-center">
              {status === 'completed' ? (
                <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
              ) : status === 'current' ? (
                <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center ring-4 ring-red-100">
                  <Clock className="w-4 h-4 text-white" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center">
                  <Circle className="w-3 h-3 text-gray-300" />
                </div>
              )}
              <span
                className={`mt-2 text-xs font-medium text-center ${
                  status === 'current'
                    ? 'text-red-700 font-semibold'
                    : status === 'completed'
                    ? 'text-gray-700'
                    : 'text-gray-400'
                }`}
              >
                {stage}
              </span>
            </div>
          );
        })}
      </div>

      <div className="sm:hidden space-y-3">
        {PIPELINE_STAGES.map((stage, idx) => {
          const status = getStageStatus(stage, idx);
          return (
            <div key={stage} className="flex items-center gap-3">
              {status === 'completed' ? (
                <div className="w-7 h-7 rounded-full bg-red-600 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                </div>
              ) : status === 'current' ? (
                <div className="w-7 h-7 rounded-full bg-red-600 flex items-center justify-center flex-shrink-0 ring-4 ring-red-100">
                  <Clock className="w-3.5 h-3.5 text-white" />
                </div>
              ) : (
                <div className="w-7 h-7 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center flex-shrink-0">
                  <Circle className="w-3 h-3 text-gray-300" />
                </div>
              )}
              <span
                className={`text-sm ${
                  status === 'current'
                    ? 'text-red-700 font-semibold'
                    : status === 'completed'
                    ? 'text-gray-700'
                    : 'text-gray-400'
                }`}
              >
                {stage}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
