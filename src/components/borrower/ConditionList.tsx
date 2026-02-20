import { useState } from 'react';
import {
  FileText,
  ChevronDown,
  ChevronRight,
  Clock,
  Briefcase,
  Home,
  DollarSign,
  TrendingUp,
  CreditCard,
  Building,
  FileCheck,
  HelpCircle,
  X,
  Send,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import { sendConditionQuestion } from '../../services/vestaService';

interface ConditionItem {
  id: string;
  entityType: string;
  conditionTiming: string | null;
  conditionStatus: string;
  conditionAtFaultUsers: string[];
  instructionsOverride: string;
  conditionCategory?: string;
  objectiveName?: string;
  [key: string]: any;
}

interface ConditionListProps {
  conditions: ConditionItem[];
  statusBadge: React.ReactNode;
  loan?: any;
}

const TIMING_ORDER = [
  'PriorToApproval',
  'PriorToDocs',
  'PriorToClosing',
  'PriorToFunding',
  'PostFunding',
];

const TIMING_LABELS: Record<string, string> = {
  PriorToApproval: 'Prior to Approval',
  PriorToDocs: 'Prior to Docs',
  PriorToClosing: 'Prior to Closing',
  PriorToFunding: 'Prior to Funding',
  PostFunding: 'Post Funding',
};

const ENTITY_ICONS: Record<string, any> = {
  Loan: FileText,
  Borrower: Briefcase,
  Property: Home,
  Asset: DollarSign,
  Income: TrendingUp,
  Liability: CreditCard,
  ClosingCost: DollarSign,
  Document: FileCheck,
  BorrowerBusiness: Building,
};

const TIMING_COLORS: Record<string, { badge: string }> = {
  PriorToApproval: { badge: 'bg-amber-100 text-amber-800' },
  PriorToDocs: { badge: 'bg-red-100 text-red-800' },
  PriorToClosing: { badge: 'bg-teal-100 text-teal-800' },
  PriorToFunding: { badge: 'bg-cyan-100 text-cyan-800' },
  PostFunding: { badge: 'bg-gray-100 text-gray-800' },
};

function entityLabel(type: string): string {
  return type.replace(/([A-Z])/g, ' $1').trim();
}

function groupByTiming(conditions: ConditionItem[]) {
  const groups: Record<string, ConditionItem[]> = {};
  conditions.forEach((c) => {
    const key = c.conditionTiming || 'Other';
    if (!groups[key]) groups[key] = [];
    groups[key].push(c);
  });

  return Object.entries(groups)
    .sort((a, b) => {
      const ai = TIMING_ORDER.indexOf(a[0]);
      const bi = TIMING_ORDER.indexOf(b[0]);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    })
    .map(([key, items]) => ({
      key,
      label: TIMING_LABELS[key] || key,
      items,
    }));
}

export default function ConditionList({ conditions, statusBadge, loan }: ConditionListProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    () => new Set(groupByTiming(conditions).map((g) => g.key))
  );
  const [questionModal, setQuestionModal] = useState<ConditionItem | null>(null);
  const [questionText, setQuestionText] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendError, setSendError] = useState('');

  function toggleGroup(key: string) {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function openQuestionModal(condition: ConditionItem) {
    setQuestionModal(condition);
    setQuestionText('');
    setSending(false);
    setSent(false);
    setSendError('');
  }

  function closeQuestionModal() {
    setQuestionModal(null);
    setQuestionText('');
    setSendError('');
    setSent(false);
  }

  async function handleSendQuestion() {
    if (!questionModal || !questionText.trim() || !loan) return;

    setSending(true);
    setSendError('');

    const borrowerEmail = loan.borrowers?.[0]?.emailAddress || '';
    const borrowerName = loan.borrowers?.[0]?.fullName ||
      [loan.borrowers?.[0]?.firstName, loan.borrowers?.[0]?.lastName].filter(Boolean).join(' ') || 'Borrower';
    const loName = loan.loanOriginator?.fullName || '';
    const loEmail = loan.loanOriginator?.emailAddress || loan.loanOriginator?.email || '';
    const loanNumber = loan.loanNumber || loan.referenceNumber || '';
    const propertyAddress = [
      loan.subjectProperty?.address?.streetAddress,
      loan.subjectProperty?.address?.city,
      loan.subjectProperty?.address?.state,
      loan.subjectProperty?.address?.zipCode,
    ].filter(Boolean).join(', ');

    const result = await sendConditionQuestion({
      borrowerName,
      borrowerEmail,
      loanOfficerName: loName,
      loanOfficerEmail: loEmail,
      loanNumber,
      propertyAddress,
      conditionName: questionModal.objectiveName || questionModal.instructionsOverride || 'Condition',
      conditionInstructions: questionModal.instructionsOverride || questionModal.externalFacingMessage || '',
      conditionTiming: TIMING_LABELS[questionModal.conditionTiming || ''] || questionModal.conditionTiming || '',
      conditionStatus: questionModal.conditionStatus || '',
      question: questionText.trim(),
    });

    if (result.error) {
      setSendError(result.error);
    } else {
      setSent(true);
      setTimeout(closeQuestionModal, 3000);
    }

    setSending(false);
  }

  const grouped = groupByTiming(conditions);

  return (
    <div className="space-y-3">
      {grouped.map((group) => {
        const isExpanded = expandedGroups.has(group.key);
        const timingColor = TIMING_COLORS[group.key] || TIMING_COLORS.PostFunding;

        return (
          <div
            key={group.key}
            className="rounded-xl border border-gray-200 overflow-hidden"
          >
            <button
              onClick={() => toggleGroup(group.key)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100/80 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                )}
                <span className="font-medium text-sm text-gray-900">{group.label}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${timingColor.badge}`}>
                  {group.items.length}
                </span>
              </div>
            </button>

            {isExpanded && (
              <div className="border-t border-gray-100 divide-y divide-gray-50">
                {group.items.map((condition, idx) => {
                  const EntityIcon = ENTITY_ICONS[condition.entityType] || FileText;
                  return (
                    <div
                      key={condition.id || idx}
                      className="px-4 py-3.5 bg-white hover:bg-gray-50/50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                          <EntityIcon className="w-3.5 h-3.5 text-gray-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 leading-relaxed">
                            {condition.instructionsOverride || condition.externalFacingMessage || 'No instructions provided.'}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                              {entityLabel(condition.entityType)}
                            </span>
                            {condition.conditionTiming && (
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${timingColor.badge}`}>
                                <Clock className="w-3 h-3" />
                                {TIMING_LABELS[condition.conditionTiming] || condition.conditionTiming}
                              </span>
                            )}
                            {statusBadge}
                            {loan && (
                              <button
                                onClick={() => openQuestionModal(condition)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors ml-auto"
                              >
                                <HelpCircle className="w-3 h-3" />
                                Have a question?
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {questionModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <HelpCircle className="w-5 h-5 text-white/80" />
                <h3 className="text-base font-semibold text-white">Ask Your Loan Officer</h3>
              </div>
              <button
                onClick={closeQuestionModal}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/15 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {sent ? (
              <div className="p-8 text-center">
                <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-7 h-7 text-green-500" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-1">Question Sent</h4>
                <p className="text-sm text-gray-500">
                  Your loan officer will receive your question and reply directly to your email.
                </p>
              </div>
            ) : (
              <div className="p-6 space-y-4">
                <div className="bg-gray-50 rounded-xl p-3.5">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Regarding Condition</p>
                  <p className="text-sm text-gray-900 leading-relaxed">
                    {questionModal.instructionsOverride || questionModal.externalFacingMessage || 'No instructions provided.'}
                  </p>
                  {questionModal.conditionTiming && (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs mt-2 ${
                      TIMING_COLORS[questionModal.conditionTiming]?.badge || 'bg-gray-100 text-gray-600'
                    }`}>
                      <Clock className="w-3 h-3" />
                      {TIMING_LABELS[questionModal.conditionTiming] || questionModal.conditionTiming}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Your Question
                  </label>
                  <textarea
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    placeholder="Type your question about this condition..."
                    rows={4}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none transition-shadow"
                  />
                </div>

                {sendError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    {sendError}
                  </div>
                )}

                <div className="flex gap-3 pt-1">
                  <button
                    onClick={closeQuestionModal}
                    className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendQuestion}
                    disabled={!questionText.trim() || sending}
                    className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {sending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send Question
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
