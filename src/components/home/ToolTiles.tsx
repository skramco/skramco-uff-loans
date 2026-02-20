import { Link } from 'react-router-dom';
import { DollarSign, Home, Calculator, TrendingDown, ArrowRight } from 'lucide-react';

const tools = [
  {
    icon: DollarSign,
    title: 'Purchasing Power',
    description: 'See the max home price you can afford based on your income and debts.',
    slug: 'affordability',
  },
  {
    icon: Home,
    title: 'Home Valuation',
    description: 'Estimate what your current property might be worth in today\'s market.',
    slug: 'rent-vs-buy',
  },
  {
    icon: Calculator,
    title: 'Monthly Payment',
    description: 'Calculate your true monthly cost including taxes, insurance, and PMI.',
    slug: 'mortgage-cost',
  },
  {
    icon: TrendingDown,
    title: 'Refinance Savings',
    description: 'See if refinancing could lower your monthly payment or total cost.',
    slug: 'refinance',
  },
];

export default function ToolTiles() {
  return (
    <section className="section-padding bg-white">
      <div className="container-wide">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Tools that show their work</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            No black boxes. Every number comes with clear assumptions you can adjust.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {tools.map((tool) => (
            <Link
              key={tool.slug}
              to="/calculators"
              className="group bg-gray-50 rounded-2xl p-6 hover:bg-white hover:shadow-lg hover:border-gray-200 border border-transparent transition-all duration-300"
            >
              <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-brand-600 transition-colors">
                <tool.icon className="w-6 h-6 text-brand-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{tool.title}</h3>
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">{tool.description}</p>
              <div className="flex items-center gap-1 text-brand-600 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                <span>Try it</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
