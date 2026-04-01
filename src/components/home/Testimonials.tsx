import { Link } from 'react-router-dom';
import { ArrowRight, Briefcase, Building2, Landmark, PiggyBank, Shield, UserRound } from 'lucide-react';
import { borrowerSegments } from '../../data/borrowerProducts';

export default function Testimonials() {
  const previewSegments = borrowerSegments.slice(0, 6);
  const iconMap = {
    'Wage Earners': Briefcase,
    'Self-Employed': Building2,
    Veterans: Shield,
    'First Time Homebuyers': UserRound,
    Investors: Landmark,
    'High Net Worth': PiggyBank,
  } as const;

  return (
    <section className="section-padding bg-gray-50">
      <div className="container-wide">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Products by borrower type
            </h2>
            <p className="text-lg text-gray-600 max-w-xl">
              Start with your profile, then explore lending solutions built around how you earn, buy, and invest.
            </p>
          </div>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 text-brand-600 font-semibold hover:text-brand-700 transition-colors"
          >
            View full product suite
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {previewSegments.map((segment) => {
            const Icon = iconMap[segment.title as keyof typeof iconMap] ?? Briefcase;
            return (
              <Link
                key={segment.slug}
                to={`/products#${segment.slug}`}
                className="bg-white rounded-2xl border border-gray-200 p-7 hover:border-brand-300 hover:shadow-lg transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-5">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{segment.title}</h3>
                <p className="text-sm text-gray-600 mb-5 leading-relaxed">{segment.summary}</p>
                <div className="space-y-2 mb-5">
                  {segment.products.slice(0, 2).map((product) => (
                    <p key={product.name} className="text-sm text-gray-700">
                      • {product.name}
                    </p>
                  ))}
                </div>
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 group-hover:text-brand-700">
                  Explore options
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
