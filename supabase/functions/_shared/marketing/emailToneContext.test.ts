import {
  DEFAULT_EMAIL_TONE,
  EMAIL_TONES,
  getEmailTonePromptBlock,
  getEmailToneImageRules,
  getFunnyWordOfTheDay,
  getMotivationalQuoteOfTheDay,
  parseEmailTone,
} from "./emailToneContext.ts";

Deno.test("parseEmailTone accepts valid tones and defaults unknown", () => {
  for (const tone of EMAIL_TONES) {
    if (parseEmailTone(tone) !== tone) throw new Error(`Expected ${tone}`);
  }
  if (parseEmailTone("invalid") !== DEFAULT_EMAIL_TONE) throw new Error("Expected default");
  if (parseEmailTone(null) !== DEFAULT_EMAIL_TONE) throw new Error("Expected default for null");
});

Deno.test("getMotivationalQuoteOfTheDay is deterministic for a date", () => {
  const ref = new Date("2026-06-22T12:00:00Z");
  const a = getMotivationalQuoteOfTheDay(ref);
  const b = getMotivationalQuoteOfTheDay(ref);
  if (a.quote !== b.quote || a.author !== b.author) {
    throw new Error("Quote should be stable for same date");
  }
  if (!a.quote || !a.author) throw new Error("Quote and author required");
});

Deno.test("getFunnyWordOfTheDay returns a non-empty string", () => {
  const word = getFunnyWordOfTheDay(new Date("2026-06-22T12:00:00Z"));
  if (!word.trim()) throw new Error("Expected funny word");
});

Deno.test("getEmailTonePromptBlock includes tone-specific requirements", () => {
  const ref = new Date("2026-06-22T12:00:00Z");
  const quote = getMotivationalQuoteOfTheDay(ref);
  const standard = getEmailTonePromptBlock("standard", { ref });
  if (!standard.includes(quote.quote)) throw new Error("Standard tone must include quote");

  const funny = getEmailTonePromptBlock("funny", { ref });
  if (!funny.includes(getFunnyWordOfTheDay(ref))) {
    throw new Error("Funny tone must include word of the day");
  }

  const urgency = getEmailTonePromptBlock("urgency");
  if (!urgency.includes("URGENCY")) throw new Error("Urgency tone label expected");

  const realTime = getEmailTonePromptBlock("real_time", {
    realTimeContext: "TEST HEADLINE BLOCK",
  });
  if (!realTime.includes("TEST HEADLINE BLOCK")) {
    throw new Error("Real-time context should be appended");
  }
});

Deno.test("getEmailToneImageRules returns tone-specific guidance", () => {
  if (!getEmailToneImageRules("funny").includes("playful")) {
    throw new Error("Funny image rules expected");
  }
  if (!getEmailToneImageRules("standard").includes("uplifting")) {
    throw new Error("Standard image rules expected");
  }
});
