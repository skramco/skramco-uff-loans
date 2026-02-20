import { Link } from 'react-router-dom';
import { ArrowRight, Clock } from 'lucide-react';
import { articles } from '../../data/articles';

export default function EducationGrid() {
  const featured = articles.slice(0, 6);

  return (
    <section className="section-padding bg-white">
      <div className="container-wide">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Guides that don't waste your time
            </h2>
            <p className="text-lg text-gray-600 max-w-xl">
              Clear answers to the questions that actually matter when you are borrowing.
            </p>
          </div>
          <Link
            to="/learn"
            className="inline-flex items-center gap-2 text-brand-600 font-semibold text-sm mt-4 md:mt-0 hover:gap-3 transition-all"
          >
            View all guides
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featured.map((article) => (
            <Link
              key={article.slug}
              to="/learn"
              className="group bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg hover:border-gray-300 transition-all duration-300"
            >
              <div className="aspect-[16/9] overflow-hidden">
                <img
                  src={article.image}
                  alt={article.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
              </div>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="px-2.5 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                    {article.category}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <Clock className="w-3 h-3" />
                    {article.readTime}
                  </span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2 group-hover:text-brand-600 transition-colors leading-snug">
                  {article.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">{article.excerpt}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
