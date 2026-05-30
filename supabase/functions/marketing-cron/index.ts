import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { loadApprovalSettings } from "../_shared/marketing/approvalRules.ts";
import { buildIdempotencyKey } from "../_shared/marketing/idempotency.ts";
import { MarketingRepository } from "../_shared/marketing/repository.ts";
import type { CampaignType } from "../_shared/marketing/types.ts";
import {
  runActiveCampaignSend,
  runCampaignGeneration,
  runPerformanceReview,
  syncCampaignMetrics,
} from "../_shared/marketing/workflow.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

interface ScheduleConfig {
  enabled?: boolean;
  weekdaysOnly?: boolean;
  weekday?: number;
  hour?: number;
  minute?: number;
  timezone?: string;
  campaignType?: string;
}

function isJobDue(config: ScheduleConfig, now: Date): boolean {
  if (config.enabled === false) return false;

  const tz = config.timezone ?? "America/New_York";
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  });
  const parts = formatter.formatToParts(now);
  const weekday = parts.find((p) => p.type === "weekday")?.value ?? "";
  const hour = parseInt(parts.find((p) => p.type === "hour")?.value ?? "0", 10);
  const minute = parseInt(parts.find((p) => p.type === "minute")?.value ?? "0", 10);

  const weekdayMap: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  };
  const dow = weekdayMap[weekday] ?? 0;

  if (config.weekdaysOnly && (dow === 0 || dow === 6)) return false;
  if (config.weekday !== undefined && dow !== config.weekday) return false;

  const targetHour = config.hour ?? 9;
  const targetMinute = config.minute ?? 0;

  return hour === targetHour && minute >= targetMinute && minute < targetMinute + 15;
}

async function runScheduledCampaignJob(
  supabase: ReturnType<typeof createClient>,
  repo: MarketingRepository,
  jobType: string,
  campaignType: CampaignType,
  autoSend: boolean
): Promise<{ skipped?: boolean; campaignId?: string; error?: string }> {
  const idempotencyKey = buildIdempotencyKey(jobType, new Date());
  const claim = await repo.claimSchedulerRun(idempotencyKey, jobType);
  if (!claim.claimed) return { skipped: true };

  try {
    const { campaignId } = await runCampaignGeneration(supabase, {
      campaignType,
      useVestaInsights: jobType === "weekly_broker_newsletter",
      actorType: "scheduler",
    });

    const campaign = await repo.getCampaign(campaignId);

    if (autoSend && !campaign?.approval_required) {
      await runActiveCampaignSend(supabase, campaignId, { actorType: "scheduler" });
    }

    if (claim.runId) {
      await repo.completeSchedulerRun(claim.runId, "completed", { campaignId }, campaignId);
    }
    return { campaignId };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "failed";
    if (claim.runId) {
      await repo.completeSchedulerRun(claim.runId, "failed", { error: msg });
    }
    return { error: msg };
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: true, message: "Method not allowed" }, 405);
  }

  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const cronSecret = Deno.env.get("MARKETING_CRON_SECRET") || "";
  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");

  if (cronSecret) {
    if (token !== cronSecret && authHeader !== `Bearer ${serviceKey}`) {
      return jsonResponse({ error: true, message: "Unauthorized" }, 401);
    }
  } else if (authHeader !== `Bearer ${serviceKey}`) {
    return jsonResponse({ error: true, message: "Unauthorized" }, 401);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    serviceKey
  );
  const repo = new MarketingRepository(supabase);
  const now = new Date();
  const results: Record<string, unknown> = {};

  const body = await req.json().catch(() => ({}));
  const forceJob = body.jobType as string | undefined;

  const approvalSettings = await loadApprovalSettings((k) => repo.getSetting(k));
  const autoSend = approvalSettings.autoSendTrustedTypes.length > 0;

  const dailyRate = (await repo.getSetting("daily_rate_schedule")) as ScheduleConfig | null;
  const dailyFeature = (await repo.getSetting("daily_feature_schedule")) as ScheduleConfig | null;
  const weeklyNewsletter = (await repo.getSetting("weekly_newsletter_schedule")) as ScheduleConfig | null;

  if (forceJob === "daily_rate_update" || (!forceJob && dailyRate && isJobDue(dailyRate, now))) {
    results.daily_rate_update = await runScheduledCampaignJob(
      supabase,
      repo,
      "daily_rate_update",
      (dailyRate?.campaignType ?? "daily_rate_update") as CampaignType,
      autoSend
    );
  }

  if (forceJob === "daily_feature_spotlight" || (!forceJob && dailyFeature && isJobDue(dailyFeature, now))) {
    results.daily_feature_spotlight = await runScheduledCampaignJob(
      supabase,
      repo,
      "daily_feature_spotlight",
      (dailyFeature?.campaignType ?? "pro_portal_feature_spotlight") as CampaignType,
      autoSend
    );
  }

  if (forceJob === "weekly_broker_newsletter" || (!forceJob && weeklyNewsletter && isJobDue(weeklyNewsletter, now))) {
    results.weekly_broker_newsletter = await runScheduledCampaignJob(
      supabase,
      repo,
      "weekly_broker_newsletter",
      (weeklyNewsletter?.campaignType ?? "weekly_broker_newsletter") as CampaignType,
      autoSend
    );
  }

  // Metrics sync every 6 hours (when minute is 0 and hour divisible by 6)
  const shouldSyncMetrics =
    forceJob === "metrics_sync" ||
    (!forceJob && now.getUTCMinutes() < 15 && now.getUTCHours() % 6 === 0);

  if (shouldSyncMetrics) {
    const metricsKey = buildIdempotencyKey("metrics_sync", now);
    const claim = await repo.claimSchedulerRun(metricsKey, "metrics_sync");
    if (claim.claimed) {
      const campaigns = await repo.listSentCampaignsForMetricsSync(50);
      const syncResults: unknown[] = [];
      for (const c of campaigns) {
        try {
          await syncCampaignMetrics(supabase, c.id);
          syncResults.push({ campaignId: c.id, ok: true });
        } catch (e) {
          syncResults.push({
            campaignId: c.id,
            ok: false,
            error: e instanceof Error ? e.message : "failed",
          });
        }
      }
      if (claim.runId) {
        await repo.completeSchedulerRun(claim.runId, "completed", { syncResults });
      }
      results.metrics_sync = { synced: syncResults.length };
    } else {
      results.metrics_sync = { skipped: true };
    }
  }

  // Performance review — Sunday 10 AM ET window
  const shouldReview =
    forceJob === "performance_review" ||
    (!forceJob && now.getUTCDay() === 0 && now.getUTCHours() === 15 && now.getUTCMinutes() < 15);

  if (shouldReview) {
    const reviewKey = buildIdempotencyKey("performance_review", now);
    const claim = await repo.claimSchedulerRun(reviewKey, "performance_review");
    if (claim.claimed) {
      await runPerformanceReview(supabase);
      if (claim.runId) {
        await repo.completeSchedulerRun(claim.runId, "completed", {});
      }
      results.performance_review = { completed: true };
    } else {
      results.performance_review = { skipped: true };
    }
  }

  return jsonResponse({ success: true, timestamp: now.toISOString(), results });
});
