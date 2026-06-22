import {
  formatLinkedInCaption,
  LANDING_PAGE_PLACEHOLDER,
  LINKEDIN_PRO_PORTAL_PLACEHOLDER,
} from "./linkedinPostFormat.ts";

Deno.test("formatLinkedInCaption orders body, landing, hashtags, pro portal", () => {
  const raw = `Market insight for brokers.

#MortgageBroker #WholesaleMortgage

https://www.uff.pro/lp/test`;

  const out = formatLinkedInCaption(raw, {
    landingUrl: "https://www.uff.pro/lp/test",
    proPortalUrl: "https://www.uff.pro/pro-portal",
  });

  const landingIdx = out.indexOf("https://www.uff.pro/lp/test");
  const hashIdx = out.indexOf("#MortgageBroker");
  const portalIdx = out.indexOf("https://www.uff.pro/pro-portal");
  const bodyIdx = out.indexOf("Market insight");

  if (!(bodyIdx < landingIdx && landingIdx < hashIdx && hashIdx < portalIdx)) {
    throw new Error(`Wrong order:\n${out}`);
  }
});

Deno.test("formatLinkedInCaption preserves placeholders when requested", () => {
  const out = formatLinkedInCaption("Hook line here.\n\n#UFFMortgage");
  if (!out.includes(LANDING_PAGE_PLACEHOLDER)) throw new Error("Missing landing placeholder");
  if (!out.includes(LINKEDIN_PRO_PORTAL_PLACEHOLDER)) throw new Error("Missing portal placeholder");
  if (out.indexOf(LANDING_PAGE_PLACEHOLDER) > out.indexOf(LINKEDIN_PRO_PORTAL_PLACEHOLDER)) {
    throw new Error("Landing should appear before PRO Portal placeholder");
  }
});
