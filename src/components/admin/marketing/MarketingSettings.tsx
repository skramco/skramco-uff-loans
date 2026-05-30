import { useState, useEffect, useCallback, useMemo } from 'react';
import { Loader2, Save } from 'lucide-react';
import {
  getMarketingSettings,
  updateMarketingSetting,
  CAMPAIGN_TYPE_OPTIONS,
  listActiveCampaignLists,
  ACTIVECAMPAIGN_LIST_PRESETS,
  type ActiveCampaignList,
} from '../../../services/marketingService';
import MarketingErrorBanner from './MarketingErrorBanner';

interface Props {
  password: string;
}

function parseListId(value: unknown): string {
  if (value == null || value === '') return '';
  if (typeof value === 'number' && !Number.isNaN(value)) return String(value);
  if (typeof value === 'string') return value.trim();
  return '';
}

export default function MarketingSettingsPage({ password }: Props) {
  const [settings, setSettings] = useState<Record<string, unknown>>({});
  const [integrationStatus, setIntegrationStatus] = useState<Record<string, unknown>>({});
  const [acLists, setAcLists] = useState<ActiveCampaignList[]>([]);
  const [acConfigured, setAcConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [threshold, setThreshold] = useState('0.6');
  const [linkedinAuto, setLinkedinAuto] = useState(false);
  const [linkedinApproval, setLinkedinApproval] = useState(true);
  const [trustedTypes, setTrustedTypes] = useState<string[]>([]);
  const [defaultListId, setDefaultListId] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');

    const data = await getMarketingSettings(password);
    if (data?.error) setLoadError(data.error);

    if (data) {
      setSettings(data.settings);
      setIntegrationStatus(data.integrationStatus);

      const acConnected = !!data.integrationStatus.activecampaign;
      setAcConfigured(acConnected);

      if (acConnected) {
        const listsResult = await listActiveCampaignLists(password);
        if (listsResult.error) {
          setLoadError((prev) => prev || listsResult.error || '');
        }
        setAcLists(listsResult.lists);
        setAcConfigured(listsResult.configured !== false);
      } else {
        setAcLists([]);
      }

      const t = data.settings.compliance_risk_threshold;
      if (typeof t === 'number') setThreshold(String(t));
      if (typeof data.settings.linkedin_auto_post_enabled === 'boolean') {
        setLinkedinAuto(data.settings.linkedin_auto_post_enabled);
      }
      if (typeof data.settings.linkedin_require_approval === 'boolean') {
        setLinkedinApproval(data.settings.linkedin_require_approval);
      }
      if (Array.isArray(data.settings.auto_send_trusted_types)) {
        setTrustedTypes(data.settings.auto_send_trusted_types as string[]);
      }

      const effectiveId = parseListId(data.integrationStatus.defaultListId);
      const settingsId = parseListId(data.settings.activecampaign_default_list_id);
      setDefaultListId(settingsId || effectiveId || '21');
    }
    setLoading(false);
  }, [password]);

  useEffect(() => {
    void load();
  }, [load]);

  const selectedListName = useMemo(() => {
    const match = acLists.find((l) => l.id === defaultListId);
    if (match) return match.name;
    const preset = ACTIVECAMPAIGN_LIST_PRESETS.find((p) => p.id === defaultListId);
    return preset?.label ?? null;
  }, [acLists, defaultListId]);

  async function handleSave() {
    setSaving(true);
    await Promise.all([
      updateMarketingSetting(password, 'compliance_risk_threshold', parseFloat(threshold) || 0.6),
      updateMarketingSetting(password, 'linkedin_auto_post_enabled', linkedinAuto),
      updateMarketingSetting(password, 'linkedin_require_approval', linkedinApproval),
      updateMarketingSetting(password, 'auto_send_trusted_types', trustedTypes),
      updateMarketingSetting(password, 'activecampaign_default_list_id', defaultListId.trim()),
    ]);
    setSaving(false);
    await load();
  }

  function toggleTrustedType(value: string) {
    setTrustedTypes((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
      </div>
    );
  }

  const envListId = parseListId(integrationStatus.envListId);
  const effectiveListId = parseListId(integrationStatus.defaultListId);

  return (
    <div className="space-y-6">
      {loadError && <MarketingErrorBanner message={loadError} />}

      {!acConfigured && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100/90">
          ActiveCampaign is not connected yet. You can still pick list <strong>21</strong> (marketing) or{' '}
          <strong>34</strong> (testing) below and save. To load lists from ActiveCampaign and send
          campaigns, add these secrets in{' '}
          <a
            href="https://supabase.com/dashboard/project/pvzqgboffydqeqzeiysx/settings/functions"
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-amber-50"
          >
            Supabase → Edge Functions → Secrets
          </a>
          :{' '}
          <code className="text-amber-200">ACTIVECAMPAIGN_API_URL</code>,{' '}
          <code className="text-amber-200">ACTIVECAMPAIGN_API_KEY</code>. Then run{' '}
          <code className="text-amber-200">.\scripts\set-activecampaign-secrets.ps1</code> after{' '}
          <code className="text-amber-200">npx supabase login</code>.
        </div>
      )}

      <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="text-xl font-semibold">Integration status</h2>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          {(
            [
              ['OpenAI', integrationStatus.openai],
              ['OpenAI Images', integrationStatus.openaiImages ?? integrationStatus.openai],
              ['ActiveCampaign', integrationStatus.activecampaign],
              ['Canva', integrationStatus.canva],
              ['LinkedIn auto-post', integrationStatus.linkedin],
            ] as const
          ).map(([label, ok]) => (
            <div key={label} className="flex items-center justify-between rounded-lg border border-slate-800 px-4 py-3">
              <dt className="text-sm text-slate-400">{label}</dt>
              <dd className={`text-sm ${ok ? 'text-emerald-400' : 'text-slate-500'}`}>
                {ok ? 'Connected' : 'Not configured'}
              </dd>
            </div>
          ))}
        </dl>
        {effectiveListId && (
          <p className="mt-4 text-sm text-slate-400">
            Effective send list:{' '}
            <span className="font-medium text-slate-200">
              {selectedListName ? `${selectedListName} (ID ${effectiveListId})` : `ID ${effectiveListId}`}
            </span>
            {envListId && envListId !== effectiveListId && (
              <span className="ml-2 text-xs text-amber-400/90">
                (admin setting overrides env list {envListId})
              </span>
            )}
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="text-xl font-semibold">Approval &amp; safety</h2>
        <div className="mt-4 space-y-4">
          <label className="block text-sm">
            Compliance risk threshold (0–1)
            <input
              type="number"
              min="0"
              max="1"
              step="0.05"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              className="mt-1 block w-full max-w-xs rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
            />
          </label>

          <div className="space-y-2">
            <span className="block text-sm">ActiveCampaign default list</span>
            <p className="text-xs text-slate-500">
              New campaigns and sends use this list. Admin setting takes priority over the{' '}
              <code className="text-slate-400">ACTIVECAMPAIGN_DEFAULT_LIST_ID</code> env var.
            </p>

            <div className="flex flex-wrap gap-2">
              {ACTIVECAMPAIGN_LIST_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setDefaultListId(preset.id)}
                  className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                    defaultListId === preset.id
                      ? 'border-indigo-500 bg-indigo-600/20 text-indigo-200'
                      : 'border-slate-700 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  {preset.label} ({preset.id})
                </button>
              ))}
            </div>

            {acLists.length > 0 ? (
              <label className="block text-sm">
                Or choose from ActiveCampaign
                <select
                  value={defaultListId}
                  onChange={(e) => setDefaultListId(e.target.value)}
                  className="mt-1 block w-full max-w-md rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
                >
                  <option value="">Select a list…</option>
                  {acLists.map((list) => (
                    <option key={list.id} value={list.id}>
                      {list.name} (ID {list.id})
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <label className="block text-sm">
                List ID
                <input
                  type="text"
                  value={defaultListId}
                  onChange={(e) => setDefaultListId(e.target.value)}
                  className="mt-1 block w-full max-w-md rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
                  placeholder="21 = marketing, 34 = testing"
                />
              </label>
            )}
          </div>

          <fieldset>
            <legend className="text-sm text-slate-400">Auto-send trusted campaign types</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {CAMPAIGN_TYPE_OPTIONS.map((o) => (
                <label key={o.value} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={trustedTypes.includes(o.value)}
                    onChange={() => toggleTrustedType(o.value)}
                    className="rounded border-slate-600"
                  />
                  {o.label}
                </label>
              ))}
            </div>
          </fieldset>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={linkedinAuto}
              onChange={(e) => setLinkedinAuto(e.target.checked)}
              className="rounded border-slate-600"
            />
            LinkedIn auto-post enabled
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={linkedinApproval}
              onChange={(e) => setLinkedinApproval(e.target.checked)}
              className="rounded border-slate-600"
            />
            LinkedIn requires approval
          </label>

          <button
            type="button"
            disabled={saving || !defaultListId.trim()}
            onClick={() => void handleSave()}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm hover:bg-indigo-500 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save settings
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
        <h3 className="font-semibold text-slate-400">Raw settings (read-only)</h3>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-slate-950 p-4 text-xs text-slate-500">
          {JSON.stringify(settings, null, 2)}
        </pre>
      </section>
    </div>
  );
}
