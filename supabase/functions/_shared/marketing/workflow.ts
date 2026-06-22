import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import {
  createCampaign as acCreateCampaign,
  createMessage,
  getCampaignReport,
  resolveDefaultListId,
  resolveSendListId,
} from "./activeCampaignClient.ts";
import { logMarketingAction } from "./auditLog.ts";
import { canSendCampaign, loadApprovalSettings } from "./approvalRules.ts";
import {
  buildAutofillFields,
  createDesignFromTemplate,
  exportDesign,
  injectImageIntoHtml as injectCanvaImage,
  loadTokensFromSettings,
  refreshCanvaToken,
} from "./canvaClient.ts";
import {
  generateCampaignContent,
  finalizeGeneratedCampaign,
  campaignRowToGeneratedContent,
} from "./campaignGenerator.ts";
import {
  createAndPublishProLandingPage,
  updateLandingPageHeroImage,
  LANDING_PAGE_PLACEHOLDER,
} from "./proLandingPage.ts";
import { PRO_PORTAL_PUBLIC_PAGE_URL } from "./proPortalContext.ts";
import {
  buildImagePrompt,
  generateMarketingImage,
  injectImageIntoHtml,
} from "./openaiImageClient.ts";
import {
  isLinkedInAutoPostEnabled,
  isLinkedInConfigured,
  publishOrganizationPost,
} from "./linkedInClient.ts";
import { MarketingRepository } from "./repository.ts";
import type { CampaignType, GeneratedCampaignContent, MarketingCampaignRow } from "./types.ts";
import { fetchVestaAggregateInsights, getPerformanceSummary } from "./vestaInsights.ts";
import {
  buildTipCampaignUserPrompt,
  researchBrokerGrowthTips,
  type BrokerGrowthTip,
} from "./brokerGrowthTips.ts";
import { DEFAULT_EMAIL_TONE, parseEmailTone, type EmailTone } from "./emailToneContext.ts";

export async function runCampaignGeneration(
  supabase: SupabaseClient,
  opts: {
    campaignType: CampaignType;
    templateId?: string;
    audienceListId?: string;
    useVestaInsights?: boolean;
    actorType?: "user" | "scheduler" | "system";
    tipBrief?: BrokerGrowthTip;
    skipImage?: boolean;
    emailTone?: EmailTone;
  }
): Promise<{ campaignId: string; content: GeneratedCampaignContent }> {
  const repo = new MarketingRepository(supabase);

  const template = opts.templateId
    ? await repo.getTemplate(opts.templateId)
    : await repo.getTemplateByType(opts.campaignType);

  let vestaInsights: string[] | undefined;
  if (opts.useVestaInsights) {
    vestaInsights = await fetchVestaAggregateInsights("dev");
  }

  const performanceSummary = await getPerformanceSummary((k) => repo.getSetting(k));
  const emailTone = opts.emailTone ?? DEFAULT_EMAIL_TONE;

  const rawContent = await generateCampaignContent(repo, {
    campaignType: opts.campaignType,
    template,
    vestaInsights,
    performanceSummary,
    audienceListId: opts.audienceListId,
    tipUserPrompt: opts.tipBrief
      ? buildTipCampaignUserPrompt(opts.tipBrief)
      : undefined,
    emailTone,
  });

  // LinkedIn: keep {{LANDING_PAGE_URL}} until approval; PRO Portal URL is formatted at bottom via linkedinPostFormat.

  const campaignId = crypto.randomUUID();

  const content = finalizeGeneratedCampaign(rawContent, {
    ctaUrl: PRO_PORTAL_PUBLIC_PAGE_URL,
    attachLandingToLinkedIn: false,
  });

  const status = content.approval_required ? "pending_approval" : "draft";

  const campaign = await repo.createCampaign({
    id: campaignId,
    campaign_type: content.campaign_type,
    status,
    title: content.title,
    internal_summary: content.internal_summary,
    email_subject: content.email_subject,
    preview_text: content.preview_text,
    email_html: content.email_html,
    email_text: content.email_text,
    linkedin_post: content.linkedin_post,
    canva_prompt: content.canva_prompt,
    canva_template_id: content.canva_template_id ?? template?.canva_template_id ?? null,
    activecampaign_list_id:
      content.audience_list_id ?? (await resolveDefaultListId((k) => repo.getSetting(k))) ?? null,
    approval_required: content.approval_required,
    compliance_risk_score: content.compliance_risk_score,
    metadata: {
      generation: { at: new Date().toISOString(), useVestaInsights: !!opts.useVestaInsights },
      email_tone: emailTone,
      call_to_action: content.call_to_action,
      email_body_fragment: rawContent.email_html,
      email_text_fragment: rawContent.email_text,
      landing_page_status: "pending_approval",
      landing_page_url: null,
      landing_page_slug: null,
      growthTip: opts.tipBrief
        ? {
            tipNumber: opts.tipBrief.tipNumber,
            title: opts.tipBrief.title,
          }
        : undefined,
    },
  });

  await logMarketingAction(repo, {
    campaignId: campaign.id,
    action: "campaign_generated",
    actorType: opts.actorType ?? "system",
    details: {
      campaignType: opts.campaignType,
      approvalRequired: content.approval_required,
      landingPageDeferred: true,
    },
  });

  if (content.linkedin_post) {
    await repo.queueLinkedInPost({
      campaignId: campaign.id,
      postText: content.linkedin_post,
    });
  }

  if (!opts.skipImage) {
    try {
      await runCampaignImageGeneration(supabase, campaign.id);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Image generation failed";
      console.warn("Auto image generation failed:", msg);
      await logMarketingAction(repo, {
        campaignId: campaign.id,
        action: "openai_image_generation_failed",
        actorType: opts.actorType ?? "system",
        details: { error: msg },
      });
    }
  }

  return { campaignId: campaign.id, content };
}

