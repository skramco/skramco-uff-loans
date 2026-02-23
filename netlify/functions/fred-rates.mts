import type { Context, Config } from "@netlify/functions";

/* ─── Tunable Spread Configuration ─── */
const SPREADS: Record<string, { base: string; spread: number; term: number; label: string }> = {
  "30yr_fixed":  { base: "MORTGAGE30US", spread: -0.125, term: 360, label: "30-Year Fixed" },
  "20yr_fixed":  { base: "MORTGAGE30US", spread: -0.375, term: 240, label: "20-Year Fixed" },
  "15yr_fixed":  { base: "MORTGAGE15US", spread: -0.125, term: 180, label: "15-Year Fixed" },
  "10yr_fixed":  { base: "MORTGAGE15US", spread: -0.250, term: 120, label: "10-Year Fixed" },
  "7_1_arm":     { base: "MORTGAGE30US", spread: -0.500, term: 360, label: "7/1 ARM" },
  "5_1_arm":     { base: "MORTGAGE5US",  spread:  0.000, term: 360, label: "5/1 ARM" },
  "fha_30yr":    { base: "MORTGAGE30US", spread: -0.500, term: 360, label: "FHA 30-Year" },
  "va_30yr":     { base: "MORTGAGE30US", spread: -0.625, term: 360, label: "VA 30-Year" },
};

/* ─── Assumptions (match /rates page footer) ─── */
const LOAN_AMOUNT = 340000;
const HOME_PRICE = 425000;
const ORIGINATION_FEE_PCT = 1.0;   // 1% of loan amount
const ESTIMATED_FEES = 3500;       // title, appraisal, etc.

/* ─── Helpers ─── */
function roundToEighth(n: number): number {
  return Math.round(n * 8) / 8;
}

function monthlyPayment(principal: number, annualRate: number, termMonths: number): number {
  const r = annualRate / 100 / 12;
  if (r === 0) return principal / termMonths;
  return principal * (r * Math.pow(1 + r, termMonths)) / (Math.pow(1 + r, termMonths) - 1);
}

function calculateAPR(principal: number, annualRate: number, termMonths: number): number {
  const pmt = monthlyPayment(principal, annualRate, termMonths);
  const originationFee = principal * (ORIGINATION_FEE_PCT / 100);
  const totalCosts = originationFee + ESTIMATED_FEES;
  const amountFinanced = principal - totalCosts;

  let apr = annualRate;
  for (let i = 0; i < 1000; i++) {
    const r = apr / 100 / 12;
    const pv = pmt * (1 - Math.pow(1 + r, -termMonths)) / r;
    if (Math.abs(pv - amountFinanced) < 0.01) break;
    apr += pv > amountFinanced ? 0.0001 : -0.0001;
  }
  return Math.round(apr * 1000) / 1000;
}

/* ─── FRED fetch ─── */
async function fetchFredSeries(seriesId: string, apiKey: string): Promise<{ current: number; previous: number; date: string } | null> {
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

/* ─── Main handler ─── */
export default async (req: Request, context: Context) => {
  const apiKey = Netlify.env.get("FRED_API_KEY");
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "FRED API key not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Fetch all three FRED series in parallel
    const [m30, m15, m5] = await Promise.all([
      fetchFredSeries("MORTGAGE30US", apiKey),
      fetchFredSeries("MORTGAGE15US", apiKey),
      fetchFredSeries("MORTGAGE5US", apiKey),
    ]);

    if (!m30) {
      return new Response(JSON.stringify({ error: "Unable to fetch FRED data" }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }

    const fredData: Record<string, { current: number; previous: number; date: string }> = {
      MORTGAGE30US: m30,
      MORTGAGE15US: m15 || m30, // fallback to 30yr if 15yr unavailable
      MORTGAGE5US: m5 || m30,   // fallback to 30yr if 5/1 unavailable
    };

    // Build rate table
    const rates = Object.entries(SPREADS).map(([key, cfg]) => {
      const fred = fredData[cfg.base];
      const rawRate = fred.current + cfg.spread;
      const rate = roundToEighth(rawRate);
      const prevRawRate = fred.previous + cfg.spread;
      const prevRate = roundToEighth(prevRawRate);
      const change = Math.round((rate - prevRate) * 1000) / 1000;

      const pmt = monthlyPayment(LOAN_AMOUNT, rate, cfg.term);
      const apr = calculateAPR(LOAN_AMOUNT, rate, cfg.term);

      return {
        key,
        product: cfg.label,
        rate: rate.toFixed(3),
        apr: apr.toFixed(3),
        payment: Math.round(pmt),
        change: change.toFixed(3),
        term: cfg.term,
      };
    });

    const payload = {
      rates,
      assumptions: {
        loanAmount: LOAN_AMOUNT,
        homePrice: HOME_PRICE,
        downPaymentPct: Math.round((1 - LOAN_AMOUNT / HOME_PRICE) * 100),
        creditScore: "740+",
        occupancy: "Owner-occupied single-family residence",
        lockDays: 30,
      },
      source: "Freddie Mac Primary Mortgage Market Survey via FRED",
      observationDate: m30.date,
      fetchedAt: new Date().toISOString(),
    };

    return new Response(JSON.stringify(payload), {
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
  path: "/api/rates",
};
