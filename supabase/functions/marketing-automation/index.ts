import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  getEnvDefaultListId,
  getList,
  listLists,
  normalizeActiveCampaignApiUrl,
  parseListId,
  resolveActiveCampaignTimezone,
  resolveDefaultListId,
  resolveSendListId,
} from "../_shared/marketing/activeCampaignClient.ts";
import { logMarketingAction } from "../_shared/marketing/auditLog.ts";
import { loadApprovalSettings } from "../_shared/marketing/approvalRules.ts";
import {
  exchangeCanvaCode,
  listBrandTemplates,
  loadTokensFromSettings,
  refreshCanvaToken,
} from "../_shared/marketing/canvaClient.ts";
import { regenerateField } from "../_shared/marketing/campaignGenerator.ts";
import { parseEmailTone } from "../_shared/marketing/emailToneContext.ts";
import {
  isLinkedInAutoPostEnabled,
  publishOrganizationPost,
} from "../_shared/marketing/linkedInClient.ts";
import { MarketingRepository } from "../_shared/marketing/repository.ts";
import type { CampaignType, RegeneratableField } from "../_shared/marketing/types.ts";
import { isValidStatusTransition } from "../_shared/marketing/types.ts";
import {
  runActiveCampaignSend,
  runSingleBrokerGrowthTipCampaign,
  runCampaignGeneration,
  runCampaignImageGeneration,
  runCanvaDesign,
  runOpenAIImageGeneration,
  runPerformanceReview,
  syncCampaignMetrics,
  approveCampaignWithLanding,
  deleteMarketingCampaign,
} from "../_shared/marketing/workflow.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey, x-client-info, apikey, X-Supabase-Api-Version",
  "Access-Control-Max-Age": "86400",
};

const ADMIN_PASSWORD = Deno.env.get("ADMIN_PASSWORD") || "";

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function errorResponse(message: string, status = 400) {
  return jsonResponse({ error: true, message }, status);
}

function getSupabase() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

function isServiceAuth(req: Request): boolean {
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const cronSecret = Deno.env.get("MARKETING_CRON_SECRET") || "";
  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (cronSecret && token === cronSecret) return true;
  return authHeader === `Bearer ${serviceKey}`;
}

