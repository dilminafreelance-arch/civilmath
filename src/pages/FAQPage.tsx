import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, HelpCircle, Search, Shield, ArrowRight, Sparkles } from 'lucide-react';
import { SEO, SITE_URL, DEFAULT_IMAGE } from '../utils/seo';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    category: 'General',
    question: 'What is CivilMath?',
    answer: 'CivilMath is a professional civil engineering calculation platform providing accurate, fast, and code-aligned calculators for concrete volume, beam analysis, bar bending schedules (BBS), column design, surveying, and site estimation.',
  },
  {
    category: 'General',
    question: 'Are all calculators free to use?',
    answer: 'Yes! All calculators, unit converters, reference tables, and formula sheets on CivilMath are 100% free to use for engineers, site contractors, quantity surveyors, and students.',
  },
  {
    category: 'Formulas & Codes',
    question: 'What international design codes are used in the calculators?',
    answer: 'CivilMath calculators implement standard international codes: Concrete volume and column calculations align with ACI 318 (American Concrete Institute) and IS 456; Bar Bending Schedules (BBS) comply with BS 8666 (British Standard) and IS 2502; Structural steel follows AISC 360; and Geotechnical bearing capacity implements Terzaghi and Meyerhof methods.',
  },
  {
    category: 'Formulas & Codes',
    question: 'Can I see the step-by-step formulas used in calculations?',
    answer: 'Yes! Every calculator features a dedicated "Engineering Formula & Calculation Steps" section displaying the exact mathematical equations, substitution of your values, and engineering assumptions (such as dry volume shrinkage factor of 1.54 for concrete or bend deduction angles for rebar).',
  },
  {
    category: 'Units & Measurements',
    question: 'Does CivilMath support both Metric (SI) and Imperial (US) units?',
    answer: 'Yes. You can toggle between Metric (m, mm, m³, kg, kN) and Imperial (ft, in, yd³, lb, kips) anywhere in the application using the topbar switch or within individual calculator input fields. All values, formulas, and results convert dynamically in real time.',
  },
  {
    category: 'Export & Reports',
    question: 'Can I export my calculation results to PDF or Excel?',
    answer: 'Yes! BBS and estimation calculators include direct PDF export and Excel (.xlsx) download options, formatted neatly for client submittals, site supervisors, and project documentation.',
  },
  {
    category: 'Data Privacy',
    question: 'Is my project data stored securely?',
    answer: 'CivilMath operates locally in your browser using HTML5 LocalStorage for saved calculations and user preferences. We do not transmit or store your proprietary dimensions, drawings, or engineering project values on external servers.',
  },
  {
    category: 'Accuracy & Disclaimer',
    question: 'Can I use CivilMath results for final construction approval?',
    answer: 'CivilMath calculations are designed as preliminary estimation, planning, and educational verification aids. Final design detailing, structural checks, and construction approvals must always be certified by a licensed professional engineer against specific project drawings and local building codes.',
  },
];

export default function FAQPage() {
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('All');

  const categories = ['All', 'General', 'Formulas & Codes', 'Units & Measurements', 'Export & Reports', 'Accuracy & Disclaimer'];

  const filteredFaqs = useMemo(() => {
    return FAQ_ITEMS.filter((item) => {
      const matchesCat = selectedCat === 'All' || item.category === selectedCat;
      const matchesSearch =
        !search.trim() ||
        item.question.toLowerCase().includes(search.toLowerCase()) ||
        item.answer.toLowerCase().includes(search.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [search, selectedCat]);

  return (
    <div className="min-h-screen pb-16">
      <SEO
        title="Frequently Asked Questions (FAQ) | CivilMath"
        description="Find answers to common questions about CivilMath engineering calculators, formulas, design codes (ACI 318, BS 8666), unit conversions, and report exports."
        canonicalUrl={`${SITE_URL}/faq`}
        keywords={['civilmath faq', 'engineering calculator questions', 'concrete formula questions', 'aci 318 calculator faq']}
        ogImage={DEFAULT_IMAGE}
        type="website"
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'FAQ', url: '/faq' },
        ]}
        faqs={FAQ_ITEMS.map((f) => ({ question: f.question, answer: f.answer }))}
      />

      <div className="max-w-4xl mx-auto px-4">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1.5 text-xs font-medium text-slate-400 dark:text-slate-500 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <Link to="/" className="hover:text-[#f97316] transition-colors no-underline">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-[#f97316] font-bold">Frequently Asked Questions</span>
        </nav>

        {/* Hero */}
        <div className="pt-10 pb-8 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-[#f97316] text-[11px] font-bold uppercase tracking-wider mb-4">
            <HelpCircle className="w-3.5 h-3.5" />
            Support & Help Center
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
            Frequently Asked Questions
          </h1>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Everything you need to know about CivilMath calculators, engineering formulas, unit conversions, and documentation.
          </p>

          {/* Search */}
          <div className="mt-6 relative max-w-xl mx-auto">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search questions or keywords (e.g. ACI 318, PDF, units)..."
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl pl-11 pr-4 py-3.5 text-sm outline-none focus:border-[#f97316] focus:ring-2 focus:ring-[#f97316]/20 shadow-xs transition-all placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex items-center justify-center gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCat(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCat === cat
                  ? 'bg-[#f97316] text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-[#f97316]/50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-3 mb-12">
          {filteredFaqs.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
              <HelpCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No matching questions found</p>
              <button
                onClick={() => {
                  setSearch('');
                  setSelectedCat('All');
                }}
                className="mt-3 text-xs text-[#f97316] font-semibold hover:underline"
              >
                Reset search
              </button>
            </div>
          ) : (
            filteredFaqs.map((faq, idx) => (
              <details
                key={idx}
                className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs hover:shadow-xs transition-shadow"
              >
                <summary className="px-5 py-4 text-sm font-bold text-slate-800 dark:text-slate-200 cursor-pointer flex items-center justify-between list-none">
                  <span>{faq.question}</span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-open:rotate-90 transition-transform shrink-0 ml-3" />
                </summary>
                <div className="px-5 pb-5 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-3">
                  {faq.answer}
                </div>
              </details>
            ))
          )}
        </div>

        {/* Support Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center shadow-xs">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Have a question not listed here?</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-4 leading-relaxed">
            Our engineering team is continually expanding our formula library and tools based on professional feedback.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              to="/contact"
              className="px-4 py-2 rounded-xl bg-[#f97316] text-white text-xs font-semibold hover:bg-[#ea580c] transition-colors no-underline"
            >
              Contact Engineering Team
            </Link>
            <Link
              to="/calculators"
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors no-underline"
            >
              Explore Calculators
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
