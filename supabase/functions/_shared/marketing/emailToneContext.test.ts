import {
  DEFAULT_EMAIL_TONE,
  EMAIL_TONES,
  evaluateToneDelivery,
  getEmailTonePromptBlock,
  getEmailToneImageRules,
  getEmailToneSystemPromptBlock,
  getFunnyWordOfTheDay,
  getMotivationalQuoteOfTheDay,
  parseEmailTone,
  pickRandomFunnyWord,
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

Deno.test("pickRandomFunnyWord returns words from the pool", () => {
  const seen = new Set<string>();
  for (let i = 0; i < 20; i++) {
    const word = pickRandomFunnyWord();
    if (!word.trim()) throw new Error("Expected funny word");
    seen.add(word);
  }
  if (seen.size < 2) {
    throw new Error("Expected variety across random picks");
  }
});

Deno.test("getEmailTonePromptBlock uses explicit funnyWord when provided", () => {
  const ref = new Date("2026-06-22T12:00:00Z");
  const quote = getMotivationalQuoteOfTheDay(ref);
  const standard = getEmailTonePromptBlock("standard", { ref });
  if (!standard.includes(quote.quote)) throw new Error("Standard tone must include quote");

  const funny = getEmailTonePromptBlock("funny", { funnyWord: "Test-o-rific" });
  if (!funny.includes("Test-o-rific")) {
    throw new Error("Funny tone must use provided funnyWord");
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

Deno.test("evaluateToneDelivery detects funny tone markers", () => {
  const fail = evaluateToneDelivery("funny", { email_subject: "Market update" });
  if (fail.passes) throw new Error("Expected funny tone failure");

  const pass = evaluateToneDelivery(
    "funny",
    { email_html: "Funny Word of the Day: Lock-tastic — a broker term", email_subject: "A punny subject" },
    { funnyWord: "Lock-tastic" }
  );
  if (!pass.passes) throw new Error(`Expected funny tone pass: ${pass.reasons.join(", ")}`);
});

Deno.test("getEmailToneSystemPromptBlock includes override for funny", () => {
  const block = getEmailToneSystemPromptBlock("funny", { funnyWord: "Pipeline-palooza" });
  if (!block.includes("CRITICAL EMAIL TONE OVERRIDE")) {
    throw new Error("Expected system override block");
  }
  if (!block.includes("Pipeline-palooza")) {
    throw new Error("Expected explicit funny word in system block");
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
