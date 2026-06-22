/**
 * Global email tone — affects copy, subject lines, imagery prompts, and LinkedIn captions.
 * Stored in marketing_settings.email_tone; default is "standard".
 */

import {
  fetchTodayMortgageHeadlines,
  formatTodayHeadlinesForPrompt,
  getEtYmd,
  getTodayBriefingDateLabel,
} from "./mortgageNewsRssContext.ts";
import { fetchMarketDataSummary } from "./marketDataContext.ts";

export const EMAIL_TONES = ["standard", "funny", "urgency", "real_time"] as const;
export type EmailTone = (typeof EMAIL_TONES)[number];

export const DEFAULT_EMAIL_TONE: EmailTone = "standard";
export const EMAIL_TONE_SETTING_KEY = "email_tone";

export const EMAIL_TONE_LABELS: Record<EmailTone, string> = {
  standard: "Standard",
  funny: "Funny",
  urgency: "Urgency",
  real_time: "Real-Time",
};

export const EMAIL_TONE_DESCRIPTIONS: Record<EmailTone, string> = {
  standard:
    "Professional broker intelligence with a motivational quote of the day in every email.",
  funny: "Engaging humor across each campaign — random funny word, jokes, and playful copy every time you generate.",
  urgency: "Action-oriented copy that motivates brokers to act now — without false rate claims.",
  real_time:
    "Grounded in today's mortgage headlines and market data with immediate, event-driven recommendations.",
};

