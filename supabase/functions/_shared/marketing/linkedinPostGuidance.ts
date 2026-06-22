import type { CampaignType } from "./types.ts";
import { LINKEDIN_PRO_PORTAL_PLACEHOLDER } from "./linkedinPostFormat.ts";
import { LANDING_PAGE_PLACEHOLDER } from "./proLandingPage.ts";

/** Shared rules for linkedin_post in campaign JSON. */
export const LINKEDIN_POST_GUIDANCE = `
LINKEDIN CAPTION (linkedin_post field) — use this EXACT section order (blank line between sections):

1. BODY: Educational caption only — scenarios, structuring, market insight. No URLs and no hashtags in this section.
2. LANDING LINK (immediately after body):
   Read the full broker resource:
   ${LANDING_PAGE_PLACEHOLDER}
3. HASHTAGS: 8–15 pertinent hashtags on one or more lines (each #tag). Match the post topic; include #UnitedFidelityFunding #UFFMortgage #WholesaleMortgage when relevant.
4. PRO PORTAL (last line of the post — bottom):
   Log in to PRO Portal for pricing & pipeline:
   ${LINKEDIN_PRO_PORTAL_PLACEHOLDER}

Additional rules:
- Educational tone, not promotional hype; strong hook in the first 1–2 lines of the body.
- Do NOT place ${LANDING_PAGE_PLACEHOLDER} inside the body or after hashtags — only in section 2.
- Do NOT place ${LINKEDIN_PRO_PORTAL_PLACEHOLDER} anywhere except section 4 at the bottom.
- Do NOT use compliance-risk hashtags (#GuaranteedApproval #LowestRates).
- Keep total caption under 3000 characters.
`.trim();

const CAMPAIGN_HASHTAG_HINTS: Partial<Record<CampaignType, string>> = {
  loan_rescue:
    "#LoanRescue #DealStructuring #MortgageUnderwriting #DTI #AlternativeLending #NonQM #AssetDepletion #BankStatementLoan #DSCR #ScenarioDesk",
  scenario_desk:
    "#ScenarioDesk #MortgageUnderwriting #ComplexIncome #SelfEmployed #AssetDepletion #BankStatementLoan #DSCR #MortgageBroker #LoanStructuring",
  broker_business_growth_tip:
    "#MortgageBroker #BusinessDevelopment #ReferralMarketing #LoanOfficer #WholesaleLending #MortgageIndustry",
  broker_growth:
    "#MortgageBroker #BusinessDevelopment #ReferralMarketing #RealEstateAgent #WholesaleLending",
  broker_recruiting:
    "#WholesaleMortgage #MortgageBroker #LoanOfficer #MortgageIndustry #WholesaleLending",
  market_commentary:
    "#MortgageRates #HousingMarket #Refinance #PurchaseMarket #MortgageIndustry #EconomicOutlook",
  daily_rate_update:
    "#MortgageNews #MortgageRates #MarketUpdate #WholesaleMortgage #MortgageBroker #HousingMarket",
  market_intelligence:
    "#MortgageRates #HousingMarket #Affordability #Refinance #MortgageIndustry #MarketOutlook",
  conventional_product_spotlight:
    "#ConventionalLoan #HomeReady #HomePossible #MortgageBroker #FirstTimeHomeBuyer #Refinance",
  fha_product_spotlight:
    "#FHA #FHALoans #FirstTimeHomeBuyer #MortgageBroker #LowDownPayment #ManualUnderwriting",
  va_product_spotlight:
    "#VALoan #Veteran #Military #IRRRL #VAHomeLoan #MortgageBroker #PCS",
  usda_product_spotlight:
    "#USDALoan #RuralHousing #MortgageBroker #FirstTimeHomeBuyer",
  non_qm_product_spotlight:
    "#NonQM #DSCR #BankStatementLoan #SelfEmployed #AssetDepletion #Investor #MortgageBroker",
  jumbo_product_spotlight:
    "#JumboLoan #NonQM #HighNetWorth #MortgageBroker #LuxuryRealEstate",
  pro_portal_feature_spotlight:
    "#PROPortal #WholesaleMortgage #MortgageTechnology #LoanOrigination #MortgageBroker",
  operational_tip:
    "#MortgageOperations #Underwriting #LoanProcessing #MortgageBroker #Closing",
  processing_operations:
    "#MortgageOperations #Underwriting #LoanProcessing #PipelineManagement #MortgageBroker",
  closing_timeline_tip:
    "#MortgageClosing #LoanProcessing #MortgageBroker #RealEstate",
  document_checklist_tip:
    "#MortgageDocuments #LoanProcessing #Underwriting #MortgageBroker",
  compliance_broker_education:
    "#MortgageCompliance #MortgageGuidelines #FHA #VA #ConventionalLoan #MortgageBroker",
  compliance_guidelines:
    "#MortgageCompliance #MortgageGuidelines #Underwriting #MortgageBroker",
  weekly_broker_newsletter:
    "#MortgageBroker #WholesaleMortgage #MortgageIndustry #MortgageRates #LoanOfficer",
  re_engagement_campaign:
    "#WholesaleMortgage #MortgageBroker #PROPortal #UnitedFidelityFunding",
};

const DEFAULT_HASHTAGS =
  "#MortgageBroker #WholesaleMortgage #LoanOfficer #MortgageIndustry #UnitedFidelityFunding #UFFMortgage #HomeFinancing #RealEstate";

export function getLinkedInHashtagHints(campaignType: CampaignType): string {
  const specific = CAMPAIGN_HASHTAG_HINTS[campaignType] ?? DEFAULT_HASHTAGS;
  return `Hashtag block (section 3 — after landing link, before PRO Portal link). Pick 8–15 from:\n${specific}\n${DEFAULT_HASHTAGS}`;
}
