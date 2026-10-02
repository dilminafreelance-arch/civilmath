import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Clock, ArrowRight } from 'lucide-react';
import { Article } from '../../types/article';
import { getArticleBySlug, getAllArticleSummaries } from '../../utils/articleStore';
import { getArticleCoverImage } from '../../data/articleVisuals';

export interface RelatedArticlesCardProps {
  title?: string;
  articleSlugs?: string[];
  currentSlug?: string;
  category?: string;
}

export default function RelatedArticlesCard({
  title = 'Related Engineering Guides & References',
  articleSlugs,
  currentSlug,
  category,
}: RelatedArticlesCardProps) {
  const [articles, setArticles] = useState<Article[]>([]);

  // Stable key to prevent infinite re-render loop from array reference creation
  const slugsKey = articleSlugs && articleSlugs.length > 0 ? articleSlugs.join(',') : '';

  useEffect(() => {
    let isMounted = true;
    async function load() {
      const summaries = getAllArticleSummaries();
      const results: Article[] = [];

      // 1. If explicit slugs were provided, fetch those first
      if (articleSlugs && articleSlugs.length > 0) {
        for (const s of articleSlugs) {
          if (s === currentSlug) continue;
          const art = await getArticleBySlug(s);
          if (art && !results.some(r => r.slug === art.slug)) {
            results.push(art);
          }
        }
      }

      // 2. If fewer than 3, backfill from same category or general list
      if (results.length < 3) {
        const fallbacks = summaries.filter(
          s => s.slug !== currentSlug && !results.some(r => r.slug === s.slug) && (category ? s.category === category : true)
        );
        for (const fb of fallbacks.slice(0, 3 - results.length)) {
          const art = await getArticleBySlug(fb.slug);
          if (art && !results.some(r => r.slug === art.slug)) {
            results.push(art);
          }
        }
      }

      if (isMounted) {
        setArticles(results.slice(0, 3));
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [slugsKey, currentSlug, category]);

  if (articles.length === 0) return null;

  return (
    <div className="my-10 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#657565] dark:text-[#9FB19F] uppercase tracking-wider">
          <BookOpen className="w-4 h-4" />
          <span>{title}</span>
        </div>
        <Link
          to="/articles"
          className="text-xs font-semibold text-[#657565] dark:text-[#9FB19F] hover:underline flex items-center gap-1 no-underline"
        >
          <span>All Articles</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {articles.map(art => {
          const cover = getArticleCoverImage(art.slug, art.category, art.coverImage);
          return (
            <Link
              key={art.slug}
              to={`/articles/${art.slug}`}
              className="group flex flex-col bg-white dark:bg-[#252B25] border border-[#D8D0C2] dark:border-[#384238] rounded-2xl overflow-hidden hover:border-[#657565] transition-all no-underline shadow-2xs hover:shadow-xs"
            >
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#FAF9F6] dark:bg-[#1E221E]">
                <img
                  src={cover.url}
                  alt={cover.alt}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-xs text-white px-2 py-0.5 rounded text-[9px] font-mono uppercase font-bold">
                  {art.category}
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                <h4 className="text-xs font-bold text-[#20231F] dark:text-[#EAE7E0] group-hover:text-[#657565] dark:group-hover:text-[#9FB19F] transition-colors leading-snug line-clamp-2">
                  {art.title}
                </h4>
                <div className="text-[10px] font-mono text-[#7B8978] flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{art.readTimeMinutes} min read</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
