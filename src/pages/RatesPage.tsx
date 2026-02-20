import { Link } from 'react-router-dom';
import { ArrowRight, Info, TrendingDown, Clock, Shield } from 'lucide-react';

const rateData = [
  { product: '30-Year Fixed', rate: '6.375%', apr: '6.512%', payment: '$2,118', change: '-0.125' },
  { product: '20-Year Fixed', rate: '6.125%', apr: '6.287%', payment: '$2,451', change: '-0.062' },
  { product: '15-Year Fixed', rate: '5.750%', apr: '5.923%', payment: '$2,821', change: '-0.125' },
  { product: '10-Year Fixed', rate: '5.625%', apr: '5.812%', payment: '$3,652', change: '0.000' },
  { product: '7/1 ARM', rate: '5.875%', apr: '6.134%', payment: '$2,014', change: '-0.250' },
  { product: '5/1 ARM', rate: '5.625%', apr: '6.087%', payment: '$1,962', change: '-0.125' },
  { product: 'FHA 30-Year', rate: '5.875%', apr: '6.745%', payment: '$2,012', change: '-0.125' },
  { product: 'VA 30-Year', rate: '5.750%', apr: '5.912%', payment: '$1,984', change: '-0.062' },
];

export default function RatesPage() {
  return (
    <div className="pt-20">
      <section className="bg-gradient-to-b from-gray-900 to-gray-800 text-white py-20 md:py-28">
        <div className="container-wide">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-5 leading-[1.1]">Today's mortgage rates</h1>
            <p className="text-xl text-gray-300 mb-4">
              Rates update daily and depend on your unique financial profile. These ranges are a starting point.
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Clock className="w-4 h-4" />
              <span>Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container-wide">
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
                  {rateData.map((r) => {
                    const changeNum = parseFloat(r.change);
                    return (
                      <tr key={r.product} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-semibold text-gray-900 text-sm">{r.product}</td>
                        <td className="px-6 py-4 text-lg font-bold text-gray-900">{r.rate}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{r.apr}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{r.payment}/mo</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                            changeNum < 0 ? 'bg-success-50 text-success-700' :
                            changeNum > 0 ? 'bg-red-50 text-red-700' :
                            'bg-gray-100 text-gray-500'
                          }`}>
                            {changeNum < 0 ? <TrendingDown className="w-3 h-3" /> : null}
                            {r.change}%
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

          <div className="bg-gray-50 rounded-xl p-6 flex items-start gap-3 mb-12">
            <Info className="w-5 h-5 text-brand-500 mt-0.5 shrink-0" />
            <div className="text-sm text-gray-600">
              <p className="font-semibold text-gray-900 mb-1">Assumptions</p>
              <p>
                Rates shown assume: $340,000 loan amount, $425,000 home price, 20% down payment,
                740+ credit score, owner-occupied single-family residence, 30-day rate lock.
                Your actual rate may differ. APR includes estimated closing costs and fees.
              </p>
            </div>
          </div>

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
