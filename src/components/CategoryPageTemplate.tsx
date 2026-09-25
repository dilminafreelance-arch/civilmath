import { useState, ComponentType } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Search, ChevronRight, Sparkles, Clipboard, Layers, GitCommit, Anchor, Compass, RefreshCw, Grid, Clock, Star,
} from 'lucide-react';
import { SEO, CATEGORY_META, CATEGORY_PATH_MAP, getCalculatorSlug, getRouteSEO, SITE_URL, DEFAULT_IMAGE } from '../utils/seo';
import { CalculatorCategory, CalculatorDef } from '../types';
import { CALCULATORS_LIST } from '../data/calculatorsData';
import { useApp } from '../context/AppContext';

interface CategoryPageProps {
  category: CalculatorCategory;
  subCalculators?: { id: string; name: string; description: string; path: string }[];
  heroTitle?: string;
  heroSubtitle?: string;
}

const ICON_MAP: Record<string, ComponentType<any>> = {
  Clipboard, Layers, GitCommit, Anchor, Compass, RefreshCw, Grid, Search, Sparkles,
};

export default function CategoryPageTemplate({ category, subCalculators, heroTitle, heroSubtitle }: CategoryPageProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const { favoriteCalculatorIds, toggleFavoriteCalculator, setActiveCalcId } = useApp();
  const meta = CATEGORY_META[category];
  const categoryPath = CATEGORY_PATH_MAP[category];

  const getSlug = (calcDef: typeof CALCULATORS_LIST[0]) => {
    if (calcDef.id.startsWith(calcDef.category + '-')) return calcDef.id.substring(calcDef.category.length + 1);
    return calcDef.id;
  };

  const calculators = subCalculators || CALCULATORS_LIST
    .filter(c => c.category === category)
    .map(c => ({
      id: c.id,
      name: c.name,
      description: c.description,
      path: `/${categoryPath}/${getSlug(c) || getCalculatorSlug(c)}`,
    }));

  const filtered = calculators.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const FAQS: { question: string; answer: string }[] = [
    {
      question: `What standards are used in the ${meta.name} calculators?`,
      answer: `Each calculator explains its method and assumptions. Use results as educational or preliminary planning information and verify final design decisions against the applicable project requirements.`,
    },
    {
      question: 'Can I switch between metric and imperial units?',
      answer: 'Yes. All calculators support real-time toggling between Metric (SI) and Imperial (US) unit systems. All inputs, outputs, and visualizations update instantly.',
    },
    {
      question: 'Can I save my calculations?',
      answer: 'Yes. Each calculator includes a Save function that stores your inputs and results locally. You can view, reload, or delete saved calculations from the Analytics dashboard.',
    },
    {
      question: 'Are the results exportable?',
      answer: 'Yes. BBS calculators support PDF, Excel (XLSX), and CSV export. Other calculators support copying results and saving to your local project history.',
    },
  ];

  const routeSEO = getRouteSEO(`/${categoryPath}`);
  const seoTitle = routeSEO?.title || `${meta.name} Calculators | CivilMath`;
  const seoDesc = routeSEO?.description || meta.description;

  return (
    <>
      <SEO
        title={seoTitle}
        description={seoDesc}
        canonicalUrl={`${SITE_URL}/${categoryPath}`}
        keywords={routeSEO?.keywords}
        ogImage={DEFAULT_IMAGE}
        type="website"
        breadcrumbs={[{ name: 'Home', url: '/' }, { name: meta.name, url: `/${categoryPath}` }]}
        faqs={FAQS}
        schema={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: seoTitle,
          description: seoDesc,
        }}
      />

      {/* Hero */}
      <section className="relative pt-10 md:pt-16 pb-8 text-center">
        <div className="mb-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#ECF2EE] dark:bg-[#181E1A] border border-[#E2E6E2] dark:border-[#1A211D] rounded-full text-[10px] font-mono font-bold text-brand uppercase tracking-wider">
            <Sparkles className="w-3 h-3" />
            {meta.name}
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-[#141A16] dark:text-[#ECF2EE] tracking-tight leading-tight max-w-3xl mx-auto">
          {heroTitle || meta.heroTitle}
        </h1>
        <p className="mt-3 text-sm text-[#7A8981] dark:text-[#97A69E] max-w-2xl mx-auto leading-relaxed">
          {heroSubtitle || meta.heroSubtitle}
        </p>
      </section>

      {/* Search */}
      <div className="max-w-xl mx-auto mb-8">
        <div className="relative group">
          <div className="relative flex items-center backdrop-blur-xl backdrop-saturate-150 bg-[#F2F5F3]/70 dark:bg-[#131715]/70 border border-[#E2E6E2] dark:border-[#1A211D] rounded-2xl shadow-2xs group-hover:border-brand transition-all">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7A8981]" />
            <input type="text" aria-label="Search calculators" placeholder="Search calculators..." value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-transparent pl-11 pr-4 py-3.5 text-sm outline-none text-[#141A16] dark:text-[#ECF2EE] placeholder:text-[#7A8981]" />
          </div>
        </div>
      </div>

      {/* Calculator Cards */}
      <div className="pb-12">
        {filtered.length === 0 ? (
          <div className="text-center py-16 backdrop-blur-xl backdrop-saturate-150 bg-[#F2F5F3]/70 dark:bg-[#131715]/70 border border-[#E2E6E2] dark:border-[#1A211D] rounded-2xl">
            <Search className="w-8 h-8 text-[#7A8981] mx-auto mb-2" />
            <p className="text-xs text-[#7A8981]">No calculators found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((calc, idx) => (
              <motion.div key={calc.id} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: Math.min(0.15, idx * 0.03) }}
                onClick={() => { setActiveCalcId(calc.id); navigate(calc.path); }}
                className="group relative backdrop-blur-xl backdrop-saturate-150 bg-[#F2F5F3]/70 dark:bg-[#131715]/70 border border-[#E2E6E2] dark:border-[#1A211D] rounded-2xl p-5 hover:shadow-xs hover:-translate-y-0.5 hover:border-brand transition-all cursor-pointer text-left"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-brand/10 text-brand shrink-0">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-[#141A16] dark:text-[#ECF2EE] group-hover:text-brand transition-colors">{calc.name}</h3>
                    <p className="text-[10px] text-[#7A8981] dark:text-[#97A69E] mt-1 leading-relaxed line-clamp-2">{calc.description}</p>
                    <div className="mt-3 flex items-center gap-2 text-[9px] text-[#7A8981]">
                      <span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" /> ~2 min</span>
                    </div>
                    <Link to={calc.path} onClick={e => e.stopPropagation()} className="mt-3 inline-block text-[10px] font-semibold text-brand no-underline">Open calculator →</Link>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <button onClick={event => { event.stopPropagation(); toggleFavoriteCalculator(calc.id); }} aria-label={`${favoriteCalculatorIds.includes(calc.id) ? 'Remove' : 'Add'} ${calc.name} ${'from favorites'}`} className={`rounded-lg p-1.5 cursor-pointer ${favoriteCalculatorIds.includes(calc.id) ? 'text-[#D9B96E] bg-[#D9B96E]/10' : 'text-[#E2E6E2] hover:text-[#D9B96E]'}`}><Star className={`w-3.5 h-3.5 ${favoriteCalculatorIds.includes(calc.id) ? 'fill-current' : ''}`} /></button>
                    <ChevronRight className="w-4 h-4 text-[#E2E6E2] group-hover:text-brand group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* FAQ + Explore */}
      <section className="max-w-4xl mx-auto pb-16 space-y-10">
        {/* FAQ */}
        <div>
          <h3 className="text-sm font-bold text-[#141A16] dark:text-[#ECF2EE] mb-4 text-center">Frequently Asked Questions</h3>
          <div className="space-y-2">
            {FAQS.map((faq, idx) => (
              <details key={idx} className="group backdrop-blur-xl backdrop-saturate-150 bg-[#F2F5F3]/70 dark:bg-[#131715]/70 border border-[#E2E6E2] dark:border-[#1A211D] rounded-2xl overflow-hidden transition-shadow hover:shadow-xs">
                <summary className="px-4 py-3.5 text-[11px] font-semibold text-[#141A16] dark:text-[#ECF2EE] cursor-pointer flex items-center justify-between list-none">
                  {faq.question}
                  <ChevronRight className="w-3.5 h-3.5 text-[#7A8981] group-open:rotate-90 transition-transform shrink-0" />
                </summary>
                <div className="px-4 pb-3.5 text-[10px] text-[#7A8981] leading-relaxed border-t border-[#E2E6E2]/60 dark:border-[#1A211D]/60 pt-3">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </div>

        {/* Related Categories */}
        <div className="border-t border-[#E2E6E2] dark:border-[#1A211D] pt-8">
          <h3 className="text-sm font-bold text-[#141A16] dark:text-[#ECF2EE] mb-4">Explore Other Categories</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {Object.entries(CATEGORY_META).filter(([key]) => key !== category).map(([key, catMeta]) => (
              <Link key={key} to={`/${CATEGORY_PATH_MAP[key as CalculatorCategory]}`}
                className="p-3.5 rounded-xl backdrop-blur-xl backdrop-saturate-150 bg-[#F2F5F3]/70 dark:bg-[#131715]/70 border border-[#E2E6E2] dark:border-[#1A211D] hover:border-brand hover:shadow-xs transition-all text-left cursor-pointer no-underline group">
                <span className="text-[11px] font-bold text-[#141A16] dark:text-[#ECF2EE] group-hover:text-brand transition-colors capitalize">{catMeta.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
