/**
 * FRED market data + same-day RSS headlines for market campaigns.
 * daily_rate_update requires today's RSS headlines (see mortgageNewsRssContext.ts).
 */
import {
  DailyMarketBriefingUnavailableError,
  DAILY_MARKET_BRIEFING_PROMPT_RULES,
  fetchTodayMortgageHeadlines,
  formatTodayHeadlinesForPrompt,
  getEtYmd,
} from "./mortgageNewsRssContext.ts";

const MARKET_SERIES = [
  { key: "MORTGAGE30US", label: "30-Year Fixed Mortgage Rate (Freddie Mac PMMS)" },
  { key: "MORTGAGE15US", label: "15-Year Fixed Mortgage Rate (Freddie Mac PMMS)" },
  { key: "DGS10", label: "10-Year Treasury Yield" },
  { key: "FEDFUNDS", label: "Federal Funds Effective Rate" },
  { key: "CPIAUCSL", label: "Consumer Price Index (All Urban)" },
  { key: "UNRATE", label: "Unemployment Rate" },
  { key: "HOUST", label: "Housing Starts" },
  { key: "EXHOSLUSM495S", label: "Existing Home Sales" },
  { key: "MSPUS", label: "Median Sales Price of Houses Sold" },
] as const;

/** FRED-backed campaigns (not the same-day RSS daily briefing). */
export const MARKET_DATA_CAMPAIGN_TYPES = new Set([
  "market_commentary",
  "market_intelligence",
  "weekly_broker_newsletter",
]);

export const DAILY_BRIEFING_CAMPAIGN_TYPE = "daily_rate_update" as const;

interface FredObservation {
  date: string;
  value: number;
}

async function fetchFredLatest(
  seriesId: string,
  apiKey: string
): Promise<FredObservation | null> {
  const url =
    `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}` +
    `&api_key=${apiKey}&file_type=json&sort_order=desc&limit=5`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  const obs = data.observations as Array<{ date: string; value: string }> | undefined;
  if (!obs?.length) return null;
  for (const o of obs) {
    if (o.value === ".") continue;
    const value = parseFloat(o.value);
    if (!Number.isNaN(value)) return { date: o.date, value };
  }
  return null;
}

export async function fetchMarketDataSummary(): Promise<string | null> {
  const apiKey = Deno.env.get("FRED_API_KEY");
  if (!apiKey) return null;

  const results = await Promise.all(
    MARKET_SERIES.map(async (s) => ({
      ...s,
      latest: await fetchFredLatest(s.key, apiKey),
    }))
  );

  const lines: string[] = [
    "CURRENT MARKET DATA (Federal Reserve Economic Data — FRED). Use ONLY these figures for rate/economic claims; cite the observation date for each number you use.",
    "UFF does NOT publish proprietary market forecasts or daily commentary services — frame this email as a brief broker-facing snapshot using public data plus practical wholesale lending context.",
    "",
  ];

  for (const row of results) {
    if (!row.latest) continue;
    const { date, value } = row.latest;
    const formatted =
      row.key.includes("MSPUS") || row.key.includes("EXHOS")
        ? value.toLocaleString("en-US", { maximumFractionDigits: 0 })
        : String(value);
    lines.push(`- ${row.label}: ${formatted} (as of ${date})`);
  }

  if (lines.length <= 3) return null;

  lines.push("");
  lines.push(`Data fetched: ${new Date().toISOString().slice(0, 10)}`);
  lines.push(
    "Interpret trends cautiously. Do not invent CPI/Fed meeting outcomes or rate predictions not supported by this data. Include a brief disclaimer that rates and programs change."
  );

  return lines.join("\n");
}

export const MARKET_COMMENTARY_PROMPT_RULES = `
MARKET / RATE CAMPAIGN RULES:
- Lead with real, dated data from the FRED block below — not generic "markets moved" filler.
- Explain what the data may mean for wholesale brokers (pricing conversations, lock timing, product fit) without promising UFF rates.
- Do NOT say UFF sends daily market commentary, rate alerts, or research reports — this email is an educational snapshot for partners, not a subscription product.
- Do NOT fabricate Fed decisions, jobs report numbers, or mortgage rate levels — use only provided FRED figures with observation dates.
- One practical broker action item is fine; CTA can point to PRO Portal for pricing/scenarios, not for "market alerts."
`.trim();

/** Same-day RSS required; supplements with FRED when available. Throws if no headlines today. */
export async function fetchTodayMarketBriefing(): Promise<string> {
  const todayEt = getEtYmd();
  const headlines = await fetchTodayMortgageHeadlines();
  if (!headlines.length) {
    throw new DailyMarketBriefingUnavailableError(
      `No mortgage market headlines published today (${todayEt} ET) in configured RSS feeds. Daily briefing not generated.`
    );
  }

  const parts: string[] = [formatTodayHeadlinesForPrompt(headlines, todayEt)];

  try {
    const fred = await fetchMarketDataSummary();
    if (fred) {
      parts.push("");
      parts.push(
        "SUPPLEMENTAL FRED DATA (use only with observation dates — not a substitute for today's headlines):"
      );
      parts.push(fred);
    }
  } catch (e) {
    console.warn("FRED supplement fetch failed:", e);
  }

  parts.push("");
  parts.push(`Briefing assembled: ${new Date().toISOString()} (${todayEt} ET)`);

  return parts.join("\n");
}

export { DailyMarketBriefingUnavailableError, DAILY_MARKET_BRIEFING_PROMPT_RULES };
