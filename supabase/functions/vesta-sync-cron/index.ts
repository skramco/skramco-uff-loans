import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  isServiceRoleRequest,
  serviceFunctionHeaders,
} from "../_shared/serviceFunctionAuth.ts";

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

/**
 * Scheduled worker: reset stuck jobs, backfill missing outbox rows, drain queue.
 * Invoke with the service key on the `apikey` header, or VESTA_CRON_SECRET.
 */
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: true, message: "Method not allowed" }, 405);
  }

  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const cronSecret = Deno.env.get("VESTA_CRON_SECRET") || "";
  const authHeader = req.headers.get("Authorization") || "";
  const serviceAuthed = isServiceRoleRequest(req, serviceKey);

  if (cronSecret) {
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (token !== cronSecret && !serviceAuthed) {
      return jsonResponse({ error: true, message: "Unauthorized" }, 401);
    }
  } else if (!serviceAuthed) {
    return jsonResponse({ error: true, message: "Unauthorized" }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  const { data: resetCount } = await supabase.rpc("reset_stuck_vesta_sync_jobs", {
    p_stale_minutes: 15,
  });

  const { data: backfillCount } = await supabase.rpc("backfill_vesta_sync_jobs", {
    p_limit: 50,
  });

  const nowIso = new Date().toISOString();

  const { data: pendingRows, error: pendingErr } = await supabase
    .from("vesta_sync_jobs")
    .select("loan_id")
    .eq("status", "pending")
    .limit(80);

  const { data: retryRows, error: retryErr } = await supabase
    .from("vesta_sync_jobs")
    .select("loan_id")
    .eq("status", "failed")
    .lte("next_retry_at", nowIso)
    .limit(80);

  if (pendingErr || retryErr) {
    return jsonResponse({
      error: true,
      message: pendingErr?.message || retryErr?.message,
    }, 500);
  }

  const loanIds = [
    ...new Set([
      ...(pendingRows || []).map((r: { loan_id: string }) => r.loan_id),
      ...(retryRows || []).map((r: { loan_id: string }) => r.loan_id),
    ]),
  ];

  const fnUrl = `${supabaseUrl}/functions/v1/vesta-sync-worker`;
  const results: unknown[] = [];

  for (const loanId of loanIds) {
    try {
      const r = await fetch(fnUrl, {
        method: "POST",
        headers: serviceFunctionHeaders(serviceKey),
        body: JSON.stringify({ loanId, serviceMode: true }),
      });
      const j = await r.json().catch(() => ({}));
      results.push({ loanId, status: r.status, body: j });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "fetch failed";
      results.push({ loanId, error: msg });
    }
  }

  return jsonResponse({
    success: true,
    resetStuck: resetCount ?? 0,
    backfilled: backfillCount ?? 0,
    drained: loanIds.length,
    results,
  });
});
