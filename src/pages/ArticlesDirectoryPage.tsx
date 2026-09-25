import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, BookOpen, Clock, Calendar, ArrowRight,
  Filter, Sparkles, User, ArrowUpDown, X, ChevronRight
} from 'lucide-react';
import { SEOHead } from '../utils/seo';
import { Article } from '../types/article';
import { getAllArticleSummaries } from '../utils/articleStore';
import { getArticleCoverImage } from '../data/articleVisuals';

type SortOption = 'recommended' | 'time-asc' | 'time-desc' | 'alphabetical';

const CATEGORIES = [
  { id: 'all', label: 'All Articles' },
  { id: 'concrete', label: 'Concrete' },
  { id: 'structural', label: 'Structural' },
  { id: 'bbs', label: 'BOQ / Estimation' },
  { id: 'survey', label: 'Surveying' },
  { id: 'geotech', label: 'Site Work & Geotech' },
  { id: 'utility', label: 'Materials' },
  { id: 'construction', label: 'Construction' },
];

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  concrete:     { bg: 'bg-brand/8 dark:bg-brand/15',  text: 'text-[#245745] dark:text-[#8CA0F0]',  border: 'border-brand/25' },
  structural:   { bg: 'bg-[#7A8981]/10 dark:bg-[#7A8981]/15',  text: 'text-[#4A5578] dark:text-[#7A8981]',  border: 'border-[#7A8981]/30' },
  bbs:          { bg: 'bg-[#D9B96E]/10 dark:bg-[#D9B96E]/15',  text: 'text-[#7B6022] dark:text-[#D9B96E]',  border: 'border-[#D9B96E]/30' },
  survey:       { bg: 'bg-[#9CB5C4]/10 dark:bg-[#9CB5C4]/15',  text: 'text-[#4B6E82] dark:text-[#9CB5C4]',  border: 'border-[#9CB5C4]/30' },
  geotech:      { bg: 'bg-[#B56F50]/10 dark:bg-[#B56F50]/15',  text: 'text-[#7A3E28] dark:text-[#D4926E]',  border: 'border-[#B56F50]/30' },
  utility:      { bg: 'bg-[#7A8981]/8 dark:bg-[#7A8981]/12',   text: 'text-brand dark:text-[#8CA0F0]',  border: 'border-brand/20' },
  construction: { bg: 'bg-[#22C55E]/8 dark:bg-[#22C55E]/12',   text: 'text-[#166534] dark:text-[#4ADE80]',  border: 'border-[#22C55E]/25' },
  general:      { bg: 'bg-[#7A8981]/8 dark:bg-[#7A8981]/12',   text: 'text-[#7A8981] dark:text-[#7A8981]',  border: 'border-[#7A8981]/25' },
};

