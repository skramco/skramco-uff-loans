import { Link } from 'react-router-dom';
import { Home, RefreshCw, Wallet, ArrowRight } from 'lucide-react';

const paths = [
  {
    icon: Home,
    title: 'Buy a home',
    description: 'See what you can afford, compare loan types, and get pre-approved.',
    href: '/start?intent=buy',
    color: 'bg-brand-50 text-brand-600',
  },
  {
    icon: RefreshCw,
    title: 'Refinance',
    description: 'Lower your rate, shorten your term, or switch from adjustable to fixed.',
    href: '/start?intent=refi',
    color: 'bg-success-50 text-success-600',
  },
  {
    icon: Wallet,
    title: 'Use my equity',
    description: 'Access your home equity for renovations, debt consolidation, or cash out.',
    href: '/start?intent=equity',
    color: 'bg-accent-50 text-accent-600',
  },
];

export default function PathCards() {
  return (
    <section className="section-padding bg-white">
      <div className="container-wide">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Choose your path</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Tell us what you are looking to do, and we will show you options tailored to your situation.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {paths.map((path) => (
            <Link
              key={path.title}
              to={path.href}
              className="group relative bg-white rounded-2xl border border-gray-200 p-8 hover:border-brand-300 hover:shadow-lg transition-all duration-300"
            >
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 ${path.color} transition-transform group-hover:scale-110`}>
                <path.icon className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{path.title}</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">{path.description}</p>
              <div className="flex items-center gap-2 text-brand-600 font-semibold text-sm group-hover:gap-3 transition-all">
                <span>Get started</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