/** Publish uff.pro landing page and rewrite email/LinkedIn links — call when campaign is approved. */
export async function publishLandingPageOnApproval(
  supabase: SupabaseClient,
  campaignId: string,
  actorType: "user" | "scheduler" | "system" = "user"
): Promise<MarketingCampaignRow> {
  const repo = new MarketingRepository(supabase);
  const campaign = await repo.getCampaign(campaignId);
  if (!campaign) throw new Error("Campaign not found");

  const meta = (campaign.metadata ?? {}) as Record<string, unknown>;
  if (meta.landing_page_status === "published" && meta.landing_page_url) {
    return campaign;
  }

  const generated = campaignRowToGeneratedContent(campaign, meta);
  let landingMeta: {
    slug?: string;
    url?: string;
    githubPath?: string;
    githubCommit?: string;
    skipped?: boolean;
    reason?: string;
  } = {};

  try {
    landingMeta = await createAndPublishProLandingPage(campaignId, generated);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Landing page publish failed";
    await logMarketingAction(repo, {
      campaignId,
      action: "pro_landing_page_failed",
      actorType,
      details: { error: msg },
    });
    throw e;
  }

  const finalized = finalizeGeneratedCampaign(generated, {
    ctaUrl: landingMeta.url,
    heroImageUrl: campaign.image_asset_url ?? undefined,
    attachLandingToLinkedIn: true,
  });

  const updatedMeta: Record<string, unknown> = {
    ...meta,
    landing_page_status: landingMeta.skipped ? "skipped" : "published",
    landing_page_slug: landingMeta.slug,
    landing_page_url: landingMeta.url,
    landing_page_github_path: landingMeta.githubPath,
    landing_page_github_commit: landingMeta.githubCommit,
    landing_page_skipped: landingMeta.skipped,
    landing_page_skip_reason: landingMeta.reason,
  };

  const updated = await repo.updateCampaign(campaignId, {
    email_html: finalized.email_html,
    email_text: finalized.email_text,
    linkedin_post: finalized.linkedin_post,
    metadata: updatedMeta,
  });

  const queue = await repo.getLinkedInQueue(campaignId);
  const queueRow = (queue as Array<{ id: string }>)[0];
  if (queueRow) {
    await repo.updateLinkedInQueue(queueRow.id, { post_text: finalized.linkedin_post });
  }

  if (landingMeta.slug && campaign.image_asset_url && !landingMeta.skipped) {
    try {
      await updateLandingPageHeroImage(landingMeta.slug, campaign.image_asset_url);
    } catch (e) {
      console.warn("Landing page hero update failed:", e);
    }
  }

  if (!landingMeta.skipped) {
    await logMarketingAction(repo, {
      campaignId,
      action: "pro_landing_page_published",
      actorType,
      details: {
        slug: landingMeta.slug,
        url: landingMeta.url,
        githubCommit: landingMeta.githubCommit,
        trigger: "approval",
      },
    });
  }

  return updated;
}

