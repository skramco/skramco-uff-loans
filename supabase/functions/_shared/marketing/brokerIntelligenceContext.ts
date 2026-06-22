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
- Construction loans or construction-to-perm — UFF does not offer them; never recommend or structure construction financing

CONTENT TO DELIVER:
- Deal structuring, loan rescue paths, referral strategies, product deep-dives
- Underwriting/submission insights, market opportunity analysis, guideline translation
- Borrower identification, documentation checklists, common mistakes, growth tactics
- INTRICATE, LEGAL structuring playbooks — not lazy product pivots (see ADVANCED STRUCTURING PLAYBOOK when provided)

ATTENTION MANDATE (subject line + opening hook):
- email_subject MUST create urgency, curiosity, or FOMO — make the broker feel they are leaving money on the table RIGHT NOW.
- preview_text reinforces the hook with a specific scenario tease (borrower profile, failed path, missed product lane).
- Open email_html with a vivid, specific borrower scene — dollar amounts, doc gaps, AUS result, or pipeline status where helpful (no fabricated approvals).
- Never open with generic greetings, rate commentary, or "hope this finds you well."

LAZY RESCUE PATHS — DO NOT DEFAULT TO THESE:
- Conv DTI fail → FHA (FHA has DTI limits too; this is the #1 lazy pivot — almost never the innovative answer)
- Any denial → "try FHA manual UW" without income/doc restructuring detail
- Generic "consider Non-QM" without naming the lane, lookback, and doc stack
- One-size-fits-all rescue advice without a specific borrower file narrative

EDUCATIONAL FRAMEWORK — include a practical mix in email_html:
- How to spot the borrower/referral opportunity
- Structuring approach (product/program fit at high level — compliant wording)
- Documentation/submission packaging tips
- 3–5 specific broker action steps (numbered) the reader can take today
- Optional: common mistakes, who to call (realtor, CPA, veteran org — not invented AE contact)

UFF WHOLESALE POSITIONING (supported claims only):
- Competitive/aggressive pricing, strong product breadth, execution, scenario desk support, operational consistency
- Products: Conventional, FHA, VA, USDA, Non-QM (DSCR, bank statement, asset depletion, interest-only, foreign national, jumbo), streamline expertise
- Does NOT offer: construction loans, construction-to-perm, one-time-close construction, or builder construction financing
- Technology: PRO Portal for origination workflow only (see separate PRO Portal facts if provided)
- Do NOT claim: best rates, lowest rates, guaranteed approval, fastest lender, #1 lender

LINKEDIN: See LINKEDIN_POST_GUIDANCE — body, then landing link, then hashtags, then {{PRO_PORTAL_URL}} at the bottom.
`.trim();

export const UFF_WHOLESALE_PRODUCT_MENU = `
PRODUCT FAMILIES (reference accurately by campaign topic):
- Conventional: purchase (FTHB, low down, gifts, co-borrower, HomeReady/Home Possible), refi (rate/term, cash-out, MI removal, debt consolidation), rescue (DTI restructure via debt paydown/cash-out, non-occupant co-borrower, asset reserves, income re-characterization — NOT automatic FHA pivot)
- FHA: credit-challenged, low down, manual UW with documented compensating factors — use when FHA guidelines genuinely fit, not as default DTI band-aid
- VA: purchase (veteran, PCS, relocation, entitlement); IRRRL retention; residual income analysis; rescue when veteran eligibility is the unlock
- Non-QM: DSCR (no personal income DTI); bank statement 12/24mo (self-employed, 1099, commission); asset depletion 36/60mo (retirees, HNW, low documented income); interest-only cash flow; foreign national; jumbo non-QM executives; P&L-only where offered
- USDA: rural/suburban eligibility where applicable

NOT OFFERED: construction loans, construction-to-perm, OTC construction, ground-up/spec construction financing, builder construction programs.
`.trim();

/** Sophisticated, compliant structuring paths — rotate across these; never default to Conv→FHA. */
export const ADVANCED_STRUCTURING_PLAYBOOK = `
ADVANCED STRUCTURING PLAYBOOK — pick ONE intricate scenario per campaign; go deep on mechanics:

INNOVATIVE RESCUE PATHS (legal, compliant — high-level only; no fabricated approvals):
1. Conv AUS DTI fail + strong liquid assets → Non-QM asset depletion (36- or 60-month lookback; which accounts qualify; CPA letter vs statements)
2. W-2 income short + $800k+ IRA/401k/brokerage → asset depletion income calculation; retiree/HNW purchase or refi
3. Self-employed YOY decline on tax returns → 12/24-month bank statement (business or personal); expense ratio election; P&L support
4. 1099 / commission / tip income volatility → bank statement or 1099-only programs; 24-month average vs most recent year strategy
5. Investor with 6+ rentals, personal DTI blown → DSCR on subject (or portfolio); no personal income DTI; rent roll + lease doc stack
6. Foreign national, no SSN, large down payment → foreign national Non-QM; visa/passport doc path; reserve requirements
7. Executive with low W-2 + RSU/bonus → asset depletion supplement or bank statement hybrid; vesting schedule documentation
8. High debt load killing DTI → cash-out refi debt consolidation (Conv or Non-QM) then re-run eligibility; which debts pay off first
9. Non-occupant co-borrower (parent, spouse not on title) → income addition where permitted; gift vs co-borrower analysis
10. Departing residence → convert to rental; use lease/rental income offset (document 75% or program-specific factor)
11. Interest-only need for cash-flow buyer → IO Non-QM or jumbo IO where offered; payment shock disclosure awareness
12. Recent credit event (BK/SS/DIL seasoning) → Non-QM seasoning lanes vs FHA/VA if eligible; timeline math
13. Divorce decree income (alimony/child support) → qualifying income docs, continuance, receipt history
14. Trust or estate income beneficiary → trust agreement, distribution history, letter from trustee/CPA
15. One-time capital gains spike → exclude from recurring income; restructure with asset depletion or bank statement instead
16. STR/Airbnb income → bank statement or DSCR depending on property; seasonality documentation
17. Multiple REO/investment acquisitions → DSCR per property; cross-collateral considerations at high level
18. Conv MI blocking payment → MI removal refi path vs LTV reduction vs piggyback restructure (where applicable)
19. Asset utilization / pledged assets → offset DTI with documented pledged asset formula (program-specific)
20. Delayed financing after cash purchase → reinvest liquidity without waiting 6-month seasoning (Conv delayed financing rules)

SUBJECT LINE HOOK PATTERNS (adapt to scenario — do not copy verbatim):
- "That 'unqualifiable' retiree with $1.4M in the bank? You already have their email."
- "AUS said no. Asset depletion said yes. You ran it once."
- "Your competitor closed this with 24-month bank statements. You sent a denial."
- "DTI 54% on Conv. DTI irrelevant on DSCR. Same borrower."
- "Stop treating every DTI fail like an FHA referral."

Every scenario email MUST include: specific borrower profile, failed first path + WHY, innovative second path + HOW (docs, lookback, calculation approach), and numbered broker actions to mine similar files this week.
`.trim();

const CAMPAIGN_TYPE_GUIDANCE: Partial<Record<CampaignType, string>> = {
  loan_rescue: `LOAN RESCUE — "YOU ARE MISSING THIS DEAL" campaign.

MANDATORY STRUCTURE:
(1) Scroll-stopping subject + preview — FOMO hook tied to a specific missed opportunity
(2) Vivid borrower file — age, income type, assets, property, what AUS/lender said NO to and why
(3) Why the obvious path failed (Conv AUS, wrong product lane, incomplete doc stack — be specific)
(4) INNOVATIVE legal rescue path — pick from ADVANCED STRUCTURING PLAYBOOK; name exact product lane, lookback period, doc checklist
(5) Step-by-step submission packaging — what to gather before scenario desk call
(6) Broker talking points for borrower + realtor
(7) "Mine your pipeline" — how to find 3 more files like this today
(8) Lesson: what most brokers get wrong (often: one AUS run, default FHA pivot, or no Non-QM awareness)

BANNED: Conv DTI fail → FHA as default answer. FHA is NOT your go-to DTI rescue — use Non-QM (asset depletion, bank statement, DSCR), Conv restructure, VA if eligible, or debt consolidation first.`,

  scenario_desk: `SCENARIO DESK — deep-dive file analysis that makes brokers call UFF.

Present ONE intricate, realistic borrower file. Walk through how a senior scenario desk thinks:
- Initial broker submission (what they got wrong)
- Guideline friction points (DTI, income calc, assets, occupancy, credit seasoning)
- 2–3 viable paths ranked by likelihood — at least one must be Non-QM or advanced Conv restructure
- Doc strategy per path (statements months, asset depletion lookback, lease/rent roll, CPA letter, etc.)
- Risk flags and how to pre-clear with underwriting
- Exact next action: "Run this in PRO Portal scenario desk with these docs"

Subject line = specific file tease ("62yo retiree, $1.1M IRA, $4k SS — who runs asset depletion?").

BANNED: shallow analysis ending in "try FHA." No fabricated rates or guaranteed approvals.`,

  broker_business_growth_tip: `BROKER GROWTH campaign. Business development — realtor/CPA/FA/builder (referral partner for completed-home purchase, NOT construction loans)/investor/veteran niche/self-employed mining. Concrete weekly actions to create pipeline.`,

  broker_growth: `BROKER GROWTH campaign (same as business development). Referral partnerships and niche targeting with implementable steps.`,

  broker_recruiting: `Broker recruiting for UFF partnership. Emphasize wholesale support, product breadth, scenario desk — not consumer rate ads.`,

  market_commentary: `MARKET INTELLIGENCE. Use FRED data when provided. Tie rates/housing/affordability to specific loan opportunities (refi triggers, FTHB affordability, investor entry). Not a research subscription pitch.`,

  daily_rate_update: `DAILY MARKET BRIEFING (same-day only). Include today's full date prominently in title, subject, and opening line. Summarize TODAY's RSS headlines — skip generic rate templates. Connect to broker actions: who to call, lock posture, scenarios to mine today.`,

  market_intelligence: `MARKET INTELLIGENCE. Actionable opportunity analysis from real data when available.`,

  conventional_product_spotlight: `PRODUCT SPOTLIGHT — Conventional. Teach identification + structuring + rescue/referral angles — not a product brochure.`,

  fha_product_spotlight: `PRODUCT SPOTLIGHT — FHA. Identification, streamline, manual UW, rescue from conventional, community/realtor tactics.`,

  va_product_spotlight: `PRODUCT SPOTLIGHT — VA. Purchase, IRRRL retention, entitlement education, rescue paths, veteran referral channels.`,

  usda_product_spotlight: `PRODUCT SPOTLIGHT — USDA. Eligibility mindset, rural/suburban opportunities, compliant program wording.`,

  non_qm_product_spotlight: `PRODUCT SPOTLIGHT — Non-QM. Pick ONE lane (DSCR, bank statement 12/24mo, asset depletion 36/60mo, IO, foreign national, 1099, P&L-only) and go surgical: borrower identification signals, income calc methodology at high level, doc stack, common broker mistakes, 3 pipeline search filters to find candidates today. Open with a "you're sitting on these files" hook.`,

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

const STRUCTURING_SPECIFICITY_SIGNALS = [
  "asset depletion",
  "bank statement",
  "dscr",
  "lookback",
  "36-month",
  "60-month",
  "24-month",
  "12-month",
  "1099",
  "foreign national",
  "interest-only",
  "non-occupant",
  "cash-out",
  "debt consolidation",
  "rental income",
  "lease",
  "cpa",
  "p&l",
  "self-employed",
  "retiree",
  "ira",
  "401",
  "brokerage",
  "vesting",
  "rsu",
  "trust",
  "divorce",
  "alimony",
  "delayed financing",
  "portfolio",
  "investor",
  "expense ratio",
  "residual income",
  "manual underwrit",
  "compensating factor",
  "aus",
  "dti",
  "scenario desk",
];

const LAZY_RESCUE_PATTERNS = [
  /\bconsider\s+fha\b/i,
  /\btry\s+fha\b/i,
  /\bpivot\s+to\s+fha\b/i,
  /\bfha\s+(?:with\s+)?compensating\s+factors?\b/i,
  /\bconv(?:entional)?\s+dti\s+fail\s*→\s*fha\b/i,
];

/** Campaign types that require advanced structuring depth, not lazy pivots. */
const ADVANCED_SCENARIO_CAMPAIGN_TYPES = new Set<CampaignType>([
  "loan_rescue",
  "scenario_desk",
  "non_qm_product_spotlight",
]);

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
  const base =
    CAMPAIGN_TYPE_GUIDANCE[campaignType] ??
    `Campaign type: ${campaignType}. Apply Broker Growth Engine — actionable broker intelligence, not advertising.`;

  if (ADVANCED_SCENARIO_CAMPAIGN_TYPES.has(campaignType)) {
    return `${base}\n\n${ADVANCED_STRUCTURING_PLAYBOOK}`;
  }
  return base;
}

export function evaluateEducationalValue(
  content: {
    email_html?: string;
    email_text?: string;
    internal_summary?: string;
    email_subject?: string;
    preview_text?: string;
  },
  opts: { campaignType?: CampaignType } = {}
): { passes: boolean; reasons: string[] } {
  const combined = [
    content.email_subject,
    content.preview_text,
    content.email_html,
    content.email_text,
    content.internal_summary,
  ]
    .filter(Boolean)
    .join("\n")
    .toLowerCase();

  const reasons: string[] = [];
  const plain = combined.replace(/<[^>]+>/g, " ");
  const rawCombined = [
    content.email_subject,
    content.preview_text,
    content.email_html,
    content.email_text,
    content.internal_summary,
  ]
    .filter(Boolean)
    .join("\n");

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

  if (opts.campaignType && ADVANCED_SCENARIO_CAMPAIGN_TYPES.has(opts.campaignType)) {
    const specificityHits = STRUCTURING_SPECIFICITY_SIGNALS.filter((s) => plain.includes(s)).length;
    if (specificityHits < 3) {
      reasons.push(
        "Scenario content lacks structuring specificity (product lane, lookback, doc stack, or income methodology)"
      );
    }

    const lazyFha = LAZY_RESCUE_PATTERNS.some((p) => p.test(rawCombined));
    const hasInnovativePath = ["asset depletion", "bank statement", "dscr", "foreign national", "1099", "interest-only"].some(
      (s) => plain.includes(s)
    );
    if (lazyFha && !hasInnovativePath) {
      reasons.push("Lazy FHA pivot without innovative Non-QM or advanced structuring path");
    }
  }

  const passes = reasons.length === 0;
  return { passes, reasons };
}

export const EDUCATIONAL_RETRY_INSTRUCTION = `
REJECTED DRAFT: Prior output failed broker intelligence check (too generic, lazy rescue path, or not actionable).
Regenerate with:
- Scroll-stopping subject line + specific borrower file narrative
- INNOVATIVE legal structuring from ADVANCED STRUCTURING PLAYBOOK — NOT default Conv→FHA
- Product lane name, lookback/doc details, numbered broker action steps
- Zero marketing fluff
Never mention construction loans or construction-to-perm — UFF does not offer them.
`.trim();
