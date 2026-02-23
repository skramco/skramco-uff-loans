import type { Context, Config } from "@netlify/functions";

/* ─── FRED Series we fetch ─── */
const SERIES: Record<string, { id: string; label: string; unit: string; frequency: string }> = {
  mortgage30:     { id: "MORTGAGE30US",      label: "30-Year Fixed Mortgage Rate",           unit: "%",       frequency: "Weekly" },
  mortgage15:     { id: "MORTGAGE15US",      label: "15-Year Fixed Mortgage Rate",           unit: "%",       frequency: "Weekly" },
  treasury10:     { id: "DGS10",             label: "10-Year Treasury Yield",                unit: "%",       frequency: "Daily" },
  fedFunds:       { id: "FEDFUNDS",          label: "Federal Funds Rate",                    unit: "%",       frequency: "Monthly" },
  medianPrice:    { id: "MSPUS",             label: "Median Sales Price of Houses Sold",     unit: "$",       frequency: "Quarterly" },
  housingSupply:  { id: "MSACSR",            label: "Monthly Supply of New Houses",          unit: "months",  frequency: "Monthly" },
  affordability:  { id: "FIXHAI",            label: "Housing Affordability Index",           unit: "index",   frequency: "Monthly" },
  homeownership:  { id: "RHORUSQ156N",      label: "Homeownership Rate",                   unit: "%",       frequency: "Quarterly" },
  cpi:            { id: "CPIAUCSL",          label: "Consumer Price Index (All Items)",      unit: "index",   frequency: "Monthly" },
  unemployment:   { id: "UNRATE",            label: "Unemployment Rate",                    unit: "%",       frequency: "Monthly" },
  housingStarts:  { id: "HOUST",             label: "Housing Starts",                       unit: "thousands", frequency: "Monthly" },
  existingHome:   { id: "EXHOSLUSM495S",    label: "Existing Home Sales",                  unit: "millions", frequency: "Monthly" },
};

/* How many observations to fetch per series (for charts) */
const HISTORY_LIMIT = 52; // ~1 year of weekly data, or ~4 years of monthly

async function fetchFredSeries(
  seriesId: string,
  apiKey: string,
  limit: number
): Promise<{ date: string; value: number }[] | null> {
  const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${apiKey}&file_type=json&sort_order=desc&limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  const obs = data.observations;
  if (!obs || obs.length === 0) return null;

  return obs
    .filter((o: any) => o.value !== ".")
    .map((o: any) => ({ date: o.date, value: parseFloat(o.value) }))
    .filter((o: any) => !isNaN(o.value))
    .reverse(); // chronological order
}

export default async (req: Request, context: Context) => {
  const apiKey = Netlify.env.get("FRED_API_KEY");
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "FRED API key not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Fetch all series in parallel
    const entries = Object.entries(SERIES);
    const results = await Promise.all(
      entries.map(([key, cfg]) => fetchFredSeries(cfg.id, apiKey, HISTORY_LIMIT))
    );

    const payload: Record<string, any> = {};
    entries.forEach(([key, cfg], i) => {
      const data = results[i];
      if (data && data.length > 0) {
        const latest = data[data.length - 1];
        const previous = data.length > 1 ? data[data.length - 2] : latest;
        payload[key] = {
          label: cfg.label,
          unit: cfg.unit,
          frequency: cfg.frequency,
          current: latest.value,
          previous: previous.value,
          change: Math.round((latest.value - previous.value) * 1000) / 1000,
          changePct: previous.value !== 0
            ? Math.round(((latest.value - previous.value) / previous.value) * 10000) / 100
            : 0,
          date: latest.date,
          history: data,
        };
      }
    });

    return new Response(JSON.stringify({ data: payload, fetchedAt: new Date().toISOString() }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=14400, s-maxage=14400", // 4-hour cache
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || "Internal error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const config: Config = {
  path: "/api/market-data",
};
