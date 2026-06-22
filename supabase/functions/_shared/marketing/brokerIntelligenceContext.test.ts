import { evaluateEducationalValue } from "./brokerIntelligenceContext.ts";

Deno.test("evaluateEducationalValue passes substantive advanced scenario copy", () => {
  const html = `
    <p>Subject tease: 62yo retiree, $1.2M IRA, $3,800 SS — Conv AUS DTI fail at 51%.</p>
    <p>Rescue: Non-QM asset depletion with 36-month lookback on qualified liquid assets. Gather 2 months statements, CPA asset letter, SS award letter.</p>
    <p>1. Filter CRM for retirees with low documented income and $500k+ investable assets</p>
    <p>2. Run asset depletion calc in PRO Portal scenario desk before telling borrower no</p>
    <p>3. Package bank statements and IRA quarterly statements for submission this week</p>
    <p>Investor path: if rental portfolio, evaluate DSCR — personal DTI may be irrelevant.</p>
  `.repeat(2);
  const result = evaluateEducationalValue(
    {
      email_subject: "That unqualifiable retiree? You already have their email.",
      email_html: html,
    },
    { campaignType: "loan_rescue" }
  );
  if (!result.passes) throw new Error(`Expected pass: ${result.reasons.join(", ")}`);
});

Deno.test("evaluateEducationalValue rejects lazy FHA-only rescue", () => {
  const html = `
    <p>Scenario: conventional denial on DTI — consider FHA with compensating factors.</p>
    <p>1. Pull credit today</p>
    <p>2. Submit to FHA</p>
    <p>3. Follow up with borrower</p>
  `.repeat(4);
  const result = evaluateEducationalValue(
    { email_html: html },
    { campaignType: "loan_rescue" }
  );
  if (result.passes) throw new Error("Expected fail for lazy FHA pivot");
});

Deno.test("evaluateEducationalValue rejects short fluff", () => {
  const result = evaluateEducationalValue({
    email_html: "<p>We are excited to announce our industry-leading comprehensive suite of solutions.</p>",
  });
  if (result.passes) throw new Error("Expected fail for fluff");
});
