import {
  DEFAULT_EMAIL_TONE,
  EMAIL_TONES,
  evaluateToneDelivery,
  getEmailTonePromptBlock,
  getEmailToneImageRules,
  getEmailToneSystemPromptBlock,
  getFunnyWordOfTheDay,
  getMotivationalQuoteOfTheDay,
  hasEdgyHumorSignals,
  isCornyHumor,
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

Deno.test("getEmailTonePromptBlock covers all tones", () => {
  const ref = new Date("2026-06-22T12:00:00Z");
  const quote = getMotivationalQuoteOfTheDay(ref);
  const standard = getEmailTonePromptBlock("standard", { ref });
  if (!standard.includes(quote.quote)) throw new Error("Standard tone must include quote");

  const funny = getEmailTonePromptBlock("funny");
  if (!funny.includes("BORDERLINE INSULTING")) throw new Error("Funny tone must describe insulting edgy humor");
  if (/funny word for this campaign/i.test(funny)) {
    throw new Error("Funny tone must not require corny funny-word callouts");
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

Deno.test("evaluateToneDelivery rejects dry and corny funny copy", () => {
  const dry = evaluateToneDelivery("funny", { email_subject: "Market update" });
  if (dry.passes) throw new Error("Expected funny tone failure for dry copy");

  const corny = evaluateToneDelivery("funny", {
    email_html: "Funny Word of the Day: Lock-tastic — a broker term",
    email_subject: "A punny subject",
  });
  if (corny.passes) throw new Error("Expected funny tone failure for corny copy");

  const edgy = evaluateToneDelivery("funny", {
    email_html:
      "If your DTI rescue plan starts with FHA, you're not structuring — you're surrendering. That retiree with $1.1M IRA? Asset depletion. 36-month lookback.",
    email_subject: "You didn't lose that deal. You gift-wrapped it.",
  });
  if (!edgy.passes) throw new Error(`Expected funny tone pass: ${edgy.reasons.join(", ")}`);
});

Deno.test("hasEdgyHumorSignals and isCornyHumor", () => {
  if (!hasEdgyHumorSignals("Underwriting circus. Real talk — this pipeline is a nightmare.")) {
    throw new Error("Expected edgy signals");
  }
  if (isCornyHumor("Funny Word of the Day: Mortgage-mentum")) {
    if (hasEdgyHumorSignals("Funny Word of the Day: Mortgage-mentum")) {
      throw new Error("Corny copy should not pass edgy check");
    }
  }
});

Deno.test("getEmailToneSystemPromptBlock includes edgy override for funny", () => {
  const block = getEmailToneSystemPromptBlock("funny");
  if (!block.includes("CRITICAL EMAIL TONE OVERRIDE")) {
    throw new Error("Expected system override block");
  }
  if (!block.includes("BORDERLINE INSULTING")) throw new Error("Expected edgy funny override");
  if (/funny word/i.test(block)) throw new Error("System block must not require funny word");
});

Deno.test("getEmailToneImageRules returns tone-specific guidance", () => {
  if (!getEmailToneImageRules("funny").includes("content-specific")) {
    throw new Error("Funny image rules expected");
  }
  if (!getEmailToneImageRules("standard").includes("memorable")) {
    throw new Error("Standard image rules expected");
  }
});
