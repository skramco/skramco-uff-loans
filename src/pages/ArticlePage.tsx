import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Clock, BookOpen, ChevronRight, Lightbulb, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';
import { articles } from '../data/articles';
import { articleContents, ArticleSection } from '../data/articleContent';

function SectionRenderer({ section, index }: { section: ArticleSection; index: number }) {
  if (section.type === 'callout') {
    return (
      <div className="my-8 bg-sky-50 border-l-4 border-sky-500 rounded-r-xl p-6">
        <div className="flex gap-3">
          <BookOpen className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
          <p className="text-gray-700 leading-relaxed">{section.content}</p>
        </div>
      </div>
    );
  }

  if (section.type === 'tip') {
    return (
      <div className="my-8 bg-emerald-50 border-l-4 border-emerald-500 rounded-r-xl p-6">
        <div className="flex gap-3">
          <Lightbulb className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            {section.heading && (
              <h3 className="font-bold text-gray-900 mb-2">{section.heading}</h3>
            )}
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">{section.content}</p>
          </div>
        </div>
      </div>
    );
  }

  if (section.type === 'warning') {
    return (
      <div className="my-8 bg-amber-50 border-l-4 border-amber-500 rounded-r-xl p-6">
        <div className="flex gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-gray-700 leading-relaxed">{section.content}</p>
        </div>
      </div>
    );
  }

  if (section.type === 'comparison') {
    return (
      <div className="my-8">
        {section.heading && (
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">{section.heading}</h2>
        )}
        <div className="bg-gray-50 rounded-2xl border border-gray-200 p-6 md:p-8">
          <p className="text-gray-700 leading-relaxed whitespace-pre-line">{section.content}</p>
        </div>
      </div>
    );
  }

  if (section.type === 'checklist') {
    return (
      <div className="my-8">
        {section.heading && (
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">{section.heading}</h2>
        )}
        {section.content && (
          <p className="text-gray-600 mb-4">{section.content}</p>
        )}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm divide-y divide-gray-100">
          {section.items?.map((item, i) => (
            <label key={i} className="flex items-center gap-3 px-5 py-3.5 cursor-pointer hover:bg-gray-50 transition-colors">
              <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5 text-gray-300" />
              </div>
              <span className="text-gray-700 text-sm">{item}</span>
            </label>
          ))}
        </div>
      </div>
    );
  }

  const paragraphs = section.content.split('\n\n');

  return (
    <div className="my-8">
      {section.heading && (
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 scroll-mt-24" id={`section-${index}`}>
          {section.heading}
        </h2>
      )}
      {paragraphs.map((p, i) => (
        <p key={i} className={`text-gray-600 leading-[1.8] ${i > 0 ? 'mt-4' : ''}`}>
          {p}
        </p>
      ))}
    </div>
  );
}

export default function ArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const article = articles.find((a) => a.slug === slug);
  const content = slug ? articleContents[slug] : undefined;

  if (!article || !content) {
    return (
      <div className="pt-20">
        <div className="container-narrow py-20 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Article not found</h1>
          <Link to="/learn" className="text-brand-600 hover:text-brand-700 font-medium">
            Back to Learning Center
          </Link>
        </div>
      </div>
    );
  }

  const headings = content.sections
    .map((s, i) => (s.heading && s.type !== 'tip' && s.type !== 'callout' && s.type !== 'warning' ? { heading: s.heading, index: i } : null))
    .filter(Boolean) as { heading: string; index: number }[];

  const relatedArticles = content.relatedSlugs
    .map((s) => articles.find((a) => a.slug === s))
    .filter(Boolean);

  return (
    <div className="pt-20">
      <div className="bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800">
        <div className="container-narrow py-12 md:py-20">
          <Link
            to="/learn"
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Learning Center
          </Link>

          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 bg-brand-500/20 text-brand-300 text-xs font-semibold rounded-full">
              {article.category}
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              {article.readTime} read
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-6 max-w-3xl">
            {article.title}
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl leading-relaxed">
            {article.excerpt}
          </p>
        </div>
      </div>

      <div className="relative">
        <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-gray-800 to-transparent pointer-events-none" />

        <div className="container-narrow relative">
          <div className="lg:grid lg:grid-cols-[1fr_280px] lg:gap-12 pt-8 pb-16">
            <article className="min-w-0">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 -mt-16 relative z-10 overflow-hidden">
                <img
                  src={article.image}
                  alt={article.title}
                  className="w-full h-48 md:h-64 object-cover"
                />
                <div className="p-6 md:p-10">
                  {content.sections.map((section, i) => (
                    <SectionRenderer key={i} section={section} index={i} />
                  ))}
                </div>
              </div>

              <div className="mt-10 bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 md:p-10">
                <h3 className="text-lg font-bold text-white mb-5">Key Takeaways</h3>
                <div className="space-y-3">
                  {content.keyTakeaways.map((t, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-brand-500/20 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-brand-400" />
                      </div>
                      <p className="text-gray-300 text-sm leading-relaxed">{t}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-10 bg-brand-600 rounded-2xl p-8 md:p-10 text-center">
                <h3 className="text-xl font-bold text-white mb-2">Ready to take the next step?</h3>
                <p className="text-brand-100 mb-6">
                  See your personalized rates and payment options in under 2 minutes.
                </p>
                <Link
                  to="/start"
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-brand-700 font-bold rounded-xl hover:bg-gray-50 transition-colors shadow-lg"
                >
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </article>

            <aside className="hidden lg:block">
              <div className="sticky top-24 space-y-6">
                {headings.length > 0 && (
                  <nav className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">In this guide</h4>
                    <div className="space-y-1">
                      {headings.map((h) => (
                        <a
                          key={h.index}
                          href={`#section-${h.index}`}
                          className="block text-sm text-gray-600 hover:text-brand-600 hover:bg-brand-50 px-3 py-1.5 rounded-lg transition-colors leading-snug"
                        >
                          {h.heading}
                        </a>
                      ))}
                    </div>
                  </nav>
                )}

                {relatedArticles.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Related Guides</h4>
                    <div className="space-y-2">
                      {relatedArticles.map((ra) => ra && (
                        <Link
                          key={ra.slug}
                          to={`/learn/${ra.slug}`}
                          className="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors group"
                        >
                          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-brand-500 shrink-0 mt-0.5 transition-colors" />
                          <span className="text-sm text-gray-700 group-hover:text-brand-600 leading-snug transition-colors">
                            {ra.title}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-gray-50 rounded-xl border border-gray-200 p-5 text-center">
                  <p className="text-sm font-semibold text-gray-900 mb-1">Have questions?</p>
                  <p className="text-xs text-gray-500 mb-3">Our loan officers are here to help.</p>
                  <a
                    href="tel:855-95-32453"
                    className="block text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors"
                  >
                    (855) 95-EAGLE
                  </a>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
