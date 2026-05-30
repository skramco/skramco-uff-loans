import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Sparkles, ArrowRight, AlertTriangle } from 'lucide-react';
import {
  generateCampaign,
  generateBrokerGrowthTip,
  listCampaigns,
  getMarketingSettings,
  CAMPAIGN_TYPE_OPTIONS,
  type MarketingCampaign,
} from '../../../services/marketingService';
import MarketingErrorBanner from './MarketingErrorBanner';

interface Props {
  password: string;
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    draft: 'bg-slate-700 text-slate-200',
    pending_approval: 'bg-amber-900/50 text-amber-200',
    approved: 'bg-emerald-900/50 text-emerald-200',
    scheduled: 'bg-indigo-900/50 text-indigo-200',
    sent: 'bg-emerald-800 text-emerald-100',
    failed: 'bg-red-900/50 text-red-200',
    cancelled: 'bg-slate-800 text-slate-400',
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs ${colors[status] ?? colors.draft}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

export default function MarketingDashboard({ password }: Props) {
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [campaignType, setCampaignType] = useState('daily_rate_update');
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [integrationStatus, setIntegrationStatus] = useState<Record<string, unknown>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [listResult, settings] = await Promise.all([
        listCampaigns(password, {}),
        getMarketingSettings(password),
      ]);
      if (listResult.error) setLoadError(listResult.error);
      setCampaigns(listResult.campaigns.slice(0, 8));
      if (settings?.integrationStatus) setIntegrationStatus(settings.integrationStatus);
      if (settings?.error && !listResult.error) setLoadError(settings.error);
    } catch {
      setLoadError('Failed to connect to marketing API.');
    } finally {
      setLoading(false);
    }
  }, [password]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleGenerate() {
    setGenerating(true);
    setError('');
    const result =
      campaignType === 'broker_business_growth_tip'
        ? await generateBrokerGrowthTip(password)
        : await generateCampaign(password, campaignType);
    setGenerating(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.campaign) {
      window.location.href = `/admin/marketing/campaigns/${result.campaign.id}`;
    }
  }

  const pending = campaigns.filter((c) => c.status === 'pending_approval').length;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="text-xl font-semibold">Marketing Overview</h2>
        <p className="mt-1 text-sm text-slate-400">
          Generate, preview, approve, and send broker-facing campaigns via ActiveCampaign.
        </p>

        {loadError && (
          <div className="mt-4">
            <MarketingErrorBanner message={loadError} />
          </div>
        )}

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <StatCard label="Recent campaigns" value={String(campaigns.length)} />
          <StatCard label="Pending approval" value={String(pending)} accent="amber" />
          <StatCard
            label="Integrations"
            value={
              [integrationStatus.openai, integrationStatus.activecampaign].filter(Boolean).length +
              '/4'
            }
          />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
        <h3 className="flex items-center gap-2 font-semibold">
          <Sparkles className="h-5 w-5 text-indigo-400" />
          Generate campaign now
        </h3>
        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-800 bg-red-950/50 p-3 text-sm text-red-200">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-sm">
            Campaign type
            <select
              value={campaignType}
              onChange={(e) => setCampaignType(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
            >
              {CAMPAIGN_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => void handleGenerate()}
            disabled={generating}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium hover:bg-indigo-500 disabled:opacity-50"
          >
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {campaignType === 'broker_business_growth_tip' ? 'Generate growth tip' : 'Generate'}
          </button>
        </div>
        {campaignType === 'broker_business_growth_tip' && (
          <p className="mt-3 max-w-2xl text-sm text-slate-400">
            AI researches one innovative broker business-development strategy, then builds a
            full campaign with email, image, and LinkedIn post. Run again anytime for a new tip.
            {generating && (
              <span className="mt-1 block text-xs text-slate-500">
                Usually takes under a minute — researching, writing, and generating the image…
              </span>
            )}
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Recent campaigns</h3>
          <Link to="/admin/marketing/campaigns" className="flex items-center gap-1 text-sm text-indigo-400 hover:underline">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
          </div>
        ) : campaigns.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">No campaigns yet. Generate your first campaign above.</p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-800">
            {campaigns.map((c) => (
              <li key={c.id} className="flex items-center justify-between py-3">
                <div>
                  <Link
                    to={`/admin/marketing/campaigns/${c.id}`}
                    className="font-medium text-slate-200 hover:text-indigo-300"
                  >
                    {c.title ?? c.campaign_type}
                  </Link>
                  <p className="text-xs text-slate-500">{new Date(c.created_at).toLocaleString()}</p>
                </div>
                <StatusBadge status={c.status} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: 'amber' | 'emerald';
}) {
  const accentClass =
    accent === 'amber' ? 'text-amber-300' : accent === 'emerald' ? 'text-emerald-300' : 'text-slate-100';
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${accentClass}`}>{value}</p>
    </div>
  );
}
