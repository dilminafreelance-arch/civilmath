import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Search, Layers, Grid, Clipboard, Activity, Compass, RefreshCw,
  TrendingUp, Sparkles, Clock, ArrowRight, CheckCircle, HardHat,
  Calculator, Star, BookOpen, Download, FileText,
} from 'lucide-react';
import { CALCULATORS_LIST } from '../data/calculatorsData';
import { CalculatorCategory } from '../types';
import { CATEGORY_PATH_MAP } from '../utils/seo';

const categories = [
  { id: 'bbs' as const, label: 'Bar Bending Schedule', icon: Clipboard, color: '#2563EB', desc: 'Steel reinforcement detailing for beams, columns, slabs & more', count: 14 },
  { id: 'concrete' as const, label: 'Concrete Mix Design', icon: Layers, color: '#22C55E', desc: 'Volume, materials, and cost estimation for concrete', count: 3 },
  { id: 'structural' as const, label: 'Structural Analysis', icon: Grid, color: '#F59E0B', desc: 'Beam, column, slab design and deflection checks', count: 4 },
  { id: 'geotech' as const, label: 'Geotechnical', icon: Activity, color: '#8B5CF6', desc: 'Bearing capacity and retaining wall calculations', count: 2 },
  { id: 'survey' as const, label: 'Surveying', icon: Compass, color: '#EC4899', desc: 'Leveling, traverse, and coordinate calculations', count: 2 },
  { id: 'utility' as const, label: 'Unit Conversion', icon: RefreshCw, color: '#14B8A6', desc: 'Engineering unit converter for all measurements', count: 1 },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredCalcs = useMemo(() => {
    let list = CALCULATORS_LIST;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(c => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q));
    }
    if (selectedCategory) {
      list = list.filter(c => c.category === selectedCategory);
    }
    return list;
  }, [searchQuery, selectedCategory]);

  const handleSelectCalc = (id: string) => {
    const calc = CALCULATORS_LIST.find(c => c.id === id);
    if (calc) {
      const path = CATEGORY_PATH_MAP[calc.category];
      navigate(calc.category === 'bbs' ? '/bbs/footing' : `/${path}/${calc.slug || calc.id.replace(`${calc.category}-`, '')}`);
    }
  };

  const popularCalcs = CALCULATORS_LIST.filter(c => c.trending);
  const clearFilters = () => { setSearchQuery(''); setSelectedCategory(null); };

  return (
    <div className="max-w-5xl mx-auto space-y-12 lg:space-y-16">
      {/* Hero */}
      <section className="text-center pt-8 lg:pt-16 pb-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#2563EB]/10 dark:bg-[#2563EB]/15 border border-[#2563EB]/20 rounded-full text-[11px] font-semibold text-[#2563EB] mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          12+ Professional Engineering Calculators
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#0F172A] dark:text-white leading-[1.15] max-w-2xl mx-auto">
          What would you like to<br />
          <span className="bg-gradient-to-r from-[#2563EB] to-[#60A5FA] bg-clip-text text-transparent">calculate today?</span>
        </h1>
        <p className="mt-3 text-base text-[#64748B] dark:text-[#94A3B8] max-w-xl mx-auto">
          Professional-grade civil engineering calculations. Fast, accurate, and beautifully simple.
        </p>

        {/* Search */}
        <div className="mt-8 max-w-2xl mx-auto">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#2563EB] to-[#60A5FA] rounded-2xl opacity-15 group-hover:opacity-25 blur transition-opacity" />
            <div className="relative flex items-center bg-white dark:bg-[#0D1527] border border-[#E2E8F0] dark:border-[#1E293B] rounded-2xl shadow-sm group-hover:shadow-md transition-all">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8]" />
              <input
                type="text"
                placeholder="Search calculators — e.g., beam, column, footing, steel..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none pl-12 pr-4 py-4 text-base outline-none text-[#0F172A] dark:text-[#F1F5F9] placeholder:text-[#94A3B8]"
                autoComplete="off"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="mr-2 p-1.5 hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B] rounded-lg text-[#94A3B8] cursor-pointer">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              )}
            </div>
          </div>

          {/* Search results dropdown */}
          {searchQuery && filteredCalcs.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="mt-2 bg-white dark:bg-[#0D1527] border border-[#E2E8F0] dark:border-[#1E293B] rounded-2xl shadow-xl max-h-72 overflow-y-auto text-left">
              {filteredCalcs.map(calc => (
                <button key={calc.id} onClick={() => handleSelectCalc(calc.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#F8FAFC] dark:hover:bg-[#1E293B] transition-colors border-b border-[#E2E8F0] dark:border-[#1E293B] last:border-0 cursor-pointer text-left">
                  <div className="p-2 rounded-xl bg-[#2563EB]/10 text-[#2563EB]">
                    <Calculator className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9]">{calc.name}</div>
                    <div className="text-[10px] text-[#64748B] truncate">{calc.description}</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#CBD5E1] shrink-0" />
                </button>
              ))}
            </motion.div>
          )}
        </div>

        {/* Trust badges */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-[11px] text-[#64748B] dark:text-[#94A3B8]">
          <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-[#22C55E]" /> Project-checkable methods</span>
          <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-[#22C55E]" /> 12+ Calculators</span>
          <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-[#22C55E]" /> 100% Free</span>
          <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-[#22C55E]" /> PDF / Excel Export</span>
        </div>
      </section>

      {/* Popular Calculators */}
      {!searchQuery && !selectedCategory && (
        <section className="animate-fade-in-up">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-[#2563EB]" />
            <h2 className="text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9]">Popular Calculators</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {popularCalcs.map((calc, idx) => (
              <motion.button key={calc.id}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}
                onClick={() => handleSelectCalc(calc.id)}
                className="bg-white dark:bg-[#0D1527] border border-[#E2E8F0] dark:border-[#1E293B] rounded-2xl p-5 text-left hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group">
                <div className="p-3 rounded-xl bg-[#2563EB]/10 text-[#2563EB] inline-flex mb-3">
                  <Calculator className="w-5 h-5" />
                </div>
                <div className="text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9] leading-tight group-hover:text-[#2563EB] transition-colors">{calc.name}</div>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-[10px] px-2 py-0.5 bg-[#F1F5F9] dark:bg-[#1E293B] rounded-md font-semibold text-[#64748B] uppercase">
                    {calc.category === 'bbs' ? 'Steel' : calc.category}
                  </span>
                  <Clock className="w-3 h-3 text-[#94A3B8]" />
                  <span className="text-[10px] text-[#94A3B8]">2 min</span>
                </div>
              </motion.button>
            ))}
          </div>
        </section>
      )}

      {/* Categories */}
      {!searchQuery && !selectedCategory && (
        <section className="animate-fade-in-up-d1">
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-4 h-4 text-[#2563EB]" />
            <h2 className="text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9]">Browse by Category</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map((cat, idx) => (
              <motion.button key={cat.id}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                onClick={() => { setSelectedCategory(cat.id); setSearchQuery(''); }}
                className="bg-white dark:bg-[#0D1527] border border-[#E2E8F0] dark:border-[#1E293B] rounded-2xl p-5 text-left hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group">
                <div className="p-3 rounded-xl mb-3 inline-flex" style={{ background: `${cat.color}15` }}>
                  <cat.icon className="w-5 h-5" style={{ color: cat.color }} />
                </div>
                <div className="text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9] leading-tight">{cat.label}</div>
                <div className="text-[10px] text-[#94A3B8] mt-1 line-clamp-2">{cat.desc}</div>
                <div className="text-[10px] text-[#2563EB] font-semibold mt-1.5">{cat.count} calculators →</div>
              </motion.button>
            ))}
          </div>
        </section>
      )}

      {/* Calculator grid (when searching or in a category) */}
      {(searchQuery || selectedCategory) && (
        <section className="animate-fade-in-up">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9]">
              {selectedCategory
                ? categories.find(c => c.id === selectedCategory)?.label || 'Calculators'
                : `Results for "${searchQuery}"`}
            </h2>
            <div className="flex items-center gap-2">
              {selectedCategory && (
                <button onClick={clearFilters}
                  className="text-[10px] font-semibold text-[#2563EB] hover:text-[#1D4ED8] transition-colors cursor-pointer">
                  Show all
                </button>
              )}
              <span className="text-[10px] text-[#94A3B8] bg-[#F1F5F9] dark:bg-[#1E293B] px-2 py-0.5 rounded-lg font-semibold">{filteredCalcs.length}</span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredCalcs.map((calc, idx) => (
              <motion.button key={calc.id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}
                onClick={() => handleSelectCalc(calc.id)}
                className="bg-white dark:bg-[#0D1527] border border-[#E2E8F0] dark:border-[#1E293B] rounded-2xl p-4 text-left hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-[#2563EB]/10 text-[#2563EB] shrink-0">
                    <Calculator className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9] group-hover:text-[#2563EB] transition-colors">{calc.name}</div>
                    <div className="text-[10px] text-[#64748B] dark:text-[#94A3B8] mt-0.5 line-clamp-2">{calc.description}</div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[8px] px-1.5 py-0.5 bg-[#F1F5F9] dark:bg-[#1E293B] rounded-md font-semibold text-[#64748B] uppercase">
                        {calc.category === 'bbs' ? 'Steel' : calc.category}
                      </span>
                      {calc.trending && <span className="text-[8px] text-[#F59E0B] font-semibold flex items-center gap-0.5"><TrendingUp className="w-2.5 h-2.5" /> Popular</span>}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#CBD5E1] group-hover:text-[#2563EB] group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                </div>
              </motion.button>
            ))}
          </div>
          {filteredCalcs.length === 0 && (
            <div className="text-center py-12">
              <Search className="w-8 h-8 text-[#CBD5E1] mx-auto mb-2" />
              <p className="text-sm text-[#64748B]">No calculators found</p>
              <button onClick={clearFilters} className="mt-2 text-xs font-semibold text-[#2563EB] hover:underline cursor-pointer">Clear filters</button>
            </div>
          )}
        </section>
      )}

      {/* Why CivilMath */}
      {!searchQuery && !selectedCategory && (
        <section className="animate-fade-in-up-d3">
          <h2 className="text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9] mb-4">Why CivilMath?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { icon: CheckCircle, title: 'Transparent Methods', desc: 'Review inputs, formulas and assumptions before relying on a calculation.' },
              { icon: Download, title: 'Export Anywhere', desc: 'PDF reports, Excel sheets, or share results instantly with your team.' },
              { icon: HardHat, title: 'Built for the Field', desc: 'Designed for engineers, contractors, supervisors, and students.' },
              { icon: Sparkles, title: 'Beginner-Friendly', desc: 'Guided step-by-step workflow with plain-English explanations.' },
            ].map((item, idx) => (
              <div key={idx} className="bg-white dark:bg-[#0D1527] border border-[#E2E8F0] dark:border-[#1E293B] rounded-2xl p-5 hover:shadow-md transition-shadow">
                <div className="p-2 rounded-xl bg-[#2563EB]/10 text-[#2563EB] inline-flex mb-3">
                  <item.icon className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-[#0F172A] dark:text-[#F1F5F9] mb-1">{item.title}</h3>
                <p className="text-[10px] text-[#64748B] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-[#E2E8F0] dark:border-[#1E293B] pt-8 pb-6 text-center space-y-3">
        <div className="flex flex-wrap items-center justify-center gap-6 text-[11px] text-[#64748B] dark:text-[#94A3B8]">
          <Link to="/about" className="hover:text-[#2563EB] transition-colors font-semibold no-underline">About</Link>
          <Link to="/articles" className="hover:text-[#2563EB] transition-colors font-semibold no-underline">Articles</Link>
          <Link to="/calculators" className="hover:text-[#2563EB] transition-colors font-semibold no-underline">Calculators</Link>
          <Link to="/contact" className="hover:text-[#2563EB] transition-colors font-semibold no-underline">Contact Us</Link>
          <Link to="/privacy" className="hover:text-[#2563EB] transition-colors font-semibold no-underline">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-[#2563EB] transition-colors font-semibold no-underline">Terms & Conditions</Link>
          <Link to="/disclaimer" className="hover:text-[#2563EB] transition-colors font-semibold no-underline">Disclaimer</Link>
          <Link to="/cookie-policy" className="hover:text-[#2563EB] transition-colors font-semibold no-underline">Cookie Policy</Link>
        </div>
        <p className="text-[10px] text-[#94A3B8]">© 2026 CivilMath. Educational civil calculation labs.</p>
      </footer>
    </div>
  );
}
