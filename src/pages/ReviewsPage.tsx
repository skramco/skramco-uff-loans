import { Star, Quote } from 'lucide-react';
import { testimonials } from '../data/testimonials';

export default function ReviewsPage() {
  const avg = (testimonials.reduce((s, t) => s + t.rating, 0) / testimonials.length).toFixed(1);

  return (
    <div className="pt-20">
      <section className="bg-gradient-to-b from-gray-900 to-gray-800 text-white py-16 md:py-24">
        <div className="container-wide">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Borrower Reviews</h1>
          <p className="text-xl text-gray-300 max-w-2xl">
            Transparency goes both ways. Here is what borrowers say about working with us.
          </p>
          <div className="flex items-center gap-3 mt-6">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-6 h-6 fill-accent-400 text-accent-400" />
              ))}
            </div>
            <span className="text-2xl font-bold">{avg}</span>
            <span className="text-gray-400">based on {testimonials.length} reviews</span>
          </div>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container-wide">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 p-8 hover:shadow-lg transition-shadow">
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
          <p className="text-xs text-gray-400 mt-8 text-center">
            Sample testimonials for illustrative purposes only. Individual experiences may vary.
          </p>
        </div>
      </section>
    </div>
  );
}