function checkAdminPassword(password: unknown): boolean {
  return !!ADMIN_PASSWORD && password === ADMIN_PASSWORD;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, password } = body;

    const serviceMode = isServiceAuth(req);
    const internalActions = new Set([
      "runScheduledJob",
      "syncAllMetrics",
      "runPerformanceReview",
    ]);

    if (!serviceMode && !internalActions.has(action)) {
      if (!ADMIN_PASSWORD) {
        return errorResponse("ADMIN_PASSWORD not configured", 503);
      }
      if (!checkAdminPassword(password)) {
        return errorResponse("Unauthorized", 401);
      }
    }

    const supabase = getSupabase();
    const repo = new MarketingRepository(supabase);

    switch (action) {
      case "generateCampaign": {
        const campaignType = body.campaignType as CampaignType;
        if (!campaignType) return errorResponse("campaignType required");

        const result = await runCampaignGeneration(supabase, {
          campaignType,
          templateId: body.templateId,
          audienceListId: body.audienceListId,
          useVestaInsights: body.useVestaInsights === true,
          actorType: "user",
          emailTone: body.emailTone ? parseEmailTone(body.emailTone) : undefined,
        });

        const campaign = await repo.getCampaign(result.campaignId);
        return jsonResponse({ success: true, campaign, content: result.content });
      }

      case "generateBrokerGrowthTip": {
        const recent = await repo.listCampaigns({
          campaignType: "broker_business_growth_tip",
          limit: 20,
        });
        const excludeTitles = recent
          .map((c) => c.title)
          .filter((t): t is string => !!t);

        const result = await runSingleBrokerGrowthTipCampaign(supabase, {
          actorType: "user",
          excludeTitles,
          emailTone: body.emailTone ? parseEmailTone(body.emailTone) : undefined,
        });
        const campaign = await repo.getCampaign(result.campaignId);
        return jsonResponse({
          success: true,
          campaign,
          tip: result.tip,
        });
      }

      case "getCampaign": {
        const campaign = await repo.getCampaign(body.campaignId);
        if (!campaign) return errorResponse("Campaign not found", 404);
        return jsonResponse({ campaign });
      }

      case "listCampaigns": {
        const campaigns = await repo.listCampaigns({
          status: body.status,
          campaignType: body.campaignType,
          limit: body.limit ?? 50,
          offset: body.offset,
        });
        return jsonResponse({ campaigns });
      }

      case "updateCampaign": {
        const campaign = await repo.getCampaign(body.campaignId);
        if (!campaign) return errorResponse("Campaign not found", 404);

        const allowed = [
          "title", "internal_summary", "email_subject", "preview_text",
          "email_html", "email_text", "linkedin_post", "canva_prompt",
          "canva_template_id", "activecampaign_list_id", "scheduled_send_at",
        ];
        const patch: Record<string, unknown> = {};
        for (const k of allowed) {
          if (body[k] !== undefined) patch[k] = body[k];
        }

        const updated = await repo.updateCampaign(body.campaignId, patch);
        await logMarketingAction(repo, {
          campaignId: body.campaignId,
          action: "campaign_updated",
          actorType: "user",
          details: { fields: Object.keys(patch) },
        });
        return jsonResponse({ success: true, campaign: updated });
      }

      case "regenerateField": {
        const campaign = await repo.getCampaign(body.campaignId);
        if (!campaign) return errorResponse("Campaign not found", 404);

        const field = body.field as RegeneratableField;
        if (!field) return errorResponse("field required");

        const meta = (campaign.metadata ?? {}) as Record<string, unknown>;
        const patch = await regenerateField(
          repo,
          campaign.campaign_type as CampaignType,
          field,
          {
            title: campaign.title ?? undefined,
            email_subject: campaign.email_subject ?? undefined,
            preview_text: campaign.preview_text ?? undefined,
            email_html: campaign.email_html ?? undefined,
            email_text: campaign.email_text ?? undefined,
            linkedin_post: campaign.linkedin_post ?? undefined,
            canva_prompt: campaign.canva_prompt ?? undefined,
            call_to_action:
              typeof meta.call_to_action === "string" ? meta.call_to_action : undefined,
            internal_summary: campaign.internal_summary ?? undefined,
            landing_page_url:
              typeof meta.landing_page_url === "string" ? meta.landing_page_url : undefined,
          },
          parseEmailTone(meta.email_tone)
        );

        const updateMap: Record<string, string> = {
          subject: "email_subject",
          linkedin: "linkedin_post",
          canva_prompt: "canva_prompt",
          email_html: "email_html",
        };

        const dbPatch: Record<string, unknown> = {};
        if (field === "subject") {
          dbPatch.email_subject = patch.email_subject;
          dbPatch.preview_text = patch.preview_text;
        } else if (field === "linkedin") {
          dbPatch.linkedin_post = patch.linkedin_post;
        } else if (field === "canva_prompt") {
          dbPatch.canva_prompt = patch.canva_prompt;
        } else if (field === "email_html") {
          dbPatch.email_html = patch.email_html;
          dbPatch.email_text = patch.email_text;
        }

        const updated = await repo.updateCampaign(body.campaignId, dbPatch);
        await logMarketingAction(repo, {
          campaignId: body.campaignId,
          action: `regenerated_${field}`,
          actorType: "user",
        });
        return jsonResponse({ success: true, campaign: updated });
      }

      case "approveCampaign": {
        const campaign = await repo.getCampaign(body.campaignId);
        if (!campaign) return errorResponse("Campaign not found", 404);
        if (!isValidStatusTransition(campaign.status, "approved")) {
          return errorResponse(`Cannot approve from status ${campaign.status}`);
        }

        try {
          const updated = await approveCampaignWithLanding(supabase, body.campaignId, "user");
          return jsonResponse({ success: true, campaign: updated });
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Approval failed";
          return errorResponse(msg, 500);
        }
      }

      case "deleteCampaign": {
        const campaign = await repo.getCampaign(body.campaignId);
        if (!campaign) return errorResponse("Campaign not found", 404);
        try {
          await deleteMarketingCampaign(supabase, body.campaignId, "user");
          return jsonResponse({ success: true });
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Delete failed";
          return errorResponse(msg, 400);
        }
      }

      case "rejectCampaign": {
        const updated = await repo.transitionStatus(body.campaignId, "draft");
        await logMarketingAction(repo, {
          campaignId: body.campaignId,
          action: "campaign_rejected",
          actorType: "user",
        });
        return jsonResponse({ success: true, campaign: updated });
      }

      case "cancelCampaign": {
        const updated = await repo.transitionStatus(body.campaignId, "cancelled");
        await logMarketingAction(repo, {
          campaignId: body.campaignId,
          action: "campaign_cancelled",
          actorType: "user",
        });
        return jsonResponse({ success: true, campaign: updated });
      }

      case "getTemplates": {
        const templates = await repo.listTemplates();
        return jsonResponse({ templates });
      }

      case "updateTemplate": {
        const updated = await repo.updateTemplate(body.templateId, body.patch ?? {});
        return jsonResponse({ success: true, template: updated });
      }

      case "getSettings": {
        const settings = await repo.getAllSettings();
        const effectiveListId = await resolveDefaultListId((k) => repo.getSetting(k));
        const acTimezone = await resolveActiveCampaignTimezone();
        const integrationStatus = {
          openai: !!Deno.env.get("OPENAI_API_KEY"),
          openaiImages: !!Deno.env.get("OPENAI_API_KEY"),
          activecampaign: !!(Deno.env.get("ACTIVECAMPAIGN_API_URL") && Deno.env.get("ACTIVECAMPAIGN_API_KEY")),
          canva: !!(Deno.env.get("CANVA_CLIENT_ID") || Deno.env.get("CANVA_ACCESS_TOKEN")),
          linkedin: isLinkedInAutoPostEnabled(),
          defaultListId: effectiveListId ?? null,
          settingsListId: parseListId(settings.activecampaign_default_list_id) ?? null,
          envListId: getEnvDefaultListId() ?? null,
          activecampaignTimezone: acTimezone,
        };
        return jsonResponse({ settings, integrationStatus });
      }

      case "updateSettings": {
        const { key, value } = body;
        if (!key) return errorResponse("key required");
        await repo.upsertSetting(key, value);
        await logMarketingAction(repo, {
          action: "settings_updated",
          actorType: "user",
          details: { key },
        });
        return jsonResponse({ success: true });
      }

      case "getAuditLog": {
        const logs = await repo.getAuditLog(body.campaignId, body.limit ?? 100);
        return jsonResponse({ logs });
      }

      case "getMetrics": {
        const metrics = await repo.getMetrics(body.campaignId, body.limit ?? 100);
        return jsonResponse({ metrics });
      }

      // Phase 2 — ActiveCampaign
      case "listActiveCampaignLists": {
        const apiUrlRaw = Deno.env.get("ACTIVECAMPAIGN_API_URL");
        const apiKey = Deno.env.get("ACTIVECAMPAIGN_API_KEY");
        if (!apiUrlRaw || !apiKey) {
          return jsonResponse({ lists: [], configured: false });
        }
        const apiUrl = normalizeActiveCampaignApiUrl(apiUrlRaw);
        const lists = await listLists();
        return jsonResponse({ lists, configured: true, apiUrl });
      }

      case "getActiveCampaignList": {
        const list = await getList(body.listId);
        return jsonResponse({ list });
      }

      case "createActiveCampaignDraft": {
        const campaign = await repo.getCampaign(body.campaignId);
        if (!campaign) return errorResponse("Campaign not found", 404);

        const { createMessage, createCampaign: acCreate } = await import(
          "../_shared/marketing/activeCampaignClient.ts"
        );
        const listId = await resolveSendListId(campaign, (k) => repo.getSetting(k));
        if (!listId) return errorResponse("No ActiveCampaign list configured");

        const message = await createMessage({
          subject: campaign.email_subject ?? campaign.title ?? "UFF",
          html: campaign.email_html ?? "",
          text: campaign.email_text ?? undefined,
          preheader: campaign.preview_text ?? undefined,
        });

        const acCampaign = await acCreate({
          name: `DRAFT: ${campaign.title ?? campaign.id}`,
          messageId: message.messageId,
          listIds: [listId],
          draft: true,
        });

        const updated = await repo.updateCampaign(body.campaignId, {
          activecampaign_campaign_id: acCampaign.campaignId,
          activecampaign_message_id: message.messageId,
          metadata: {
            ...(campaign.metadata as Record<string, unknown>),
            ac_draft: true,
          },
        });

        await logMarketingAction(repo, {
          campaignId: body.campaignId,
          action: "ac_draft_created",
          actorType: "user",
        });
        return jsonResponse({ success: true, campaign: updated });
      }

      case "scheduleCampaign": {
        const scheduleAt = body.scheduledSendAt
          ? new Date(body.scheduledSendAt)
          : undefined;
        if (!scheduleAt || isNaN(scheduleAt.getTime())) {
          return errorResponse("scheduledSendAt required");
        }
        await runActiveCampaignSend(supabase, body.campaignId, {
          scheduleAt,
          actorType: "user",
        });
        const campaign = await repo.getCampaign(body.campaignId);
        return jsonResponse({ success: true, campaign });
      }

      case "sendCampaign": {
        await runActiveCampaignSend(supabase, body.campaignId, { actorType: "user" });
        const campaign = await repo.getCampaign(body.campaignId);
        return jsonResponse({ success: true, campaign });
      }

      case "sendTestEmail": {
        return errorResponse(
          "Test sends require ActiveCampaign list segment configuration — use createActiveCampaignDraft and AC UI for test sends",
          501
        );
      }

      // Phase 3 — Canva
      case "generateCanvaDesign": {
        const result = await runCanvaDesign(supabase, body.campaignId);
        const campaign = await repo.getCampaign(body.campaignId);
        return jsonResponse({ success: true, ...result, campaign });
      }

      case "generateCampaignImage": {
        const result = await runCampaignImageGeneration(supabase, body.campaignId);
        const campaign = await repo.getCampaign(body.campaignId);
        return jsonResponse({ success: true, ...result, campaign });
      }

      case "canvaOAuthCallback": {
        if (!body.code) return errorResponse("code required");
        const tokens = await exchangeCanvaCode(body.code, async (t) => {
          await repo.upsertSetting("canva_oauth_tokens", t);
        });
        await logMarketingAction(repo, {
          action: "canva_oauth_completed",
          actorType: "user",
        });
        return jsonResponse({ success: true, expires_at: tokens.expires_at });
      }

      case "refreshCanvaToken": {
        const tokens = await loadTokensFromSettings((k) => repo.getSetting(k));
        if (!tokens?.refresh_token) return errorResponse("No Canva refresh token");
        await refreshCanvaToken(tokens.refresh_token, async (t) => {
          await repo.upsertSetting("canva_oauth_tokens", t);
        });
        return jsonResponse({ success: true });
      }

      case "listCanvaTemplates": {
        const tokens = await loadTokensFromSettings((k) => repo.getSetting(k));
        if (!tokens) return errorResponse("Canva not connected", 503);
        const templates = await listBrandTemplates(tokens.access_token);
        return jsonResponse({ templates });
      }

      // Phase 5 — LinkedIn
      case "getLinkedInQueue": {
        const queue = await repo.getLinkedInQueue(body.campaignId);
        return jsonResponse({ queue });
      }

      case "publishLinkedInPost": {
        const campaign = await repo.getCampaign(body.campaignId);
        if (!campaign?.linkedin_post) return errorResponse("No LinkedIn post content");

        const result = await publishOrganizationPost({
          text: campaign.linkedin_post,
          imageUrl: campaign.image_asset_url ?? undefined,
        });

        const queue = await repo.getLinkedInQueue(body.campaignId);
        const row = (queue as Array<{ id: string }>)[0];
        if (row) {
          await repo.updateLinkedInQueue(row.id, {
            status: result.success ? "published" : "failed",
            published_at: result.success ? new Date().toISOString() : null,
            publish_result: result.raw,
          });
        }

        await logMarketingAction(repo, {
          campaignId: body.campaignId,
          action: result.success ? "linkedin_published" : "linkedin_publish_failed",
          actorType: "user",
          details: { error: result.error },
        });

        return jsonResponse({ success: result.success, result });
      }

      case "markLinkedInPublished": {
        const queue = await repo.getLinkedInQueue(body.campaignId);
        const row = (queue as Array<{ id: string }>)[0];
        if (row) {
          await repo.updateLinkedInQueue(row.id, {
            status: "published",
            published_at: new Date().toISOString(),
            publish_result: { manual: true },
          });
        }
        return jsonResponse({ success: true });
      }

      // Phase 6 — Metrics
      case "syncCampaignMetrics": {
        await syncCampaignMetrics(supabase, body.campaignId);
        const metrics = await repo.getMetrics(body.campaignId, 5);
        return jsonResponse({ success: true, metrics });
      }

      case "syncAllMetrics": {
        const campaigns = await repo.listSentCampaignsForMetricsSync(50);
        const results: unknown[] = [];
        for (const c of campaigns) {
          try {
            await syncCampaignMetrics(supabase, c.id);
            results.push({ campaignId: c.id, success: true });
          } catch (e) {
            results.push({
              campaignId: c.id,
              success: false,
              error: e instanceof Error ? e.message : "failed",
            });
          }
        }
        return jsonResponse({ success: true, results });
      }

      case "runPerformanceReview": {
        await runPerformanceReview(supabase);
        return jsonResponse({ success: true });
      }

      case "getIntegrationStatus": {
        const approvalSettings = await loadApprovalSettings((k) => repo.getSetting(k));
        return jsonResponse({
          openai: !!Deno.env.get("OPENAI_API_KEY"),
          openaiImages: !!Deno.env.get("OPENAI_API_KEY"),
          activecampaign: !!(Deno.env.get("ACTIVECAMPAIGN_API_URL") && Deno.env.get("ACTIVECAMPAIGN_API_KEY")),
          canva: !!(Deno.env.get("CANVA_ACCESS_TOKEN") || Deno.env.get("CANVA_CLIENT_ID")),
          linkedin: isLinkedInAutoPostEnabled(),
          approvalSettings,
        });
      }

      default:
        return errorResponse(`Unknown action: ${action}`, 400);
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal error";
    console.error("marketing-automation error:", msg);
    return errorResponse(msg, 500);
  }
});
