const FUNCTIONS_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

export interface MarketingCampaign {
  id: string;
  campaign_type: string;
  status: string;
  title: string | null;
  internal_summary: string | null;
  email_subject: string | null;
  preview_text: string | null;
  email_html: string | null;
  email_text: string | null;
  linkedin_post: string | null;
  canva_prompt: string | null;
  canva_template_id: string | null;
  canva_design_id: string | null;
  canva_export_url: string | null;
  image_asset_url: string | null;
  activecampaign_campaign_id: string | null;
  activecampaign_message_id: string | null;
  activecampaign_list_id: string | null;
  scheduled_send_at: string | null;
  sent_at: string | null;
  approval_required: boolean;
  approved_at: string | null;
  compliance_risk_score: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface MarketingTemplate {
  id: string;
  name: string;
  campaign_type: string;
  active: boolean;
  canva_template_id: string | null;
  default_audience_list_id: string | null;
  prompt_system: string | null;
  prompt_user: string | null;
  brand_rules: Record<string, unknown>;
  created_at: string;
}

export interface MarketingMetric {
  id: string;
  campaign_id: string;
  source: string;
  sends: number;
  opens: number;
  clicks: number;
  unsubscribes: number;
  bounces: number;
  captured_at: string;
}

export interface AuditLogEntry {
  id: string;
  campaign_id: string | null;
  action: string;
  actor_type: string;
  details: Record<string, unknown>;
  created_at: string;
}

async function marketingFetch(body: Record<string, unknown>) {
  let response: Response;
  try {
    response = await fetch(`${FUNCTIONS_BASE}/marketing-automation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Network error';
    return new Response(null, {
      status: 0,
      statusText: `Failed to reach marketing-automation (${msg}). Check Supabase edge function health.`,
    });
  }
  return response;
}

async function parseResponse<T>(response: Response): Promise<{ data?: T; error?: string }> {
  try {
    if (response.status === 0) {
      return { error: response.statusText || 'Failed to connect to marketing API.' };
    }
    const text = await response.text();
    if (!text) {
      if (response.status === 404) {
        return {
          error:
            'Marketing API not found. Deploy the marketing-automation Supabase edge function.',
        };
      }
      return { error: `Empty response (${response.status})` };
    }

    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      return {
        error:
          response.status === 404
            ? 'Marketing API not found. Deploy the marketing-automation Supabase edge function.'
            : `Invalid response (${response.status}): ${text.slice(0, 200)}`,
      };
    }

    if (!response.ok) {
      let msg =
        (data as { message?: string })?.message ||
        (data as { error?: string })?.error ||
        `Request failed (${response.status})`;
      if (msg.includes('OPENAI_API_KEY not configured')) {
        msg +=
          ' Add OPENAI_API_KEY in Supabase Dashboard → Project Settings → Edge Functions → Secrets, or run scripts/set-marketing-secrets.ps1 after npx supabase login.';
      }
      return { error: msg };
    }

    return { data: data as T };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Network error' };
  }
}

export async function generateCampaign(
  password: string,
  campaignType: string,
  options?: {
    useVestaInsights?: boolean;
    templateId?: string;
    audienceListId?: string;
    emailTone?: EmailTone;
  }
): Promise<{ campaign?: MarketingCampaign; error?: string }> {
  const response = await marketingFetch({
    action: 'generateCampaign',
    password,
    campaignType,
    emailTone: options?.emailTone ?? 'standard',
    ...options,
  });
  const { data, error } = await parseResponse<{ campaign: MarketingCampaign }>(response);
  if (error) return { error };
  return { campaign: data?.campaign };
}

export async function generateBrokerGrowthTip(
  password: string,
  options?: { emailTone?: EmailTone }
): Promise<{ campaign?: MarketingCampaign; tip?: unknown; error?: string }> {
  const response = await marketingFetch({
    action: 'generateBrokerGrowthTip',
    password,
    emailTone: options?.emailTone ?? 'standard',
    ...options,
  });
  const { data, error } = await parseResponse<{
    campaign: MarketingCampaign;
    tip: unknown;
  }>(response);
  if (error) return { error };
  return { campaign: data?.campaign, tip: data?.tip };
}

export async function listCampaigns(
  password: string,
  filters?: { status?: string; campaignType?: string }
): Promise<{ campaigns: MarketingCampaign[]; error?: string }> {
  const response = await marketingFetch({ action: 'listCampaigns', password, ...filters });
  const { data, error } = await parseResponse<{ campaigns: MarketingCampaign[] }>(response);
  if (error) return { campaigns: [], error };
  return { campaigns: data?.campaigns ?? [] };
}

export async function getCampaign(
  password: string,
  campaignId: string
): Promise<{ campaign: MarketingCampaign | null; error?: string }> {
  const response = await marketingFetch({ action: 'getCampaign', password, campaignId });
  const { data, error } = await parseResponse<{ campaign: MarketingCampaign }>(response);
  if (error) return { campaign: null, error };
  return { campaign: data?.campaign ?? null };
}

export async function updateCampaign(
  password: string,
  campaignId: string,
  patch: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  const response = await marketingFetch({ action: 'updateCampaign', password, campaignId, ...patch });
  const { error } = await parseResponse(response);
  return error ? { success: false, error } : { success: true };
}

export async function regenerateField(
  password: string,
  campaignId: string,
  field: 'subject' | 'linkedin' | 'canva_prompt' | 'email_html'
): Promise<{ campaign?: MarketingCampaign; error?: string }> {
  const response = await marketingFetch({ action: 'regenerateField', password, campaignId, field });
  const { data, error } = await parseResponse<{ campaign: MarketingCampaign }>(response);
  if (error) return { error };
  return { campaign: data?.campaign };
}

export async function approveCampaign(
  password: string,
  campaignId: string
): Promise<{ success: boolean; campaign?: MarketingCampaign; error?: string }> {
  const response = await marketingFetch({ action: 'approveCampaign', password, campaignId });
  const { data, error } = await parseResponse<{ campaign: MarketingCampaign }>(response);
  if (error) return { success: false, error };
  return { success: true, campaign: data?.campaign };
}

export async function deleteCampaign(
  password: string,
  campaignId: string
): Promise<{ success: boolean; error?: string }> {
  const response = await marketingFetch({ action: 'deleteCampaign', password, campaignId });
  const { error } = await parseResponse(response);
  return error ? { success: false, error } : { success: true };
}

export async function rejectCampaign(
  password: string,
  campaignId: string
): Promise<{ success: boolean; error?: string }> {
  const response = await marketingFetch({ action: 'rejectCampaign', password, campaignId });
  const { error } = await parseResponse(response);
  return error ? { success: false, error } : { success: true };
}

export async function cancelCampaign(
  password: string,
  campaignId: string
): Promise<{ success: boolean; error?: string }> {
  const response = await marketingFetch({ action: 'cancelCampaign', password, campaignId });
  const { error } = await parseResponse(response);
  return error ? { success: false, error } : { success: true };
}

export async function sendCampaign(
  password: string,
  campaignId: string
): Promise<{ success: boolean; error?: string }> {
  const response = await marketingFetch({ action: 'sendCampaign', password, campaignId });
  const { error } = await parseResponse(response);
  return error ? { success: false, error } : { success: true };
}

export async function scheduleCampaign(
  password: string,
  campaignId: string,
  scheduledSendAt: string
): Promise<{ success: boolean; error?: string }> {
  const response = await marketingFetch({
    action: 'scheduleCampaign',
    password,
    campaignId,
    scheduledSendAt,
  });
  const { error } = await parseResponse(response);
  return error ? { success: false, error } : { success: true };
}

export async function createActiveCampaignDraft(
  password: string,
  campaignId: string
): Promise<{ success: boolean; error?: string }> {
  const response = await marketingFetch({ action: 'createActiveCampaignDraft', password, campaignId });
  const { error } = await parseResponse(response);
  return error ? { success: false, error } : { success: true };
}

export async function generateCanvaDesign(
  password: string,
  campaignId: string
): Promise<{ success: boolean; error?: string }> {
  const response = await marketingFetch({ action: 'generateCanvaDesign', password, campaignId });
  const { error } = await parseResponse(response);
  return error ? { success: false, error } : { success: true };
}

export async function generateCampaignImage(
  password: string,
  campaignId: string
): Promise<{ success: boolean; error?: string }> {
  const response = await marketingFetch({ action: 'generateCampaignImage', password, campaignId });
  const { error } = await parseResponse(response);
  return error ? { success: false, error } : { success: true };
}

export async function listTemplates(
  password: string
): Promise<{ templates: MarketingTemplate[]; error?: string }> {
  const response = await marketingFetch({ action: 'getTemplates', password });
  const { data, error } = await parseResponse<{ templates: MarketingTemplate[] }>(response);
  if (error) return { templates: [], error };
  return { templates: data?.templates ?? [] };
}

export async function updateTemplate(
  password: string,
  templateId: string,
  patch: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  const response = await marketingFetch({ action: 'updateTemplate', password, templateId, patch });
  const { error } = await parseResponse(response);
  return error ? { success: false, error } : { success: true };
}

/** Normalize auto_send_trusted_types from DB (jsonb array). */
export function parseAutoSendTrustedTypes(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === 'string' && v.length > 0);
}

export const EMAIL_TONE_OPTIONS = [
  {
    value: 'standard',
    label: 'Standard',
    description:
      'Professional broker intelligence (default). Every email includes a motivational quote of the day.',
  },
  {
    value: 'funny',
    label: 'Funny',
    description:
      'Edgy, shockingly funny broker humor — sharp deadpan and absurdist beats across subject, body, LinkedIn, and imagery. No corny puns.',
  },
  {
    value: 'urgency',
    label: 'Urgency',
    description:
      'Action-oriented copy that motivates brokers to act now — without false rate or approval claims.',
  },
  {
    value: 'real_time',
    label: 'Real-Time',
    description:
      "Grounded in today's mortgage headlines and market data with immediate, event-driven recommendations.",
  },
] as const;

export type EmailTone = (typeof EMAIL_TONE_OPTIONS)[number]['value'];

export function parseEmailTone(value: unknown): EmailTone {
  const match = EMAIL_TONE_OPTIONS.find((o) => o.value === value);
  return match?.value ?? 'standard';
}

export async function getMarketingSettings(password: string): Promise<{
  settings: Record<string, unknown>;
  integrationStatus: Record<string, unknown>;
  error?: string;
} | null> {
  const response = await marketingFetch({ action: 'getSettings', password });
  const { data, error } = await parseResponse<{
    settings: Record<string, unknown>;
    integrationStatus: Record<string, unknown>;
  }>(response);
  if (error) return { settings: {}, integrationStatus: {}, error };
  return data ?? null;
}

export async function updateMarketingSetting(
  password: string,
  key: string,
  value: unknown
): Promise<{ success: boolean; error?: string }> {
  const response = await marketingFetch({ action: 'updateSettings', password, key, value });
  const { error } = await parseResponse(response);
  return error ? { success: false, error } : { success: true };
}

export interface ActiveCampaignList {
  id: string;
  name: string;
  stringid?: string;
}

/** Known UFF lists — quick presets in admin settings. */
export const ACTIVECAMPAIGN_LIST_PRESETS = [
  { id: '21', label: 'Marketing (Wholesale)', description: 'Production marketing list' },
  { id: '34', label: 'Testing', description: 'Safe list for QA sends' },
] as const;

export async function listActiveCampaignLists(
  password: string
): Promise<{ lists: ActiveCampaignList[]; configured?: boolean; error?: string }> {
  const response = await marketingFetch({ action: 'listActiveCampaignLists', password });
  const { data, error } = await parseResponse<{
    lists: ActiveCampaignList[];
    configured?: boolean;
  }>(response);
  if (error) return { lists: [], error };
  return { lists: data?.lists ?? [], configured: data?.configured ?? true };
}

export async function getAuditLog(
  password: string,
  campaignId?: string
): Promise<{ logs: AuditLogEntry[]; error?: string }> {
  const response = await marketingFetch({ action: 'getAuditLog', password, campaignId });
  const { data, error } = await parseResponse<{ logs: AuditLogEntry[] }>(response);
  if (error) return { logs: [], error };
  return { logs: data?.logs ?? [] };
}

export async function getMetrics(
  password: string,
  campaignId?: string
): Promise<{ metrics: MarketingMetric[]; error?: string }> {
  const response = await marketingFetch({ action: 'getMetrics', password, campaignId });
  const { data, error } = await parseResponse<{ metrics: MarketingMetric[] }>(response);
  if (error) return { metrics: [], error };
  return { metrics: data?.metrics ?? [] };
}

export async function syncCampaignMetrics(
  password: string,
  campaignId: string
): Promise<{ success: boolean; error?: string }> {
  const response = await marketingFetch({ action: 'syncCampaignMetrics', password, campaignId });
  const { error } = await parseResponse(response);
  return error ? { success: false, error } : { success: true };
}

export async function publishLinkedInPost(
  password: string,
  campaignId: string
): Promise<{ success: boolean; error?: string }> {
  const response = await marketingFetch({ action: 'publishLinkedInPost', password, campaignId });
  const { data, error } = await parseResponse<{ success: boolean }>(response);
  if (error) return { success: false, error };
  return { success: data?.success ?? false };
}

export async function markLinkedInPublished(
  password: string,
  campaignId: string
): Promise<{ success: boolean; error?: string }> {
  const response = await marketingFetch({ action: 'markLinkedInPublished', password, campaignId });
  const { error } = await parseResponse(response);
  return error ? { success: false, error } : { success: true };
}

export async function getLinkedInQueue(
  password: string,
  campaignId: string
): Promise<unknown[]> {
  const response = await marketingFetch({ action: 'getLinkedInQueue', password, campaignId });
  const { data } = await parseResponse<{ queue: unknown[] }>(response);
  return data?.queue ?? [];
}

export const CAMPAIGN_TYPE_OPTIONS = [
  { value: 'daily_rate_update', label: 'Daily Market Briefing (same-day RSS)' },
  { value: 'market_commentary', label: 'Market Commentary' },
  { value: 'market_intelligence', label: 'Market Intelligence' },
  { value: 'loan_rescue', label: 'Loan Rescue' },
  { value: 'scenario_desk', label: 'Scenario Desk' },
  { value: 'pro_portal_feature_spotlight', label: 'PRO Portal Feature Spotlight' },
  { value: 'fha_product_spotlight', label: 'FHA Product Spotlight' },
  { value: 'va_product_spotlight', label: 'VA Product Spotlight' },
  { value: 'conventional_product_spotlight', label: 'Conventional Product Spotlight' },
  { value: 'usda_product_spotlight', label: 'USDA Product Spotlight' },
  { value: 'non_qm_product_spotlight', label: 'Non-QM Product Spotlight' },
  { value: 'jumbo_product_spotlight', label: 'Jumbo Product Spotlight' },
  { value: 'broker_recruiting', label: 'Broker Recruiting' },
  { value: 'broker_business_growth_tip', label: 'Broker Business Growth Tip' },
  { value: 'broker_growth', label: 'Broker Growth' },
  { value: 'operational_tip', label: 'Operational Tip' },
  { value: 'processing_operations', label: 'Processing & Operations' },
  { value: 'closing_timeline_tip', label: 'Closing Timeline Tip' },
  { value: 'document_checklist_tip', label: 'Document Checklist Tip' },
  { value: 'compliance_broker_education', label: 'Compliance-Safe Broker Education' },
  { value: 'compliance_guidelines', label: 'Compliance & Guidelines' },
  { value: 'weekly_broker_newsletter', label: 'Weekly Broker Newsletter' },
  { value: 're_engagement_campaign', label: 'Re-Engagement Campaign' },
];
