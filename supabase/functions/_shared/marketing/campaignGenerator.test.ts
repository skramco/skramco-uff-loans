import { buildSystemPrompt, buildUserPrompt } from "./campaignGenerator.ts";
import { ADVANCED_STRUCTURING_PLAYBOOK } from "./brokerIntelligenceContext.ts";

const HOLIDAY_PROMPT =
  "Send brokers our holiday hours: closed Dec 25-26 and Jan 1, phones back Jan 2. Submit files by noon Dec 24.";

Deno.test("buildUserPrompt puts a holiday-hours assignment first and does not inject DSCR", () => {
  const prompt = buildUserPrompt({
    campaignType: "custom_prompt",
    customPrompt: HOLIDAY_PROMPT,
  });

  if (!prompt.startsWith("OPERATOR PROMPT — EXCLUSIVE ASSIGNMENT")) {
    throw new Error("Operator prompt must lead the user message");
  }
  if (!prompt.includes(HOLIDAY_PROMPT)) {
    throw new Error("Operator prompt text missing");
  }
  if (prompt.includes(ADVANCED_STRUCTURING_PLAYBOOK)) {
    throw new Error("Holiday-hours generation must not include the structuring playbook");
  }
  if (/PRODUCT FAMILIES \(reference accurately/i.test(prompt)) {
    throw new Error("Holiday-hours generation must not dump the wholesale product menu");
  }
  if (prompt.includes("DTI 54% on Conv")) {
    throw new Error("DSCR subject-line examples must not appear for ops prompts");
  }
});

Deno.test("buildUserPrompt still includes the product menu when the operator asks for DSCR", () => {
  const prompt = buildUserPrompt({
    campaignType: "custom_prompt",
    customPrompt: "Write a DSCR campaign for 4-unit investors who just failed Conv DTI.",
  });
  if (!prompt.includes("PRODUCT FAMILIES")) {
    throw new Error("Product prompts should still get the wholesale product menu");
  }
  if (!prompt.includes("DSCR campaign for 4-unit investors")) {
    throw new Error("Operator prompt text missing");
  }
});

Deno.test("buildSystemPrompt uses operator-assignment mode instead of Broker Growth Engine", () => {
  const custom = buildSystemPrompt(null, "standard", { operatorAssignment: true });
  if (!custom.includes("OPERATOR ASSIGNMENT MODE")) {
    throw new Error("Expected operator assignment system prompt");
  }
  if (custom.includes("BROKER GROWTH ENGINE — CORE MANDATE")) {
    throw new Error("Custom prompts must not include Broker Growth Engine topic rules");
  }

  const scheduled = buildSystemPrompt(null, "standard", { operatorAssignment: false });
  if (!scheduled.includes("BROKER GROWTH ENGINE — CORE MANDATE")) {
    throw new Error("Scheduled campaigns should still use Broker Growth Engine");
  }
});
