/** Marketing automation types — shared across edge functions. */

export const CAMPAIGN_TYPES = [
  "daily_rate_update",
  "market_commentary",
  "market_intelligence",
  "pro_portal_feature_spotlight",
  "fha_product_spotlight",
  "va_product_spotlight",
  "conventional_product_spotlight",
  "usda_product_spotlight",
  "non_qm_product_spotlight",
  "jumbo_product_spotlight",
  "loan_rescue",
  "scenario_desk",
  "broker_recruiting",
  "broker_business_growth_tip",
  "broker_growth",
  "operational_tip",
  "processing_operations",
  "closing_timeline_tip",
  "document_checklist_tip",
  "compliance_broker_education",
  "compliance_guidelines",
  "weekly_broker_newsletter",
  "re_engagement_campaign",
] as const;

export type CampaignType = (typeof CAMPAIGN_TYPES)[number];

export const CAMPAIGN_STATUSES = [
  "draft",
  "pending_approval",
  "approved",
  "scheduled",
  "sent",
  "failed",
  "cancelled",
] as const;

export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];

export type ActorType = "user" | "system" | "scheduler" | "api";

export type MetricsSource = "activecampaign" | "linkedin" | "internal";

export interface GeneratedCampaignContent {
  campaign_type: CampaignType;
  title: string;
  internal_summary: string;
  email_subject: string;
  preview_text: string;
  email_html: string;
  email_text: string;
  linkedin_post: string;
  canva_prompt: string;
  canva_template_id?: string;
  call_to_action: string;
  audience_list_id?: string;
  compliance_risk_score: number;
  approval_required: boolean;
  consumer_facing?: boolean;
  uses_vesta_insights?: boolean;
  /** Set when email tone is funny — random per generation. */
  funny_word?: string;
}

export interface MarketingCampaignRow {
  id: string;
  campaign_type: string;
  status: CampaignStatus;
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
  approved_by: string | null;
  approved_at: string | null;
  compliance_risk_score: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface MarketingTemplateRow {
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

export interface ComplianceResult {
  riskScore: number;
  flags: string[];
  requiresApproval: boolean;
  violations: string[];
}

export const REGENERATABLE_FIELDS = [
  "subject",
  "linkedin",
  "canva_prompt",
  "email_html",
] as const;

export type RegeneratableField = (typeof REGENERATABLE_FIELDS)[number];

export function isValidStatusTransition(
  from: CampaignStatus,
  to: CampaignStatus
): boolean {
  const allowed: Record<CampaignStatus, CampaignStatus[]> = {
    draft: ["pending_approval", "approved", "cancelled", "failed"],
    pending_approval: ["approved", "cancelled", "draft", "failed"],
    approved: ["scheduled", "sent", "cancelled", "failed"],
    scheduled: ["sent", "cancelled", "failed"],
    sent: ["sent", "scheduled"],
    failed: ["draft", "pending_approval", "cancelled"],
    cancelled: [],
  };
  return allowed[from]?.includes(to) ?? false;
}
