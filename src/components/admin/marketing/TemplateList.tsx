import { useState, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { listTemplates, updateTemplate, type MarketingTemplate } from '../../../services/marketingService';
import MarketingErrorBanner from './MarketingErrorBanner';

interface Props {
  password: string;
}

export default function TemplateList({ password }: Props) {
  const [templates, setTemplates] = useState<MarketingTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const { templates: list, error: loadError } = await listTemplates(password);
    if (loadError) setError(loadError);
    setTemplates(list);
    setLoading(false);
  }, [password]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleToggleActive(t: MarketingTemplate) {
    setSaving(t.id);
    await updateTemplate(password, t.id, { active: !t.active });
    setSaving(null);
    await load();
  }

  async function handleSaveCanvaId(t: MarketingTemplate, canvaId: string) {
    setSaving(t.id);
    await updateTemplate(password, t.id, { canva_template_id: canvaId || null });
    setSaving(null);
    await load();
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
      <h2 className="text-xl font-semibold">Campaign templates</h2>
      <p className="mt-1 text-sm text-slate-400">
        Configure prompts, Canva brand template IDs, and default ActiveCampaign list IDs.
      </p>

      {error && <div className="mt-4"><MarketingErrorBanner message={error} /></div>}

      <div className="mt-6 space-y-4">
        {templates.map((t) => (
          <div key={t.id} className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-medium">{t.name}</h3>
                <p className="text-xs text-slate-500">{t.campaign_type}</p>
              </div>
              <button
                type="button"
                disabled={saving === t.id}
                onClick={() => void handleToggleActive(t)}
                className={`rounded-full px-3 py-1 text-xs ${
                  t.active ? 'bg-emerald-900/50 text-emerald-200' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {t.active ? 'Active' : 'Inactive'}
              </button>
            </div>
            <label className="mt-3 block text-xs text-slate-500">
              Canva template ID
              <input
                type="text"
                defaultValue={t.canva_template_id ?? ''}
                onBlur={(e) => {
                  if (e.target.value !== (t.canva_template_id ?? '')) {
                    void handleSaveCanvaId(t, e.target.value);
                  }
                }}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
                placeholder="Canva brand template ID"
              />
            </label>
            <label className="mt-2 block text-xs text-slate-500">
              Default AC list ID
              <input
                type="text"
                defaultValue={t.default_audience_list_id ?? ''}
                onBlur={(e) => {
                  if (e.target.value !== (t.default_audience_list_id ?? '')) {
                    void updateTemplate(password, t.id, {
                      default_audience_list_id: e.target.value || null,
                    }).then(() => load());
                  }
                }}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
                placeholder="ActiveCampaign list ID"
              />
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
