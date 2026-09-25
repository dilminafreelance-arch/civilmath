import { useState, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import {
  ChevronRight, Share2, Printer, BookOpen, Bookmark,
} from 'lucide-react';
import { SEO, generateCalculatorSchema, CATEGORY_PATH_MAP, getRouteSEO, SITE_URL, DEFAULT_IMAGE } from '../utils/seo';
import { CalculatorCategory } from '../types';
import { CALCULATORS_LIST } from '../data/calculatorsData';
import StepWizard from './StepWizard';
import { BeginnerToggle } from './BeginnerMode';

interface CalculatorPageProps {
  title: string;
  description: string;
  category: CalculatorCategory;
  path: string;
  image?: string;
  faqs?: { question: string; answer: string }[];
  children: ReactNode;
  breadcrumbLabel?: string;
  beginnerMode?: boolean;
  onBeginnerModeChange?: (v: boolean) => void;
  currentStep?: number;
  onStepChange?: (step: number) => void;
}

const categoryPathNames: Record<string, string> = {
  structural: 'Structural', concrete: 'Concrete', geotech: 'Geotechnical',
  survey: 'Surveying', utility: 'Utilities', bbs: 'BBS',
};

export default function CalculatorPageTemplate({
  title, description, category, path, image, faqs, children, breadcrumbLabel,
  beginnerMode, onBeginnerModeChange, currentStep, onStepChange,
}: CalculatorPageProps) {
  const navigate = useNavigate();
  const categoryPath = CATEGORY_PATH_MAP[category];
  const displayPath = path.startsWith('/') ? path : `/${path}`;
  const [showHelp, setShowHelp] = useState(false);
  const relatedCalculators = CALCULATORS_LIST.filter(calc => calc.category === category && calc.name !== title).slice(0, 3);

  const steps = [
    { id: 'choose', label: 'Calculator', description: 'Type & shape' },
    { id: 'inputs', label: 'Dimensions', description: 'Enter values' },
    { id: 'results', label: 'Results', description: 'Review output' },
  ];

  const defaultFaqs = [
    {
      question: `How does the ${title} calculator work?`,
      answer: `The ${title} calculator applies the method described on this page to the values you provide. Review the stated inputs, units and assumptions before relying on the result.`,
    },
    {
      question: 'Can I trust the accuracy of these calculations?',
      answer: 'Use results as an educational or planning aid. Final design, detailing, quantities and construction decisions must be checked by a qualified professional against the applicable project documents and requirements.',
    },
    {
      question: 'Can I export the results?',
      answer: 'BBS calculators support PDF, Excel (XLSX), and CSV export. You can also save your calculations locally and access them from the Analytics dashboard.',
    },
  ];

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title, text: description, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url);
    }
  };

  const routeSEO = getRouteSEO(displayPath);
  const seoTitle = routeSEO?.title || title;
  const seoDesc = routeSEO?.description || description;

  return (
    <>
      <SEO
        title={seoTitle}
        description={seoDesc}
        keywords={routeSEO?.keywords}
        canonicalUrl={`${SITE_URL}${displayPath}`}
        ogImage={image || DEFAULT_IMAGE}
        type="article"
        faqs={faqs || defaultFaqs}
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: categoryPathNames[category] || category, url: `/${categoryPath}` },
          { name: breadcrumbLabel || title, url: displayPath },
        ]}
        schema={generateCalculatorSchema({ name: title, description: seoDesc, url: displayPath, category })}
      />

      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs font-medium text-[#7C88B8] dark:text-[#8891B0] mb-4 pb-3 border-b border-[#DCE3F5]/60 dark:border-[#262E42]">
        <Link to="/" className="hover:text-[#161A2C] dark:hover:text-white transition-colors cursor-pointer font-semibold no-underline">Home</Link>
        <ChevronRight className="w-3.5 h-3.5 text-[#B4ACA0]" />
        <Link to={`/${categoryPath}`} className="hover:text-[#161A2C] dark:hover:text-white transition-colors cursor-pointer font-semibold capitalize no-underline">
          {categoryPathNames[category] || category}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-[#B4ACA0]" />
        <span className="text-[#161A2C] dark:text-[#E7EAF7] font-bold truncate max-w-[240px]">{breadcrumbLabel || title}</span>
      </nav>

      {/* Title + Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#161A2C] dark:text-[#E7EAF7] tracking-tight">{title}</h1>
          <p className="text-xs sm:text-sm text-[#7C88B8] dark:text-[#8891B0] mt-1 max-w-2xl leading-relaxed">{description}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {onBeginnerModeChange && (
            <BeginnerToggle enabled={!!beginnerMode} onChange={onBeginnerModeChange} />
          )}
          <button
            onClick={() => {
              const evt = new CustomEvent('civilmath:save-current-calc');
              window.dispatchEvent(evt);
            }}
            className="px-3.5 py-2 backdrop-blur-xl backdrop-saturate-150 bg-[#F7F9FF]/70 dark:bg-[#141826]/70 border border-[#DCE3F5] dark:border-[#2A3350] rounded-xl text-xs font-semibold text-[#161A2C] dark:text-[#E7EAF7] flex items-center gap-1.5 hover:border-[#7C88B8] transition-all cursor-pointer shadow-2xs"
          >
            <Bookmark className="w-3.5 h-3.5 text-[#7C88B8]" /> Save Calculator
          </button>
          <button onClick={handleShare}
            className="px-3 py-2 backdrop-blur-xl backdrop-saturate-150 bg-[#F7F9FF]/70 dark:bg-[#141826]/70 border border-[#DCE3F5] dark:border-[#2A3350] rounded-xl text-xs font-semibold text-[#4A5578] dark:text-[#C9D0EA] flex items-center gap-1.5 hover:border-[#7C88B8] transition-all cursor-pointer shadow-2xs">
            <Share2 className="w-3.5 h-3.5 text-[#7C88B8]" /> Share
          </button>
          <button onClick={() => window.print()}
            className="px-3 py-2 backdrop-blur-xl backdrop-saturate-150 bg-[#F7F9FF]/70 dark:bg-[#141826]/70 border border-[#DCE3F5] dark:border-[#2A3350] rounded-xl text-xs font-semibold text-[#4A5578] dark:text-[#C9D0EA] flex items-center gap-1.5 hover:border-[#7C88B8] transition-all cursor-pointer shadow-2xs">
            <Printer className="w-3.5 h-3.5 text-[#7C88B8]" /> Print
          </button>
        </div>
      </div>

      {/* Step Progress */}
      {currentStep !== undefined && onStepChange && (
        <div className="mb-6">
          <StepWizard steps={steps} currentStep={currentStep} onStepClick={onStepChange} />
        </div>
      )}

      {/* Calculator Content */}
      <div className="relative">
        {children}
      </div>

      {relatedCalculators.length > 0 && <section className="mt-10 max-w-5xl"><div className="flex items-center gap-2 mb-3"><SparklesIcon /><h2 className="text-sm font-bold text-[#161A2C] dark:text-[#E7EAF7]">You may also need</h2></div><div className="grid gap-3 sm:grid-cols-3">{relatedCalculators.map(calc => <Link key={calc.id} to={calc.category === 'bbs' ? '/bbs/footing' : `/${CATEGORY_PATH_MAP[calc.category]}/${calc.slug || calc.id.replace(`${calc.category}-`, '')}`} className="rounded-2xl border border-[#DCE3F5] bg-white/80 p-3.5 text-xs font-semibold text-[#161A2C] no-underline hover:border-[#7C88B8] hover:shadow-2xs dark:border-[#2A3350] dark:bg-[#141826]/70 dark:text-[#E7EAF7] transition-all">{calc.name}<span className="mt-1 block text-[10.5px] font-normal text-[#7C88B8]">Related {categoryPathNames[category]} tool</span></Link>)}</div></section>}

      {/* FAQ Section */}
      <section className="mt-10 max-w-4xl">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-4 h-4 text-[#2563EB]" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Frequently Asked Questions</h3>
        </div>
        <div className="space-y-2">
          {(faqs || defaultFaqs).map((faq, idx) => (
            <details key={idx} className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden transition-shadow hover:shadow-xs">
              <summary className="px-4 py-3.5 text-[11px] font-semibold text-slate-800 dark:text-slate-200 cursor-pointer flex items-center justify-between list-none">
                {faq.question}
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-open:rotate-90 transition-transform shrink-0" />
              </summary>
              <div className="px-4 pb-3.5 text-[10px] text-slate-500 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-3">
                {faq.answer}
              </div>
            </details>
          ))}
        </div>
      </section>
      <aside className="mt-6 max-w-4xl border-l-4 border-amber-400 bg-amber-50 dark:bg-amber-950/20 px-4 py-3 text-xs leading-5 text-amber-900 dark:text-amber-200">
        This calculator provides an estimate or preliminary calculation for educational and planning purposes. Verify final structural design and construction decisions with a qualified professional and the applicable project specification and design requirements.
      </aside>
    </>
  );
}

function SparklesIcon() { return <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-blue-50 text-xs text-[#2563EB] dark:bg-blue-500/10">✦</span>; }
