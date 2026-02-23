import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Shared FRED fetch helper for local dev proxies
async function fetchFred(seriesId: string, apiKey: string, limit = 2) {
  const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${apiKey}&file_type=json&sort_order=desc&limit=${limit}`;
  const r = await fetch(url);
  if (!r.ok) return null;
  const d = await r.json();
  const obs = d.observations;
  if (!obs?.length) return null;
  return obs
    .filter((o: any) => o.value !== '.')
    .map((o: any) => ({ date: o.date, value: parseFloat(o.value) }))
    .filter((o: any) => !isNaN(o.value))
    .reverse();
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      // Local dev proxies for FRED-powered API routes
      {
        name: 'fred-dev-proxy',
        configureServer(server) {
          // ─── /api/rates ───
          server.middlewares.use('/api/rates', async (_req, res) => {
            try {
              const apiKey = env.FRED_API_KEY;
              if (!apiKey) { res.writeHead(500, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'FRED_API_KEY not set in .env' })); return; }

              const SPREADS: Record<string, { base: string; spread: number; term: number; label: string }> = {
                '30yr_fixed':  { base: 'MORTGAGE30US', spread: -0.125, term: 360, label: '30-Year Fixed' },
                '20yr_fixed':  { base: 'MORTGAGE30US', spread: -0.375, term: 240, label: '20-Year Fixed' },
                '15yr_fixed':  { base: 'MORTGAGE15US', spread: -0.125, term: 180, label: '15-Year Fixed' },
                '10yr_fixed':  { base: 'MORTGAGE15US', spread: -0.250, term: 120, label: '10-Year Fixed' },
                '7_1_arm':     { base: 'MORTGAGE30US', spread: -0.500, term: 360, label: '7/1 ARM' },
                '5_1_arm':     { base: 'MORTGAGE5US',  spread:  0.000, term: 360, label: '5/1 ARM' },
                'fha_30yr':    { base: 'MORTGAGE30US', spread: -0.500, term: 360, label: 'FHA 30-Year' },
                'va_30yr':     { base: 'MORTGAGE30US', spread: -0.625, term: 360, label: 'VA 30-Year' },
              };
              const LOAN_AMOUNT = 340000, HOME_PRICE = 425000, ORIG_FEE = 1.0, EST_FEES = 3500;
              const round8 = (n: number) => Math.round(n * 8) / 8;
              const pmt = (P: number, r: number, n: number) => { const mr = r / 100 / 12; return mr === 0 ? P / n : P * (mr * Math.pow(1 + mr, n)) / (Math.pow(1 + mr, n) - 1); };
              const calcAPR = (P: number, rate: number, n: number) => { const payment = pmt(P, rate, n); const af = P - (P * ORIG_FEE / 100 + EST_FEES); let apr = rate; for (let i = 0; i < 1000; i++) { const mr = apr / 100 / 12; const pv = payment * (1 - Math.pow(1 + mr, -n)) / mr; if (Math.abs(pv - af) < 0.01) break; apr += pv > af ? 0.0001 : -0.0001; } return Math.round(apr * 1000) / 1000; };

              const [d30, d15, d5] = await Promise.all([fetchFred('MORTGAGE30US', apiKey), fetchFred('MORTGAGE15US', apiKey), fetchFred('MORTGAGE5US', apiKey)]);
              if (!d30?.length) { res.writeHead(502, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'Unable to fetch FRED data' })); return; }
              const latest = (d: any[]) => ({ current: d[d.length - 1].value, previous: d.length > 1 ? d[d.length - 2].value : d[d.length - 1].value, date: d[d.length - 1].date });
              const fred: Record<string, any> = { MORTGAGE30US: latest(d30), MORTGAGE15US: d15?.length ? latest(d15) : latest(d30), MORTGAGE5US: d5?.length ? latest(d5) : latest(d30) };

              const rates = Object.entries(SPREADS).map(([key, cfg]) => {
                const f = fred[cfg.base]; const rate = round8(f.current + cfg.spread); const prev = round8(f.previous + cfg.spread);
                return { key, product: cfg.label, rate: rate.toFixed(3), apr: calcAPR(LOAN_AMOUNT, rate, cfg.term).toFixed(3), payment: Math.round(pmt(LOAN_AMOUNT, rate, cfg.term)), change: (Math.round((rate - prev) * 1000) / 1000).toFixed(3), term: cfg.term };
              });

              const payload = { rates, assumptions: { loanAmount: LOAN_AMOUNT, homePrice: HOME_PRICE, downPaymentPct: Math.round((1 - LOAN_AMOUNT / HOME_PRICE) * 100), creditScore: '740+', occupancy: 'Owner-occupied single-family residence', lockDays: 30 }, source: 'Freddie Mac Primary Mortgage Market Survey via FRED', observationDate: fred.MORTGAGE30US.date, fetchedAt: new Date().toISOString() };
              res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(payload));
            } catch (err: any) { res.writeHead(500, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: err.message || 'Internal error' })); }
          });

          // ─── /api/market-data ───
          server.middlewares.use('/api/market-data', async (_req, res) => {
            try {
              const apiKey = env.FRED_API_KEY;
              if (!apiKey) { res.writeHead(500, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'FRED_API_KEY not set in .env' })); return; }

              const SERIES: Record<string, { id: string; label: string; unit: string; frequency: string }> = {
                mortgage30:    { id: 'MORTGAGE30US',   label: '30-Year Fixed Mortgage Rate',       unit: '%',        frequency: 'Weekly' },
                mortgage15:    { id: 'MORTGAGE15US',   label: '15-Year Fixed Mortgage Rate',       unit: '%',        frequency: 'Weekly' },
                treasury10:    { id: 'DGS10',          label: '10-Year Treasury Yield',            unit: '%',        frequency: 'Daily' },
                fedFunds:      { id: 'FEDFUNDS',       label: 'Federal Funds Rate',                unit: '%',        frequency: 'Monthly' },
                medianPrice:   { id: 'MSPUS',          label: 'Median Sales Price of Houses Sold', unit: '$',        frequency: 'Quarterly' },
                housingSupply: { id: 'MSACSR',         label: 'Monthly Supply of New Houses',      unit: 'months',   frequency: 'Monthly' },
                affordability: { id: 'FIXHAI',         label: 'Housing Affordability Index',       unit: 'index',    frequency: 'Monthly' },
                homeownership: { id: 'RHORUSQ156N',   label: 'Homeownership Rate',                unit: '%',        frequency: 'Quarterly' },
                cpi:           { id: 'CPIAUCSL',       label: 'Consumer Price Index (All Items)',   unit: 'index',    frequency: 'Monthly' },
                unemployment:  { id: 'UNRATE',         label: 'Unemployment Rate',                 unit: '%',        frequency: 'Monthly' },
                housingStarts: { id: 'HOUST',          label: 'Housing Starts',                    unit: 'thousands', frequency: 'Monthly' },
                existingHome:  { id: 'EXHOSLUSM495S', label: 'Existing Home Sales',               unit: 'millions', frequency: 'Monthly' },
              };

              const entries = Object.entries(SERIES);
              const results = await Promise.all(entries.map(([, cfg]) => fetchFred(cfg.id, apiKey, 52)));
              const payload: Record<string, any> = {};
              entries.forEach(([key, cfg], i) => {
                const data = results[i];
                if (data && data.length > 0) {
                  const latest = data[data.length - 1]; const previous = data.length > 1 ? data[data.length - 2] : latest;
                  payload[key] = { label: cfg.label, unit: cfg.unit, frequency: cfg.frequency, current: latest.value, previous: previous.value, change: Math.round((latest.value - previous.value) * 1000) / 1000, changePct: previous.value !== 0 ? Math.round(((latest.value - previous.value) / previous.value) * 10000) / 100 : 0, date: latest.date, history: data };
                }
              });

              res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ data: payload, fetchedAt: new Date().toISOString() }));
            } catch (err: any) { res.writeHead(500, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: err.message || 'Internal error' })); }
          });
        },
      },
    ],
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
  };
});
