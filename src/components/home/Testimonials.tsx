import { useState } from 'react';
import { ChevronLeft, ChevronRight, Star, Quote } from 'lucide-react';
import { testimonials } from '../../data/testimonials';

export default function Testimonials() {
  const [current, setCurrent] = useState(0);
  const visible = typeof window !== 'undefined' && window.innerWidth >= 768 ? 3 : 1;

  const prev = () => setCurrent((c) => (c === 0 ? testimonials.length - visible : c - 1));
  const next = () => setCurrent((c) => (c >= testimonials.length - visible ? 0 : c + 1));

  return (
    <section className="section-padding bg-gray-50">
      <div className="container-wide">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What borrowers are saying
            </h2>
            <p className="text-lg text-gray-600 max-w-xl">
              Real feedback from real people. Transparency goes both ways.
            </p>
          </div>
          <div className="flex gap-2 mt-4 md:mt-0">
            <button
              onClick={prev}
              className="p-2.5 rounded-full border border-gray-200 hover:bg-white hover:border-gray-300 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={next}
              className="p-2.5 rounded-full border border-gray-200 hover:bg-white hover:border-gray-300 transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="overflow-hidden">
          <div
            className="flex transition-transform duration-500 ease-out gap-6"
            style={{ transform: `translateX(-${current * (100 / visible + 2)}%)` }}
          >
            {testimonials.map((t, i) => (
              <div
                key={i}
                className="flex-none w-full md:w-[calc(33.333%-16px)] bg-white rounded-2xl border border-gray-200 p-8"
              >
                <Quote className="w-8 h-8 text-brand-200 mb-4" />
                <p className="text-gray-700 leading-relaxed mb-6">{t.text}</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{t.name}</p>
                    <p className="text-sm text-gray-500">{t.location} &middot; {t.loanType}</p>
                  </div>
                  <div className="flex">
                    {[...Array(t.rating)].map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-accent-400 text-accent-400" />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-gray-400 mt-6 text-center">
          Sample testimonials for illustrative purposes only. Individual experiences may vary.
        </p>
      </div>
    </section>
  );
}
