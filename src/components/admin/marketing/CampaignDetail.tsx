import { useState, useEffect, useCallback, type ComponentType, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Loader2,
  CheckCircle,
  XCircle,
  Send,
  RefreshCw,
  Copy,
  Download,
  Image,
  Linkedin,
  Mail,
  ArrowLeft,
  AlertTriangle,
  ExternalLink,
  Trash2,
} from 'lucide-react';
import {
  getCampaign,
  approveCampaign,
  rejectCampaign,
  deleteCampaign,
  sendCampaign,
  scheduleCampaign,
  regenerateField,
  generateCampaignImage,
  createActiveCampaignDraft,
  publishLinkedInPost,
  markLinkedInPublished,
  getLinkedInQueue,
  getAuditLog,
  syncCampaignMetrics,
  getMarketingSettings,
  parseAutoSendTrustedTypes,
  ACTIVECAMPAIGN_LIST_PRESETS,
  type MarketingCampaign,
  type AuditLogEntry,
} from '../../../services/marketingService';
import { canSendCampaign } from '../../../lib/marketing/complianceGuardrails';
import MarketingErrorBanner from './MarketingErrorBanner';

interface Props {
  password: string;
}

function getHeroImageUrl(campaign: MarketingCampaign, queue: unknown[]): string | null {
  const fromQueue = (queue[0] as { image_url?: string | null } | undefined)?.image_url;
  return campaign.image_asset_url ?? campaign.canva_export_url ?? fromQueue ?? null;
}

async function fetchImageBlob(url: string): Promise<Blob> {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Could not load image');
  return res.blob();
}

