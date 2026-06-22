import {
  enforceDailyBriefingDateFields,
  getEtYmd,
  getTodayBriefingDateLabel,
  isSameEtDay,
} from "./mortgageNewsRssContext.ts";

Deno.test("isSameEtDay matches calendar day in Eastern time", () => {
  const ref = new Date("2026-06-01T23:00:00Z");
  if (!isSameEtDay("Mon, 01 Jun 2026 19:57:16 GMT", ref)) {
    throw new Error("Expected same ET day");
  }
  if (isSameEtDay("Sun, 31 May 2026 19:57:16 GMT", ref)) {
    throw new Error("Expected different ET day");
  }
});

Deno.test("getEtYmd returns YYYY-MM-DD", () => {
  const ymd = getEtYmd(new Date("2026-06-01T12:00:00Z"));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) throw new Error(`Bad format: ${ymd}`);
});

Deno.test("enforceDailyBriefingDateFields stamps title and subject", () => {
  const ref = new Date("2026-06-01T15:00:00Z");
  const label = getTodayBriefingDateLabel(ref);
  const campaign = {
    title: "Generic Update",
    email_subject: "Mortgage markets moved",
    preview_text: "Quick recap",
    email_html: "<p>Body</p>",
    email_text: "Body",
  };
  enforceDailyBriefingDateFields(campaign, ref);
  if (!campaign.title.includes(label)) throw new Error("Title missing date");
  if (!campaign.email_subject?.includes(label)) throw new Error("Subject missing date");
  if (!campaign.email_html?.includes(label)) throw new Error("HTML missing date");
});
