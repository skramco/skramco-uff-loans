import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, TrendingDown, TrendingUp, Minus, Clock, Loader2, AlertCircle, RefreshCw,
  Home, DollarSign, Percent, BarChart3, Activity, Users, Building2, ShieldCheck, Info
} from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  Legend
} from 'recharts';

/* ─── Types ─── */
interface SeriesData {
  label: string;
  unit: string;
  frequency: string;
  current: number;
  previous: number;
  change: number;
  changePct: number;
  date: string;
  history: { date: string; value: number }[];
}

interface MarketPayload {
  data: Record<string, SeriesData>;
  fetchedAt: string;
}

/* ─── Formatters ─── */
const fmtPct = (n: number, decimals = 2) => `${n.toFixed(decimals)}%`;
const fmtCurrency = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
const fmtNum = (n: number, decimals = 1) => n.toFixed(decimals);
const fmtDate = (d: string) =>
  new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
const fmtDateShort = (d: string) =>
  new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

/* ─── Change Badge ─── */
function ChangeBadge({ change, suffix = '' }: { change: number; suffix?: string }) {
  const isDown = change < 0;
  const isFlat = change === 0;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
      isDown ? 'bg-green-50 text-green-700' : isFlat ? 'bg-gray-100 text-gray-500' : 'bg-red-50 text-red-700'
    }`}>
      {isDown ? <TrendingDown className="w-3 h-3" /> : isFlat ? <Minus className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
      {change > 0 ? '+' : ''}{change}{suffix}
    </span>
  );
}

/* ─── Stat Card ─── */
function StatCard({ icon: Icon, label, value, change, changeSuffix, sub, color = 'red' }: {
  icon: any; label: string; value: string; change: number; changeSuffix?: string; sub?: string; color?: string;
}) {
  const colorMap: Record<string, string> = {
    red: 'from-red-500 to-red-700',
    blue: 'from-blue-500 to-blue-700',
    green: 'from-emerald-500 to-emerald-700',
    amber: 'from-amber-500 to-amber-700',
    purple: 'from-purple-500 to-purple-700',
    sky: 'from-sky-500 to-sky-700',
  };
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colorMap[color] || colorMap.red} flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <ChangeBadge change={change} suffix={changeSuffix} />
      </div>
      <p className="text-2xl font-bold text-gray-900 mb-0.5">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

/* ─── Chart Tooltip ─── */
function ChartTooltipContent({ active, payload, label, unit }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 px-3 py-2 text-xs">
      <p className="font-semibold text-gray-900 mb-1">{fmtDateShort(label)}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-gray-600">
          <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: p.color }} />
          {p.name}: {unit === '$' ? fmtCurrency(p.value) : unit === '%' ? fmtPct(p.value) : fmtNum(p.value)}
        </p>
      ))}
    </div>
  );
}

/* ─── Main Page ─── */
export default function MarketPulsePage() {
  const [data, setData] = useState<MarketPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/market-data');
      if (!res.ok) throw new Error('Unable to load market data');
      const payload: MarketPayload = await res.json();
      setData(payload);
    } catch (err: any) {
      setError(err.message || 'Failed to load market data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const d = data?.data;

  // Merge mortgage30 + treasury10 histories for overlay chart
  const rateVsTreasuryData = (() => {
    if (!d?.mortgage30?.history || !d?.treasury10?.history) return [];
    const map = new Map<string, any>();
    d.mortgage30.history.forEach((h) => map.set(h.date, { date: h.date, mortgage: h.value }));
    d.treasury10.history.forEach((h) => {
      const existing = map.get(h.date);
      if (existing) existing.treasury = h.value;
      else map.set(h.date, { date: h.date, treasury: h.value });
    });
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  })();

  // Merge fedFunds + mortgage30 for Fed vs Mortgage chart
  const fedVsMortgageData = (() => {
    if (!d?.fedFunds?.history || !d?.mortgage30?.history) return [];
    const map = new Map<string, any>();
    d.mortgage30.history.forEach((h) => map.set(h.date, { date: h.date, mortgage: h.value }));
    d.fedFunds.history.forEach((h) => {
      const existing = map.get(h.date);
      if (existing) existing.fedFunds = h.value;
      else map.set(h.date, { date: h.date, fedFunds: h.value });
    });
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  })();

  return (
    <div className="pt-20">
      {/* Hero */}
      <section className="bg-gradient-to-b from-gray-900 to-gray-800 text-white py-16 md:py-24">
        <div className="container-wide">
          <Link
            to="/learn"
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Learning Center
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 bg-red-500/20 text-red-300 text-xs font-semibold rounded-full flex items-center gap-1.5">
              <Activity className="w-3 h-3" />
              Live Data
            </span>
            {d?.mortgage30?.date && (
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                Updated {fmtDate(d.mortgage30.date)}
              </span>
            )}
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 leading-[1.1]">Market Pulse</h1>
          <p className="text-xl text-gray-300 max-w-2xl">
            Live housing market data powered by the Federal Reserve. Understand where rates, prices, and affordability stand today.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="section-padding bg-gray-50">
        <div className="container-wide">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-red-600 animate-spin mb-4" />
              <p className="text-gray-500">Loading market data from FRED...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20">
              <AlertCircle className="w-10 h-10 text-red-500 mb-4" />
              <p className="text-gray-600 mb-4">{error}</p>
              <button onClick={fetchData} className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors">
                <RefreshCw className="w-4 h-4" /> Try Again
              </button>
            </div>
          ) : d ? (
            <div className="space-y-10">

              {/* ── Section 1: Key Rates ── */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Interest Rates</h2>
                <p className="text-sm text-gray-500 mb-5">Current mortgage and benchmark rates from the Federal Reserve</p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {d.mortgage30 && <StatCard icon={Percent} label="30-Year Fixed" value={fmtPct(d.mortgage30.current)} change={d.mortgage30.change} changeSuffix="%" sub={`PMMS · ${d.mortgage30.frequency}`} color="red" />}
                  {d.mortgage15 && <StatCard icon={Percent} label="15-Year Fixed" value={fmtPct(d.mortgage15.current)} change={d.mortgage15.change} changeSuffix="%" sub={`PMMS · ${d.mortgage15.frequency}`} color="red" />}
                  {d.treasury10 && <StatCard icon={BarChart3} label="10-Year Treasury" value={fmtPct(d.treasury10.current)} change={d.treasury10.change} changeSuffix="%" sub="Mortgage rates track this closely" color="blue" />}
                  {d.fedFunds && <StatCard icon={Building2} label="Fed Funds Rate" value={fmtPct(d.fedFunds.current)} change={d.fedFunds.change} changeSuffix="%" sub="Set by the Federal Reserve" color="purple" />}
                </div>

                {/* Mortgage Rate vs 10-Year Treasury Chart */}
                {rateVsTreasuryData.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-gray-900">Mortgage Rate vs. 10-Year Treasury</h3>
                        <p className="text-xs text-gray-500 mt-0.5">Mortgage rates closely track the 10-Year Treasury yield — the spread between them reflects lender risk and market conditions.</p>
                      </div>
                    </div>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={rateVsTreasuryData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                          <YAxis tick={{ fontSize: 11 }} domain={['auto', 'auto']} tickFormatter={(v) => `${v}%`} />
                          <Tooltip content={<ChartTooltipContent unit="%" />} />
                          <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                          <Line type="monotone" dataKey="mortgage" name="30-Year Mortgage" stroke="#dc2626" strokeWidth={2.5} dot={false} connectNulls />
                          <Line type="monotone" dataKey="treasury" name="10-Year Treasury" stroke="#2563eb" strokeWidth={2} dot={false} strokeDasharray="5 3" connectNulls />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Section 2: Housing Market ── */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Housing Market</h2>
                <p className="text-sm text-gray-500 mb-5">Prices, supply, and sales activity</p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {d.medianPrice && <StatCard icon={Home} label="Median Home Price" value={fmtCurrency(d.medianPrice.current)} change={d.medianPrice.changePct} changeSuffix="%" sub={`${d.medianPrice.frequency} · US national`} color="green" />}
                  {d.housingSupply && <StatCard icon={BarChart3} label="Months of Supply" value={fmtNum(d.housingSupply.current)} change={d.housingSupply.change} sub={d.housingSupply.current < 6 ? "Seller's market (<6 months)" : "Buyer's market (>6 months)"} color="amber" />}
                  {d.existingHome && <StatCard icon={DollarSign} label="Existing Home Sales" value={`${fmtNum(d.existingHome.current / 1000000, 2)}M`} change={d.existingHome.changePct} changeSuffix="%" sub="Annualized units" color="sky" />}
                  {d.housingStarts && <StatCard icon={Building2} label="Housing Starts" value={`${fmtNum(d.housingStarts.current / 1000, 2)}M`} change={d.housingStarts.changePct} changeSuffix="%" sub="New construction (annualized)" color="blue" />}
                </div>

                {/* Median Home Price Chart */}
                {d.medianPrice?.history && (
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-gray-900">Median Home Price Trend</h3>
                        <p className="text-xs text-gray-500 mt-0.5">U.S. median sales price of houses sold, published quarterly by the Census Bureau.</p>
                      </div>
                    </div>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={d.medianPrice.history}>
                          <defs>
                            <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} />
                          <Tooltip content={<ChartTooltipContent unit="$" />} />
                          <Area type="monotone" dataKey="value" name="Median Price" stroke="#10b981" strokeWidth={2.5} fill="url(#priceGrad)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Section 3: Affordability & Economy ── */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Affordability & Economy</h2>
                <p className="text-sm text-gray-500 mb-5">Indicators that affect your buying power</p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {d.affordability && (
                    <StatCard
                      icon={ShieldCheck}
                      label="Affordability Index"
                      value={fmtNum(d.affordability.current, 1)}
                      change={d.affordability.changePct}
                      changeSuffix="%"
                      sub={d.affordability.current >= 100 ? 'Median family can qualify' : 'Median family cannot qualify'}
                      color="green"
                    />
                  )}
                  {d.homeownership && <StatCard icon={Users} label="Homeownership Rate" value={fmtPct(d.homeownership.current, 1)} change={d.homeownership.change} changeSuffix="%" sub={`${d.homeownership.frequency} · US national`} color="sky" />}
                  {d.unemployment && <StatCard icon={Activity} label="Unemployment Rate" value={fmtPct(d.unemployment.current, 1)} change={d.unemployment.change} changeSuffix="%" sub="Bureau of Labor Statistics" color="amber" />}
                  {d.cpi && <StatCard icon={DollarSign} label="CPI (All Items)" value={fmtNum(d.cpi.current, 1)} change={d.cpi.changePct} changeSuffix="%" sub="Consumer Price Index" color="purple" />}
                </div>

                {/* Fed Funds vs Mortgage Rate */}
                {fedVsMortgageData.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-gray-900">Fed Funds Rate vs. Mortgage Rate</h3>
                        <p className="text-xs text-gray-500 mt-0.5">The Fed doesn't set mortgage rates directly — but its policy rate influences the broader rate environment. Notice they don't move 1:1.</p>
                      </div>
                    </div>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={fedVsMortgageData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                          <YAxis tick={{ fontSize: 11 }} domain={['auto', 'auto']} tickFormatter={(v) => `${v}%`} />
                          <Tooltip content={<ChartTooltipContent unit="%" />} />
                          <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                          <Line type="stepAfter" dataKey="fedFunds" name="Fed Funds Rate" stroke="#7c3aed" strokeWidth={2.5} dot={false} connectNulls />
                          <Line type="monotone" dataKey="mortgage" name="30-Year Mortgage" stroke="#dc2626" strokeWidth={2} dot={false} connectNulls />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Affordability Gauge ── */}
              {d.affordability && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                  <h3 className="font-bold text-gray-900 mb-2">What Does the Affordability Index Mean?</h3>
                  <div className="flex flex-col md:flex-row gap-6 items-center">
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 leading-relaxed mb-4">
                        The Housing Affordability Index measures whether a typical family earns enough income to qualify for a mortgage on a typical home.
                        A value of <strong>100</strong> means a family with the median income has exactly enough to qualify. Above 100 = more affordable. Below 100 = less affordable.
                      </p>
                      <div className="relative h-6 bg-gradient-to-r from-red-400 via-amber-400 to-green-400 rounded-full overflow-hidden">
                        <div
                          className="absolute top-0 h-full w-1 bg-gray-900 rounded-full shadow-lg"
                          style={{ left: `${Math.min(Math.max((d.affordability.current / 200) * 100, 2), 98)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-400 mt-1 px-1">
                        <span>Less Affordable</span>
                        <span>100 = Baseline</span>
                        <span>More Affordable</span>
                      </div>
                    </div>
                    <div className="text-center md:text-right shrink-0">
                      <p className="text-5xl font-extrabold text-gray-900">{fmtNum(d.affordability.current, 1)}</p>
                      <p className="text-sm text-gray-500 mt-1">Current Index</p>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Source & Disclaimer ── */}
              <div className="bg-gray-100 rounded-xl p-5 flex items-start gap-3">
                <Info className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                <div className="text-xs text-gray-500 leading-relaxed">
                  <p className="font-semibold text-gray-700 mb-1">Data Sources</p>
                  <p>
                    All data sourced from the Federal Reserve Economic Data (FRED) API, maintained by the Federal Reserve Bank of St. Louis.
                    Mortgage rates from the Freddie Mac Primary Mortgage Market Survey (PMMS). Housing data from the U.S. Census Bureau and National Association of Realtors.
                    Economic indicators from the Bureau of Labor Statistics. Data is provided for educational purposes only and does not constitute financial advice.
                  </p>
                </div>
              </div>

              {/* CTA */}
              <div className="text-center py-4">
                <h2 className="text-2xl font-bold text-gray-900 mb-3">Ready to see your personalized rate?</h2>
                <p className="text-gray-600 mb-6">Get a quote based on your actual financial profile in about 3 minutes.</p>
                <Link
                  to="/start"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-colors group"
                >
                  Get Started
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
