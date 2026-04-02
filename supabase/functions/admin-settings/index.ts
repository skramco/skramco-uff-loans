import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
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

function getSupabaseClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

function getEnvironmentStatus() {
  return {
    dev: {
      apiUrl: "https://uff.beta.vesta.com/api/v1",
      hasApiKey: !!(
        Deno.env.get("VESTA_DEV_API_KEY") || Deno.env.get("VESTA_API_KEY")
      ),
      apiVersion:
        Deno.env.get("VESTA_DEV_API_VERSION") ||
        Deno.env.get("VESTA_API_VERSION") ||
        "26.1",
    },
    production: {
      apiUrl: "https://uff.vesta.com/api/v1",
      hasApiKey: !!Deno.env.get("VESTA_PROD_API_KEY"),
      apiVersion: Deno.env.get("VESTA_PROD_API_VERSION") || "26.1",
    },
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, password } = body;

    if (!ADMIN_PASSWORD) {
      return errorResponse(
        "Admin password not configured. Set the ADMIN_PASSWORD secret.",
        503
      );
    }

    if (action === "login") {
      if (password === ADMIN_PASSWORD) {
        return jsonResponse({ success: true });
      }
      return errorResponse("Invalid password", 401);
    }

    if (password !== ADMIN_PASSWORD) {
      return errorResponse("Unauthorized", 401);
    }

    const supabase = getSupabaseClient();

    switch (action) {
      case "getSettings": {
        const { data, error } = await supabase
          .from("admin_settings")
          .select("*")
          .eq("id", 1)
          .maybeSingle();

        if (error) return errorResponse(error.message, 500);

        return jsonResponse({
          settings: data || { vesta_environment: "dev" },
          envStatus: getEnvironmentStatus(),
        });
      }

      case "updateSettings": {
        const { vesta_environment } = body;

        if (!["dev", "production"].includes(vesta_environment)) {
          return errorResponse(
            "Invalid environment. Must be 'dev' or 'production'."
          );
        }

        const { error } = await supabase.from("admin_settings").upsert({
          id: 1,
          vesta_environment,
          updated_at: new Date().toISOString(),
        });

        if (error) return errorResponse(error.message, 500);

        return jsonResponse({ success: true, vesta_environment });
      }

      case "getVestaReconciliation": {
        const { count: submittedNoVesta } = await supabase
          .from("loans")
          .select("id", { count: "exact", head: true })
          .eq("is_submitted", true)
          .is("vesta_loan_id", null);

        const { count: pendingJobs } = await supabase
          .from("vesta_sync_jobs")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending");

        const { count: failedJobs } = await supabase
          .from("vesta_sync_jobs")
          .select("id", { count: "exact", head: true })
          .eq("status", "failed");

        const { count: syncedJobs } = await supabase
          .from("vesta_sync_jobs")
          .select("id", { count: "exact", head: true })
          .eq("status", "succeeded");

        const { data: recentJobs, error: jobsErr } = await supabase
          .from("vesta_sync_jobs")
          .select(
            "id, loan_id, status, attempt_count, last_error, created_at, vesta_loan_id, idempotency_key, mapping_version"
          )
          .order("created_at", { ascending: false })
          .limit(40);

        if (jobsErr) return errorResponse(jobsErr.message, 500);

        return jsonResponse({
          counts: {
            submittedMissingVesta: submittedNoVesta ?? 0,
            pendingJobs: pendingJobs ?? 0,
            failedJobs: failedJobs ?? 0,
            succeededJobs: syncedJobs ?? 0,
          },
          recentJobs: recentJobs || [],
        });
      }

      case "retryVestaSyncJob": {
        const jobId = body.jobId as string | undefined;
        if (!jobId) return errorResponse("jobId is required");

        const { error } = await supabase
          .from("vesta_sync_jobs")
          .update({
            status: "pending",
            last_error: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", jobId);

        if (error) return errorResponse(error.message, 500);
        return jsonResponse({ success: true });
      }

      case "drainVestaSyncQueue": {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

        const { data: rows, error: qErr } = await supabase
          .from("vesta_sync_jobs")
          .select("loan_id")
          .eq("status", "pending")
          .limit(80);

        if (qErr) return errorResponse(qErr.message, 500);

        const loanIds = [
          ...new Set((rows || []).map((r: { loan_id: string }) => r.loan_id)),
        ];
        const fnUrl = `${supabaseUrl}/functions/v1/vesta-sync-worker`;
        const results: unknown[] = [];

        for (const loanId of loanIds) {
          try {
            const r = await fetch(fnUrl, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${serviceKey}`,
                apikey: anonKey,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ loanId, serviceMode: true }),
            });
            const j = await r.json().catch(() => ({}));
            results.push({ loanId, status: r.status, body: j });
          } catch (e: any) {
            results.push({ loanId, error: e?.message || "fetch failed" });
          }
        }

        return jsonResponse({ success: true, drained: loanIds.length, results });
      }

      default:
        return errorResponse(`Unknown action: ${action}`);
    }
  } catch (err: any) {
    return errorResponse(`Server error: ${err.message}`, 500);
  }
});
