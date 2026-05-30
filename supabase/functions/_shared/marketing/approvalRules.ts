import { evaluateCompliance } from "./complianceGuardrails.ts";
import type { GeneratedCampaignContent } from "./types.ts";

export interface ApprovalContext {
  complianceRiskThreshold: number;
  autoSendTrustedTypes: string[];
  linkedinRequireApproval: boolean;
}

export function computeApprovalRequired(
  campaign: Pick<
    GeneratedCampaignContent,
    "campaign_type" | "compliance_risk_score" | "consumer_facing" | "uses_vesta_insights"
  > & {
    email_subject?: string;
    preview_text?: string;
    email_html?: string;
    email_text?: string;
    linkedin_post?: string;
  },
  settings: ApprovalContext
): boolean {
  const compliance = evaluateCompliance({
    email_subject: campaign.email_subject,
    preview_text: campaign.preview_text,
    email_html: campaign.email_html,
    email_text: campaign.email_text,
    linkedin_post: campaign.linkedin_post,
    consumer_facing: campaign.consumer_facing,
    uses_vesta_insights: campaign.uses_vesta_insights,
    aiRiskScore: campaign.compliance_risk_score,
  });

  if (compliance.riskScore > settings.complianceRiskThreshold) return true;
  if (campaign.consumer_facing) return true;
  if (campaign.uses_vesta_insights) return true;
  if (compliance.flags.some((f) => f.startsWith("compliance_keyword:"))) return true;
  if (compliance.violations.length > 0) return true;

  // Trusted types may auto-send only when no other flags
  if (settings.autoSendTrustedTypes.includes(campaign.campaign_type)) {
    return false;
  }

  return true;
}

export function canSendCampaign(
  status: string,
  approvalRequired: boolean,
  campaignType: string,
  autoSendTrustedTypes: string[]
): { allowed: boolean; reason?: string } {
  if (status === "approved") return { allowed: true };
  if (status === "scheduled") return { allowed: true };
  // Allow resend after a prior send attempt or completion
  if (status === "sent" || status === "failed") return { allowed: true };
  if (!approvalRequired && autoSendTrustedTypes.includes(campaignType)) {
    return { allowed: true };
  }
  return {
    allowed: false,
    reason: "Campaign must be approved before sending",
  };
}

export async function loadApprovalSettings(
  getSetting: (key: string) => Promise<unknown>
): Promise<ApprovalContext> {
  const threshold = (await getSetting("compliance_risk_threshold")) as number | null;
  const trusted = (await getSetting("auto_send_trusted_types")) as string[] | null;
  const linkedinRequire = (await getSetting("linkedin_require_approval")) as boolean | null;

  return {
    complianceRiskThreshold: typeof threshold === "number" ? threshold : 0.6,
    autoSendTrustedTypes: Array.isArray(trusted) ? trusted : [],
    linkedinRequireApproval: linkedinRequire !== false,
  };
}
