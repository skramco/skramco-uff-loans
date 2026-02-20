import { useState, useEffect } from 'react';
import {
  Settings,
  Server,
  ArrowRightLeft,
  LogOut,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  XCircle,
} from 'lucide-react';
import {
  getAdminSettings,
  updateVestaEnvironment,
  type AdminSettingsResponse,
} from '../../services/adminService';

interface Props {
  password: string;
  onLogout: () => void;
}

export default function AdminDashboard({ password, onLogout }: Props) {
  const [data, setData] = useState<AdminSettingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    const result = await getAdminSettings(password);
    if (result) {
      setData(result);
    } else {
      setError('Failed to load settings. Your session may have expired.');
    }
    setLoading(false);
  }

  async function handleSwitch() {
    if (!data) return;
    const newEnv =
      data.settings.vesta_environment === 'dev' ? 'production' : 'dev';

    if (newEnv === 'production') {
      const confirmed = window.confirm(
        'You are about to switch to PRODUCTION. All borrower portal requests will go to the live Vesta API. Continue?'
      );
      if (!confirmed) return;
    }

    setSwitching(true);
    setError('');
    setSuccessMsg('');

    const result = await updateVestaEnvironment(password, newEnv);
    if (result.success) {
      setSuccessMsg(
        `Switched to ${newEnv === 'dev' ? 'Development' : 'Production'}`
      );
      await loadSettings();
    } else {
      setError(result.error || 'Failed to update environment');
    }
    setSwitching(false);
    setTimeout(() => setSuccessMsg(''), 4000);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
      </div>
    );
  }

  const env = data?.settings.vesta_environment || 'dev';
  const isDev = env === 'dev';
  const devStatus = data?.envStatus?.dev;
  const prodStatus = data?.envStatus?.production;

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-slate-400" />
            <h1 className="text-lg font-semibold text-white">Admin Panel</h1>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-400">{error}</p>
              <button
                onClick={() => {
                  setError('');
                  loadSettings();
                }}
                className="text-xs text-red-300 underline mt-1 hover:text-red-200"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 flex items-center gap-3 animate-fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <p className="text-sm text-emerald-400">{successMsg}</p>
          </div>
        )}

        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-700">
            <div className="flex items-center gap-3">
              <Server className="w-5 h-5 text-slate-400" />
              <h2 className="text-base font-semibold text-white">
                Vesta API Environment
              </h2>
            </div>
            <p className="text-sm text-slate-500 mt-1 ml-8">
              Controls which Vesta API all portals connect to
            </p>
          </div>

          <div className="p-6">
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-1.5">
                  Active Environment
                </p>
                <div className="flex items-center gap-2.5">
                  <span
                    className={`relative flex h-3 w-3 ${isDev ? '' : ''}`}
                  >
                    <span
                      className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isDev ? 'bg-amber-400' : 'bg-emerald-400'}`}
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
                onClick={handleSwitch}
                disabled={switching}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all ${
                  isDev
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30'
                    : 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-900/30'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
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

            <div className="mt-6 bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
                Secret Names Reference
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-slate-500 mb-1.5">Development</p>
                  <code className="block text-slate-300 font-mono">
                    VESTA_DEV_API_KEY
                  </code>
                  <code className="block text-slate-300 font-mono mt-1">
                    VESTA_DEV_API_VERSION
                  </code>
                </div>
                <div>
                  <p className="text-slate-500 mb-1.5">Production</p>
                  <code className="block text-slate-300 font-mono">
                    VESTA_PROD_API_KEY
                  </code>
                  <code className="block text-slate-300 font-mono mt-1">
                    VESTA_PROD_API_VERSION
                  </code>
                </div>
              </div>
              <p className="text-xs text-slate-600 mt-3">
                Legacy keys (VESTA_API_KEY, VESTA_API_VERSION) are used as
                fallback for the Development environment only.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
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
      ? 'border-amber-500/30 bg-amber-500/5'
      : 'border-emerald-500/30 bg-emerald-500/5'
    : 'border-slate-700 bg-slate-800/50';

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
    <div className={`rounded-lg border p-4 transition-all ${borderClass}`}>
      <div className="flex items-center gap-2 mb-3">
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
      <div className="space-y-2.5 text-xs">
        <div>
          <span className="text-slate-500">URL</span>
          <p className="text-slate-300 font-mono mt-0.5 break-all">
            {status?.apiUrl}
          </p>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-500">API Key</span>
          <span
            className={`flex items-center gap-1 ${status?.hasApiKey ? 'text-emerald-400' : 'text-red-400'}`}
          >
            {status?.hasApiKey ? (
              <CheckCircle2 className="w-3 h-3" />
            ) : (
              <AlertTriangle className="w-3 h-3" />
            )}
            {status?.hasApiKey ? 'Configured' : 'Not Set'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-500">API Version</span>
          <span className="text-slate-300 font-mono">
            {status?.apiVersion}
          </span>
        </div>
      </div>
    </div>
  );
}
