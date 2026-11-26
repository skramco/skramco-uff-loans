/** Shared /api/rates payload builder (Netlify function + Vite dev middleware). */

export type FredObservation = { current: number; previous: number; date: string };

export type RateProductConfig = {
  base: string;
  spread: number;
  term: number;
  label: string;
  /** True when the row tracks a PMMS series directly (30- or 15-year fixed). */
  pmmsDirect: boolean;
  /** When set, the product is only included if this FRED series is present and fresh. */
  requiresSeries?: string;
};

export const RATE_SPREADS: Record<string, RateProductConfig> = {
  '30yr_fixed':  { base: 'MORTGAGE30US', spread: -0.125, term: 360, label: '30-Year Fixed', pmmsDirect: true },
  '20yr_fixed':  { base: 'MORTGAGE30US', spread: -0.375, term: 240, label: '20-Year Fixed', pmmsDirect: false },
  '15yr_fixed':  { base: 'MORTGAGE15US', spread: -0.125, term: 180, label: '15-Year Fixed', pmmsDirect: true },
  '10yr_fixed':  { base: 'MORTGAGE15US', spread: -0.250, term: 120, label: '10-Year Fixed', pmmsDirect: false },
  '7_1_arm':     { base: 'MORTGAGE30US', spread: -0.500, term: 360, label: '7/1 ARM', pmmsDirect: false },
  '5_1_arm':     { base: 'MORTGAGE5US',  spread:  0.000, term: 360, label: '5/1 ARM', pmmsDirect: false, requiresSeries: 'MORTGAGE5US' },
  'fha_30yr':    { base: 'MORTGAGE30US', spread: -0.500, term: 360, label: 'FHA 30-Year', pmmsDirect: false },
  'va_30yr':     { base: 'MORTGAGE30US', spread: -0.625, term: 360, label: 'VA 30-Year', pmmsDirect: false },
};

export const LOAN_AMOUNT = 340000;
export const HOME_PRICE = 425000;
export const ORIGINATION_FEE_PCT = 1.0;
export const ESTIMATED_FEES = 3500;

/** PMMS publishes weekly; observations older than this are treated as stale for display. */
export const PMMS_STALE_AFTER_DAYS = 21;

export function roundToEighth(n: number): number {
  return Math.round(n * 8) / 8;
}

export function monthlyPayment(principal: number, annualRate: number, termMonths: number): number {
  const r = annualRate / 100 / 12;
  if (r === 0) return principal / termMonths;
  return principal * (r * Math.pow(1 + r, termMonths)) / (Math.pow(1 + r, termMonths) - 1);
}

export function calculateAPR(principal: number, annualRate: number, termMonths: number): number {
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

export function daysSinceObservation(dateStr: string, now = new Date()): number {
  const obs = new Date(`${dateStr}T12:00:00Z`);
  return (now.getTime() - obs.getTime()) / (1000 * 60 * 60 * 24);
}

export function isPmmsObservationStale(dateStr: string, now = new Date()): boolean {
  return daysSinceObservation(dateStr, now) > PMMS_STALE_AFTER_DAYS;
}

export type BuiltRateRow = {
  key: string;
  product: string;
  rate: string;
  apr: string;
  payment: number;
  change: string;
  term: number;
  sourceObservationDate: string;
  dataKind: 'pmms_national_average' | 'illustrative_estimate';
  rateTypeLabel: string;
  publishedAt: string;
};

export function buildRatesPayload(
  fredData: Record<string, FredObservation | null | undefined>,
  fetchedAt: string,
): {
  rates: BuiltRateRow[];
  assumptions: Record<string, unknown>;
  source: string;
  observationDate: string;
  fetchedAt: string;
  disclaimer: string;
} | null {
  const m30 = fredData.MORTGAGE30US;
  if (!m30) return null;

  const rates: BuiltRateRow[] = [];

  for (const [key, cfg] of Object.entries(RATE_SPREADS)) {
    if (cfg.requiresSeries) {
      const required = fredData[cfg.requiresSeries];
      if (!required || isPmmsObservationStale(required.date)) continue;
    }

    const fred = fredData[cfg.base];
    if (!fred) continue;
    if (cfg.pmmsDirect && isPmmsObservationStale(fred.date)) continue;

    const rawRate = fred.current + cfg.spread;
    const rate = roundToEighth(rawRate);
    const prevRawRate = fred.previous + cfg.spread;
    const prevRate = roundToEighth(prevRawRate);
    const change = Math.round((rate - prevRate) * 1000) / 1000;

    const pmt = monthlyPayment(LOAN_AMOUNT, rate, cfg.term);
    const apr = calculateAPR(LOAN_AMOUNT, rate, cfg.term);

    const dataKind = cfg.pmmsDirect ? 'pmms_national_average' : 'illustrative_estimate';
    const rateTypeLabel = cfg.pmmsDirect
      ? 'National PMMS average (not a UFF quote)'
      : 'Illustrative estimate from national averages (not a UFF quote)';

    rates.push({
      key,
      product: cfg.label,
      rate: rate.toFixed(3),
      apr: apr.toFixed(3),
      payment: Math.round(pmt),
      change: change.toFixed(3),
      term: cfg.term,
      sourceObservationDate: fred.date,
      dataKind,
      rateTypeLabel,
      publishedAt: fetchedAt,
    });
  }

  return {
    rates,
    assumptions: {
      loanAmount: LOAN_AMOUNT,
      homePrice: HOME_PRICE,
      downPaymentPct: Math.round((1 - LOAN_AMOUNT / HOME_PRICE) * 100),
      creditScore: '740+',
      occupancy: 'Owner-occupied single-family residence',
      lockDays: 30,
      originationFeePct: ORIGINATION_FEE_PCT,
      estimatedClosingCosts: ESTIMATED_FEES,
      aprEstimatedTotalCosts: Math.round((LOAN_AMOUNT * (ORIGINATION_FEE_PCT / 100)) + ESTIMATED_FEES),
    },
    source: 'Freddie Mac Primary Mortgage Market Survey via FRED',
    observationDate: m30.date,
    fetchedAt,
    disclaimer:
      'Figures shown are national survey or illustrative estimates for comparison only. They are not offers, locks, or United Fidelity Funding rate quotes.',
  };
}