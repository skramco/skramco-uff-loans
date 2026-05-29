import { useState, useEffect } from 'react';
import {
  AlertCircle,
  Loader,
  CheckCircle,
  Eye,
} from 'lucide-react';
import { fetchLoanConditions } from '../../services/vestaService';
import type { VestaObjectiveCondition } from '../../lib/vestaConditions';
import ConditionList from './ConditionList';

interface LoanConditionsProps {
  loan: Record<string, unknown>;
}

type StatusTab = 'NotReadyToApprove' | 'ReadyToApprove' | 'Approved';

const STATUSES_TO_FETCH: StatusTab[] = ['NotReadyToApprove', 'ReadyToApprove', 'Approved'];

const STATUS_CONFIG: Record<StatusTab, {
  label: string;
  description: string;
  icon: typeof AlertCircle;
  activeClasses: string;
  badgeClasses: string;
  emptyTitle: string;
  emptyDescription: string;
  statusBadgeClasses: string;
  statusBadgeLabel: string;
}> = {
  NotReadyToApprove: {
    label: 'Action Needed',
    description: 'Upload documents or add notes for these borrower conditions',
    icon: AlertCircle,
    activeClasses: 'bg-amber-600 text-white shadow-sm',
    badgeClasses: 'bg-amber-100 text-amber-800',
    emptyTitle: 'No Action Needed',
    emptyDescription: 'You have no outstanding borrower conditions right now.',
    statusBadgeClasses: 'bg-amber-50 text-amber-700',
    statusBadgeLabel: 'Action Needed',
  },
  ReadyToApprove: {
    label: 'Under Review',
    description: 'Submitted items your loan team is reviewing',
    icon: Eye,
    activeClasses: 'bg-red-600 text-white shadow-sm',
    badgeClasses: 'bg-red-100 text-red-800',
    emptyTitle: 'Nothing Under Review',
    emptyDescription: 'There are no borrower conditions currently under review.',
    statusBadgeClasses: 'bg-red-50 text-red-700',
    statusBadgeLabel: 'Under Review',
  },
  Approved: {
    label: 'Approved',
    description: 'Completed borrower conditions',
    icon: CheckCircle,
    activeClasses: 'bg-green-600 text-white shadow-sm',
    badgeClasses: 'bg-green-100 text-green-800',
    emptyTitle: 'No Approved Conditions Yet',
    emptyDescription: 'Conditions will appear here once approved.',
    statusBadgeClasses: 'bg-green-50 text-green-700',
    statusBadgeLabel: 'Approved',
  },
};

export default function LoanConditions({ loan }: LoanConditionsProps) {
  const [allConditions, setAllConditions] = useState<VestaObjectiveCondition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<StatusTab>('NotReadyToApprove');

  const vestaLoanId = String(loan?.id || loan?.loanId || '');

  useEffect(() => {
    loadConditions();
  }, [vestaLoanId]);

  async function loadConditions() {
    if (!vestaLoanId) return;
    setLoading(true);
    setError('');

    const result = await fetchLoanConditions(vestaLoanId, STATUSES_TO_FETCH, ['Borrower']);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setAllConditions((result.conditions || []) as VestaObjectiveCondition[]);
    setLoading(false);
  }

  function getConditionsByStatus(status: StatusTab): VestaObjectiveCondition[] {
    return allConditions.filter((c) => c.conditionStatus === status);
  }

  function getCountByStatus(status: StatusTab): number {
    return getConditionsByStatus(status).length;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader className="w-8 h-8 text-red-600 animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading your conditions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <p className="text-red-800 font-medium mb-1">Unable to load conditions</p>
        <p className="text-red-600 text-sm mb-4">{error}</p>
        <button
          type="button"
          onClick={loadConditions}
          className="text-sm font-medium text-red-700 hover:text-red-800 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  const activeConfig = STATUS_CONFIG[activeTab];
  const activeConditions = getConditionsByStatus(activeTab);
  const ActiveIcon = activeConfig.icon;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Loan Conditions</h3>
        <p className="text-sm text-gray-500 mt-0.5">
          Borrower conditions from your loan file — upload documents or submit notes where needed.
        </p>
      </div>

      <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
        {STATUSES_TO_FETCH.map((status) => {
          const config = STATUS_CONFIG[status];
          const count = getCountByStatus(status);
          const isActive = activeTab === status;
          const Icon = config.icon;

          return (
            <button
              key={status}
              type="button"
              onClick={() => setActiveTab(status)}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? config.activeClasses
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{config.label}</span>
              {count > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${
                    isActive ? 'bg-white/25 text-white' : config.badgeClasses
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2.5">
            <ActiveIcon
              className={`w-5 h-5 ${
                activeTab === 'NotReadyToApprove'
                  ? 'text-amber-600'
                  : activeTab === 'ReadyToApprove'
                    ? 'text-red-600'
                    : 'text-green-600'
              }`}
            />
            <div>
              <h4 className="text-sm font-semibold text-gray-900">{activeConfig.label}</h4>
              <p className="text-xs text-gray-500 mt-0.5">{activeConfig.description}</p>
            </div>
          </div>
        </div>

        <div className="p-5">
          {activeConditions.length === 0 ? (
            <div className="text-center py-10">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <h4 className="text-base font-semibold text-gray-900 mb-1">
                {activeConfig.emptyTitle}
              </h4>
              <p className="text-gray-500 text-sm">{activeConfig.emptyDescription}</p>
            </div>
          ) : (
            <ConditionList
              conditions={activeConditions}
              loan={loan}
              allowActions={activeTab === 'NotReadyToApprove'}
              onConditionsUpdated={loadConditions}
              statusBadge={
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${activeConfig.statusBadgeClasses}`}
                >
                  <ActiveIcon className="w-3 h-3" />
                  {activeConfig.statusBadgeLabel}
                </span>
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}
