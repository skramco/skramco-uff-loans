/**
 * Authoritative PRO Portal product facts from https://uff.pro/pro-portal
 * Use whenever email copy references PRO Portal — do not invent features.
 */

export const PRO_PORTAL_PRODUCT_CONTEXT = `
PRO PORTAL — AUTHORIZED PRODUCT FACTS (source: uff.pro/pro-portal)
PRO Portal is UFF's cloud-based wholesale loan management platform. Brokers can self-sign up at go.uff.pro/signup and log in at go.uff.pro.

AVAILABLE TODAY (you may reference these):
- Create Loans: loan application creation, auto-populate borrower info, built-in compliance checks, save and resume
- Price Loans: live rate updates throughout the day, multiple pricing scenarios, LTV calculations, customizable pricing worksheets
- Lock Loans: one-click rate locks, flexible lock periods, lock extensions, automated lock confirmations
- Upload Documents: drag-and-drop uploads, automatic document categorization, version control, secure encrypted storage
- Manage Pipeline: visual pipeline dashboard, milestone tracking, automated status updates, performance analytics
- View Conditions: live condition updates, priority-based organization, condition resolution tracking, automated notifications (loan/condition status — NOT custom user-configured market alerts)
- Platform: 24/7 web access, mobile-responsive, bank-level security, team collaboration with role-based permissions
- Login: existing partners use go.uff.pro; new brokers self-sign up at go.uff.pro/signup

COMING SOON (mention only as roadmap, never as available today):
- Order Appraisal, Order Credit, Digital Verifications (VOE/VOI), Initial Disclosures

DO NOT CLAIM OR IMPLY PRO Portal has:
- Custom automated alerts, rate alert subscriptions, or push notifications for market moves
- Appraisal ordering, credit pulls, digital verifications, or initial disclosures (not live yet)
- Features not listed above — if unsure, omit rather than invent
- That UFF publishes daily market commentary newsletters or proprietary rate forecasts (UFF is a lender, not a market data publisher)

When mentioning PRO Portal, tie the CTA to a real capability above (e.g. price a scenario, check conditions, upload docs).
`.trim();

/** Campaign types that should always receive full PRO Portal product context. */
export const PRO_PORTAL_CONTEXT_CAMPAIGN_TYPES = new Set([
  "pro_portal_feature_spotlight",
  "daily_rate_update",
  "market_commentary",
  "re_engagement_campaign",
  "broker_business_growth_tip",
  "weekly_broker_newsletter",
  "operational_tip",
]);

export function needsProPortalContext(campaignType: string): boolean {
  return PRO_PORTAL_CONTEXT_CAMPAIGN_TYPES.has(campaignType);
}
