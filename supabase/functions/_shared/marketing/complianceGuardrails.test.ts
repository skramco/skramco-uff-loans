import { evaluateCompliance, stripPIIFromText } from "./complianceGuardrails.ts";

Deno.test("compliance flags superlatives", () => {
  const result = evaluateCompliance({ email_subject: "The best rate for brokers" });
  if (!result.flags.some((f) => f.startsWith("superlative:"))) {
    throw new Error("Expected superlative flag");
  }
});

Deno.test("compliance flags unsupported construction loan products", () => {
  const result = evaluateCompliance({
    email_html: "UFF construction loan programs help builders.",
  });
  if (!result.violations.some((v) => v.includes("construction loan"))) {
    throw new Error("Expected construction loan violation");
  }
  if (!result.flags.some((f) => f.startsWith("unsupported_product:"))) {
    throw new Error("Expected unsupported_product flag");
  }
});

Deno.test("PII strip removes email", () => {
  const out = stripPIIFromText("Email broker@test.com for info");
  if (!out.includes("[REDACTED_EMAIL]")) throw new Error("Email not redacted");
});

Deno.test("buildIdempotencyKey format", () => {
  const { buildIdempotencyKey } = await import("./idempotency.ts");
  const key = buildIdempotencyKey("weekly_broker_newsletter", new Date("2026-05-29"));
  if (key !== "weekly_broker_newsletter:2026-05-29") throw new Error(`Unexpected key: ${key}`);
});

Deno.test("approval blocks unapproved send", () => {
  const { canSendCampaign } = await import("./approvalRules.ts");
  const result = canSendCampaign("pending_approval", true, "fha_product_spotlight", []);
  if (result.allowed) throw new Error("Should not allow send");
});

Deno.test("vesta insights sanitize blocks PII", () => {
  const { sanitizeInsightText } = await import("./vestaInsights.ts");
  const out = sanitizeInsightText("Contact mark@uff.loans for details");
  if (out.includes("@")) throw new Error("PII leaked");
});

Deno.test("mapAiResponseToCampaign structure", () => {
  const { mapAiResponseToCampaign } = await import("./campaignGenerator.ts");
  const mapped = mapAiResponseToCampaign("daily_rate_update", {
    title: "Test",
    email_subject: "Subject",
    compliance_risk_score: 0.2,
  });
  if (mapped.title !== "Test") throw new Error("Title mismatch");
  if (mapped.campaign_type !== "daily_rate_update") throw new Error("Type mismatch");
});
