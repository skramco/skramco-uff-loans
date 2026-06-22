/**
 * Authoritative PRO Portal product facts from https://uff.pro/pro-portal
 * Use whenever email copy references PRO Portal — do not invent features.
 */

/** Public marketing page — use for pre-approval email CTAs until a campaign landing page is published. */
export const PRO_PORTAL_PUBLIC_PAGE_URL = "https://www.uff.pro/pro-portal";

export const PRO_PORTAL_PRODUCT_CONTEXT = `
PRO PORTAL — AUTHORIZED PRODUCT FACTS (source: uff.pro/pro-portal)

WHAT PRO PORTAL IS:
PRO Portal is UFF's cloud-based wholesale loan origination and pipeline platform. Brokers use it to create loans, price scenarios, lock rates, upload documents, manage their pipeline, and track underwriting conditions with United Fidelity Funding. It is NOT a CRM, marketing automation tool, website builder, or client testimonial/social-proof platform.

AVAILABLE TODAY (only these capabilities may be referenced):
- Create Loans: loan application creation, auto-populate borrower info, built-in compliance checks, save and resume
- Price Loans: live rate updates throughout the day, multiple pricing scenarios, LTV calculations, customizable pricing worksheets
- Lock Loans: one-click rate locks, flexible lock periods, lock extensions, automated lock confirmations
- Upload Documents: drag-and-drop uploads, automatic document categorization, version control, secure encrypted storage
- Manage Pipeline: visual pipeline dashboard, milestone tracking, automated status updates, performance analytics
- View Conditions: live condition updates, priority-based organization, condition resolution tracking, automated notifications on loan/condition status (NOT custom market alerts or marketing notifications)
- Platform: 24/7 web access, mobile-responsive, bank-level security, team collaboration with role-based permissions
- Access: existing partners log in at go.uff.pro; new brokers self-sign up at go.uff.pro/signup

COMING SOON (roadmap only — never describe as available today):
- Order Appraisal, Order Credit, Digital Verifications (VOE/VOI), Initial Disclosures

NEVER CLAIM OR IMPLY PRO Portal can:
- Integrate client video testimonials, social proof, or marketing materials
- Run email campaigns, drip sequences, or broker branding tools
- Store or publish broker marketing content, flyers, or co-branded assets
- Provide custom automated rate/market alerts or alert subscriptions
- Order appraisals, pull credit, run verifications, or generate initial disclosures (not live yet)
- Replace a CRM, LOS for other lenders, or general "business growth" software unrelated to submitting/closing UFF loans
- Do anything not listed under AVAILABLE TODAY — if unsure, omit the PRO Portal mention entirely

WHEN TO MENTION PRO PORTAL:
Only tie PRO Portal to loan origination workflow (price, lock, submit, upload docs, track conditions, pipeline). Example: "Price the scenario in PRO Portal" or "Upload the remaining conditions in PRO Portal."
Do NOT use PRO Portal as a solution for broker marketing tactics (testimonials, social media, lead gen, referral programs) unless the sentence is ONLY "log in to manage your UFF pipeline" with no false feature claim.

UFF WHOLESALE POSITIONING (supported language only):
Competitive/aggressive pricing, strong product selection, execution, scenario desk support, operational consistency.
Product families: Conventional, FHA, VA, USDA, Non-QM (DSCR, bank statement, asset depletion, interest-only, foreign national, jumbo), streamline expertise.
Never claim: best rates, lowest rates, guaranteed approval, fastest lender, or #1 lender.

UFF is a wholesale lender — not a market research publisher. Do not claim UFF sends daily commentary or rate alert services.
`.trim();

/** All campaign types receive PRO Portal guardrails when copy might mention the platform. */
export function needsProPortalContext(_campaignType: string): boolean {
  return true;
}
