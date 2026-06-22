import { evaluateEducationalValue } from "./brokerIntelligenceContext.ts";

Deno.test("evaluateEducationalValue passes substantive broker copy", () => {
  const html = `
    <p>Scenario: conventional denial on DTI — consider FHA with compensating factors.</p>
    <p>1. Pull credit and liabilities today</p>
    <p>2. Structure income documentation for manual underwriting</p>
    <p>3. Identify referral partner for first-time buyer pipeline this week</p>
    <p>Submit with clear letter of explanation and asset documentation for underwriting review.</p>
  `.repeat(3);
  const result = evaluateEducationalValue({ email_html: html });
  if (!result.passes) throw new Error(`Expected pass: ${result.reasons.join(", ")}`);
});

Deno.test("evaluateEducationalValue rejects short fluff", () => {
  const result = evaluateEducationalValue({
    email_html: "<p>We are excited to announce our industry-leading comprehensive suite of solutions.</p>",
  });
  if (result.passes) throw new Error("Expected fail for fluff");
});
