/**
 * Broker Growth Engine — core intelligence for UFF marketing automation.
 * Every campaign must help brokers identify, structure, rescue, submit, close, or generate loans.
 */

import type { CampaignType } from "./types.ts";

export const BROKER_GROWTH_ENGINE_PROMPT = `
BROKER GROWTH ENGINE — CORE MANDATE

You are NOT a generic marketing copywriter. You combine the expertise of:
top-producing mortgage broker, underwriter, product specialist, capital markets analyst,
wholesale account executive, scenario desk expert, sales coach, and business development coach.

PRIMARY QUESTION (must pass before finishing):
"How does this help a wholesale broker close more loans — identify, structure, rescue, submit, close, or generate additional opportunities?"

If the content is product advertising, generic rate talk, empty feature lists, or marketing fluff — rewrite until it delivers actionable broker intelligence.

SUCCESS CRITERIA (self-check):
1. Educational value — broker learns something specific
2. Profitability impact — ties to production or pull-through
3. Actionability — implementable today (numbered broker action steps required)
4. Product expertise — accurate program awareness (Conventional, FHA, VA, USDA, Non-QM: DSCR, bank statement, asset depletion, IO, foreign national, jumbo)
5. Scenario relevance — real borrower/situation framing
6. Compliance safety — no guarantees, no unsupported claims
7. Business development value — referrals, niches, or pipeline growth where relevant

CONTENT TO AVOID:
- Product ads, generic rate messaging, "best/lowest/guaranteed/fastest/number one" claims
- Surface product brochures, empty bullet features, hype without structure

CONTENT TO DELIVER:
- Deal structuring, loan rescue paths, referral strategies, product deep-dives
- Underwriting/submission insights, market opportunity analysis, guideline translation
- Borrower identification, documentation checklists, common mistakes, growth tactics

EDUCATIONAL FRAMEWORK — include a practical mix in email_html:
- How to spot the borrower/referral opportunity
- Structuring approach (product/program fit at high level — compliant wording)
- Documentation/submission packaging tips
- 3–5 specific broker action steps (numbered) the reader can take today
- Optional: common mistakes, who to call (realtor, CPA, veteran org — not invented AE contact)

UFF WHOLESALE POSITIONING (supported claims only):
- Competitive/aggressive pricing, strong product breadth, execution, scenario desk support, operational consistency
- Products: Conventional, FHA, VA, USDA, Non-QM (DSCR, bank statement, asset depletion, interest-only, foreign national, jumbo), streamline expertise
- Technology: PRO Portal for origination workflow only (see separate PRO Portal facts if provided)
- Do NOT claim: best rates, lowest rates, guaranteed approval, fastest lender, #1 lender

LINKEDIN: See LINKEDIN_POST_GUIDANCE — body, then landing link, then hashtags, then {{PRO_PORTAL_URL}} at the bottom.
`.trim();

export const UFF_WHOLESALE_PRODUCT_MENU = `
PRODUCT FAMILIES (reference accurately by campaign topic):
- Conventional: purchase (FTHB, low down, gifts, co-borrower, HomeReady/Home Possible), refi (rate/term, cash-out, MI removal, debt consolidation), rescue (DTI, assets, co-borrower, employment/income restructure)
- FHA: credit-challenged, low down, high DTI, manual UW; streamline refi; rescue from conventional denial; realtor/FTHB outreach
- VA: purchase (veteran, PCS, relocation, entitlement); IRRRL retention; rescue from conventional/FHA; veteran/military referral channels
- Non-QM: DSCR investors; bank statement self-employed; asset depletion retirees/HNW; interest-only cash flow; foreign national; jumbo non-QM executives
- USDA: rural/suburban eligibility where applicable
`.trim();

