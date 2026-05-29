import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  buildVestaPayloadFromApplication,
  VESTA_MAPPING_VERSION,
} from "../_shared/buildVestaPayload.ts";

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
            next_retry_at: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", jobId);

        if (error) return errorResponse(error.message, 500);
        return jsonResponse({ success: true });
      }

      case "resetStuckVestaJobs": {
        const { data, error } = await supabase.rpc("reset_stuck_vesta_sync_jobs", {
          p_stale_minutes: 15,
        });
        if (error) return errorResponse(error.message, 500);
        return jsonResponse({ success: true, resetCount: data ?? 0 });
      }

      case "backfillVestaJobs": {
        const limit = Math.min(Number(body.limit) || 50, 100);
        const { data, error } = await supabase.rpc("backfill_vesta_sync_jobs", {
          p_limit: limit,
        });
        if (error) return errorResponse(error.message, 500);
        return jsonResponse({ success: true, backfilled: data ?? 0 });
      }

      case "runVestaSyncCron": {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
        const fnUrl = `${supabaseUrl}/functions/v1/vesta-sync-cron`;
        const r = await fetch(fnUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${serviceKey}`,
            apikey: anonKey,
            "Content-Type": "application/json",
          },
          body: "{}",
        });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) return errorResponse(j.message || "Cron run failed", r.status);
        return jsonResponse({ success: true, ...j });
      }

      case "listVestaPushLoans": {
        const filter = (body.filter as string) || "needs_sync";
        const limit = Math.min(Number(body.limit) || 100, 200);

        let query = supabase
          .from("loans")
          .select(
            "id, temp_loan_number, vesta_loan_id, vesta_sync_status, submitted_at, loan_application_data, loan_amount, loan_type, property_address"
          )
          .eq("is_submitted", true)
          .order("submitted_at", { ascending: false })
          .limit(limit);

        if (filter === "needs_sync") {
          query = query.is("vesta_loan_id", null);
        } else if (filter === "synced") {
          query = query.not("vesta_loan_id", "is", null);
        }

        const { data: loans, error: listErr } = await query;
        if (listErr) return errorResponse(listErr.message, 500);

        const loanIds = (loans || []).map((l: { id: string }) => l.id);
        const { data: jobs } = loanIds.length
          ? await supabase
            .from("vesta_sync_jobs")
            .select("loan_id, status, last_error, attempt_count, updated_at")
            .in("loan_id", loanIds)
            .order("created_at", { ascending: false })
          : { data: [] };

        const jobByLoan = new Map<string, Record<string, unknown>>();
        for (const j of jobs || []) {
          if (!jobByLoan.has(j.loan_id)) jobByLoan.set(j.loan_id, j);
        }

        const rows = (loans || []).map((loan: Record<string, unknown>) => {
          const app = (loan.loan_application_data || {}) as Record<string, unknown>;
          const pi = (app.personalInfo || {}) as Record<string, unknown>;
          const ld = (app.loanDetails || {}) as Record<string, unknown>;
          const job = jobByLoan.get(loan.id as string);
          return {
            id: loan.id,
            tempLoanNumber: loan.temp_loan_number,
            vestaLoanId: loan.vesta_loan_id,
            vestaSyncStatus: loan.vesta_sync_status,
            submittedAt: loan.submitted_at,
            loanAmount: loan.loan_amount ?? ld.loanAmount,
            loanType: loan.loan_type ?? ld.loanType,
            loanPurpose: ld.loanPurpose,
            propertyAddress: loan.property_address,
            borrowerName: [pi.firstName, pi.lastName].filter(Boolean).join(" ") || null,
            borrowerEmail: pi.email ?? null,
            jobStatus: (job?.status as string) ?? null,
            jobLastError: (job?.last_error as string) ?? null,
            jobAttemptCount: (job?.attempt_count as number) ?? 0,
          };
        });

        return jsonResponse({ success: true, loans: rows, filter });
      }

      case "deleteLoanApplication": {
        const loanId = body.loanId as string | undefined;
        if (!loanId) return errorResponse("loanId is required");

        const { data: loan, error: loanErr } = await supabase
          .from("loans")
          .select("id, temp_loan_number, vesta_loan_id, loan_application_data")
          .eq("id", loanId)
          .maybeSingle();

        if (loanErr || !loan) return errorResponse("Loan not found", 404);

        const { error: delErr } = await supabase
          .from("loans")
          .delete()
          .eq("id", loanId);

        if (delErr) return errorResponse(delErr.message, 500);

        return jsonResponse({
          success: true,
          deletedLoanId: loanId,
          hadVestaLoanId: Boolean(loan.vesta_loan_id),
          message:
            "Application removed from portal database. Vesta loan file was not deleted via API.",
        });
      }

      case "pushLoanToVesta": {
        const loanId = body.loanId as string | undefined;
        if (!loanId) return errorResponse("loanId is required");

        const { data: loan, error: loanErr } = await supabase
          .from("loans")
          .select(
            "id, is_submitted, vesta_loan_id, loan_application_data, vesta_sync_status"
          )
          .eq("id", loanId)
          .maybeSingle();

        if (loanErr || !loan) return errorResponse("Loan not found", 404);
        if (!loan.is_submitted) {
          return errorResponse("Loan must be submitted before pushing to Vesta", 400);
        }
        if (loan.vesta_loan_id) {
          return jsonResponse({
            success: true,
            alreadySynced: true,
            vestaLoanId: loan.vesta_loan_id,
          });
        }
        if (!loan.loan_application_data) {
          return errorResponse("Loan has no application data to sync", 400);
        }

        const payload = buildVestaPayloadFromApplication(
          loan.loan_application_data as Record<string, unknown>
        );

        const { error: upsertErr } = await supabase.from("vesta_sync_jobs").upsert(
          {
            loan_id: loanId,
            operation: "create_loan",
            idempotency_key: `create_loan:${loanId}`,
            payload_json: payload,
            mapping_version: VESTA_MAPPING_VERSION,
            status: "pending",
            last_error: null,
            next_retry_at: null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "idempotency_key" }
        );
        if (upsertErr) return errorResponse(upsertErr.message, 500);

        await supabase
          .from("loans")
          .update({
            vesta_sync_status: "queued",
            updated_at: new Date().toISOString(),
          })
          .eq("id", loanId);

        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
        const fnUrl = `${supabaseUrl}/functions/v1/vesta-sync-worker`;

        const workerRes = await fetch(fnUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${serviceKey}`,
            apikey: anonKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ loanId, serviceMode: true }),
        });
        const workerBody = await workerRes.json().catch(() => ({}));

        const { data: updated } = await supabase
          .from("loans")
          .select("vesta_loan_id, vesta_sync_status")
          .eq("id", loanId)
          .maybeSingle();

        return jsonResponse({
          success: workerBody.success !== false && workerRes.ok,
          vestaLoanId: updated?.vesta_loan_id ?? workerBody.vestaLoanId ?? null,
          vestaSyncStatus: updated?.vesta_sync_status,
          worker: workerBody,
        });
      }

      case "drainVestaSyncQueue": {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

        await supabase.rpc("reset_stuck_vesta_sync_jobs", { p_stale_minutes: 15 });
        await supabase.rpc("backfill_vesta_sync_jobs", { p_limit: 50 });

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
          return errorResponse(pendingErr?.message || retryErr?.message || "Query failed", 500);
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