export async function approveCampaignWithLanding(
  supabase: SupabaseClient,
  campaignId: string,
  actorType: "user" | "scheduler" | "system" = "user"
): Promise<MarketingCampaignRow> {
  const repo = new MarketingRepository(supabase);
  const campaign = await repo.getCampaign(campaignId);
  if (!campaign) throw new Error("Campaign not found");

  await publishLandingPageOnApproval(supabase, campaignId, actorType);

  const updated = await repo.updateCampaign(campaignId, {
    status: "approved",
    approved_at: new Date().toISOString(),
  });

  await logMarketingAction(repo, {
    campaignId,
    action: "campaign_approved",
    actorType,
    details: { approver: "admin", landingPublished: true },
  });

  return updated;
}

const DELETABLE_CAMPAIGN_STATUSES = new Set([
  "draft",
  "pending_approval",
  "approved",
  "failed",
  "cancelled",
]);

export async function deleteMarketingCampaign(
  supabase: SupabaseClient,
  campaignId: string,
  actorType: "user" | "scheduler" | "system" = "user"
): Promise<void> {
  const repo = new MarketingRepository(supabase);
  const campaign = await repo.getCampaign(campaignId);
  if (!campaign) throw new Error("Campaign not found");

  if (!DELETABLE_CAMPAIGN_STATUSES.has(campaign.status)) {
    throw new Error(
      `Cannot delete campaign with status "${campaign.status}". Cancel or wait until send completes.`
    );
  }

  if (campaign.status === "scheduled") {
    throw new Error("Cannot delete a scheduled campaign. Cancel it first.");
  }

  await repo.deleteCampaign(campaignId);

  await logMarketingAction(repo, {
    campaignId: null,
    action: "campaign_deleted",
    actorType,
    details: {
      deletedCampaignId: campaignId,
      title: campaign.title,
      campaignType: campaign.campaign_type,
    },
  });
}

/** Research one broker growth tip and create a full campaign (+ image). */
export async function runSingleBrokerGrowthTipCampaign(
  supabase: SupabaseClient,
  opts: {
    actorType?: "user" | "scheduler" | "system";
    excludeTitles?: string[];
    emailTone?: EmailTone;
  } = {}
): Promise<{ campaignId: string; tip: BrokerGrowthTip }> {
  const repo = new MarketingRepository(supabase);
  const [tip] = await researchBrokerGrowthTips(1, opts.excludeTitles ?? []);

  const { campaignId } = await runCampaignGeneration(supabase, {
    campaignType: "broker_business_growth_tip",
    tipBrief: tip,
    actorType: opts.actorType ?? "user",
    emailTone: opts.emailTone,
  });

  await logMarketingAction(repo, {
    campaignId,
    action: "broker_growth_tip_generated",
    actorType: opts.actorType ?? "user",
    details: { tipTitle: tip.title },
  });

  return { campaignId, tip };
}

