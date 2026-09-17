import { evaluateEducationalValue, getCampaignTypeIntelligence } from "./brokerIntelligenceContext.ts";

Deno.test("evaluateEducationalValue passes substantive advanced scenario copy", () => {
  const html = `
    <p>Subject tease: 4-unit investor, $18k personal W-2, six rentals, Conv AUS DTI fail at 54%.</p>
    <p>Rescue: DSCR on the subject property — personal DTI is irrelevant. Gather current leases, 12-month rent roll, and 2 months bank statements showing rents.</p>
    <p>1. Filter CRM for investors with 3+ financed properties and a recent Conv denial</p>
    <p>2. Run DSCR in PRO Portal scenario desk before telling borrower no</p>
    <p>3. Package leases and rent roll for submission this week</p>
    <p>Self-employed path: if they also have a business, evaluate 24-month bank statement income as a backup lane.</p>
  `.repeat(2);
  const result = evaluateEducationalValue(
    {
      email_subject: "Personal DTI 54%. DSCR does not care. Same borrower.",
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

const ASSET_DEPLETION_HTML = `
    <p>Subject tease: 62yo retiree, $1.2M IRA, $3,800 SS — Conv AUS DTI fail at 51%.</p>
    <p>Rescue: Non-QM asset depletion with 36-month lookback on qualified liquid assets. Gather 2 months statements, CPA asset letter, SS award letter.</p>
    <p>1. Filter CRM for retirees with low documented income and $500k+ investable assets</p>
    <p>2. Run asset depletion calc in PRO Portal scenario desk before telling borrower no</p>
    <p>3. Package bank statements and IRA quarterly statements for submission this week</p>
    <p>Investor path: if rental portfolio, evaluate DSCR — personal DTI may be irrelevant.</p>
  `.repeat(2);

Deno.test("evaluateEducationalValue rejects asset depletion overuse unless the operator prompt asks for it", () => {
  const result = evaluateEducationalValue(
    {
      email_subject: "That unqualifiable retiree? You already have their email.",
      email_html: ASSET_DEPLETION_HTML,
    },
    { campaignType: "loan_rescue" }
  );
  if (result.passes) throw new Error("Expected fail for asset depletion overuse");
  if (!result.reasons.some((r) => r.toLowerCase().includes("asset depletion"))) {
    throw new Error(`Expected asset depletion reason, got: ${result.reasons.join(", ")}`);
  }
});

Deno.test("evaluateEducationalValue allows asset depletion when the operator prompt requests it", () => {
  const result = evaluateEducationalValue(
    {
      email_subject: "That unqualifiable retiree? You already have their email.",
      email_html: ASSET_DEPLETION_HTML,
    },
    {
      campaignType: "custom_prompt",
      customPrompt: "Write a campaign on asset depletion for retirees with large IRAs",
    }
  );
  if (!result.passes) throw new Error(`Expected pass when prompt requests AD: ${result.reasons.join(", ")}`);
});

Deno.test("getCampaignTypeIntelligence does not attach the DSCR playbook to custom prompts", () => {
  const custom = getCampaignTypeIntelligence("custom_prompt");
  if (custom.includes("DTI 54%") || custom.includes("ADVANCED STRUCTURING PLAYBOOK")) {
    throw new Error("Custom prompts must not receive the advanced structuring playbook");
  }
  if (!custom.toLowerCase().includes("exclusive content assignment")) {
    throw new Error("Custom prompt guidance should say the operator prompt is exclusive");
  }

  const rescue = getCampaignTypeIntelligence("loan_rescue");
  if (!rescue.includes("ADVANCED STRUCTURING PLAYBOOK")) {
    throw new Error("Loan rescue should still include the structuring playbook");
  }
});

Deno.test("evaluateEducationalValue accepts holiday-hours copy for a custom prompt", () => {
  const html = `
    <p>UFF wholesale desk holiday hours: closed Thursday Dec 25 and Friday Dec 26, and Thursday Jan 1.</p>
    <p>Phones and scenario desk return Friday Jan 2. Submit files before noon Dec 24 if you need a same-week decision.</p>
  `;
  const result = evaluateEducationalValue(
    {
      email_subject: "Holiday hours: UFF closed Dec 25-26 and Jan 1",
      preview_text: "Phones back January 2. Submit by noon Dec 24.",
      email_html: html,
      email_text: "UFF holiday hours closed Dec 25-26 and Jan 1. Phones back Jan 2.",
    },
    {
      campaignType: "custom_prompt",
      customPrompt:
        "Send brokers our holiday hours: closed Dec 25-26 and Jan 1, phones back Jan 2. Submit files by noon Dec 24.",
    }
  );
  if (!result.passes) throw new Error(`Expected holiday hours to pass: ${result.reasons.join(", ")}`);
});

Deno.test("evaluateEducationalValue rejects a DSCR flyer when the operator asked for holiday hours", () => {
  const result = evaluateEducationalValue(
    {
      email_subject: "Personal DTI 54%. DSCR does not care. Same borrower.",
      email_html:
        "<p>Rescue: DSCR on the subject property. Gather leases and a 12-month rent roll. Bank statement backup if self-employed.</p>",
    },
    {
      campaignType: "custom_prompt",
      customPrompt:
        "Send brokers our holiday hours: closed Dec 25-26 and Jan 1, phones back Jan 2.",
    }
  );
  if (result.passes) throw new Error("Expected fail when DSCR replaces holiday hours");
  if (!result.reasons.some((r) => r.toLowerCase().includes("dscr") || r.toLowerCase().includes("operator prompt"))) {
    throw new Error(`Expected fidelity reason, got: ${result.reasons.join(", ")}`);
  }
});
