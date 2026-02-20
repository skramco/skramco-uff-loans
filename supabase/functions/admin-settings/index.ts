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

      default:
        return errorResponse(`Unknown action: ${action}`);
    }
  } catch (err: any) {
    return errorResponse(`Server error: ${err.message}`, 500);
  }
});