async function persistImageToStorage(
  supabase: SupabaseClient,
  campaignId: string,
  source: { imageUrl?: string; b64Json?: string; mimeType?: string },
  fileStem: string
): Promise<string> {
  let buf: ArrayBuffer;
  let contentType: string;

  if (source.b64Json) {
    contentType = source.mimeType ?? "image/png";
    const bytes = Uint8Array.from(atob(source.b64Json), (c) => c.charCodeAt(0));
    buf = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  } else if (source.imageUrl) {
    const imgRes = await fetch(source.imageUrl);
    if (!imgRes.ok) return source.imageUrl;

    contentType = imgRes.headers.get("content-type") ?? "image/png";
    buf = await imgRes.arrayBuffer();
  } else {
    throw new Error("No image data to persist");
  }

  const ext =
    contentType.includes("jpeg") || contentType.includes("jpg")
      ? "jpg"
      : contentType.includes("webp")
        ? "webp"
        : "png";
  const path = `campaigns/${campaignId}/${fileStem}.${ext}`;

  const { error } = await supabase.storage
    .from("marketing-assets")
    .upload(path, buf, { contentType, upsert: true });

  if (error) {
    if (source.imageUrl) return source.imageUrl;
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  const { data: urlData } = supabase.storage.from("marketing-assets").getPublicUrl(path);
  return urlData?.publicUrl ?? source.imageUrl ?? "";
}

/** Generate hero image via OpenAI DALL-E (no Canva required). */
export async function runOpenAIImageGeneration(
  supabase: SupabaseClient,
  campaignId: string
): Promise<{ imageUrl: string; imageAssetUrl: string }> {
  const repo = new MarketingRepository(supabase);
  const campaign = await repo.getCampaign(campaignId);
  if (!campaign) throw new Error("Campaign not found");

  const prompt = buildImagePrompt(campaign);
  const generated = await generateMarketingImage(prompt);

  const imageAssetUrl = await persistImageToStorage(
    supabase,
    campaignId,
    generated,
    `openai-${Date.now()}`
  );

  const updatedHtml = injectImageIntoHtml(
    campaign.email_html ?? "",
    imageAssetUrl,
    campaign.title ?? "UFF Marketing"
  );

  await repo.updateCampaign(campaignId, {
    image_asset_url: imageAssetUrl,
    canva_export_url: generated.imageUrl ?? imageAssetUrl,
    email_html: updatedHtml,
    metadata: {
      ...(campaign.metadata as Record<string, unknown>),
      openai_image: {
        generatedAt: new Date().toISOString(),
        prompt: prompt.slice(0, 500),
        revisedPrompt: generated.revisedPrompt,
      },
    },
  });

  const meta = campaign.metadata as Record<string, unknown> | undefined;
  const landingSlug =
    typeof meta?.landing_page_slug === "string" ? meta.landing_page_slug : undefined;
  if (landingSlug) {
    try {
      await updateLandingPageHeroImage(landingSlug, imageAssetUrl);
    } catch (e) {
      console.warn("Landing page hero update failed:", e);
    }
  }

  const queue = await repo.getLinkedInQueue(campaignId);
  const queueRow = (queue as Array<{ id: string }>)[0];
  if (queueRow) {
    await repo.updateLinkedInQueue(queueRow.id, { image_url: imageAssetUrl });
  }

  await logMarketingAction(repo, {
    campaignId,
    action: "openai_image_generated",
    actorType: "system",
    details: { imageAssetUrl },
  });

  return { imageUrl: generated.imageUrl ?? imageAssetUrl, imageAssetUrl };
}

/** Prefer OpenAI image; fall back to Canva when template + tokens configured. */
export async function runCampaignImageGeneration(
  supabase: SupabaseClient,
  campaignId: string
): Promise<{ source: "openai" | "canva"; imageAssetUrl: string }> {
  const repo = new MarketingRepository(supabase);
  const campaign = await repo.getCampaign(campaignId);
  if (!campaign) throw new Error("Campaign not found");

  const useCanva = Deno.env.get("MARKETING_IMAGE_PROVIDER") === "canva";

  if (useCanva && campaign.canva_template_id) {
    try {
      const result = await runCanvaDesign(supabase, campaignId);
      return { source: "canva", imageAssetUrl: result.imageAssetUrl ?? result.exportUrl };
    } catch {
      // fall through to OpenAI
    }
  }

  const result = await runOpenAIImageGeneration(supabase, campaignId);
  return { source: "openai", imageAssetUrl: result.imageAssetUrl };
}

export async function runCanvaDesign(
  supabase: SupabaseClient,
  campaignId: string
): Promise<{ designId: string; exportUrl: string; imageAssetUrl?: string }> {
  const repo = new MarketingRepository(supabase);
  const campaign = await repo.getCampaign(campaignId);
  if (!campaign) throw new Error("Campaign not found");

  const templateId = campaign.canva_template_id;
  if (!templateId) {
    throw new Error("No Canva template configured for this campaign");
  }

  let tokens = await loadTokensFromSettings((k) => repo.getSetting(k));
  if (!tokens) throw new Error("Canva tokens not configured");

  let accessToken = tokens.access_token;
  if (tokens.expires_at && new Date(tokens.expires_at) < new Date()) {
    accessToken = await refreshCanvaToken(tokens.refresh_token, async (t) => {
      await repo.upsertSetting("canva_oauth_tokens", t);
    });
  }

  const autofill = buildAutofillFields({
    ...campaign,
    call_to_action: (campaign.metadata as Record<string, unknown>)?.call_to_action as string,
  });

  const { designId } = await createDesignFromTemplate(accessToken, templateId, autofill);
  const exported = await exportDesign(accessToken, designId, "png");

  let imageAssetUrl = exported.exportUrl;

  try {
    const imgRes = await fetch(exported.exportUrl);
    if (imgRes.ok) {
      const buf = await imgRes.arrayBuffer();
      const path = `campaigns/${campaignId}/${designId}.png`;
      const { error } = await supabase.storage
        .from("marketing-assets")
        .upload(path, buf, { contentType: "image/png", upsert: true });
      if (!error) {
        const { data: urlData } = supabase.storage.from("marketing-assets").getPublicUrl(path);
        if (urlData?.publicUrl) imageAssetUrl = urlData.publicUrl;
      }
    }
  } catch {
    // Keep Canva export URL if storage upload fails
  }

  const updatedHtml = injectCanvaImage(
    campaign.email_html ?? "",
    imageAssetUrl,
    campaign.title ?? "UFF Marketing"
  );

  await repo.updateCampaign(campaignId, {
    canva_design_id: designId,
    canva_export_url: exported.exportUrl,
    image_asset_url: imageAssetUrl,
    email_html: updatedHtml,
    metadata: {
      ...(campaign.metadata as Record<string, unknown>),
      canva: { exportedAt: new Date().toISOString() },
    },
  });

  const queue = await repo.getLinkedInQueue(campaignId);
  const queueRow = (queue as Array<{ id: string }>)[0];
  if (queueRow) {
    await repo.updateLinkedInQueue(queueRow.id, { image_url: imageAssetUrl });
  }

  await logMarketingAction(repo, {
    campaignId,
    action: "canva_design_exported",
    actorType: "system",
    details: { designId, exportUrl: exported.exportUrl },
  });

  return { designId, exportUrl: exported.exportUrl, imageAssetUrl };
}

export async function runActiveCampaignSend(
  supabase: SupabaseClient,
  campaignId: string,
  opts: { scheduleAt?: Date; actorType?: "user" | "scheduler" } = {}
): Promise<void> {
  const repo = new MarketingRepository(supabase);
  const campaign = await repo.getCampaign(campaignId);
  if (!campaign) throw new Error("Campaign not found");

  const approvalSettings = await loadApprovalSettings((k) => repo.getSetting(k));
  const sendCheck = canSendCampaign(
    campaign.status,
    campaign.approval_required,
    campaign.campaign_type,
    approvalSettings.autoSendTrustedTypes
  );
  if (!sendCheck.allowed) {
    throw new Error(sendCheck.reason ?? "Send not allowed");
  }

  const meta = (campaign.metadata ?? {}) as Record<string, unknown>;
  if (meta.landing_page_status !== "published" || !meta.landing_page_url) {
    if (campaign.status === "approved" || !campaign.approval_required) {
      await publishLandingPageOnApproval(supabase, campaignId, opts.actorType ?? "user");
      const refreshed = await repo.getCampaign(campaignId);
      if (refreshed) Object.assign(campaign, refreshed);
    }
  }

  const isResend = campaign.status === "sent" || campaign.status === "scheduled" || campaign.status === "failed";

  const listId = await resolveSendListId(campaign, (k) => repo.getSetting(k));
  if (!listId) throw new Error("No ActiveCampaign list ID configured");

  const message = await createMessage({
    subject: campaign.email_subject ?? campaign.title ?? "UFF Update",
    html: campaign.email_html ?? "<p>UFF PRO Portal update</p>",
    text: campaign.email_text ?? undefined,
    preheader: campaign.preview_text ?? undefined,
  });

  const acCampaign = await acCreateCampaign({
    name: `UFF: ${campaign.title ?? campaign.campaign_type} ${new Date().toISOString().slice(0, 10)}${isResend ? ` resend ${Date.now()}` : ""}`,
    messageId: message.messageId,
    listIds: [listId],
    ...(opts.scheduleAt ? { sendAt: opts.scheduleAt } : { sendNow: true }),
  });

  if (opts.scheduleAt) {
    await repo.updateCampaign(campaignId, {
      status: "scheduled",
      activecampaign_list_id: listId,
      activecampaign_campaign_id: acCampaign.campaignId,
      activecampaign_message_id: message.messageId,
      scheduled_send_at: opts.scheduleAt.toISOString(),
      metadata: {
        ...(campaign.metadata as Record<string, unknown>),
        ac_responses: [
          ...(((campaign.metadata as Record<string, unknown>)?.ac_responses as unknown[]) ?? []),
          { message: message.raw, campaign: acCampaign.raw, resent: isResend },
        ],
        send_count: (((campaign.metadata as Record<string, unknown>)?.send_count as number) ?? 0) + 1,
      },
    });
  } else {
    await repo.updateCampaign(campaignId, {
      status: "sent",
      activecampaign_list_id: listId,
      activecampaign_campaign_id: acCampaign.campaignId,
      activecampaign_message_id: message.messageId,
      sent_at: new Date().toISOString(),
      metadata: {
        ...(campaign.metadata as Record<string, unknown>),
        ac_responses: [
          ...(((campaign.metadata as Record<string, unknown>)?.ac_responses as unknown[]) ?? []),
          { message: message.raw, campaign: acCampaign.raw, resent: isResend },
        ],
        send_count: (((campaign.metadata as Record<string, unknown>)?.send_count as number) ?? 0) + 1,
      },
    });

    if (!isResend) {
      await maybePublishLinkedIn(repo, campaignId, campaign);
    }
  }

  await logMarketingAction(repo, {
    campaignId,
    action: opts.scheduleAt ? "campaign_scheduled" : isResend ? "campaign_resent" : "campaign_sent",
    actorType: opts.actorType ?? "user",
    details: { acCampaignId: acCampaign.campaignId, resend: isResend },
  });
}

async function maybePublishLinkedIn(
  repo: MarketingRepository,
  campaignId: string,
  campaign: { linkedin_post?: string | null; image_asset_url?: string | null }
): Promise<void> {
  const linkedinRequire = (await repo.getSetting("linkedin_require_approval")) !== false;
  const autoPost = isLinkedInAutoPostEnabled();

  if (!autoPost || linkedinRequire) return;
  if (!isLinkedInConfigured() || !campaign.linkedin_post) return;

  const result = await publishOrganizationPost({
    text: campaign.linkedin_post,
    imageUrl: campaign.image_asset_url ?? undefined,
  });

  if (result.success) {
    const queue = await repo.getLinkedInQueue(campaignId);
    const row = (queue as Array<{ id: string }>)[0];
    if (row) {
      await repo.updateLinkedInQueue(row.id, {
        status: "published",
        published_at: new Date().toISOString(),
        publish_result: result.raw,
      });
    }
    await repo.insertMetrics({
      campaignId,
      source: "linkedin",
      raw_response: result.raw,
    });
  } else {
    await logMarketingAction(repo, {
      campaignId,
      action: "linkedin_publish_failed",
      actorType: "system",
      details: { error: result.error },
    });
  }
}

export async function syncCampaignMetrics(
  supabase: SupabaseClient,
  campaignId: string
): Promise<void> {
  const repo = new MarketingRepository(supabase);
  const campaign = await repo.getCampaign(campaignId);
  if (!campaign?.activecampaign_campaign_id) return;

  const report = await getCampaignReport(campaign.activecampaign_campaign_id);
  await repo.insertMetrics({
    campaignId,
    source: "activecampaign",
    sends: report.sends,
    opens: report.opens,
    clicks: report.clicks,
    unsubscribes: report.unsubscribes,
    bounces: report.bounces,
    spam_complaints: report.spamComplaints,
    raw_response: report.raw,
  });
}

export async function runPerformanceReview(supabase: SupabaseClient): Promise<void> {
  const repo = new MarketingRepository(supabase);
  const campaigns = await repo.listSentCampaignsForMetricsSync(20);
  const history: Array<{ subject: string; openRate: number; clickRate: number }> = [];

  for (const c of campaigns) {
    if (!c.activecampaign_campaign_id) continue;
    try {
      const report = await getCampaignReport(c.activecampaign_campaign_id);
      const openRate = report.sends > 0 ? report.opens / report.sends : 0;
      const clickRate = report.sends > 0 ? report.clicks / report.sends : 0;
      history.push({
        subject: c.email_subject ?? c.title ?? c.campaign_type,
        openRate,
        clickRate,
      });
    } catch {
      // skip failed reports
    }
  }

  history.sort((a, b) => b.openRate - a.openRate);
  await repo.upsertSetting("performance_history", history.slice(0, 20));

  await logMarketingAction(repo, {
    action: "performance_review_completed",
    actorType: "scheduler",
    details: { campaignsReviewed: history.length },
  });
}
