import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Search } from 'lucide-react';
import { articles } from '../data/articles';

const allCategories = ['All', ...new Set(articles.map((a) => a.category))];

export default function LearnPage() {
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');

  const filtered = articles.filter((a) => {
    const matchCategory = category === 'All' || a.category === category;
    const matchSearch = !search || a.title.toLowerCase().includes(search.toLowerCase()) || a.excerpt.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="pt-20">
      <section className="bg-gradient-to-b from-gray-900 to-gray-800 text-white py-16 md:py-24">
        <div className="container-wide">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Learning Center</h1>
          <p className="text-xl text-gray-300 max-w-2xl">
            Mortgage guides that skip the fluff. Clear, actionable information to help you make confident decisions.
          </p>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container-wide">
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-10">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search guides..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {allCategories.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    category === c
                      ? 'bg-brand-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((article) => (
              <Link
                to={`/learn/${article.slug}`}
                key={article.slug}
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
                    <span className="px-2.5 py-0.5 bg-brand-50 text-brand-700 text-xs font-medium rounded-full">
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

          {filtered.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <p className="text-lg">No guides match your search.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