export default function CampaignDetail({ password }: Props) {
  const { id } = useParams<{ id: string }>();
  const [campaign, setCampaign] = useState<MarketingCampaign | null>(null);
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [scheduleAt, setScheduleAt] = useState('');
  const [linkedInQueue, setLinkedInQueue] = useState<unknown[]>([]);
  const [settingsListId, setSettingsListId] = useState('');
  const [autoSendTrustedTypes, setAutoSendTrustedTypes] = useState<string[]>([]);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const [campaignResult, auditResult, queue, settingsResult] = await Promise.all([
        getCampaign(password, id),
        getAuditLog(password, id),
        getLinkedInQueue(password, id),
        getMarketingSettings(password),
      ]);
      if (campaignResult.error) setError(campaignResult.error);
      setCampaign(campaignResult.campaign);
      setLogs(auditResult.logs);
      if (auditResult.error && !campaignResult.error) setError(auditResult.error);
      setLinkedInQueue(queue);
      const effective = settingsResult?.integrationStatus?.defaultListId;
      setSettingsListId(typeof effective === 'string' || typeof effective === 'number' ? String(effective) : '');
      setAutoSendTrustedTypes(
        parseAutoSendTrustedTypes(settingsResult?.settings?.auto_send_trusted_types)
      );
    } catch {
      setError('Failed to load campaign.');
    } finally {
      setLoading(false);
    }
  }, [password, id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function runAction(label: string, fn: () => Promise<{ success?: boolean; error?: string }>) {
    setBusy(label);
    setError('');
    setSuccess('');
    const result = await fn();
    setBusy('');
    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(`${label} completed`);
      await load();
    }
  }

  async function handleCopyLinkedIn() {
    if (!campaign?.linkedin_post) return;
    await navigator.clipboard.writeText(campaign.linkedin_post);
    setSuccess('LinkedIn caption copied — attach the image below in LinkedIn');
  }

  async function handleCopyLinkedInImage() {
    if (!campaign) return;
    const url = getHeroImageUrl(campaign, linkedInQueue);
    if (!url) {
      setError('No image yet — click Generate image first');
      return;
    }
    try {
      const blob = await fetchImageBlob(url);
      const type = blob.type || 'image/png';
      await navigator.clipboard.write([new ClipboardItem({ [type]: blob })]);
      setSuccess('Image copied — paste into LinkedIn post composer (Ctrl+V)');
    } catch {
      setError('Copy image failed — use Download image instead');
    }
  }

  async function handleDownloadLinkedInImage() {
    if (!campaign) return;
    const url = getHeroImageUrl(campaign, linkedInQueue);
    if (!url) {
      setError('No image yet — click Generate image first');
      return;
    }
    try {
      const blob = await fetchImageBlob(url);
      const objectUrl = URL.createObjectURL(blob);
      const slug = (campaign.title ?? 'uff-post').slice(0, 40).replace(/[^\w-]+/g, '-');
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = `${slug || 'uff-linkedin'}.png`;
      a.click();
      URL.revokeObjectURL(objectUrl);
      setSuccess('Image downloaded — upload it in LinkedIn after pasting the caption');
    } catch {
      setError('Download failed');
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-center">
        <p className="text-slate-400">Campaign not found.</p>
        <Link to="/admin/marketing/campaigns" className="mt-4 inline-block text-indigo-400 hover:underline">
          Back to campaigns
        </Link>
      </div>
    );
  }

  const canApprove = ['draft', 'pending_approval'].includes(campaign.status);
  const canDelete = ['draft', 'pending_approval', 'approved', 'failed', 'cancelled'].includes(
    campaign.status
  );
  const sendCheck = canSendCampaign(
    campaign.status,
    campaign.approval_required,
    campaign.campaign_type,
    autoSendTrustedTypes
  );
  const canSend = sendCheck.allowed;
  const isResend = ['sent', 'scheduled', 'failed'].includes(campaign.status);
  const sendListId = settingsListId || campaign.activecampaign_list_id || '';
  const sendListLabel =
    ACTIVECAMPAIGN_LIST_PRESETS.find((p) => p.id === sendListId)?.label ?? `List ${sendListId}`;
  const generatedWithDifferentList =
    canSend &&
    campaign.activecampaign_list_id &&
    settingsListId &&
    campaign.activecampaign_list_id !== settingsListId;
  const heroImageUrl = getHeroImageUrl(campaign, linkedInQueue);
  const landingPageUrl =
    typeof campaign.metadata?.landing_page_url === 'string'
      ? campaign.metadata.landing_page_url
      : null;
  const landingPending = campaign.metadata?.landing_page_status === 'pending_approval';
  const landingPageSkipped = campaign.metadata?.landing_page_skipped === true;
  const landingSkipReason =
    typeof campaign.metadata?.landing_page_skip_reason === 'string'
      ? campaign.metadata.landing_page_skip_reason
      : null;

  return (
    <div className="space-y-6">
      <Link
        to="/admin/marketing/campaigns"
        className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200"
      >
        <ArrowLeft className="h-4 w-4" /> Back to campaigns
      </Link>

      {error && (
        <MarketingErrorBanner message={error} />
      )}
      {success && (
        <div className="rounded-lg border border-emerald-800 bg-emerald-950/50 p-3 text-sm text-emerald-200">
          {success}
        </div>
      )}

      <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">{campaign.title ?? 'Untitled campaign'}</h2>
            <p className="mt-1 text-sm text-slate-400 capitalize">
              {campaign.campaign_type.replace(/_/g, ' ')} · {campaign.status.replace(/_/g, ' ')}
            </p>
            {campaign.internal_summary && (
              <p className="mt-3 text-sm text-slate-300">{campaign.internal_summary}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {canApprove && (
              <>
                <ActionBtn
                  icon={CheckCircle}
                  label="Approve"
                  busy={busy}
                  onClick={() => {
                    if (
                      !window.confirm(
                        'Approve this campaign? This will publish the uff.pro landing page and update email/LinkedIn links.'
                      )
                    ) {
                      return;
                    }
                    void runAction('Approve', async () => {
                      const result = await approveCampaign(password, campaign.id);
                      if (result.error) return { error: result.error };
                      return { success: true };
                    });
                  }}
                  className="bg-emerald-700 hover:bg-emerald-600"
                />
                <ActionBtn
                  icon={XCircle}
                  label="Reject"
                  busy={busy}
                  onClick={() => runAction('Reject', () => rejectCampaign(password, campaign.id))}
                  className="border border-slate-600 hover:bg-slate-800"
                />
              </>
            )}
            {canSend && (
              <ActionBtn
                icon={Send}
                label={isResend ? 'Resend via AC' : 'Send via AC'}
                busy={busy}
                onClick={() => {
                  const msg = isResend
                    ? 'Create a new ActiveCampaign send with this campaign content? Uses your current Settings list.'
                    : 'Send this campaign through ActiveCampaign?';
                  if (!window.confirm(msg)) return;
                  void runAction(isResend ? 'Resend' : 'Send', () => sendCampaign(password, campaign.id));
                }}
                className="bg-indigo-600 hover:bg-indigo-500"
              />
            )}
            {canDelete && (
              <ActionBtn
                icon={Trash2}
                label="Delete"
                busy={busy}
                onClick={() => {
                  if (
                    !window.confirm(
                      'Delete this campaign permanently? This cannot be undone.'
                    )
                  ) {
                    return;
                  }
                  void (async () => {
                    setBusy('Delete');
                    setError('');
                    const result = await deleteCampaign(password, campaign.id);
                    setBusy('');
                    if (result.error) {
                      setError(result.error);
                    } else {
                      window.location.href = '/admin/marketing/campaigns';
                    }
                  })();
                }}
                className="border border-red-800/60 text-red-300 hover:bg-red-950/50"
              />
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500">
          <span>Risk: {campaign.compliance_risk_score != null ? `${(campaign.compliance_risk_score * 100).toFixed(0)}%` : '—'}</span>
          <span>Approval required: {campaign.approval_required ? 'Yes' : 'No'}</span>
          {!campaign.approval_required &&
            autoSendTrustedTypes.includes(campaign.campaign_type) && (
              <span className="text-emerald-400/90">Trusted auto-send type</span>
            )}
          {campaign.approval_required &&
            autoSendTrustedTypes.includes(campaign.campaign_type) && (
              <span className="text-amber-400/90">
                Trusted type, but compliance review still required
              </span>
            )}
          {sendListId && (
            <span>
              Send list: {sendListLabel} (ID {sendListId})
            </span>
          )}
          {campaign.activecampaign_campaign_id && (
            <span>AC ID: {campaign.activecampaign_campaign_id}</span>
          )}
          {campaign.sent_at && (
            <span>Last sent: {new Date(campaign.sent_at).toLocaleString()}</span>
          )}
          {typeof campaign.metadata?.send_count === 'number' && campaign.metadata.send_count > 0 && (
            <span>Send count: {String(campaign.metadata.send_count)}</span>
          )}
        </div>

        {generatedWithDifferentList && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100/90">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              This campaign was generated with list <strong>{campaign.activecampaign_list_id}</strong>, but
              send will use your current Settings list <strong>{settingsListId}</strong> ({sendListLabel}).
              Change the list under Marketing → Settings before sending.
            </p>
          </div>
        )}

        {landingPending && !landingPageUrl && (
          <div className="mt-4 rounded-lg border border-slate-600 bg-slate-800/40 px-4 py-3 text-sm text-slate-300">
            <p className="font-medium text-slate-200">Landing page pending approval</p>
            <p className="mt-1 text-xs text-slate-500">
              The uff.pro landing page will be created when you approve this campaign. Until then,
              email links point to{' '}
              <a
                href="https://uff.pro/pro-portal"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-400 hover:underline"
              >
                uff.pro/pro-portal
              </a>
              .
            </p>
          </div>
        )}

        {landingPageUrl && (
          <div className="mt-4 rounded-lg border border-slate-700 bg-slate-800/40 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Broker landing page (uff.pro)</p>
            <a
              href={landingPageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1.5 text-sm text-indigo-400 hover:text-indigo-300 hover:underline"
            >
              {landingPageUrl}
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
            <p className="mt-2 text-xs text-slate-500">
              Email CTAs and body links point here. Published via GitHub for Netlify auto-deploy.
            </p>
          </div>
        )}

        {landingPageSkipped && !landingPageUrl && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100/90">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Pro landing page was not pushed to GitHub
              {landingSkipReason ? `: ${landingSkipReason}` : ''}. Set <code className="text-amber-200">GITHUB_TOKEN</code> in Supabase secrets.
            </p>
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-2">
          <SmallBtn
            icon={RefreshCw}
            label="Regen subject"
            busy={busy}
            onClick={() => runAction('Regen subject', () => regenerateField(password, campaign.id, 'subject'))}
          />
          <SmallBtn
            icon={RefreshCw}
            label="Regen LinkedIn"
            busy={busy}
            onClick={() => runAction('Regen LinkedIn', () => regenerateField(password, campaign.id, 'linkedin'))}
          />
          <SmallBtn
            icon={RefreshCw}
            label="Regen HTML"
            busy={busy}
            onClick={() => runAction('Regen HTML', () => regenerateField(password, campaign.id, 'email_html'))}
          />
          <SmallBtn
            icon={Image}
            label="Generate image"
            busy={busy}
            onClick={() => runAction('Generate image', () => generateCampaignImage(password, campaign.id))}
          />
          <SmallBtn
            icon={Mail}
            label="AC draft"
            busy={busy}
            onClick={() => runAction('AC draft', () => createActiveCampaignDraft(password, campaign.id))}
          />
          <SmallBtn
            icon={RefreshCw}
            label="Sync metrics"
            busy={busy}
            onClick={() => runAction('Metrics', () => syncCampaignMetrics(password, campaign.id))}
          />
        </div>

        {canSend && (
          <div className="mt-4 flex flex-wrap items-end gap-2">
            <label className="text-sm text-slate-400">
              Schedule send
              <input
                type="datetime-local"
                value={scheduleAt}
                onChange={(e) => setScheduleAt(e.target.value)}
                className="mt-1 block rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
              />
            </label>
            <button
              type="button"
              disabled={!scheduleAt || !!busy}
              onClick={() =>
                runAction('Schedule', () =>
                  scheduleCampaign(password, campaign.id, new Date(scheduleAt).toISOString())
                )
              }
              className="rounded-lg bg-indigo-600 px-3 py-2 text-sm hover:bg-indigo-500 disabled:opacity-50"
            >
              Schedule
            </button>
          </div>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <PreviewPanel title="Email preview" icon={Mail}>
          <p className="mb-2 text-sm font-medium">{campaign.email_subject}</p>
          <p className="mb-4 text-xs text-slate-500">{campaign.preview_text}</p>
          {campaign.email_html ? (
            <iframe
              title="Email preview"
              srcDoc={campaign.email_html}
              className="h-80 w-full rounded-lg border border-slate-800 bg-white"
              sandbox=""
            />
          ) : (
            <p className="text-sm text-slate-500">No HTML content</p>
          )}
        </PreviewPanel>

        <PreviewPanel title="LinkedIn post" icon={Linkedin}>
          {heroImageUrl ? (
            <div className="mb-4 overflow-hidden rounded-lg border border-slate-700 bg-slate-950">
              <img
                src={heroImageUrl}
                alt={campaign.title ?? 'LinkedIn post image'}
                className="max-h-72 w-full object-cover"
              />
              <p className="border-t border-slate-800 px-3 py-2 text-xs text-slate-500">
                Same hero image as the email — copy or download, then attach in LinkedIn.
              </p>
            </div>
          ) : (
            <p className="mb-4 rounded-lg border border-dashed border-slate-700 px-3 py-4 text-center text-xs text-slate-500">
              No image yet. Use <strong>Generate image</strong> above — it will appear here for manual
              LinkedIn posting.
            </p>
          )}

          <pre className="whitespace-pre-wrap text-sm text-slate-300">{campaign.linkedin_post ?? 'No LinkedIn copy'}</pre>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void handleCopyLinkedIn()}
              className="flex items-center gap-1 rounded-lg border border-slate-700 px-3 py-1.5 text-xs hover:bg-slate-800"
            >
              <Copy className="h-3 w-3" /> Copy caption
            </button>
            {heroImageUrl && (
              <>
                <button
                  type="button"
                  onClick={() => void handleCopyLinkedInImage()}
                  className="flex items-center gap-1 rounded-lg border border-slate-700 px-3 py-1.5 text-xs hover:bg-slate-800"
                >
                  <Copy className="h-3 w-3" /> Copy image
                </button>
                <button
                  type="button"
                  onClick={() => void handleDownloadLinkedInImage()}
                  className="flex items-center gap-1 rounded-lg border border-slate-700 px-3 py-1.5 text-xs hover:bg-slate-800"
                >
                  <Download className="h-3 w-3" /> Download image
                </button>
              </>
            )}
            <button
              type="button"
              disabled={!!busy}
              onClick={() => runAction('LinkedIn publish', () => publishLinkedInPost(password, campaign.id))}
              className="flex items-center gap-1 rounded-lg bg-blue-700 px-3 py-1.5 text-xs hover:bg-blue-600 disabled:opacity-50"
            >
              Publish via API
            </button>
            <button
              type="button"
              disabled={!!busy}
              onClick={() => runAction('Mark published', () => markLinkedInPublished(password, campaign.id))}
              className="flex items-center gap-1 rounded-lg border border-slate-700 px-3 py-1.5 text-xs hover:bg-slate-800 disabled:opacity-50"
            >
              Mark manual publish
            </button>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Manual post: copy caption → paste in LinkedIn → add media (copy or download image) → post.
          </p>
          {linkedInQueue.length > 0 && (
            <p className="mt-1 text-xs text-slate-500">
              Queue status: {(linkedInQueue[0] as { status?: string }).status ?? 'queued'}
            </p>
          )}
        </PreviewPanel>
      </div>

      {heroImageUrl && (
        <PreviewPanel title="Email hero image (full)" icon={Image}>
          <img
            src={heroImageUrl}
            alt={campaign.title ?? 'Campaign image'}
            className="max-h-96 rounded-lg border border-slate-800"
          />
        </PreviewPanel>
      )}

      {campaign.canva_prompt && (
        <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
          <h3 className="text-sm font-medium text-slate-400">Canva prompt</h3>
          <p className="mt-2 text-sm text-slate-300">{campaign.canva_prompt}</p>
        </section>
      )}

      <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
        <h3 className="font-semibold">Audit log</h3>
        <ul className="mt-4 space-y-2 text-sm">
          {logs.map((log) => (
            <li key={log.id} className="flex justify-between border-b border-slate-800/50 py-2">
              <span>
                <span className="text-indigo-300">{log.action}</span>
                <span className="ml-2 text-slate-500">({log.actor_type})</span>
              </span>
              <span className="text-slate-500">{new Date(log.created_at).toLocaleString()}</span>
            </li>
          ))}
          {logs.length === 0 && <li className="text-slate-500">No audit entries yet.</li>}
        </ul>
      </section>
    </div>
  );
}

function PreviewPanel({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: ComponentType<{ className?: string }>;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
      <h3 className="flex items-center gap-2 font-semibold">
        <Icon className="h-5 w-5 text-indigo-400" />
        {title}
      </h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function ActionBtn({
  icon: Icon,
  label,
  busy,
  onClick,
  className,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  busy: string;
  onClick: () => void;
  className: string;
}) {
  return (
    <button
      type="button"
      disabled={!!busy}
      onClick={onClick}
      className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50 ${className}`}
    >
      {busy === label ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
      {label}
    </button>
  );
}

function SmallBtn({
  icon: Icon,
  label,
  busy,
  onClick,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  busy: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={!!busy}
      onClick={onClick}
      className="flex items-center gap-1 rounded-lg border border-slate-700 px-2 py-1 text-xs hover:bg-slate-800 disabled:opacity-50"
    >
      {busy === label ? <Loader2 className="h-3 w-3 animate-spin" /> : <Icon className="h-3 w-3" />}
      {label}
    </button>
  );
}
