import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Filter } from 'lucide-react';
import { listCampaigns, type MarketingCampaign } from '../../../services/marketingService';
import MarketingErrorBanner from './MarketingErrorBanner';

interface Props {
  password: string;
}

const STATUSES = [
  '',
  'draft',
  'pending_approval',
  'approved',
  'scheduled',
  'sent',
  'failed',
  'cancelled',
];

export default function CampaignList({ password }: Props) {
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { campaigns: list, error: loadError } = await listCampaigns(
        password,
        statusFilter ? { status: statusFilter } : {}
      );
      if (loadError) setError(loadError);
      setCampaigns(list);
    } catch {
      setError('Failed to load campaigns.');
    } finally {
      setLoading(false);
    }
  }, [password, statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-semibold">Campaigns</h2>
        <label className="flex items-center gap-2 text-sm text-slate-400">
          <Filter className="h-4 w-4" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1"
          >
            {STATUSES.map((s) => (
              <option key={s || 'all'} value={s}>
                {s ? s.replace(/_/g, ' ') : 'All statuses'}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && <div className="mt-4"><MarketingErrorBanner message={error} /></div>}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500">
                <th className="pb-3 pr-4">Title</th>
                <th className="pb-3 pr-4">Type</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3 pr-4">Risk</th>
                <th className="pb-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.id} className="border-b border-slate-800/50 hover:bg-slate-900/50">
                  <td className="py-3 pr-4">
                    <Link
                      to={`/admin/marketing/campaigns/${c.id}`}
                      className="font-medium text-indigo-300 hover:underline"
                    >
                      {c.title ?? 'Untitled'}
                    </Link>
                  </td>
                  <td className="py-3 pr-4 text-slate-400">{c.campaign_type.replace(/_/g, ' ')}</td>
                  <td className="py-3 pr-4 capitalize">{c.status.replace(/_/g, ' ')}</td>
                  <td className="py-3 pr-4">
                    {c.compliance_risk_score != null
                      ? `${(c.compliance_risk_score * 100).toFixed(0)}%`
                      : '—'}
                  </td>
                  <td className="py-3 text-slate-500">{new Date(c.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {campaigns.length === 0 && (
            <p className="py-8 text-center text-slate-500">No campaigns match this filter.</p>
          )}
        </div>
      )}
    </div>
  );
}
