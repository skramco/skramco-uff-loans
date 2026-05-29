import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  computeNextRetryAt,
  getVestaConfig,
  postCreateLoan,
  VESTA_MAX_SYNC_ATTEMPTS,
} from "../_shared/vestaCreateLoan.ts";

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

async function resetStuckJobs(supabaseService: ReturnType<typeof createClient>) {
  await supabaseService.rpc("reset_stuck_vesta_sync_jobs", { p_stale_minutes: 15 });
}

async function markJobSuccess(
  supabaseService: ReturnType<typeof createClient>,
  jobId: string,
  loanId: string,
  vestaId: string,
  vestaLoanNumber: string | null,
  now: string
) {
  await supabaseService
    .from("vesta_sync_jobs")
    .update({
      status: "succeeded",
      vesta_loan_id: vestaId,
      last_error: null,
      next_retry_at: null,
      updated_at: now,
    })
    .eq("id", jobId);

  const loanUpdate: Record<string, unknown> = {
    vesta_loan_id: vestaId,
    vesta_sync_status: "synced",
    updated_at: now,
  };
  if (vestaLoanNumber) {
    loanUpdate.vesta_loan_number = vestaLoanNumber;
  }

  await supabaseService.from("loans").update(loanUpdate).eq("id", loanId);
}

async function markJobFailure(
  supabaseService: ReturnType<typeof createClient>,
  job: { id: string; attempt_count: number },
  loanId: string,
  errMsg: string,
  now: string
) {
  const canRetry = job.attempt_count < VESTA_MAX_SYNC_ATTEMPTS;
  const nextStatus = canRetry ? "pending" : "dead_letter";
  const loanStatus = canRetry ? "queued" : "failed";

  await supabaseService
    .from("vesta_sync_jobs")
    .update({
      status: nextStatus,
      last_error: errMsg,
      next_retry_at: canRetry ? computeNextRetryAt(job.attempt_count) : null,
      updated_at: now,
    })
    .eq("id", job.id);

  await supabaseService
    .from("loans")
    .update({
      vesta_sync_status: loanStatus,
      updated_at: now,
    })
    .eq("id", loanId);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: true, message: "Method not allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  const authHeader = req.headers.get("Authorization") || "";
  const body = await req.json().catch(() => ({}));
  const loanId = body.loanId as string | undefined;
  const serviceMode = body.serviceMode === true;

  if (!loanId) {
    return jsonResponse({ error: true, message: "loanId is required" }, 400);
  }

  const supabaseService = createClient(supabaseUrl, serviceKey);
  await resetStuckJobs(supabaseService);

  const isServiceCaller = authHeader === `Bearer ${serviceKey}`;

  if (serviceMode) {
    if (!isServiceCaller) {
      return jsonResponse({ error: true, message: "Unauthorized" }, 401);
    }
  } else {
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) {
      return jsonResponse({ error: true, message: "Unauthorized" }, 401);
    }

    const { data: loan, error: loanErr } = await supabaseService
      .from("loans")
      .select("borrower_id, vesta_loan_id")
      .eq("id", loanId)
      .maybeSingle();

    if (loanErr || !loan) {
      return jsonResponse({ error: true, message: "Loan not found" }, 404);
    }
    if (loan.borrower_id !== user.id) {
      return jsonResponse({ error: true, message: "Forbidden" }, 403);
    }
    if (loan.vesta_loan_id) {
      await supabaseService
        .from("vesta_sync_jobs")
        .update({
          status: "succeeded",
          vesta_loan_id: loan.vesta_loan_id,
          updated_at: new Date().toISOString(),
        })
        .eq("loan_id", loanId)
        .in("status", ["pending", "processing", "failed"]);

      await supabaseService
        .from("loans")
        .update({
          vesta_sync_status: "synced",
          updated_at: new Date().toISOString(),
        })
        .eq("id", loanId);

      return jsonResponse({
        processed: 0,
        message: "Already linked to Vesta",
        vestaLoanId: loan.vesta_loan_id,
        success: true,
      });
    }
  }

  const { data: existingLoan } = await supabaseService
    .from("loans")
    .select("vesta_loan_id")
    .eq("id", loanId)
    .maybeSingle();

  if (existingLoan?.vesta_loan_id) {
    await supabaseService
      .from("vesta_sync_jobs")
      .update({
        status: "succeeded",
        vesta_loan_id: existingLoan.vesta_loan_id,
        updated_at: new Date().toISOString(),
      })
      .eq("loan_id", loanId)
      .in("status", ["pending", "processing", "failed"]);

    await supabaseService
      .from("loans")
      .update({
        vesta_sync_status: "synced",
        updated_at: new Date().toISOString(),
      })
      .eq("id", loanId);

    return jsonResponse({
      processed: 0,
      vestaLoanId: existingLoan.vesta_loan_id,
      message: "Already linked",
      success: true,
    });
  }

  const { data: claimed, error: claimErr } = await supabaseService.rpc(
    "claim_vesta_sync_job",
    { p_loan_id: loanId }
  );

  if (claimErr) {
    return jsonResponse(
      { error: true, message: claimErr.message },
      500
    );
  }

  const job = Array.isArray(claimed) ? claimed[0] : claimed;
  if (!job?.id) {
    return jsonResponse({ processed: 0, message: "No pending jobs", success: true });
  }

  const config = await getVestaConfig(supabaseUrl, serviceKey);
  const payload = (job.payload_json || {}) as Record<string, unknown>;

  const result = await postCreateLoan(config, payload);

  const now = new Date().toISOString();

  if (result.ok && result.vestaId) {
    await markJobSuccess(
      supabaseService,
      job.id,
      loanId,
      result.vestaId,
      result.vestaLoanNumber,
      now
    );

    return jsonResponse({
      processed: 1,
      success: true,
      vestaLoanId: result.vestaId,
      vestaLoanNumber: result.vestaLoanNumber,
    });
  }

  const errMsg = result.ok && !result.vestaId
    ? "Vesta returned success without loan id"
    : `Vesta error (${result.status}): ${result.body.slice(0, 2000)}`;

  await markJobFailure(supabaseService, job, loanId, errMsg, now);

  return jsonResponse(
    {
      processed: 1,
      success: false,
      message: errMsg,
      retryScheduled: job.attempt_count < VESTA_MAX_SYNC_ATTEMPTS,
    },
    200
  );
});
