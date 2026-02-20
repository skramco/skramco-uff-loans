import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Shield, Star, Clock, DollarSign, Home, RefreshCw, Wallet } from 'lucide-react';

interface LandingPageProps {
  intent: 'buy' | 'refi' | 'equity';
}

const config = {
  buy: {
    icon: Home,
    title: 'Buy a home with clarity',
    subtitle: 'Know exactly what you can afford before you start looking.',
    hero: 'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=1920',
    benefits: [
      'See your purchasing power in minutes, not days',
      'Compare 30-year fixed, 15-year, ARM, FHA, and VA side by side',
      'Get a clear cash-to-close estimate with every assumption visible',
      'Pre-approval letter ready when you find the right home',
    ],
    stats: [
      { label: 'Avg. days to close', value: '21' },
      { label: 'Borrowers helped', value: '10,000+' },
      { label: 'Avg. customer rating', value: '4.9/5' },
    ],
  },
  refi: {
    icon: RefreshCw,
    title: 'Refinance on your terms',
    subtitle: 'Lower your rate, shorten your term, or restructure your loan.',
    hero: 'https://images.pexels.com/photos/5849577/pexels-photo-5849577.jpeg?auto=compress&cs=tinysrgb&w=1920',
    benefits: [
      'See your potential savings before you commit to anything',
      'Break-even analysis so you know exactly when refinancing pays off',
      'Rate-and-term or cash-out options compared transparently',
      'No application fee to get started',
    ],
    stats: [
      { label: 'Avg. monthly savings', value: '$287' },
      { label: 'Avg. break-even', value: '14 mo.' },
      { label: 'Avg. customer rating', value: '4.9/5' },
    ],
  },
  equity: {
    icon: Wallet,
    title: 'Put your equity to work',
    subtitle: 'Access your home equity for renovations, consolidation, or cash out.',
    hero: 'https://images.pexels.com/photos/8293778/pexels-photo-8293778.jpeg?auto=compress&cs=tinysrgb&w=1920',
    benefits: [
      'HELOC, home equity loan, and cash-out refi compared in one view',
      'See how much equity you can access based on current LTV',
      'Flexible draw periods and repayment options',
      'Competitive rates with no hidden fees',
    ],
    stats: [
      { label: 'Max LTV', value: '90%' },
      { label: 'Line amounts up to', value: '$500K' },
      { label: 'Avg. customer rating', value: '4.9/5' },
    ],
  },
};

export default function LandingPage({ intent }: LandingPageProps) {
  const c = config[intent];

  return (
    <div>
      <section className="relative min-h-[50vh] flex items-center">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700" />
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{ backgroundImage: `url("${c.hero}")`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        />
        <div className="relative container-wide py-24 md:py-28">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-5 leading-[1.1]">{c.title}</h1>
            <p className="text-xl text-gray-300 mb-8">{c.subtitle}</p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to={`/start?intent=${intent}`}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-gray-900 font-bold text-lg rounded-xl hover:bg-gray-50 transition-all shadow-lg group"
              >
                Get my options
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <div className="flex items-center gap-2 mt-6 text-sm text-gray-400">
              <Shield className="w-4 h-4" />
              <span>No credit impact to see your options</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container-wide">
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {c.stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-4xl font-extrabold text-brand-700 mb-2">{s.value}</p>
                <p className="text-gray-600">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">
              Why borrowers choose us
            </h2>
            <div className="space-y-4">
              {c.benefits.map((b) => (
                <div key={b} className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                  <CheckCircle2 className="w-5 h-5 text-success-500 mt-0.5 shrink-0" />
                  <p className="text-gray-700 leading-relaxed">{b}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding bg-gray-50">
        <div className="container-narrow text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to see your options?</h2>
          <p className="text-lg text-gray-600 mb-8">Takes about 3 minutes. No credit pull. No obligation.</p>
          <Link
            to={`/start?intent=${intent}`}
            className="inline-flex items-center gap-2 px-8 py-4 bg-brand-600 text-white font-bold text-lg rounded-xl hover:bg-brand-700 transition-colors group"
          >
            Get started
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>
    </div>
  );
}
