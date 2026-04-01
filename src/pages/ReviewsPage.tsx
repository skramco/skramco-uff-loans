import { Link } from 'react-router-dom';
import { ArrowRight, Briefcase, Building2, Landmark, PiggyBank, Shield, UserRound } from 'lucide-react';
import { borrowerSegments } from '../data/borrowerProducts';

export default function ReviewsPage() {
  const iconMap = {
    'Wage Earners': Briefcase,
    'Self-Employed': Building2,
    Veterans: Shield,
    'First Time Homebuyers': UserRound,
    Investors: Landmark,
    'High Net Worth': PiggyBank,
  } as const;

  return (
    <div className="pt-20">
      <section className="bg-gradient-to-b from-gray-900 to-gray-800 text-white py-16 md:py-24">
        <div className="container-wide">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Mortgage Product Suite</h1>
          <p className="text-xl text-gray-300 max-w-3xl">
            Product options organized by borrower profile. Explore solutions for wage earners, self-employed
            borrowers, veterans, first-time homebuyers, investors, and high net worth households.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {borrowerSegments.map((segment) => (
              <a
                key={segment.slug}
                href={`#${segment.slug}`}
                className="px-4 py-2 rounded-full text-sm border border-gray-600 text-gray-200 hover:border-brand-400 hover:text-white transition-colors"
              >
                {segment.title}
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding bg-gray-50">
        <div className="container-wide space-y-10">
          {borrowerSegments.map((segment) => {
            const Icon = iconMap[segment.title as keyof typeof iconMap] ?? Briefcase;
            return (
              <div id={segment.slug} key={segment.slug} className="bg-white rounded-3xl border border-gray-200 p-6 md:p-8">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900">{segment.title}</h2>
                    <p className="text-gray-600 mt-2 max-w-3xl">{segment.summary}</p>
                  </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-5">
                  {segment.products.map((product) => (
                    <article key={product.name} className="rounded-2xl border border-gray-200 p-5 bg-gray-50">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{product.name}</h3>
                      <p className="text-sm text-gray-600 mb-4 leading-relaxed">{product.description}</p>
                      <ul className="space-y-2">
                        {product.highlights.map((point) => (
                          <li key={point} className="text-sm text-gray-700">
                            - {point}
                          </li>
                        ))}
                      </ul>
                    </article>
                  ))}
                </div>
              </div>
            );
          })}

          <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">Need help choosing the right path?</h3>
              <p className="text-gray-600">
                Start your scenario and we will match you to options based on goals, documentation, and timeline.
              </p>
            </div>
            <Link
              to="/start"
              className="inline-flex items-center gap-2 px-5 py-3 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition-colors"
            >
              Start now
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <p className="text-xs text-gray-500">
            Product descriptions are for educational purposes only and do not constitute a commitment to lend.
            Eligibility, rates, terms, and program availability vary by borrower profile, property, and state.
          </p>
        </div>
      </section>
    </div>
  );
}