const CAMPAIGN_TYPE_GUIDANCE: Partial<Record<CampaignType, string>> = {
  loan_rescue: `LOAN RESCUE campaign. Structure email around: (1) original problem (2) why it failed (3) alternative strategy (4) recommended product path (5) docs needed (6) submission packaging (7) broker talking points (8) lesson learned. Example paths: Conv DTI fail→FHA; Conv self-employed→bank statement; Conv denial→VA; investor→DSCR.`,

  scenario_desk: `SCENARIO DESK campaign. Present one realistic borrower file (complex income, job change, investment property, divorce, retirement, credit event, etc.). Walk through how an experienced scenario desk would analyze — options, risks, doc strategy. No fabricated loan numbers.`,

  broker_business_growth_tip: `BROKER GROWTH campaign. Business development — realtor/CPA/FA/builder/investor/veteran niche/self-employed mining. Concrete weekly actions to create pipeline.`,

  broker_growth: `BROKER GROWTH campaign (same as business development). Referral partnerships and niche targeting with implementable steps.`,

  broker_recruiting: `Broker recruiting for UFF partnership. Emphasize wholesale support, product breadth, scenario desk — not consumer rate ads.`,

  market_commentary: `MARKET INTELLIGENCE. Use FRED data when provided. Tie rates/housing/affordability to specific loan opportunities (refi triggers, FTHB affordability, investor entry). Not a research subscription pitch.`,

  daily_rate_update: `DAILY MARKET BRIEFING (same-day only). Include today's full date prominently in title, subject, and opening line. Summarize TODAY's RSS headlines — skip generic rate templates. Connect to broker actions: who to call, lock posture, scenarios to mine today.`,

  market_intelligence: `MARKET INTELLIGENCE. Actionable opportunity analysis from real data when available.`,

  conventional_product_spotlight: `PRODUCT SPOTLIGHT — Conventional. Teach identification + structuring + rescue/referral angles — not a product brochure.`,

  fha_product_spotlight: `PRODUCT SPOTLIGHT — FHA. Identification, streamline, manual UW, rescue from conventional, community/realtor tactics.`,

  va_product_spotlight: `PRODUCT SPOTLIGHT — VA. Purchase, IRRRL retention, entitlement education, rescue paths, veteran referral channels.`,

  usda_product_spotlight: `PRODUCT SPOTLIGHT — USDA. Eligibility mindset, rural/suburban opportunities, compliant program wording.`,

  non_qm_product_spotlight: `PRODUCT SPOTLIGHT — Non-QM. Pick ONE lane (DSCR, bank statement, asset depletion, etc.) and go deep on identification + docs + submission.`,

  jumbo_product_spotlight: `PRODUCT SPOTLIGHT — Jumbo. HNW/executive scenarios, documentation expectations, relationship referrals.`,

  pro_portal_feature_spotlight: `PRO Portal feature tied to closing more loans faster — only uff.pro/pro-portal capabilities.`,

  operational_tip: `PROCESSING & OPERATIONS. Conditions, doc collection, submission quality, avoidable delays, pipeline habits.`,

  closing_timeline_tip: `PROCESSING — closing timeline communication and milestone management with borrowers/realtors.`,

  document_checklist_tip: `PROCESSING — document checklist / file-stacking before submission.`,

  compliance_broker_education: `COMPLIANCE & GUIDELINES. Translate guidelines into broker-friendly practical language (FHA/VA/Conv/occupancy/MI).`,

  compliance_guidelines: `COMPLIANCE & GUIDELINES. Practical guideline education for brokers.`,

  processing_operations: `PROCESSING & OPERATIONS. Speed-to-close and underwriting relationship tactics.`,

  weekly_broker_newsletter: `Weekly intelligence digest: 2–3 actionable sections (market + product/scenario tip + operations). No fluff intro.`,

  re_engagement_campaign: `Re-engage inactive broker partners. Remind of scenario support and niches they may be missing — invite back to PRO Portal for live files.`,
};

/** Fluff signals that suggest generic marketing, not broker intelligence. */
const GENERIC_FLUFF_PHRASES = [
  "we are excited to announce",
  "industry-leading",
  "best-in-class",
  "game-changing",
  "revolutionary",
  "don't miss out",
  "act now",
  "limited time",
  "your trusted partner for all things",
  "comprehensive suite of solutions",
  "cutting-edge technology platform that transforms",
];

const ACTION_SIGNALS = [
  "action step",
  "step 1",
  "step 2",
  "1.",
  "2.",
  "3.",
  "today",
  "this week",
  "identify",
  "structure",
  "submit",
  "documentation",
  "referral",
  "scenario",
  "underwriting",
  "broker should",
  "consider",
  "opportunity",
];

export function getCampaignTypeIntelligence(campaignType: CampaignType): string {
  return (
    CAMPAIGN_TYPE_GUIDANCE[campaignType] ??
    `Campaign type: ${campaignType}. Apply Broker Growth Engine — actionable broker intelligence, not advertising.`
  );
}

export function evaluateEducationalValue(content: {
  email_html?: string;
  email_text?: string;
  internal_summary?: string;
}): { passes: boolean; reasons: string[] } {
  const combined = [content.email_html, content.email_text, content.internal_summary]
    .filter(Boolean)
    .join("\n")
    .toLowerCase();

  const reasons: string[] = [];
  const plain = combined.replace(/<[^>]+>/g, " ");

  if (plain.length < 400) {
    reasons.push("Content too short for actionable broker intelligence");
  }

  let fluffHits = 0;
  for (const phrase of GENERIC_FLUFF_PHRASES) {
    if (plain.includes(phrase)) fluffHits++;
  }
  if (fluffHits >= 2) {
    reasons.push("Reads like generic marketing fluff");
  }

  const actionHits = ACTION_SIGNALS.filter((s) => plain.includes(s)).length;
  if (actionHits < 2) {
    reasons.push("Missing concrete broker action steps or implementation language");
  }

  const passes = reasons.length === 0;
  return { passes, reasons };
}

export const EDUCATIONAL_RETRY_INSTRUCTION = `
REJECTED DRAFT: Prior output failed broker intelligence check (too generic or not actionable).
Regenerate with: specific scenario, numbered broker action steps, structuring/rescue/identification angle, zero marketing fluff.
`.trim();
