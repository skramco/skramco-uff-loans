import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, RefreshCw } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { getMetrics, listCampaigns, type MarketingMetric, type MarketingCampaign } from '../../../services/marketingService';
import MarketingErrorBanner from './MarketingErrorBanner';

interface Props {
  password: string;
}

export default function MetricsDashboard({ password }: Props) {
  const [metrics, setMetrics] = useState<MarketingMetric[]>([]);
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const [metricsResult, campaignsResult] = await Promise.all([
      getMetrics(password),
      listCampaigns(password, { status: 'sent' }),
    ]);
    if (metricsResult.error) setError(metricsResult.error);
    else if (campaignsResult.error) setError(campaignsResult.error);
    setMetrics(metricsResult.metrics);
    setCampaigns(campaignsResult.campaigns);
    setLoading(false);
  }, [password]);

  useEffect(() => {
    void load();
  }, [load]);

  const chartData = metrics
    .filter((m) => m.source === 'activecampaign')
    .slice(0, 10)
    .map((m) => {
      const campaign = campaigns.find((c) => c.id === m.campaign_id);
      return {
        name: (campaign?.email_subject ?? m.campaign_id.slice(0, 8)).slice(0, 24),
        opens: m.opens,
        clicks: m.clicks,
        sends: m.sends,
        openRate: m.sends > 0 ? Math.round((m.opens / m.sends) * 100) : 0,
      };
    });

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Campaign metrics</h2>
        <button
          type="button"
          onClick={() => void load()}
          className="flex items-center gap-1 rounded-lg border border-slate-700 px-3 py-1.5 text-sm hover:bg-slate-900"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {error && <MarketingErrorBanner message={error} />}

      {chartData.length > 0 ? (
        <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
          <h3 className="mb-4 font-medium text-slate-400">Opens &amp; clicks (ActiveCampaign)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: '1px solid #334155' }}
                  labelStyle={{ color: '#e2e8f0' }}
                />
                <Bar dataKey="opens" fill="#6366f1" name="Opens" />
                <Bar dataKey="clicks" fill="#22c55e" name="Clicks" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      ) : (
        <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-center text-slate-500">
          No metrics yet. Send campaigns and sync metrics from the campaign detail page.
        </section>
      )}

      <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
        <h3 className="font-medium">Metrics history</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500">
                <th className="pb-2 pr-4">Campaign</th>
                <th className="pb-2 pr-4">Source</th>
                <th className="pb-2 pr-4">Sends</th>
                <th className="pb-2 pr-4">Opens</th>
                <th className="pb-2 pr-4">Clicks</th>
                <th className="pb-2">Captured</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((m) => {
                const campaign = campaigns.find((c) => c.id === m.campaign_id);
                return (
                  <tr key={m.id} className="border-b border-slate-800/50">
                    <td className="py-2 pr-4">
                      <Link
                        to={`/admin/marketing/campaigns/${m.campaign_id}`}
                        className="text-indigo-300 hover:underline"
                      >
                        {campaign?.title ?? m.campaign_id.slice(0, 8)}
                      </Link>
                    </td>
                    <td className="py-2 pr-4 capitalize">{m.source}</td>
                    <td className="py-2 pr-4">{m.sends}</td>
                    <td className="py-2 pr-4">{m.opens}</td>
                    <td className="py-2 pr-4">{m.clicks}</td>
                    <td className="py-2 text-slate-500">{new Date(m.captured_at).toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {metrics.length === 0 && (
            <p className="py-4 text-center text-slate-500">No metric snapshots stored yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