export default function ArticlesDirectoryPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('recommended');

  useEffect(() => {
    setArticles(getAllArticleSummaries());
  }, []);

  // Filter & Sort
  const filteredAndSortedArticles = useMemo(() => {
    const filtered = articles.filter(art => {
      const matchSearch =
        !search.trim() ||
        art.title.toLowerCase().includes(search.toLowerCase()) ||
        art.excerpt.toLowerCase().includes(search.toLowerCase()) ||
        art.seo?.primaryKeyword?.toLowerCase().includes(search.toLowerCase()) ||
        art.tags?.some(t => t.toLowerCase().includes(search.toLowerCase()));

      let matchCat = true;
      if (activeCategory === 'all') {
        matchCat = true;
      } else if (activeCategory === 'construction') {
        matchCat = art.category === 'construction' || art.category === 'general';
      } else {
        matchCat = art.category === activeCategory;
      }

      const matchStatus = art.status === 'published';
      return matchSearch && matchCat && matchStatus;
    });

    // Sorting
    return filtered.sort((a, b) => {
      if (sortBy === 'time-asc') {
        return (a.readTimeMinutes || 5) - (b.readTimeMinutes || 5);
      }
      if (sortBy === 'time-desc') {
        return (b.readTimeMinutes || 5) - (a.readTimeMinutes || 5);
      }
      if (sortBy === 'alphabetical') {
        return a.title.localeCompare(b.title);
      }
      // 'recommended': keep built-in priority then date
      return 0;
    });
  }, [articles, search, activeCategory, sortBy]);

  const clearFilters = () => {
    setSearch('');
    setActiveCategory('all');
    setSortBy('recommended');
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      <SEOHead
        meta={{
          title: 'Civil Engineering Calculation Articles & Guides | CivilMath',
          description: 'Explore step-by-step engineering articles, formulas, and practical calculation guides for concrete, rebar BBS schedules, beam design, and surveying.',
          path: '/articles',
          canonical: 'https://civilmath.com/articles',
          type: 'website',
          breadcrumbs: [
            { name: 'Home', url: '/' },
            { name: 'Articles', url: '/articles' },
          ],
        }}
      />

      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="text-xs text-[#7B8978] flex items-center gap-1.5 font-mono">
        <Link to="/" className="hover:text-[#20231F] dark:hover:text-white transition-colors no-underline">
          Home
        </Link>
        <span>/</span>
        <span className="text-[#20231F] dark:text-[#EAE7E0] font-bold">Articles & Guides</span>
      </nav>

      {/* Hero Header */}
      <header className="space-y-3 pb-2 border-b border-[#D8D0C2]/50 dark:border-[#333C33]">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold font-mono bg-[#657565]/12 text-[#657565] dark:text-[#A1B3A1]">
          <BookOpen className="w-3.5 h-3.5" />
          <span>CivilMath Engineering Codex</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#20231F] dark:text-[#EAE7E0] tracking-tight">
          Civil Engineering Calculation Articles
        </h1>
        <p className="text-sm sm:text-base text-[#7B8978] dark:text-[#9CA899] max-w-3xl leading-relaxed">
          Comprehensive step-by-step technical guides covering theoretical mechanics, code provisions (ACI 318, IS 456, BS 8666, Eurocode 2), worked numerical calculations, and site best practices.
        </p>
      </header>

      {/* Search & Filter Toolbar */}
      <div className="bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#384238] rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
        {/* Top bar: Search + Sort */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7B8978]" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search articles by title, keyword, formula, or code..."
              className="w-full text-xs sm:text-sm pl-10 pr-9 py-2.5 bg-white dark:bg-[#252B25] border border-[#D8D0C2] dark:border-[#384238] rounded-xl text-[#20231F] dark:text-[#EAE7E0] outline-none focus:border-[#657565] transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7B8978] hover:text-[#20231F] dark:hover:text-white cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-[11px] font-mono text-[#7B8978] shrink-0 flex items-center gap-1">
              <ArrowUpDown className="w-3 h-3" />
              Sort:
            </span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as SortOption)}
              className="text-xs font-semibold px-3 py-2 bg-white dark:bg-[#252B25] border border-[#D8D0C2] dark:border-[#384238] rounded-xl text-[#20231F] dark:text-[#EAE7E0] outline-none cursor-pointer w-full sm:w-auto"
            >
              <option value="recommended">Recommended</option>
              <option value="time-asc">Quickest Read (~ min)</option>
              <option value="time-desc">Long-form (~ min)</option>
              <option value="alphabetical">Alphabetical (A–Z)</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar">
          {CATEGORIES.map(cat => {
            const active = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-[#657565] text-white shadow-xs'
                    : 'bg-white dark:bg-[#252B25] text-[#555C55] dark:text-[#A4B2A4] border border-[#D8D0C2] dark:border-[#384238] hover:border-[#657565]'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Results summary bar */}
        <div className="flex items-center justify-between text-[11px] font-mono text-[#7B8978] pt-1">
          <span>
            Showing <strong className="text-[#20231F] dark:text-[#EAE7E0]">{filteredAndSortedArticles.length}</strong> engineering articles
          </span>
          {(search || activeCategory !== 'all' || sortBy !== 'recommended') && (
            <button
              onClick={clearFilters}
              className="text-[#657565] dark:text-[#A1B3A1] hover:underline font-bold cursor-pointer flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Reset filters
            </button>
          )}
        </div>
      </div>

      {/* Upgraded Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAndSortedArticles.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#384238] rounded-2xl p-8 space-y-3">
            <BookOpen className="w-10 h-10 text-[#7B8978] mx-auto opacity-40" />
            <h3 className="text-base font-bold text-[#20231F] dark:text-[#EAE7E0]">No matching articles found</h3>
            <p className="text-xs text-[#7B8978] max-w-sm mx-auto leading-relaxed">
              We couldn't find any articles matching your search query &quot;{search}&quot;. Try broadening your keywords.
            </p>
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-[#657565] hover:bg-[#536153] text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              Show All Articles
            </button>
          </div>
        ) : (
          filteredAndSortedArticles.map(art => {
            const cover = getArticleCoverImage(art.slug, art.category, art.coverImage);
            const catColor = CATEGORY_COLORS[art.category] || CATEGORY_COLORS.general;

            return (
              <Link
                key={art.slug}
                to={`/articles/${art.slug}`}
                className="group flex flex-col bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#384238] rounded-2xl overflow-hidden hover:border-[#657565] transition-all no-underline shadow-2xs hover:shadow-md hover:-translate-y-0.5"
              >
                {/* 16:9 Thumbnail Image */}
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#EAE7E0] dark:bg-[#252B25]">
                  <img
                    src={cover.url}
                    alt={cover.alt}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                  />
                  {/* Category Pill Overlay */}
                  <div className="absolute top-3 left-3">
                    <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono uppercase tracking-wider backdrop-blur-md border ${catColor.bg} ${catColor.text} ${catColor.border}`}>
                      {art.category === 'bbs' ? 'BOQ / BBS' : art.category}
                    </span>
                  </div>

                  {/* Reading Time Pill Overlay */}
                  <div className="absolute bottom-3 right-3 bg-black/65 backdrop-blur-xs text-white px-2 py-0.5 rounded-md text-[10px] font-mono flex items-center gap-1 font-medium">
                    <Clock className="w-3 h-3" />
                    <span>{art.readTimeMinutes || 6} min read</span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h2 className="text-base font-bold text-[#20231F] dark:text-[#EAE7E0] group-hover:text-[#657565] dark:group-hover:text-[#A1B3A1] transition-colors leading-snug line-clamp-2">
                      {art.title}
                    </h2>

                    <p className="text-xs text-[#7B8978] dark:text-[#9CA899] leading-relaxed line-clamp-3">
                      {art.excerpt}
                    </p>
                  </div>

                  {/* Card Footer: Metadata & CTA */}
                  <div className="pt-3 border-t border-[#D8D0C2]/50 dark:border-[#333C33] flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-[10px] font-mono text-[#7B8978]">
                      <div className="w-5 h-5 rounded-full bg-[#657565]/15 text-[#657565] flex items-center justify-center font-bold text-[9px]">
                        CM
                      </div>
                      <span className="truncate max-w-[120px]">CivilMath Team</span>
                    </div>

                    <span className="text-xs font-bold text-[#657565] dark:text-[#A1B3A1] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      <span>Read Guide</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
