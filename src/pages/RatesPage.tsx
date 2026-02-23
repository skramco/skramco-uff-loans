import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Info, TrendingDown, TrendingUp, Clock, Shield, Loader2, AlertCircle, RefreshCw } from 'lucide-react';

interface RateRow {
  key: string;
  product: string;
  rate: string;
  apr: string;
  payment: number;
  change: string;
  term: number;
}

interface RatePayload {
  rates: RateRow[];
  assumptions: {
    loanAmount: number;
    homePrice: number;
    downPaymentPct: number;
    creditScore: string;
    occupancy: string;
    lockDays: number;
  };
  source: string;
  observationDate: string;
  fetchedAt: string;
}

const fmtCurrency = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

export default function RatesPage() {
  const [data, setData] = useState<RatePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRates = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/rates');
      if (!res.ok) throw new Error('Unable to load rates');
      const payload: RatePayload = await res.json();
      setData(payload);
    } catch (err: any) {
      setError(err.message || 'Failed to load rates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRates(); }, []);

  const observationLabel = data?.observationDate
    ? new Date(data.observationDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <div className="pt-20">
      {/* Hero */}
      <section className="bg-gradient-to-b from-gray-900 to-gray-800 text-white py-20 md:py-28">
        <div className="container-wide">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-5 leading-[1.1]">Today's mortgage rates</h1>
            <p className="text-xl text-gray-300 mb-4">
              Rates update weekly from the Freddie Mac Primary Mortgage Market Survey and depend on your unique financial profile.
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Clock className="w-4 h-4" />
              <span>
                {observationLabel
                  ? `PMMS data as of ${observationLabel}`
                  : `Last updated: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Rate Table */}
      <section className="section-padding bg-white">
        <div className="container-wide">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-red-600 animate-spin mb-4" />
              <p className="text-gray-500">Loading current rates from FRED...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20">
              <AlertCircle className="w-10 h-10 text-red-500 mb-4" />
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={fetchRates}
                className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
            </div>
          ) : data ? (
            <>
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm mb-8">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Product</th>
                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Rate</th>
                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">APR</th>
                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Est. Payment</th>
                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Change</th>
                        <th className="px-6 py-4"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {data.rates.map((r) => {
                        const changeNum = parseFloat(r.change);
                        return (
                          <tr key={r.key} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 font-semibold text-gray-900 text-sm">{r.product}</td>
                            <td className="px-6 py-4 text-lg font-bold text-gray-900">{r.rate}%</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{r.apr}%</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{fmtCurrency(r.payment)}/mo</td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                                changeNum < 0 ? 'bg-green-50 text-green-700' :
                                changeNum > 0 ? 'bg-red-50 text-red-700' :
                                'bg-gray-100 text-gray-500'
                              }`}>
                                {changeNum < 0 ? <TrendingDown className="w-3 h-3" /> : changeNum > 0 ? <TrendingUp className="w-3 h-3" /> : null}
                                {changeNum > 0 ? '+' : ''}{r.change}%
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <Link
                                to="/start"
                                className="text-xs font-semibold text-brand-600 hover:text-brand-700 whitespace-nowrap"
                              >
                                Personalize
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Source badge */}
              <div className="flex items-center justify-center gap-2 text-xs text-gray-400 mb-8">
                <Shield className="w-3.5 h-3.5" />
                <span>Source: {data.source}</span>
              </div>

              {/* Assumptions */}
              <div className="bg-gray-50 rounded-xl p-6 flex items-start gap-3 mb-12">
                <Info className="w-5 h-5 text-brand-500 mt-0.5 shrink-0" />
                <div className="text-sm text-gray-600">
                  <p className="font-semibold text-gray-900 mb-1">Assumptions</p>
                  <p>
                    Rates shown assume: {fmtCurrency(data.assumptions.loanAmount)} loan amount, {fmtCurrency(data.assumptions.homePrice)} home price, {data.assumptions.downPaymentPct}% down payment,
                    {' '}{data.assumptions.creditScore} credit score, {data.assumptions.occupancy.toLowerCase()}, {data.assumptions.lockDays}-day rate lock.
                    Your actual rate may differ. APR includes estimated closing costs and fees.
                    Rates are derived from the Freddie Mac Primary Mortgage Market Survey (PMMS) published weekly and may not reflect intraday market movements.
                  </p>
                </div>
              </div>
            </>
          ) : null}

          {/* CTA */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Want your actual rate?</h2>
            <p className="text-gray-600 mb-6">Get a personalized quote in about 3 minutes. No credit impact.</p>
            <Link
              to="/start"
              className="inline-flex items-center gap-2 px-8 py-4 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-colors group"
            >
              Personalize my rate
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
