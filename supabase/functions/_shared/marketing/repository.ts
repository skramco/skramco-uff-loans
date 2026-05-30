import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import type {
  ActorType,
  CampaignStatus,
  MarketingCampaignRow,
  MarketingTemplateRow,
  MetricsSource,
} from "./types.ts";

export class MarketingRepository {
  constructor(private supabase: SupabaseClient) {}

  async getCampaign(id: string): Promise<MarketingCampaignRow | null> {
    const { data, error } = await this.supabase
      .from("marketing_campaigns")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data as MarketingCampaignRow | null;
  }

  async listCampaigns(filters: {
    status?: string;
    campaignType?: string;
    limit?: number;
    offset?: number;
  }): Promise<MarketingCampaignRow[]> {
    let q = this.supabase
      .from("marketing_campaigns")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(filters.limit ?? 50);

    if (filters.offset) q = q.range(filters.offset, filters.offset + (filters.limit ?? 50) - 1);
    if (filters.status) q = q.eq("status", filters.status);
    if (filters.campaignType) q = q.eq("campaign_type", filters.campaignType);

    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return (data ?? []) as MarketingCampaignRow[];
  }

  async createCampaign(
    row: Partial<MarketingCampaignRow> & { campaign_type: string }
  ): Promise<MarketingCampaignRow> {
    const { data, error } = await this.supabase
      .from("marketing_campaigns")
      .insert(row)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return data as MarketingCampaignRow;
  }

  async updateCampaign(
    id: string,
    patch: Record<string, unknown>
  ): Promise<MarketingCampaignRow> {
    const { data, error } = await this.supabase
      .from("marketing_campaigns")
      .update(patch)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return data as MarketingCampaignRow;
  }

  async getTemplateByType(campaignType: string): Promise<MarketingTemplateRow | null> {
    const { data, error } = await this.supabase
      .from("marketing_campaign_templates")
      .select("*")
      .eq("campaign_type", campaignType)
      .eq("active", true)
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data as MarketingTemplateRow | null;
  }

  async getTemplate(id: string): Promise<MarketingTemplateRow | null> {
    const { data, error } = await this.supabase
      .from("marketing_campaign_templates")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data as MarketingTemplateRow | null;
  }

  async listTemplates(): Promise<MarketingTemplateRow[]> {
    const { data, error } = await this.supabase
      .from("marketing_campaign_templates")
      .select("*")
      .order("name");
    if (error) throw new Error(error.message);
    return (data ?? []) as MarketingTemplateRow[];
  }

  async updateTemplate(id: string, patch: Record<string, unknown>): Promise<MarketingTemplateRow> {
    const { data, error } = await this.supabase
      .from("marketing_campaign_templates")
      .update(patch)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return data as MarketingTemplateRow;
  }

  async getSetting(key: string): Promise<unknown> {
    const { data, error } = await this.supabase
      .from("marketing_settings")
      .select("value")
      .eq("key", key)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data?.value ?? null;
  }

  async getAllSettings(): Promise<Record<string, unknown>> {
    const { data, error } = await this.supabase.from("marketing_settings").select("key, value");
    if (error) throw new Error(error.message);
    const out: Record<string, unknown> = {};
    for (const row of data ?? []) {
      out[row.key] = row.value;
    }
    return out;
  }

  async upsertSetting(key: string, value: unknown): Promise<void> {
    const { error } = await this.supabase
      .from("marketing_settings")
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
    if (error) throw new Error(error.message);
  }

  async writeAuditLog(entry: {
    campaignId?: string | null;
    action: string;
    actorId?: string | null;
    actorType: ActorType;
    details?: Record<string, unknown>;
  }): Promise<void> {
    const { error } = await this.supabase.from("marketing_audit_log").insert({
      campaign_id: entry.campaignId ?? null,
      action: entry.action,
      actor_id: entry.actorId ?? null,
      actor_type: entry.actorType,
      details: entry.details ?? {},
    });
    if (error) throw new Error(error.message);
  }

