import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import {
  processRateFlowSummary,
  CORS_HEADERS as rateFlowSummaryCors,
} from './netlify/_shared/sendRateFlowSummaryResend';
import { buildRatesPayload, type FredObservation } from './netlify/functions/_shared/buildFredRatesPayload';

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
          // ─── /api/send-rate-flow-summary (Resend; needs RESEND_API_KEY in .env) ───
          server.middlewares.use('/api/send-rate-flow-summary', async (req, res) => {
            const json = (status: number, payload: Record<string, unknown>) => {
              res.writeHead(status, { 'Content-Type': 'application/json', ...rateFlowSummaryCors });
              res.end(JSON.stringify(payload));
            };
            if (req.method === 'OPTIONS') {
              res.writeHead(204, rateFlowSummaryCors);
              res.end();
              return;
            }
            if (req.method !== 'POST') {
              json(405, { success: false, message: 'Method not allowed' });
              return;
            }
            try {
              const chunks: Buffer[] = [];
              for await (const chunk of req) chunks.push(chunk as Buffer);
              const rawStr = Buffer.concat(chunks).toString('utf8');
              let parsed: unknown;
              try {
                parsed = JSON.parse(rawStr);
              } catch {
                json(400, { success: false, message: 'Invalid JSON' });
                return;
              }
              const result = await processRateFlowSummary(parsed, {
                RESEND_API_KEY: env.RESEND_API_KEY,
                RESEND_FROM_EMAIL: env.RESEND_FROM_EMAIL,
                RATE_FLOW_SUMMARY_TO: env.RATE_FLOW_SUMMARY_TO,
              });
              if (!result.success) {
                json(result.status, { success: false, message: result.message });
                return;
              }
              json(200, { success: true });
            } catch (err: unknown) {
              const message = err instanceof Error ? err.message : 'Internal error';
              json(500, { success: false, message });
            }
          });

          // ─── /api/rates ───
          server.middlewares.use('/api/rates', async (_req, res) => {
            try {
              const apiKey = env.FRED_API_KEY;
              if (!apiKey) { res.writeHead(500, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'FRED_API_KEY not set in .env' })); return; }

              const toObservation = (rows: { date: string; value: number }[] | null): FredObservation | null => {
                if (!rows?.length) return null;
                const last = rows[rows.length - 1];
                const prev = rows.length > 1 ? rows[rows.length - 2] : last;
                return { current: last.value, previous: prev.value, date: last.date };
              };

              const [d30, d15, d5] = await Promise.all([
                fetchFred('MORTGAGE30US', apiKey),
                fetchFred('MORTGAGE15US', apiKey),
                fetchFred('MORTGAGE5US', apiKey),
              ]);

              const fetchedAt = new Date().toISOString();
              const payload = buildRatesPayload(
                {
                  MORTGAGE30US: toObservation(d30),
                  MORTGAGE15US: toObservation(d15),
                  MORTGAGE5US: toObservation(d5),
                },
                fetchedAt,
              );

              if (!payload) {
                res.writeHead(502, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Unable to fetch FRED data' }));
                return;
              }

              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify(payload));
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
    // Match Supabase Auth "Site URL" when set to http://localhost:3000 so email confirm links work.
    server: {
      port: 3000,
      strictPort: false,
    },
  };
});
