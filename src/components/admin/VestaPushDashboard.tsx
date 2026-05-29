import { useState, useEffect, useCallback } from 'react';
import {
  LogOut,
  Loader2,
  RefreshCw,
  Upload,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Layers,
  Filter,
  ArrowRightLeft,
  Trash2,
} from 'lucide-react';
import {
  listVestaPushLoans,
  pushLoanToVesta,
  deleteLoanApplication,
  drainVestaSyncQueue,
  backfillVestaJobs,
  runVestaSyncCron,
  getAdminSettings,
  updateVestaEnvironment,
  type VestaPushLoanRow,
  type VestaPushLoanFilter,
  type AdminSettingsResponse,
} from '../../services/adminService';

interface Props {
  password: string;
  onLogout: () => void;
}

export default function VestaPushDashboard({ password, onLogout }: Props) {
  const [loans, setLoans] = useState<VestaPushLoanRow[]>([]);
  const [filter, setFilter] = useState<VestaPushLoanFilter>('needs_sync');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [pushingId, setPushingId] = useState<string | null>(null);
  const [bulkRunning, setBulkRunning] = useState<string | null>(null);
  const [envInfo, setEnvInfo] = useState<AdminSettingsResponse | null>(null);
  const [switchingEnv, setSwitchingEnv] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadLoans = useCallback(async () => {
    setLoading(true);
    setError('');
    const [listResult, settings] = await Promise.all([
      listVestaPushLoans(password, filter),
      getAdminSettings(password),
    ]);
    if (settings) setEnvInfo(settings);
    if (listResult.success && listResult.loans) {
      setLoans(listResult.loans);
    } else {
      setLoans([]);
      setError(listResult.error || 'Failed to load loans');
    }
    setLoading(false);
  }, [password, filter]);

  useEffect(() => {
    void loadLoans();
  }, [loadLoans]);

  async function handleDelete(loan: VestaPushLoanRow) {
    const label =
      loan.borrowerName ||
      loan.tempLoanNumber ||
      loan.borrowerEmail ||
      loan.id.slice(0, 8);

    let msg =
      `Delete application for ${label}?\n\nThis removes the loan from the portal database (application data, sync jobs, conditions, documents). This cannot be undone.`;

    if (loan.vestaLoanId) {
      msg += `\n\nNote: Vesta loan ${loan.vestaLoanId} will NOT be deleted from Vesta — only the local record.`;
    }

    if (!window.confirm(msg)) return;

    setDeletingId(loan.id);
    setError('');
    const r = await deleteLoanApplication(password, loan.id);
    setDeletingId(null);
    if (r.success) {
      setSuccessMsg(
        r.hadVestaLoanId
          ? 'Application deleted locally (Vesta loan unchanged)'
          : 'Application deleted'
      );
      await loadLoans();
    } else {
      setError(r.error || 'Delete failed');
    }
    setTimeout(() => setSuccessMsg(''), 5000);
  }

  async function handlePush(loanId: string) {
    setPushingId(loanId);
    setError('');
    const r = await pushLoanToVesta(password, loanId);
    setPushingId(null);
    if (r.success || r.alreadySynced) {
      setSuccessMsg(
        r.vestaLoanId
          ? `Synced — Vesta loan ${r.vestaLoanId}`
          : 'Push completed'
      );
      await loadLoans();
    } else {
      setError(r.error || r.workerMessage || 'Push to Vesta failed');
    }
    setTimeout(() => setSuccessMsg(''), 5000);
  }

  async function runBulk(
    label: string,
    fn: () => Promise<{ success: boolean; error?: string }>
  ) {
    setBulkRunning(label);
    setError('');
    const r = await fn();
    setBulkRunning(null);
    if (r.success) {
      setSuccessMsg(`${label} finished`);
      await loadLoans();
    } else {
      setError(r.error || `${label} failed`);
    }
    setTimeout(() => setSuccessMsg(''), 5000);
  }

  const env = envInfo?.settings.vesta_environment || 'dev';
  const isDev = env === 'dev';
  const activeEnvStatus = isDev ? envInfo?.envStatus?.dev : envInfo?.envStatus?.production;

  async function handleSwitchEnvironment() {
    const newEnv = isDev ? 'production' : 'dev';

    if (newEnv === 'production') {
      const confirmed = window.confirm(
        'Switch to PRODUCTION? All Vesta API calls will use the live UFF environment.'
      );
      if (!confirmed) return;
    }

    setSwitchingEnv(true);
    setError('');
    const result = await updateVestaEnvironment(password, newEnv);
    if (result.success) {
      const settings = await getAdminSettings(password);
      if (settings) setEnvInfo(settings);
      setSuccessMsg(
        `Now using ${newEnv === 'dev' ? 'Development (beta)' : 'Production'}`
      );
      setTimeout(() => setSuccessMsg(''), 5000);
    } else {
      setError(result.error || 'Failed to switch environment');
    }
    setSwitchingEnv(false);
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold text-white tracking-tight">
              Vesta loan push
            </h1>
            <p className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="flex items-center gap-1.5">
                <span
                  className={`inline-block h-2 w-2 rounded-full ${isDev ? 'bg-amber-400' : 'bg-emerald-400'}`}
                />
                <span className={isDev ? 'text-amber-400' : 'text-emerald-400'}>
                  {isDev ? 'Development (beta)' : 'Production'}
                </span>
              </span>
              {activeEnvStatus && (
                <span className="text-slate-600">
                  · API key {activeEnvStatus.hasApiKey ? 'set' : 'missing'}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void handleSwitchEnvironment()}
              disabled={switchingEnv}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                isDev
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-amber-600 hover:bg-amber-500 text-white'
              }`}
            >
              {switchingEnv ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowRightLeft className="w-4 h-4" />
              )}
              {isDev ? 'Switch to Production' : 'Switch to Development'}
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-white px-3 py-2 rounded-lg hover:bg-slate-800/80"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 flex gap-3">
            <XCircle className="w-5 h-5 text-red-400 shrink-0" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}
        {successMsg && (
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 flex gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <p className="text-sm text-emerald-300">{successMsg}</p>
          </div>
        )}

        <section className="rounded-2xl border border-slate-800 bg-slate-900/50 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center">
                <Layers className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h2 className="font-semibold text-white">Submitted loans</h2>
                <p className="text-sm text-slate-500">
                  Push one loan or run bulk sync for the queue
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-950/60 p-0.5">
                <Filter className="w-3.5 h-3.5 text-slate-500 ml-2" />
                {(
                  [
                    ['needs_sync', 'Needs Vesta'],
                    ['all', 'All'],
                    ['synced', 'Synced'],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFilter(value)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      filter === value
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => void loadLoans()}
                disabled={loading}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-slate-700 text-slate-200 hover:bg-slate-800 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                type="button"
                disabled={!!bulkRunning}
                onClick={() =>
                  void runBulk('Backfill', () => backfillVestaJobs(password))
                }
                className="px-3 py-2 text-sm rounded-lg border border-slate-700 text-slate-200 hover:bg-slate-800 disabled:opacity-50"
              >
                {bulkRunning === 'Backfill' ? (
                  <Loader2 className="w-4 h-4 animate-spin inline" />
                ) : null}{' '}
                Backfill
              </button>
              <button
                type="button"
                disabled={!!bulkRunning}
                onClick={() =>
                  void runBulk('Drain queue', () => drainVestaSyncQueue(password))
                }
                className="px-3 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50"
              >
                {bulkRunning === 'Drain queue' ? (
                  <Loader2 className="w-4 h-4 animate-spin inline" />
                ) : null}{' '}
                Drain queue
              </button>
              <button
                type="button"
                disabled={!!bulkRunning}
                onClick={() =>
                  void runBulk('Full sync', () => runVestaSyncCron(password))
                }
                className="px-3 py-2 text-sm rounded-lg bg-emerald-700 text-white hover:bg-emerald-600 disabled:opacity-50"
              >
                {bulkRunning === 'Full sync' ? (
                  <Loader2 className="w-4 h-4 animate-spin inline" />
                ) : null}{' '}
                Full sync
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs text-slate-500 uppercase bg-slate-900/80">
                  <th className="px-4 py-3 font-medium">Borrower</th>
                  <th className="px-4 py-3 font-medium">Reference</th>
                  <th className="px-4 py-3 font-medium">Loan</th>
                  <th className="px-4 py-3 font-medium">Sync</th>
                  <th className="px-4 py-3 font-medium">Vesta ID</th>
                  <th className="px-4 py-3 font-medium min-w-[160px]">Last error</th>
                  <th className="px-4 py-3 font-medium w-36">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-16 text-center text-slate-500">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-400" />
                      Loading loans…
                    </td>
                  </tr>
                ) : loans.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-16 text-center text-slate-500">
                      No loans match this filter.
                    </td>
                  </tr>
                ) : (
                  loans.map((loan) => (
                    <tr key={loan.id} className="hover:bg-slate-800/30">
                      <td className="px-4 py-3 align-top">
                        <p className="font-medium text-slate-200">
                          {loan.borrowerName || '—'}
                        </p>
                        <p className="text-xs text-slate-500 truncate max-w-[200px]">
                          {loan.borrowerEmail || ''}
                        </p>
                      </td>
                      <td className="px-4 py-3 align-top font-mono text-xs text-slate-400">
                        {loan.tempLoanNumber || loan.id.slice(0, 8) + '…'}
                      </td>
                      <td className="px-4 py-3 align-top text-slate-400 text-xs">
                        <p>
                          {[loan.loanPurpose, loan.loanType].filter(Boolean).join(' · ') ||
                            '—'}
                        </p>
                        {loan.loanAmount != null && (
                          <p className="mt-0.5 tabular-nums">
                            ${Number(loan.loanAmount).toLocaleString()}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <SyncBadge status={loan.vestaSyncStatus} jobStatus={loan.jobStatus} />
                      </td>
                      <td className="px-4 py-3 align-top font-mono text-xs text-emerald-400/90 break-all max-w-[120px]">
                        {loan.vestaLoanId || '—'}
                      </td>
                      <td className="px-4 py-3 align-top text-xs text-red-300/80 max-w-[200px] break-words">
                        {loan.jobLastError ? (
                          <span title={loan.jobLastError}>
                            {loan.jobLastError.slice(0, 120)}
                            {loan.jobLastError.length > 120 ? '…' : ''}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex flex-col gap-1.5">
                          {!loan.vestaLoanId && (
                            <button
                              type="button"
                              disabled={pushingId === loan.id || deletingId === loan.id}
                              onClick={() => void handlePush(loan.id)}
                              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50"
                            >
                              {pushingId === loan.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Upload className="w-3.5 h-3.5" />
                              )}
                              Push
                            </button>
                          )}
                          <button
                            type="button"
                            disabled={deletingId === loan.id || pushingId === loan.id}
                            onClick={() => void handleDelete(loan)}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-red-500/30 text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                          >
                            {deletingId === loan.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!envInfo?.envStatus?.[env === 'production' ? 'production' : 'dev']?.hasApiKey && (
            <div className="mx-5 mb-5 mt-4 rounded-xl bg-amber-500/10 border border-amber-500/25 px-4 py-3 flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              <p className="text-sm text-amber-200/90">
                Vesta API key for the active environment is not set on Supabase Edge
                Functions. Pushes will fail until{' '}
                <code className="text-amber-100">
                  {env === 'production' ? 'VESTA_PROD_API_KEY' : 'VESTA_DEV_API_KEY'}
                </code>{' '}
                is configured.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function SyncBadge({
  status,
  jobStatus,
}: {
  status: string | null;
  jobStatus: string | null;
}) {
  const display = status || jobStatus || 'unknown';
  const styles: Record<string, string> = {
    synced: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
    queued: 'bg-sky-500/15 text-sky-300 border-sky-500/25',
    failed: 'bg-red-500/15 text-red-300 border-red-500/25',
    pending: 'bg-sky-500/15 text-sky-300 border-sky-500/25',
    processing: 'bg-violet-500/15 text-violet-300 border-violet-500/25',
    succeeded: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
  };
  const cls =
    styles[display] || 'bg-slate-700/50 text-slate-400 border-slate-600/40';
  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium border ${cls}`}
    >
      {display}
    </span>
  );
}
