import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface VestaConfig {
  apiUrl: string;
  apiKey: string;
  apiVersion: string;
}

async function getVestaConfig(): Promise<VestaConfig> {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data } = await supabase
      .from("admin_settings")
      .select("vesta_environment")
      .eq("id", 1)
      .maybeSingle();

    const env = data?.vesta_environment || "dev";

    if (env === "production") {
      return {
        apiUrl:
          Deno.env.get("VESTA_PROD_API_URL") ||
          "https://uff.vesta.com/api/v1",
        apiKey: Deno.env.get("VESTA_PROD_API_KEY") || "",
        apiVersion: Deno.env.get("VESTA_PROD_API_VERSION") || "26.1",
      };
    }

    return {
      apiUrl:
        Deno.env.get("VESTA_DEV_API_URL") ||
        "https://uff.beta.vesta.com/api/v1",
      apiKey:
        Deno.env.get("VESTA_DEV_API_KEY") ||
        Deno.env.get("VESTA_API_KEY") ||
        "",
      apiVersion:
        Deno.env.get("VESTA_DEV_API_VERSION") ||
        Deno.env.get("VESTA_API_VERSION") ||
        "26.1",
    };
  } catch {
    return {
      apiUrl:
        Deno.env.get("VESTA_API_URL") ||
        "https://uff.beta.vesta.com/api/v1",
      apiKey: Deno.env.get("VESTA_API_KEY") || "",
      apiVersion: Deno.env.get("VESTA_API_VERSION") || "26.1",
    };
  }
}

function vestaLoansCollectionUrl(apiUrl: string): string {
  return `${apiUrl.replace(/\/+$/, "")}/loans`;
}

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function postCreateLoan(
  config: VestaConfig,
  payload: Record<string, unknown>
): Promise<{ ok: boolean; status: number; body: string; vestaId: string | null }> {
  if (!config.apiUrl || !config.apiKey) {
    return {
      ok: false,
      status: 503,
      body: "Vesta not configured",
      vestaId: null,
    };
  }

  const response = await fetch(vestaLoansCollectionUrl(config.apiUrl), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${config.apiKey}`,
      "x-Api-Version": config.apiVersion,
    },
    body: JSON.stringify({
      borrowerFirstName: payload.borrowerFirstName,
      borrowerLastName: payload.borrowerLastName,
      borrowerEmail: payload.borrowerEmail,
      loanAmount: payload.loanAmount,
      propertyAddress: payload.propertyAddress,
      loanType: payload.loanType,
      loanPurpose: payload.loanPurpose,
      propertyValue: payload.propertyValue,
      applicationData: payload.applicationData,
      urlaMapped: payload.urlaMapped,
      mappingVersion: payload.mappingVersion,
    }),
  });

  const text = await response.text();
  let vestaId: string | null = null;
  if (response.ok) {
    try {
      const data = JSON.parse(text);
      vestaId = data.loanId || data.id || null;
    } catch {
      vestaId = text.replace(/^"|"$/g, "").trim() || null;
    }
  }

  return { ok: response.ok, status: response.status, body: text, vestaId };
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
        .in("status", ["pending", "processing"]);

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
      .in("status", ["pending", "processing"]);

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
    return jsonResponse({ processed: 0, message: "No pending jobs" });
  }

  const config = await getVestaConfig();
  const payload = (job.payload_json || {}) as Record<string, unknown>;

  const result = await postCreateLoan(config, payload);

  const now = new Date().toISOString();

  if (result.ok && result.vestaId) {
    await supabaseService
      .from("vesta_sync_jobs")
      .update({
        status: "succeeded",
        vesta_loan_id: result.vestaId,
        last_error: null,
        updated_at: now,
      })
      .eq("id", job.id);

    await supabaseService
      .from("loans")
      .update({
        vesta_loan_id: result.vestaId,
        vesta_sync_status: "synced",
        updated_at: now,
      })
      .eq("id", loanId);

    return jsonResponse({
      processed: 1,
      success: true,
      vestaLoanId: result.vestaId,
    });
  }

  const errMsg = result.ok && !result.vestaId
    ? "Vesta returned success without loan id"
    : `Vesta error (${result.status}): ${result.body.slice(0, 2000)}`;

  await supabaseService
    .from("vesta_sync_jobs")
    .update({
      status: "failed",
      last_error: errMsg,
      updated_at: now,
    })
    .eq("id", job.id);

  await supabaseService
    .from("loans")
    .update({
      vesta_sync_status: "failed",
      updated_at: now,
    })
    .eq("id", loanId);

  return jsonResponse(
    {
      processed: 1,
      success: false,
      message: errMsg,
    },
    200
  );
});
