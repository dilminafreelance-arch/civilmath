import { useEffect, useMemo, useState } from 'react';
import { Command, History, Search, Star, X, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CALCULATORS_LIST } from '../data/calculatorsData';
import { useApp } from '../context/AppContext';
import { CATEGORY_PATH_MAP, getCalculatorSlug } from '../utils/seo';
import { getAllArticleSummaries } from '../utils/articleStore';

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { recentCalculatorIds, favoriteCalculatorIds, setActiveCalcId } = useApp();

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setOpen(true); }
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    return term ? CALCULATORS_LIST.filter(calc => `${calc.name} ${calc.description} ${calc.category}`.toLowerCase().includes(term)).slice(0, 7) : [];
  }, [query]);

  const articleResults = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return [];
    return getAllArticleSummaries()
      .filter(art =>
        art.title.toLowerCase().includes(term) ||
        art.excerpt.toLowerCase().includes(term) ||
        art.category.toLowerCase().includes(term) ||
        art.tags?.some(t => t.toLowerCase().includes(term))
      )
      .slice(0, 4);
  }, [query]);

  const recents = recentCalculatorIds.map(id => CALCULATORS_LIST.find(calc => calc.id === id)).filter(Boolean);
  const favorites = favoriteCalculatorIds.map(id => CALCULATORS_LIST.find(calc => calc.id === id)).filter(Boolean);

  const openCalculator = (id: string) => {
    const calc = CALCULATORS_LIST.find(item => item.id === id);
    if (!calc) return;
    setActiveCalcId(id);
    setOpen(false); setQuery('');
    navigate(calc.category === 'bbs' ? '/bbs/footing' : `/${CATEGORY_PATH_MAP[calc.category]}/${getCalculatorSlug(calc)}`);
  };

  const openArticle = (slug: string) => {
    setOpen(false);
    setQuery('');
    navigate(`/articles/${slug}`);
  };

  return <>
    <button onClick={() => setOpen(true)} aria-label="Search calculators" className="inline-flex items-center gap-2.5 rounded-lg border border-[#E2E6E2] dark:border-white/10 bg-white dark:bg-[#131715] px-3 py-1.5 text-xs font-medium text-[#526058] dark:text-[#97A69E] hover:border-[#2E6B56]/50 dark:hover:border-[#34D399]/40 transition-colors cursor-pointer shadow-2xs">
      <Search className="w-3.5 h-3.5 text-[#7A8981]" />
      <span className="hidden sm:inline">Search calculators...</span>
      <kbd className="hidden sm:inline rounded border border-[#E2E6E2] dark:border-white/10 bg-[#F2F5F3] dark:bg-[#181E1A] px-1.5 py-0.5 text-[9px] font-mono text-[#7A8981]">Ctrl K</kbd>
    </button>
    {open && <div role="dialog" aria-modal="true" aria-label="Search calculators" className="fixed inset-0 z-[100] flex items-start justify-center bg-black/50 p-4 pt-[12vh] backdrop-blur-xs" onMouseDown={() => setOpen(false)}>
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-[#E2E6E2] bg-white/95 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-[#111413]/95" onMouseDown={event => event.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-[#E2E6E2] dark:border-white/10 px-4 py-3">
          <Search className="w-4 h-4 text-[#7A8981]" />
          <input autoFocus value={query} onChange={event => setQuery(event.target.value)} placeholder="Search calculators, engineering tools, formulas…" className="min-w-0 flex-1 bg-transparent text-sm text-[#141A16] dark:text-[#ECF2EE] outline-none placeholder-[#7A8981]" />
          <button onClick={() => setOpen(false)} aria-label="Close search" className="rounded-lg p-1 text-[#7A8981] hover:bg-[#F2F5F3] dark:hover:bg-[#181E1A] cursor-pointer"><X className="w-4 h-4" /></button>
        </div>
        <div className="max-h-[55vh] overflow-y-auto p-2">
          {query ? (
            <>
              <SearchGroup title="Calculators" items={results} onOpen={openCalculator} empty={articleResults.length === 0 ? "No calculators match that search." : undefined} />
              {articleResults.length > 0 && (
                <section className="mb-2">
                  <div className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-mono font-bold uppercase tracking-wider text-[#7A8981]">
                    <BookOpen className="w-3 h-3 text-[#2E6B56] dark:text-[#34D399]" />
                    Articles &amp; Guides
                  </div>
                  {articleResults.map(art => (
                    <button
                      key={art.slug}
                      onClick={() => openArticle(art.slug)}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-[#F2F5F3] dark:hover:bg-[#181E1A] cursor-pointer transition-colors"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-[#2E6B56] dark:text-[#34D399]" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-semibold text-[#141A16] dark:text-[#ECF2EE]">
                          {art.title}
                        </span>
                        <span className="block truncate text-[10px] text-[#7A8981] font-mono">
                          {art.readingTimeMinutes} min read &bull; {art.category}
                        </span>
                      </span>
                    </button>
                  ))}
                </section>
              )}
            </>
          ) : <>
            {favorites.length > 0 && <SearchGroup title="Favorites" icon={Star} items={favorites} onOpen={openCalculator} />}
            <SearchGroup title="Recently used" icon={History} items={recents} onOpen={openCalculator} empty="Start a calculation to build your recent list." />
            <div className="px-3 py-3 text-[10px] font-mono text-[#7A8981]">Popular searches: concrete volume, rebar weight, brickwork, beam analysis</div>
          </>}
        </div>
      </div>
    </div>}
  </>;
}

function SearchGroup({ title, icon: Icon, items, onOpen, empty }: { title: string; icon?: typeof Search; items: ReturnType<typeof CALCULATORS_LIST.filter>; onOpen: (id: string) => void; empty?: string }) {
  return <section className="mb-2"><div className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-mono font-bold uppercase tracking-wider text-[#7A8981]">{Icon && <Icon className="w-3 h-3 text-[#2E6B56] dark:text-[#34D399]" />}{title}</div>{items.length === 0 ? <p className="px-3 pb-3 text-xs text-[#7A8981]">{empty}</p> : items.map(calc => <button key={calc.id} onClick={() => onOpen(calc.id)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-[#F2F5F3] dark:hover:bg-[#181E1A] cursor-pointer transition-colors"><Command className="w-3.5 h-3.5 text-[#2E6B56] dark:text-[#34D399]" /><span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold text-[#141A16] dark:text-[#ECF2EE]">{calc.name}</span><span className="block truncate text-[10px] text-[#7A8981] font-mono">{calc.category}</span></span></button>)}</section>;
}
