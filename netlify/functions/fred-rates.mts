import type { Context, Config } from "@netlify/functions";
import { buildRatesPayload, type FredObservation } from "./_shared/buildFredRatesPayload";

async function fetchFredSeries(seriesId: string, apiKey: string): Promise<FredObservation | null> {
  const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${apiKey}&file_type=json&sort_order=desc&limit=2`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  const obs = data.observations;
  if (!obs || obs.length === 0) return null;

  const current = parseFloat(obs[0].value);
  const previous = obs.length > 1 ? parseFloat(obs[1].value) : current;
  if (isNaN(current)) return null;

  return { current, previous: isNaN(previous) ? current : previous, date: obs[0].date };
}

export default async (_req: Request, _context: Context) => {
  const apiKey = Netlify.env.get("FRED_API_KEY");
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "FRED API key not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const [m30, m15, m5] = await Promise.all([
      fetchFredSeries("MORTGAGE30US", apiKey),
      fetchFredSeries("MORTGAGE15US", apiKey),
      fetchFredSeries("MORTGAGE5US", apiKey),
    ]);

    const fetchedAt = new Date().toISOString();
    const payload = buildRatesPayload(
      {
        MORTGAGE30US: m30,
        MORTGAGE15US: m15,
        MORTGAGE5US: m5,
      },
      fetchedAt,
    );

    if (!payload) {
      return new Response(JSON.stringify({ error: "Unable to fetch FRED data" }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=14400, s-maxage=14400",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const config: Config = {
  path: "/api/rates",
};