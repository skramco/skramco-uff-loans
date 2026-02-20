import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, ArrowRight } from 'lucide-react';

interface DettCalculator {
  slug: string;
  title: string;
  description: string;
}

function CalculatorCard({ calculator }: { calculator: DettCalculator }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const script = document.createElement('script');
    script.src = 'https://dett.io/embed.js';
    script.setAttribute('data-calculator', calculator.slug);
    script.setAttribute('data-color', '#C41E1E');
    script.setAttribute('data-label', 'Launch');
    script.async = true;
    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [calculator.slug]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-brand-200 transition-all">
      <h3 className="text-lg font-bold text-gray-900 mb-2">{calculator.title}</h3>
      <p className="text-sm text-gray-600 mb-4 leading-relaxed">{calculator.description}</p>
      <div ref={containerRef} />
    </div>
  );
}

const categories = [
  {
    name: 'Buying a Home',
    calculators: [
      { slug: 'affordability', title: 'How Much House Can I Afford?', description: 'Find out the maximum home price you can comfortably afford based on your income, debts, and down payment.' },
      { slug: 'mortgage-cost', title: 'True Monthly Mortgage Cost', description: 'See your real monthly payment including taxes, insurance, HOA, and PMI.' },
      { slug: 'down-payment', title: 'Down Payment Strategy', description: 'Compare different down payment amounts and see how they affect your monthly payment.' },
      { slug: 'rent-vs-buy', title: 'Rent vs Buy Analysis', description: 'Compare the long-term financial impact of renting versus buying.' },
      { slug: 'closing-costs', title: 'Closing Cost Estimator', description: 'Get an itemized estimate of your closing costs.' },
    ],
  },
  {
    name: 'Loan Types & Qualification',
    calculators: [
      { slug: 'fha', title: 'FHA Loan Calculator', description: 'Calculate your FHA loan payment including mortgage insurance premiums.' },
      { slug: 'va', title: 'VA Loan Calculator', description: 'See your VA loan payment with $0 down and no PMI.' },
      { slug: 'dti', title: 'DTI Calculator', description: 'Calculate your debt-to-income ratio and qualification.' },
      { slug: 'pmi', title: 'PMI Calculator', description: 'Find out how much PMI costs and when it drops off.' },
    ],
  },
  {
    name: 'Refinancing',
    calculators: [
      { slug: 'refinance', title: 'Refinance Break-Even', description: 'Find out how long it takes for refinancing savings to cover costs.' },
      { slug: 'cash-out-refi', title: 'Cash-Out Refinance', description: 'See how much equity you can tap and your new payment.' },
      { slug: 'recast-vs-refi', title: 'Recast vs Refinance', description: 'Compare recasting versus refinancing with a lump sum.' },
    ],
  },
  {
    name: 'Rate & Structure',
    calculators: [
      { slug: 'arm-vs-fixed', title: 'ARM vs Fixed Rate', description: 'Compare adjustable and fixed rates over your time horizon.' },
      { slug: 'points-buydown', title: 'Points & Buydown', description: 'See if buying points saves money over the life of your loan.' },
      { slug: 'interest-sensitivity', title: 'Rate Sensitivity', description: 'See how rate changes impact your payment and total cost.' },
    ],
  },
  {
    name: 'Payoff Strategy',
    calculators: [
      { slug: 'extra-payment', title: 'Extra Payment Impact', description: 'See how extra payments shorten your loan and save interest.' },
      { slug: 'biweekly', title: 'Biweekly Payments', description: 'Pay off your mortgage years early with biweekly payments.' },
      { slug: 'amortization', title: 'Amortization Schedule', description: 'View your complete month-by-month payment schedule.' },
    ],
  },
];

export default function CalculatorsPage() {
  return (
    <div className="pt-20">
      <section className="bg-gradient-to-b from-gray-900 to-gray-800 text-white py-16 md:py-24">
        <div className="container-wide">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Mortgage Calculators</h1>
          <p className="text-xl text-gray-300 max-w-2xl">
            Free, interactive calculators powered by Dett.io. Click any button to run a calculator instantly.
          </p>
        </div>
      </section>

      <section className="section-padding bg-gray-50">
        <div className="container-wide">
          {categories.map((cat, i) => (
            <div key={i} className="mb-14 last:mb-0">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">{cat.name}</h2>
                <div className="h-1 w-16 bg-brand-500 rounded" />
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cat.calculators.map((calc) => (
                  <CalculatorCard key={calc.slug} calculator={calc} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container-narrow text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to get real numbers?</h2>
          <p className="text-lg text-gray-600 mb-8">
            Calculators give estimates. Get a personalized quote with exact numbers in about 3 minutes.
          </p>
          <Link
            to="/start"
            className="inline-flex items-center gap-2 px-8 py-4 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-colors group"
          >
            Get my options
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <p className="mt-6 text-xs text-gray-400">
            Calculators provided by{' '}
            <a href="https://dett.io" target="_blank" rel="noopener noreferrer" className="text-brand-500 hover:underline inline-flex items-center gap-0.5">
              Dett.io <ExternalLink className="w-3 h-3" />
            </a>{' '}
            -- estimates only, not financial advice.
          </p>
        </div>
      </section>
    </div>
  );
}
