import { Link } from 'react-router-dom';
import { Shield, Eye, Users, Award, ArrowRight, CheckCircle2 } from 'lucide-react';

const values = [
  {
    icon: Eye,
    title: 'Radical transparency',
    description: 'Every rate, fee, and assumption is visible. We show our work so you never wonder what you are paying for.',
  },
  {
    icon: Shield,
    title: 'Your data, your control',
    description: 'We never sell your information. Your data is encrypted in transit and at rest. Period.',
  },
  {
    icon: Users,
    title: 'People over transactions',
    description: 'Our loan officers are salaried advisors, not commissioned salespeople. Their job is to find you the best fit.',
  },
  {
    icon: Award,
    title: 'Compliance first',
    description: 'We exceed regulatory requirements because doing the right thing should not be optional.',
  },
];

export default function AboutPage() {
  return (
    <div className="pt-20">
      <section className="bg-gradient-to-b from-gray-900 to-gray-800 text-white py-20 md:py-28">
        <div className="container-wide">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-5 leading-[1.1]">
              A mortgage company that shows its work.
            </h1>
            <p className="text-xl text-gray-300">
              United Fidelity Funding Corp. was built on a simple premise: borrowers deserve to see every
              number, understand every fee, and feel confident in every decision.
            </p>
          </div>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container-wide">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">What we believe</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {values.map((v) => (
              <div key={v.title} className="flex gap-5">
                <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center shrink-0">
                  <v.icon className="w-6 h-6 text-brand-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">{v.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{v.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding bg-gray-50">
        <div className="container-narrow">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">By the numbers</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: '20+', label: 'Years in business' },
              { value: '10,000+', label: 'Families served' },
              { value: '48', label: 'States licensed' },
              { value: '4.9/5', label: 'Customer rating' },
            ].map((s) => (
              <div key={s.label} className="text-center bg-white rounded-xl p-6 border border-gray-200">
                <p className="text-3xl font-extrabold text-brand-700 mb-1">{s.value}</p>
                <p className="text-sm text-gray-600">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container-narrow text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Want to work with us?</h2>
          <p className="text-lg text-gray-600 mb-8">See your personalized options in about 3 minutes.</p>
          <Link
            to="/start"
            className="inline-flex items-center gap-2 px-8 py-4 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-colors group"
          >
            Get started
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>
    </div>
  );
}
