import { useEffect, useRef } from 'react';
import { ExternalLink } from 'lucide-react';

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
    script.setAttribute('data-color', '#DC2626');
    script.async = true;
    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [calculator.slug]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-red-200 transition-all">
      <h3 className="text-lg font-bold text-gray-900 mb-2">{calculator.title}</h3>
      <p className="text-sm text-gray-600 mb-4 leading-relaxed">{calculator.description}</p>
      <div ref={containerRef} />
    </div>
  );
}

interface CalculatorsPageProps {
  onNavigate: (page: string) => void;
}

export default function CalculatorsPage({ onNavigate }: CalculatorsPageProps) {
  const categories = [
    {
      name: 'Buying a Home',
      calculators: [
        {
          slug: 'affordability',
          title: 'How Much House Can I Afford?',
          description: 'Find out the maximum home price you can comfortably afford based on your income, debts, and down payment.',
        },
        {
          slug: 'mortgage-cost',
          title: 'True Monthly Mortgage Cost',
          description: 'See your real monthly payment including taxes, insurance, HOA, and PMI — not just principal and interest.',
        },
        {
          slug: 'down-payment',
          title: 'Down Payment Strategy',
          description: 'Compare different down payment amounts and see how they affect your monthly payment, PMI, and total cost.',
        },
        {
          slug: 'rent-vs-buy',
          title: 'Rent vs Buy Analysis',
          description: 'Should you keep renting or buy a home? Compare the long-term financial impact of both options.',
        },
        {
          slug: 'closing-costs',
          title: 'Closing Cost Estimator',
          description: 'Get an itemized estimate of your closing costs including lender fees, title insurance, and prepaid items.',
        },
      ],
    },
    {
      name: 'Loan Types & Qualification',
      calculators: [
        {
          slug: 'fha',
          title: 'FHA Loan Calculator',
          description: 'Calculate your FHA loan payment including upfront and monthly mortgage insurance premiums.',
        },
        {
          slug: 'va',
          title: 'VA Loan Calculator',
          description: 'See your VA loan payment with $0 down and no PMI. Includes funding fee calculation.',
        },
        {
          slug: 'dti',
          title: 'DTI Calculator',
          description: 'Calculate your debt-to-income ratio and see if you qualify for a mortgage.',
        },
        {
          slug: 'pmi',
          title: 'PMI Calculator',
          description: 'Find out how much PMI costs based on your credit score and when it drops off.',
        },
      ],
    },
    {
      name: 'Refinancing',
      calculators: [
        {
          slug: 'refinance',
          title: 'Refinance Break-Even',
          description: 'Find out how long it takes for refinancing savings to cover your closing costs.',
        },
        {
          slug: 'cash-out-refi',
          title: 'Cash-Out Refinance',
          description: 'See how much equity you can tap and what your new payment would be.',
        },
        {
          slug: 'recast-vs-refi',
          title: 'Recast vs Refinance',
          description: 'Compare recasting your mortgage vs refinancing when you have a lump sum to apply.',
        },
      ],
    },
    {
      name: 'Rate & Structure',
      calculators: [
        {
          slug: 'arm-vs-fixed',
          title: 'ARM vs Fixed Rate',
          description: 'Compare adjustable-rate and fixed-rate mortgages side by side over your expected time horizon.',
        },
        {
          slug: 'points-buydown',
          title: 'Points & Buydown',
          description: 'See if buying points to lower your rate saves money over the life of your loan.',
        },
        {
          slug: 'interest-sensitivity',
          title: 'Rate Sensitivity',
          description: 'See how small changes in interest rates impact your monthly payment and total cost.',
        },
        {
          slug: 'timeline-simulator',
          title: 'Decision Timeline',
          description: 'Simulate different scenarios for when to buy, refinance, or make extra payments.',
        },
      ],
    },
    {
      name: 'Payoff Strategy',
      calculators: [
        {
          slug: 'extra-payment',
          title: 'Extra Payment Impact',
          description: 'See how extra payments shorten your loan and save you thousands in interest.',
        },
        {
          slug: 'acceleration',
          title: 'Payoff Acceleration',
          description: 'Build a custom payoff plan with extra payments and see your new payoff date.',
        },
        {
          slug: 'biweekly',
          title: 'Biweekly Payments',
          description: 'Switch to biweekly payments and pay off your mortgage years early with one extra payment per year.',
        },
        {
          slug: 'amortization',
          title: 'Amortization Schedule',
          description: 'View your complete month-by-month payment schedule showing principal, interest, and remaining balance.',
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen pt-20 pb-16 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 pt-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Mortgage Calculators
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Free, interactive mortgage calculators powered by Dett.io. Click any button to run the
            calculator instantly.
          </p>
        </div>

        {categories.map((category, index) => (
          <div key={index} className="mb-16">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{category.name}</h2>
              <div className="h-1 w-20 bg-red-600 rounded"></div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {category.calculators.map((calculator) => (
                <CalculatorCard key={calculator.slug} calculator={calculator} />
              ))}
            </div>
          </div>
        ))}

        <div className="mt-16 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-8 md:p-12 text-white text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Take the Next Step?</h2>
          <p className="text-xl text-gray-200 mb-6 max-w-2xl mx-auto">
            These calculators provide helpful estimates. When you're ready, our team will help you
            find the perfect mortgage solution for your unique situation.
          </p>
          <button
            onClick={() => onNavigate('apply')}
            className="px-8 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-all"
          >
            Start Your Application
          </button>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Calculators provided free by{' '}
            <a
              href="https://dett.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-red-600 hover:text-red-700 underline inline-flex items-center gap-1"
            >
              Dett.io
              <ExternalLink className="w-3 h-3" />
            </a>{' '}
            — estimates only, not financial advice.
          </p>
        </div>
      </div>
    </div>
  );
}