  async getAuditLog(campaignId?: string, limit = 100): Promise<unknown[]> {
    let q = this.supabase
      .from("marketing_audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (campaignId) q = q.eq("campaign_id", campaignId);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return data ?? [];
  }

  async insertMetrics(row: {
    campaignId: string;
    source: MetricsSource;
    sends?: number;
    opens?: number;
    clicks?: number;
    unsubscribes?: number;
    bounces?: number;
    spam_complaints?: number;
    linkedin_impressions?: number;
    linkedin_likes?: number;
    linkedin_comments?: number;
    linkedin_shares?: number;
    raw_response?: unknown;
  }): Promise<void> {
    const { error } = await this.supabase.from("marketing_campaign_metrics").insert({
      campaign_id: row.campaignId,
      source: row.source,
      sends: row.sends ?? 0,
      opens: row.opens ?? 0,
      clicks: row.clicks ?? 0,
      unsubscribes: row.unsubscribes ?? 0,
      bounces: row.bounces ?? 0,
      spam_complaints: row.spam_complaints ?? 0,
      linkedin_impressions: row.linkedin_impressions ?? 0,
      linkedin_likes: row.linkedin_likes ?? 0,
      linkedin_comments: row.linkedin_comments ?? 0,
      linkedin_shares: row.linkedin_shares ?? 0,
      raw_response: row.raw_response ?? null,
    });
    if (error) throw new Error(error.message);
  }

  async getMetrics(campaignId?: string, limit = 100): Promise<unknown[]> {
    let q = this.supabase
      .from("marketing_campaign_metrics")
      .select("*")
      .order("captured_at", { ascending: false })
      .limit(limit);
    if (campaignId) q = q.eq("campaign_id", campaignId);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return data ?? [];
  }

  async claimSchedulerRun(
    idempotencyKey: string,
    jobType: string
  ): Promise<{ claimed: boolean; runId?: string }> {
    const { data: existing } = await this.supabase
      .from("marketing_scheduler_runs")
      .select("id, status")
      .eq("idempotency_key", idempotencyKey)
      .maybeSingle();

    if (existing?.status === "completed" || existing?.status === "started") {
      return { claimed: false };
    }

    const { data, error } = await this.supabase
      .from("marketing_scheduler_runs")
      .insert({
        idempotency_key: idempotencyKey,
        job_type: jobType,
        status: "started",
      })
      .select("id")
      .single();

    if (error) {
      if (error.code === "23505") return { claimed: false };
      throw new Error(error.message);
    }
    return { claimed: true, runId: data.id };
  }

  async completeSchedulerRun(
    runId: string,
    status: "completed" | "failed" | "skipped",
    details: Record<string, unknown>,
    campaignId?: string
  ): Promise<void> {
    const { error } = await this.supabase
      .from("marketing_scheduler_runs")
      .update({ status, details, campaign_id: campaignId ?? null })
      .eq("id", runId);
    if (error) throw new Error(error.message);
  }

  async queueLinkedInPost(entry: {
    campaignId: string;
    postText: string;
    imageUrl?: string;
  }): Promise<void> {
    const { error } = await this.supabase.from("marketing_linkedin_queue").insert({
      campaign_id: entry.campaignId,
      status: "queued",
      post_text: entry.postText,
      image_url: entry.imageUrl ?? null,
    });
    if (error) throw new Error(error.message);
  }

  async getLinkedInQueue(campaignId?: string): Promise<unknown[]> {
    let q = this.supabase
      .from("marketing_linkedin_queue")
      .select("*")
      .order("created_at", { ascending: false });
    if (campaignId) q = q.eq("campaign_id", campaignId);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return data ?? [];
  }

  async updateLinkedInQueue(
    id: string,
    patch: Record<string, unknown>
  ): Promise<void> {
    const { error } = await this.supabase
      .from("marketing_linkedin_queue")
      .update(patch)
      .eq("id", id);
    if (error) throw new Error(error.message);
  }

  async listSentCampaignsForMetricsSync(limit = 50): Promise<MarketingCampaignRow[]> {
    const { data, error } = await this.supabase
      .from("marketing_campaigns")
      .select("*")
      .eq("status", "sent")
      .not("activecampaign_campaign_id", "is", null)
      .order("sent_at", { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    return (data ?? []) as MarketingCampaignRow[];
  }

  async transitionStatus(
    id: string,
    to: CampaignStatus,
    extra?: Record<string, unknown>
  ): Promise<MarketingCampaignRow> {
    return this.updateCampaign(id, { status: to, ...extra });
  }
}
