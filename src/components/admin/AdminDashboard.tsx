import { useState, useEffect, useCallback } from 'react';
import {
  Settings,
  Server,
  ArrowRightLeft,
  LogOut,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  XCircle,
  RefreshCw,
  Layers,
  ChevronDown,
  Inbox,
} from 'lucide-react';
import {
  getAdminSettings,
  updateVestaEnvironment,
  getVestaReconciliation,
  retryVestaSyncJob,
  drainVestaSyncQueue,
  type AdminSettingsResponse,
  type VestaReconciliationResponse,
  type VestaSyncJobRow,
} from '../../services/adminService';

type TabId = 'sync' | 'environment';

interface Props {
  password: string;
  onLogout: () => void;
}

export default function AdminDashboard({ password, onLogout }: Props) {
  const [tab, setTab] = useState<TabId>('sync');
  const [data, setData] = useState<AdminSettingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [vestaRec, setVestaRec] = useState<VestaReconciliationResponse | null>(null);
  const [recError, setRecError] = useState('');
  const [recLoading, setRecLoading] = useState(false);
  const [draining, setDraining] = useState(false);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const loadSyncOnly = useCallback(async () => {
    setRecLoading(true);
    setRecError('');
    const rec = await getVestaReconciliation(password);
    if (rec) {
      setVestaRec(rec);
      setRecError('');
    } else {
      setVestaRec(null);
      setRecError(
        'Could not load sync data. Redeploy the admin-settings Edge Function, or sign out and sign in again.'
      );
    }
    setRecLoading(false);
  }, [password]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError('');
    const [settingsResult, recResult] = await Promise.all([
      getAdminSettings(password),
      getVestaReconciliation(password),
    ]);

    if (settingsResult) setData(settingsResult);
    else setError('Failed to load settings. Sign out and try again.');

    if (recResult) {
      setVestaRec(recResult);
      setRecError('');
    } else {
      setVestaRec(null);
      setRecError(
        'Could not load sync metrics. Deploy admin-settings with getVestaReconciliation, or check your admin password.'
      );
    }
    setLoading(false);
  }, [password]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  async function handleSwitch() {
    if (!data) return;
    const newEnv =
      data.settings.vesta_environment === 'dev' ? 'production' : 'dev';

    if (newEnv === 'production') {
      const confirmed = window.confirm(
        'Switch to PRODUCTION? All borrower Vesta calls will use the live API.'
      );
      if (!confirmed) return;
    }

    setSwitching(true);
    setError('');
    setSuccessMsg('');

    const result = await updateVestaEnvironment(password, newEnv);
    if (result.success) {
      setSuccessMsg(
        `Active environment: ${newEnv === 'dev' ? 'Development' : 'Production'}`
      );
      await Promise.all([
        (async () => {
          const s = await getAdminSettings(password);
          if (s) setData(s);
        })(),
        loadSyncOnly(),
      ]);
    } else {
      setError(result.error || 'Failed to update environment');
    }
    setSwitching(false);
    setTimeout(() => setSuccessMsg(''), 5000);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
        <p className="text-sm text-slate-500">Loading admin…</p>
      </div>
    );
  }

  const env = data?.settings.vesta_environment || 'dev';
  const isDev = env === 'dev';
  const devStatus = data?.envStatus?.dev;
  const prodStatus = data?.envStatus?.production;

  const pending = vestaRec?.counts.pendingJobs ?? 0;
  const failed = vestaRec?.counts.failedJobs ?? 0;
  const needsAttention = pending + failed + (vestaRec?.counts.submittedMissingVesta ?? 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/15 border border-indigo-500/25">
              <Settings className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white tracking-tight">
                Admin
              </h1>
              <p className="text-xs text-slate-500">
                Vesta sync queue &amp; API environment
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-slate-800/80"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>

        <nav className="max-w-6xl mx-auto px-4 sm:px-6 flex gap-1 border-t border-slate-800/60">
          {(
            [
              { id: 'sync' as const, label: 'Vesta sync queue', icon: Inbox },
              { id: 'environment' as const, label: 'API environment', icon: Server },
            ] as const
          ).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === id
                  ? 'border-indigo-500 text-white'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              <Icon className="w-4 h-4 opacity-80" />
              {label}
              {id === 'sync' && needsAttention > 0 && (
                <span className="ml-1 min-w-[1.25rem] h-5 px-1.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold flex items-center justify-center">
                  {needsAttention > 99 ? '99+' : needsAttention}
                </span>
              )}
            </button>
          ))}
        </nav>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-sm text-red-300">{error}</p>
              <button
                type="button"
                onClick={() => {
                  setError('');
                  void loadAll();
                }}
                className="text-xs text-red-400/90 underline mt-2 hover:text-red-300"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {successMsg && (
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <p className="text-sm text-emerald-300">{successMsg}</p>
          </div>
        )}

        {tab === 'sync' && (
          <section className="rounded-2xl border border-slate-800 bg-slate-900/50 overflow-hidden shadow-xl shadow-black/20">
            <div className="px-5 sm:px-6 py-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 border border-sky-500/20">
                  <Layers className="w-5 h-5 text-sky-400" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-white">
                    Outbox &amp; worker
                  </h2>
                  <p className="text-sm text-slate-500 mt-0.5 max-w-xl">
                    Jobs created when borrowers submit applications. Use{' '}
                    <strong className="text-slate-400 font-medium">Drain</strong>{' '}
                    to process pending rows if the browser worker did not run.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => void loadSyncOnly()}
                  disabled={recLoading}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700/80 hover:border-slate-600 disabled:opacity-50"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${recLoading ? 'animate-spin' : ''}`}
                  />
                  Refresh
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setDraining(true);
                    setError('');
                    const r = await drainVestaSyncQueue(password);
                    setDraining(false);
                    if (r.success) {
                      setSuccessMsg(
                        `Processed ${r.drained ?? 0} loan queue(s). Check results below.`
                      );
                      await loadSyncOnly();
                    } else {
                      setError(r.error || 'Drain failed');
                    }
                    setTimeout(() => setSuccessMsg(''), 6000);
                  }}
                  disabled={draining}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 shadow-lg shadow-indigo-950/40"
                >
                  {draining ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : null}
                  Drain pending queue
                </button>
              </div>
            </div>

            <div className="p-5 sm:p-6 space-y-6">
              {recError && (
                <div className="rounded-xl bg-amber-500/10 border border-amber-500/25 px-4 py-3 flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-200/90">
                    <p className="font-medium text-amber-100">Sync panel unavailable</p>
                    <p className="mt-1 text-amber-200/80">{recError}</p>
                  </div>
                </div>
              )}

              {vestaRec && !recError && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <StatCard
                    label="Submitted, no Vesta ID"
                    value={vestaRec.counts.submittedMissingVesta}
                    tone="amber"
                    hint="Loans marked submitted but vesta_loan_id empty"
                  />
                  <StatCard
                    label="Pending jobs"
                    value={vestaRec.counts.pendingJobs}
                    tone="sky"
                    hint="Waiting for worker"
                  />
                  <StatCard
                    label="Failed jobs"
                    value={vestaRec.counts.failedJobs}
                    tone="red"
                    hint="Vesta error or misconfiguration"
                  />
                  <StatCard
                    label="Succeeded"
                    value={vestaRec.counts.succeededJobs}
                    tone="emerald"
                    hint="Completed sync jobs (historical)"
                  />
                </div>
              )}

              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Recent jobs
                </h3>
                <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950/40">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-800 text-xs text-slate-500 uppercase tracking-wide bg-slate-900/80">
                          <th className="px-4 py-3 font-medium">Status</th>
                          <th className="px-4 py-3 font-medium">Loan</th>
                          <th className="px-4 py-3 font-medium">Tries</th>
                          <th className="px-4 py-3 font-medium">Map</th>
                          <th className="px-4 py-3 font-medium">Vesta ID</th>
                          <th className="px-4 py-3 font-medium min-w-[180px]">
                            Error
                          </th>
                          <th className="px-4 py-3 font-medium w-24">Action</th>
                        </tr>
                      </thead>
                      <tbody className="text-slate-300 divide-y divide-slate-800/80">
                        {(vestaRec?.recentJobs || []).map((j) => (
                          <JobRow
                            key={j.id}
                            job={j}
                            retryingId={retryingId}
                            onRetry={async () => {
                              setRetryingId(j.id);
                              const r = await retryVestaSyncJob(password, j.id);
                              setRetryingId(null);
                              if (r.success) {
                                setSuccessMsg('Job queued again (pending)');
                                await loadSyncOnly();
                              } else {
                                setError(r.error || 'Retry failed');
                              }
                              setTimeout(() => setSuccessMsg(''), 4000);
                            }}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {vestaRec && vestaRec.recentJobs.length === 0 && (
                    <p className="py-10 text-center text-sm text-slate-500">
                      No sync jobs yet. Submit an application from /apply to create
                      the first outbox row.
                    </p>
                  )}
                  {!vestaRec && !recError && (
                    <p className="py-10 text-center text-sm text-slate-500">
                      Loading job list…
                    </p>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {tab === 'environment' && (
          <section className="rounded-2xl border border-slate-800 bg-slate-900/50 overflow-hidden shadow-xl shadow-black/20">
            <div className="px-5 sm:px-6 py-5 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <Server className="w-5 h-5 text-slate-400" />
                <div>
                  <h2 className="text-base font-semibold text-white">
                    Vesta API environment
                  </h2>
                  <p className="text-sm text-slate-500 mt-0.5">
                    Which Vesta base URL and keys the portal uses
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-6 space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-2">
                    Currently active
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="relative flex h-3 w-3">
                      <span
                        className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-40 ${isDev ? 'bg-amber-400' : 'bg-emerald-400'}`}
                      />
                      <span
                        className={`relative inline-flex rounded-full h-3 w-3 ${isDev ? 'bg-amber-400' : 'bg-emerald-400'}`}
                      />
                    </span>
                    <span className="text-xl font-bold text-white">
                      {isDev ? 'Development (Beta)' : 'Production'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSwitch}
                  disabled={switching}
                  className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                    isDev
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/30'
                      : 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-950/30'
                  } disabled:opacity-50`}
                >
                  {switching ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ArrowRightLeft className="w-4 h-4" />
                  )}
                  Switch to {isDev ? 'Production' : 'Development'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <EnvironmentCard
                  label="Development (Beta)"
                  active={isDev}
                  color="amber"
                  status={devStatus}
                />
                <EnvironmentCard
                  label="Production"
                  active={!isDev}
                  color="emerald"
                  status={prodStatus}
                />
              </div>

              <details className="group rounded-xl border border-slate-800 bg-slate-950/50">
                <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-medium text-slate-400 hover:text-slate-200">
                  <span>Supabase secret names (reference)</span>
                  <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180 text-slate-500" />
                </summary>
                <div className="px-4 pb-4 pt-0 border-t border-slate-800/80">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-4">
                    <div>
                      <p className="text-slate-500 mb-2">Development</p>
                      <code className="block text-slate-300 font-mono bg-slate-900 px-2 py-1 rounded">
                        VESTA_DEV_API_KEY
                      </code>
                      <code className="block text-slate-300 font-mono bg-slate-900 px-2 py-1 rounded mt-1">
                        VESTA_DEV_API_VERSION
                      </code>
                    </div>
                    <div>
                      <p className="text-slate-500 mb-2">Production</p>
                      <code className="block text-slate-300 font-mono bg-slate-900 px-2 py-1 rounded">
                        VESTA_PROD_API_KEY
                      </code>
                      <code className="block text-slate-300 font-mono bg-slate-900 px-2 py-1 rounded mt-1">
                        VESTA_PROD_API_VERSION
                      </code>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 mt-3">
                    Legacy: VESTA_API_KEY / VESTA_API_VERSION fall back for dev only.
                  </p>
                </div>
              </details>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
  hint,
}: {
  label: string;
  value: number;
  tone: 'amber' | 'sky' | 'red' | 'emerald';
  hint: string;
}) {
  const tones = {
    amber: 'border-amber-500/20 bg-amber-500/[0.06] text-amber-200',
    sky: 'border-sky-500/20 bg-sky-500/[0.06] text-sky-200',
    red: 'border-red-500/20 bg-red-500/[0.06] text-red-200',
    emerald: 'border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-200',
  };
  const valueClass = {
    amber: 'text-amber-300',
    sky: 'text-sky-300',
    red: 'text-red-300',
    emerald: 'text-emerald-300',
  }[tone];

  return (
    <div
      className={`rounded-xl border p-4 ${tones[tone]}`}
      title={hint}
    >
      <p className={`text-3xl font-bold tabular-nums ${valueClass}`}>{value}</p>
      <p className="text-xs text-slate-400 mt-2 leading-snug">{label}</p>
    </div>
  );
}

function JobStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-sky-500/15 text-sky-300 border-sky-500/25',
    processing: 'bg-violet-500/15 text-violet-300 border-violet-500/25',
    succeeded: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
    failed: 'bg-red-500/15 text-red-300 border-red-500/25',
    dead_letter: 'bg-slate-600/30 text-slate-400 border-slate-600/40',
  };
  const cls = styles[status] || 'bg-slate-700/50 text-slate-400 border-slate-600/40';
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${cls}`}
    >
      {status}
    </span>
  );
}

function JobRow({
  job,
  retryingId,
  onRetry,
}: {
  job: VestaSyncJobRow;
  retryingId: string | null;
  onRetry: () => void;
}) {
  return (
    <tr className="hover:bg-slate-800/30">
      <td className="px-4 py-3 align-top">
        <JobStatusBadge status={job.status} />
      </td>
      <td className="px-4 py-3 align-top font-mono text-xs text-slate-400">
        {job.loan_id.slice(0, 8)}…
      </td>
      <td className="px-4 py-3 align-top tabular-nums">{job.attempt_count}</td>
      <td className="px-4 py-3 align-top text-slate-400">{job.mapping_version}</td>
      <td className="px-4 py-3 align-top font-mono text-xs text-slate-400 break-all max-w-[140px]">
        {job.vesta_loan_id || '—'}
      </td>
      <td className="px-4 py-3 align-top text-xs text-red-300/90 max-w-[240px] break-words">
        {job.last_error || '—'}
      </td>
      <td className="px-4 py-3 align-top">
        {job.status === 'failed' ? (
          <button
            type="button"
            disabled={retryingId === job.id}
            onClick={onRetry}
            className="text-sm font-medium text-indigo-400 hover:text-indigo-300 disabled:opacity-50"
          >
            {retryingId === job.id ? '…' : 'Retry'}
          </button>
        ) : (
          <span className="text-slate-600">—</span>
        )}
      </td>
    </tr>
  );
}

function EnvironmentCard({
  label,
  active,
  color,
  status,
}: {
  label: string;
  active: boolean;
  color: 'amber' | 'emerald';
  status?: { apiUrl: string; hasApiKey: boolean; apiVersion: string };
}) {
  const borderClass = active
    ? color === 'amber'
      ? 'border-amber-500/30 bg-amber-500/[0.04]'
      : 'border-emerald-500/30 bg-emerald-500/[0.04]'
    : 'border-slate-800 bg-slate-950/40';

  const dotClass = active
    ? color === 'amber'
      ? 'bg-amber-400'
      : 'bg-emerald-400'
    : 'bg-slate-600';

  const badgeBg =
    color === 'amber'
      ? 'bg-amber-500/20 text-amber-400'
      : 'bg-emerald-500/20 text-emerald-400';

  return (
    <div className={`rounded-xl border p-5 transition-all ${borderClass}`}>
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-2 h-2 rounded-full ${dotClass}`} />
        <h3 className="text-sm font-semibold text-white">{label}</h3>
        {active && (
          <span
            className={`text-xs px-2 py-0.5 rounded-full ml-auto ${badgeBg}`}
          >
            Active
          </span>
        )}
      </div>
      <div className="space-y-3 text-xs">
        <div>
          <span className="text-slate-500">URL</span>
          <p className="text-slate-300 font-mono mt-1 break-all leading-relaxed">
            {status?.apiUrl}
          </p>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-slate-500">API key</span>
          <span
            className={`flex items-center gap-1.5 shrink-0 ${status?.hasApiKey ? 'text-emerald-400' : 'text-red-400'}`}
          >
            {status?.hasApiKey ? (
              <CheckCircle2 className="w-3.5 h-3.5" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5" />
            )}
            {status?.hasApiKey ? 'Set' : 'Missing'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-500">API version</span>
          <span className="text-slate-300 font-mono">{status?.apiVersion}</span>
        </div>
      </div>
    </div>
  );
}
