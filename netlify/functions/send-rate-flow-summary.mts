import type { Context } from "@netlify/functions";
import {
  CORS_HEADERS,
  processRateFlowSummary,
} from "../_shared/sendRateFlowSummaryResend";

export default async (req: Request, _context: Context) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ success: false, message: "Method not allowed" }), {
      status: 405,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  try {
    let raw: unknown;
    try {
      raw = await req.json();
    } catch {
      return new Response(JSON.stringify({ success: false, message: "Invalid JSON" }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const result = await processRateFlowSummary(raw, {
      RESEND_API_KEY: Netlify.env.get("RESEND_API_KEY") ?? undefined,
      RESEND_FROM_EMAIL: Netlify.env.get("RESEND_FROM_EMAIL") ?? undefined,
      RATE_FLOW_SUMMARY_TO: Netlify.env.get("RATE_FLOW_SUMMARY_TO") ?? undefined,
    });

    if (!result.success) {
      return new Response(JSON.stringify({ success: false, message: result.message }), {
        status: result.status,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return new Response(JSON.stringify({ success: false, message }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
};