const MOTIVATIONAL_QUOTES: Array<{ quote: string; author: string }> = [
  { quote: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
  { quote: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
  { quote: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { quote: "Opportunities don't happen. You create them.", author: "Chris Grosser" },
  { quote: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { quote: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { quote: "Quality is not an act, it is a habit.", author: "Aristotle" },
  { quote: "Well done is better than well said.", author: "Benjamin Franklin" },
  { quote: "Act as if what you do makes a difference. It does.", author: "William James" },
  { quote: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
  { quote: "Your limitation — it's only your imagination.", author: "Unknown" },
  { quote: "Push yourself, because no one else is going to do it for you.", author: "Unknown" },
  { quote: "Great things never come from comfort zones.", author: "Unknown" },
  { quote: "Dream it. Wish it. Do it.", author: "Unknown" },
  { quote: "Success doesn't just find you. You have to go out and get it.", author: "Unknown" },
  { quote: "The harder you work for something, the greater you'll feel when you achieve it.", author: "Unknown" },
  { quote: "Dream bigger. Do bigger.", author: "Unknown" },
  { quote: "Don't stop when you're tired. Stop when you're done.", author: "Unknown" },
  { quote: "Wake up with determination. Go to bed with satisfaction.", author: "Unknown" },
  { quote: "Do something today that your future self will thank you for.", author: "Unknown" },
  { quote: "Little things make big days.", author: "Unknown" },
  { quote: "It's going to be hard, but hard does not mean impossible.", author: "Unknown" },
  { quote: "Don't wait for opportunity. Create it.", author: "Unknown" },
  { quote: "Sometimes we're tested not to show our weaknesses, but to discover our strengths.", author: "Unknown" },
  { quote: "The key to success is to focus on goals, not obstacles.", author: "Unknown" },
  { quote: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { quote: "What you get by achieving your goals is not as important as what you become.", author: "Henry David Thoreau" },
  { quote: "Strive not to be a success, but rather to be of value.", author: "Albert Einstein" },
  { quote: "I find that the harder I work, the more luck I seem to have.", author: "Thomas Jefferson" },
  { quote: "If you are not willing to risk the usual, you will have to settle for the ordinary.", author: "Jim Rohn" },
  { quote: "All our dreams can come true if we have the courage to pursue them.", author: "Walt Disney" },
  { quote: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
  { quote: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { quote: "Everything you've ever wanted is on the other side of fear.", author: "George Addair" },
  { quote: "Hardships often prepare ordinary people for an extraordinary destiny.", author: "C.S. Lewis" },
  { quote: "Believe in yourself and all that you are.", author: "Christian D. Larson" },
  { quote: "You are never too old to set another goal or to dream a new dream.", author: "C.S. Lewis" },
  { quote: "Try to be a rainbow in someone else's cloud.", author: "Maya Angelou" },
  { quote: "You miss 100% of the shots you don't take.", author: "Wayne Gretzky" },
  { quote: "Whether you think you can or you think you can't, you're right.", author: "Henry Ford" },
];

const FUNNY_WORDS_OF_THE_DAY = [
  "Mortgage-mentum",
  "Underwrite-ful",
  "Lock-tastic",
  "Pipeline-palooza",
  "Scenario-sational",
  "Broker-brella",
  "Rate-itude",
  "Closing-terpiece",
  "Doc-u-drama",
  "Escrow-citing",
  "Amorti-zing",
  "Pre-approva-lujah",
  "DTI-lightful",
  "Refi-resco",
  "Condition-al love",
  "Title-wave",
  "Appraisal-ooza",
  "Wholesale-wonder",
  "Guideline-giggles",
  "FICO-frolic",
  "Loan-gerie",
  "Under-rater",
  "Points-pun",
  "Servicing-smile",
  "Broker-boost",
  "Rate-rator",
  "Closing-cue",
  "Pipeline-pizzazz",
  "Scenario-snap",
  "Lock-larity",
  "Doc-umentary",
  "Escrow-ellent",
];

function dayOfYear(ref: Date): number {
  const start = new Date(ref.getFullYear(), 0, 0);
  const diff = ref.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function parseEmailTone(value: unknown): EmailTone {
  if (typeof value === "string" && (EMAIL_TONES as readonly string[]).includes(value)) {
    return value as EmailTone;
  }
  return DEFAULT_EMAIL_TONE;
}

export function getMotivationalQuoteOfTheDay(ref: Date = new Date()): {
  quote: string;
  author: string;
} {
  const index = dayOfYear(ref) % MOTIVATIONAL_QUOTES.length;
  return MOTIVATIONAL_QUOTES[index];
}

export function getFunnyWordOfTheDay(ref: Date = new Date()): string {
  const index = dayOfYear(ref) % FUNNY_WORDS_OF_THE_DAY.length;
  return FUNNY_WORDS_OF_THE_DAY[index];
}

/** Random funny word for each campaign generation (not tied to calendar day). */
export function pickRandomFunnyWord(): string {
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  return FUNNY_WORDS_OF_THE_DAY[bytes[0] % FUNNY_WORDS_OF_THE_DAY.length];
}

function resolveFunnyWord(explicit: string | undefined): string {
  return explicit?.trim() ? explicit.trim() : pickRandomFunnyWord();
}

/** Fetch today's mortgage headlines + FRED snapshot for Real-Time tone. */
export async function fetchRealTimeContext(ref: Date = new Date()): Promise<string> {
  const dateLabel = getTodayBriefingDateLabel(ref);
  const ymd = getEtYmd(ref);
  const parts: string[] = [
    `REAL-TIME CONTEXT (${dateLabel}, ${ymd}, America/New_York)`,
    "Use ONLY the sources below for current-event claims. Do not invent news, Fed actions, or rate moves.",
    "",
  ];

  try {
    const headlines = await fetchTodayMortgageHeadlines(ref);
    if (headlines.length > 0) {
      parts.push(formatTodayHeadlinesForPrompt(headlines, ymd));
    } else {
      parts.push(
        "No same-day mortgage headlines found in RSS feeds yet. Acknowledge this honestly and focus on actionable broker guidance using FRED data and general market context — do not fabricate breaking news."
      );
    }
  } catch {
    parts.push("Mortgage headline fetch unavailable — rely on FRED data and general guidance only.");
  }

  parts.push("");

  try {
    const fred = await fetchMarketDataSummary();
    if (fred) parts.push(fred);
  } catch {
    parts.push("FRED market data unavailable.");
  }

  parts.push(
    "",
    "REAL-TIME TONE REQUIREMENTS:",
    "- Tie subject line, preview text, email body, LinkedIn caption, and canva_prompt to TODAY's events above.",
    "- Lead with what changed today and what brokers should do in the next 24–48 hours.",
    "- Cite observation dates for any economic figures; attribute news themes to the listed sources.",
    "- Recommend specific PRO Portal actions (pricing, scenario desk, product fit) driven by today's context."
  );

  return parts.join("\n");
}

function standardToneBlock(quote: { quote: string; author: string }): string {
  return `
EMAIL TONE: STANDARD (default professional broker intelligence)
- Keep the existing UFF broker-growth voice: practical, educational, compliance-safe.
- REQUIRED — Motivational Quote of the Day: include this exact quote in EVERY output:
  "${quote.quote}" — ${quote.author}
  - email_html: styled callout box near the top (blockquote or highlighted panel) with the quote and attribution.
  - email_text: include the quote on its own line with attribution.
  - linkedin_post: weave the quote naturally into the body section (not as a separate footer).
  - canva_prompt: reflect an uplifting, professional mood inspired by the quote.
  - email_subject / preview_text: may subtly echo the quote's theme but stay broker-relevant.
`.trim();
}

function funnyToneBlock(funnyWord: string): string {
  return `
EMAIL TONE: FUNNY (engaging humor — still broker-facing and compliance-safe)
- Make the reader smile or laugh across subject line, preview text, email body, LinkedIn, and imagery.
- Include at least one mortgage-industry-appropriate joke, pun, or playful analogy (wholesale brokers are the audience).
- REQUIRED — Funny Word for this campaign: "${funnyWord}" — define it playfully in the email and reference it in linkedin_post.
- Subject lines can use wit or wordplay; avoid clickbait and forbidden compliance phrases.
- canva_prompt: lighter, cheerful visual mood (still professional — no memes, no clown imagery, no text overlays).
- Humor must NOT mock borrowers, veterans, or protected classes; no guaranteed-approval jokes.
`.trim();
}

function urgencyToneBlock(): string {
  return `
EMAIL TONE: URGENCY (motivate immediate action — compliance-safe)
- Create a genuine sense of timeliness: pipeline deadlines, expiring conditions, end-of-week submission windows, market windows brokers should act on.
- Subject lines and preview text should convey "act now" without false scarcity (NO fake countdown timers, NO "rates expiring tonight" unless supported by provided data).
- Use action verbs, numbered immediate steps, and time-bound CTAs (today, this week, before close of business).
- email_html: prominent "Do this now" section with 2–4 urgent-but-honest action items.
- linkedin_post: open with a time-sensitive hook tied to broker pipeline reality.
- canva_prompt: dynamic, forward-motion energy (clock, sprint, momentum — subtle, no alarmist imagery).
- NEVER promise guaranteed approval, lowest rates, or deceptive urgency about pricing.
`.trim();
}

function realTimeToneBlock(): string {
  return `
EMAIL TONE: REAL-TIME (today's events drive every recommendation)
- A REAL-TIME CONTEXT block is appended below — it is your primary source for "what's happening today."
- Subject, preview, body, LinkedIn, and canva_prompt MUST reference specific current-day themes from that block.
- Open the email with "As of [today's date]" framing and immediate broker recommendations.
- If headlines are sparse, say so honestly and lean on dated FRED figures — do not invent breaking news.
- canva_prompt: visual tied to today's market story (headlines, data trend, or news-driven mood).
`.trim();
}

export interface EmailTonePromptOptions {
  ref?: Date;
  realTimeContext?: string;
  /** Picked once per campaign — keeps prompts and validation aligned. */
  funnyWord?: string;
}

/** Prompt block injected into campaign generation when a tone is active. */
export function getEmailTonePromptBlock(
  tone: EmailTone,
  opts: EmailTonePromptOptions = {}
): string {
  const ref = opts.ref ?? new Date();

  switch (tone) {
    case "standard":
      return standardToneBlock(getMotivationalQuoteOfTheDay(ref));
    case "funny":
      return funnyToneBlock(resolveFunnyWord(opts.funnyWord));
    case "urgency":
      return urgencyToneBlock();
    case "real_time": {
      const base = realTimeToneBlock();
      if (opts.realTimeContext?.trim()) {
        return `${base}\n\n${opts.realTimeContext.trim()}`;
      }
      return base;
    }
    default:
      return standardToneBlock(getMotivationalQuoteOfTheDay(ref));
  }
}

/**
 * System-prompt override — must win over "professional/corporate" voice elsewhere.
 * Placed last in buildSystemPrompt so it takes precedence.
 */
export function getEmailToneSystemPromptBlock(
  tone: EmailTone,
  opts: EmailTonePromptOptions = {}
): string {
  const ref = opts.ref ?? new Date();

  if (tone === "standard") {
    const quote = getMotivationalQuoteOfTheDay(ref);
    return `
EMAIL TONE: STANDARD — voice/style requirements (compliance rules still apply)
- Professional broker intelligence voice; practical and educational.
- REQUIRED Motivational Quote of the Day in email_html (styled callout), email_text, and linkedin_post:
  "${quote.quote}" — ${quote.author}
`.trim();
  }

  if (tone === "funny") {
    const funnyWord = resolveFunnyWord(opts.funnyWord);
    return `
CRITICAL EMAIL TONE OVERRIDE: FUNNY — this OVERRIDES any "professional", "corporate", or "transactional" voice instructions above.
The user explicitly selected FUNNY. Do NOT output dry, standard broker newsletter copy.

MANDATORY (verify before finishing JSON):
1. email_subject — pun, joke hook, or playful wordplay (not a boring corporate subject line).
2. email_html — open with a mortgage-industry joke OR a highlighted "Funny Word: ${funnyWord}" callout with a playful definition; include at least one additional pun or joke in the body.
3. linkedin_post — at least one joke or pun in the body section (before the landing link).
4. canva_prompt — cheerful, slightly playful visual mood (still photorealistic; no memes/clowns).
5. Still include numbered broker action steps — humor wraps the intelligence, it does not replace it.
6. Do NOT include a motivational quote of the day (that is for Standard tone only).
`.trim();
  }

  if (tone === "urgency") {
    return `
CRITICAL EMAIL TONE OVERRIDE: URGENCY — this OVERRIDES neutral/corporate pacing above.
The user selected URGENCY. Copy must feel time-sensitive and action-driven.

MANDATORY:
1. email_subject and preview_text — "act now" energy (honest deadlines only; no fake rate expirations).
2. email_html — prominent "Do this now" section with 2–4 immediate broker action items.
3. linkedin_post — open with a time-sensitive hook.
4. canva_prompt — dynamic forward-motion energy.
5. Do NOT include a motivational quote of the day.
`.trim();
  }

  // real_time
  return `
CRITICAL EMAIL TONE OVERRIDE: REAL-TIME — this OVERRIDES generic/evergreen framing above.
The user selected REAL-TIME. Every field must anchor to TODAY's date and current events from the REAL-TIME CONTEXT block in the user message.

MANDATORY:
1. email_subject — reference today's date or a specific current headline theme.
2. email_html — open with "As of [today's date]" and immediate recommendations tied to provided headlines/data.
3. linkedin_post — lead with what changed today.
4. Do NOT write evergreen copy that could have been sent any week.
5. Do NOT include a motivational quote of the day.
`.trim();
}

export interface EvaluateToneOptions {
  ref?: Date;
  funnyWord?: string;
}

export function evaluateToneDelivery(
  tone: EmailTone,
  content: {
    email_subject?: string;
    preview_text?: string;
    email_html?: string;
    email_text?: string;
    linkedin_post?: string;
    internal_summary?: string;
  },
  opts: EvaluateToneOptions = {}
): { passes: boolean; reasons: string[] } {
  if (tone === "standard") return { passes: true, reasons: [] };

  const ref = opts.ref ?? new Date();
  const combined = [
    content.email_subject,
    content.preview_text,
    content.email_html,
    content.email_text,
    content.linkedin_post,
    content.internal_summary,
  ]
    .filter(Boolean)
    .join("\n");
  const plain = combined.replace(/<[^>]+>/g, " ").toLowerCase();
  const reasons: string[] = [];

  if (tone === "funny") {
    const funnyWord = resolveFunnyWord(opts.funnyWord).toLowerCase();
    const humorSignals =
      plain.includes(funnyWord) ||
      /\b(pun|joke|lol|haha|humor|humour|playful|laugh|😄|😂|🤣)\b/.test(plain) ||
      /funny word/i.test(combined);
    if (!humorSignals) {
      reasons.push(
        `Funny tone required but output lacks humor signals or funny word "${funnyWord}"`
      );
    }
  }

  if (tone === "urgency") {
    const urgencySignals =
      /\b(now|today|this week|act fast|don't wait|time-sensitive|before (close|eod|deadline)|immediate|asap|24 hours?|48 hours?)\b/.test(
        plain
      ) || /do this now/i.test(combined);
    if (!urgencySignals) {
      reasons.push("Urgency tone required but output lacks time-sensitive language");
    }
  }

  if (tone === "real_time") {
    const dateLabel = getTodayBriefingDateLabel(ref).toLowerCase();
    const ymd = getEtYmd(ref);
    const hasDate = plain.includes(dateLabel) || plain.includes(ymd) || /as of today/i.test(plain);
    if (!hasDate) {
      reasons.push("Real-Time tone required but output lacks today's date framing");
    }
  }

  return { passes: reasons.length === 0, reasons };
}

export function getToneRetryInstruction(
  tone: EmailTone,
  reasons: string[],
  opts: EmailTonePromptOptions = {}
): string {
  const toneBlock = getEmailToneSystemPromptBlock(tone, opts);
  return `
REJECTED DRAFT: Prior output failed the selected EMAIL TONE check (${tone}).
Failure reasons: ${reasons.join("; ")}

Regenerate the FULL JSON. ${toneBlock}
`.trim();
}

/** Additional image-generation rules per tone (appended to canva/OpenAI image prompts). */
export function getEmailToneImageRules(tone: EmailTone): string {
  switch (tone) {
    case "funny":
      return "Visual mood: warm, approachable, slightly playful — bright natural light, subtle humor in composition (e.g. coffee mug with papers), still photorealistic and professional.";
    case "urgency":
      return "Visual mood: dynamic forward momentum — motion blur on cityscape, active professionals in focused collaboration, energetic but not chaotic or alarmist.";
    case "real_time":
      return "Visual mood: current, newsroom-adjacent editorial feel — modern office with screens/data ambiance, timely and relevant to today's market story.";
    case "standard":
    default:
      return "Visual mood: uplifting and confident — inspired by professional growth and steady success.";
  }
}
