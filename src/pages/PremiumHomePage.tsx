import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Layers, Grid, GitCommit, Compass, RefreshCw,
  HardHat, BookOpen, Calculator, ArrowRight, ShieldCheck,
  CheckCircle2, Box, Sparkles, Scale, ExternalLink, FileSpreadsheet, FileText,
  Search, Star, Clock, ChevronRight, Lightbulb
} from 'lucide-react';
import { CALCULATORS_LIST } from '../data/calculatorsData';
import { CATEGORY_PATH_MAP, getCalculatorSlug } from '../utils/seo';
import {
  SEO,
  generateOrganizationSchema,
  generateWebsiteSchema,
} from '../utils/seo';
import { useApp } from '../context/AppContext';
import { PopularCalculatorsGrid, ProgressDonut, QuickStatsBar, CalendarWidget, LatestArticlesWidget, RecentCalculationsWidget } from '../components/DashboardWidgets';

// ─── Design tokens (from UIUX skill: Minimalism + Swiss Modernism 2.0 for Construction/Architecture)
// Primary: Sage green #657565 (brand), Blueprint blue #334155, Warm neutral #F3F1EC
// Typography: Inter (sans) + JetBrains Mono (mono) — already in index.css
// Pattern: Feature-Rich Showcase + Hero-Centric

const ENGINEERING_DISCIPLINES = [
  {
    id: 'concrete',
    title: 'Concrete & Materials',
    count: 6,
    path: '/concrete',
    desc: 'Volume, cement bags, sand/gravel ratios, brickwork and mortar batching.',
    icon: Layers,
    color: '#4C5FE0',
    tag: 'ACI 318 / IS 456',
    popularCalc: { name: 'Concrete Volume', path: '/concrete/volume' },
  },
  {
    id: 'structural',
    title: 'Structural Engineering',
    count: 5,
    path: '/structural',
    desc: 'Shear force, BMD, short column capacity and deflection checks.',
    icon: GitCommit,
    accentHex: '#B56F50',
    tag: 'AISC 360 / EC2',
    popularCalc: { name: 'Beam Analysis', path: '/structural/beam' },
  },
  {
    id: 'bbs',
    title: 'Reinforcement (BBS)',
    count: 12,
    path: '/bbs',
    desc: 'Bar bending schedules, cutting lengths, weight takeoffs, shape codes.',
    icon: Grid,
    color: '#7C88B8',
    tag: 'BS 8666 / IS 2502',
    popularCalc: { name: 'Footing BBS', path: '/bbs/footing' },
  },
  {
    id: 'geotech',
    title: 'Geotechnical & Soils',
    count: 4,
    path: '/geotechnical',
    desc: 'Terzaghi bearing capacity, Rankine earth pressure, slope checks.',
    icon: ShieldCheck,
    accentHex: '#9A8062',
    tag: 'Terzaghi / Meyerhof',
    popularCalc: { name: 'Bearing Capacity', path: '/geotechnical/bearing-capacity' },
  },
  {
    id: 'survey',
    title: 'Surveying & Leveling',
    count: 4,
    path: '/surveying',
    desc: 'Height of instrument, Bowditch traverse balancing, elevations.',
    icon: Compass,
    accentHex: '#9CB5C4',
    tag: 'Bowditch Rule',
    popularCalc: { name: 'HI Leveling', path: '/surveying/hi' },
  },
  {
    id: 'utility',
    title: 'Engineering Converters',
    count: 8,
    path: '/utilities/unit-converter',
    desc: 'SI Metric and US Customary conversions: stress, force, density, volume.',
    icon: RefreshCw,
    color: '#7C88B8',
    tag: 'ISO 80000',
    popularCalc: { name: 'Unit Converter', path: '/utilities/unit-converter' },
  },
];

const SHOWCASE_CALCS = [
  {
    id: 'concrete-volume',
    name: 'Concrete Volume & Materials',
    category: 'Concrete',
    path: '/concrete/volume',
    metric: '3.00 m³',
    submetric: '5.00 × 4.00 × 0.15 m',
    standard: 'ACI 318-19',
    details: 'Calculates concrete volume, cement bags, fine sand, coarse aggregate and water requirements with 5% waste tolerance.',
    icon: Box,
    accentHex: '#657565',
  },
  {
    id: 'structural-beam',
    name: 'Simply Supported Beam Analysis',
    category: 'Structural',
    path: '/structural/beam',
    metric: '42.5 kNm',
    submetric: 'Mmax = qL² / 8',
    standard: 'AISC 360-16',
    details: 'Live SFD, BMD and elastic deflection profiles with serviceability limit checks.',
    icon: GitCommit,
    accentHex: '#B56F50',
  },
  {
    id: 'bbs-footing',
    name: 'Isolated Footing BBS',
    category: 'Reinforcement',
    path: '/bbs/footing',
    metric: '184.2 kg',
    submetric: 'Shape Code 21 & 00',
    standard: 'BS 8666:2020',
    details: 'Cutting length schedules, hook deductions, rebar weights and export to PDF & Excel.',
    icon: Grid,
    accentHex: '#7B8978',
  },
];

const DESIGN_CODES = [
  { code: 'ACI 318-19', org: 'American Concrete Institute', topic: 'Reinforced concrete design, slab thickness & rebar development' },
  { code: 'Eurocode 2 / EN 1992', org: 'European Standards Committee', topic: 'Design of concrete structures & limit state safety factors' },
  { code: 'IS 456:2000', org: 'Bureau of Indian Standards', topic: 'Plain and reinforced concrete code of practice' },
  { code: 'BS 8110 / BS 8666', org: 'British Standards Institution', topic: 'Structural use of concrete, scheduling, bending & cutting lengths' },
  { code: 'AISC 360-16', org: 'American Institute of Steel', topic: 'Specification for structural steel buildings & section analysis' },
  { code: 'Bowditch Compass Rule', org: 'Geodetic Surveying Standard', topic: 'Angular error distribution for closed boundary traverses' },
];

const TRUST_STATS: Array<{ value: string; label: string; icon: React.ElementType }> = [
  { value: '50+', label: 'Calculators', icon: Calculator },
  { value: '7', label: 'Disciplines', icon: FlaskConical },
  { value: '6', label: 'Design Codes', icon: Award },
  { value: '100%', label: 'Free', icon: Zap },
];


// ─── Scroll reveal hook
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.12 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

// ─── Subcomponents
function RevealSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity 0.55s ease ${delay}ms, transform 0.55s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}


// ─── Main Page
export default function PremiumHomePage() {
  const navigate = useNavigate();
  const { setActiveCalcId, favoriteCalculatorIds, recentCalculatorIds, savedCalculations } = useApp();
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'structural' | 'concrete' | 'bbs' | 'site'>('all');
  const [now, setNow] = useState(new Date());

  React.useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  const favorites = favoriteCalculatorIds.map(id => CALCULATORS_LIST.find(c => c.id === id)).filter(Boolean).slice(0, 4);
  const recents = recentCalculatorIds.map(id => CALCULATORS_LIST.find(c => c.id === id)).filter(Boolean).slice(0, 4);
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });

  const openCalculator = (id: string) => {
    const def = CALCULATORS_LIST.find(c => c.id === id);
    if (!def) return;
    setActiveCalcId(id);
    const path = CATEGORY_PATH_MAP[def.category];
    navigate(def.category === 'bbs' ? '/bbs/footing' : `/${path}/${getCalculatorSlug(def)}`);
  };

  const openSearch = () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
  };

  // Category breakdown of saved calculations, for the "Your Progress" donut
  const CATEGORY_META: Record<string, { label: string; color: string }> = {
    concrete: { label: 'Concrete', color: '#4C5FE0' },
    structural: { label: 'Structural', color: '#00B894' },
    bbs: { label: 'Reinforcement', color: '#7C88B8' },
    geotech: { label: 'Geotechnical', color: '#E17055' },
    survey: { label: 'Surveying', color: '#0984E3' },
    utility: { label: 'Utilities', color: '#FDCB6E' },
  };
  const categoryCounts: Record<string, number> = {};
  savedCalculations.forEach((sc: any) => {
    const def = CALCULATORS_LIST.find((c) => c.id === sc.calculatorId);
    const key = def?.category || 'other';
    categoryCounts[key] = (categoryCounts[key] || 0) + 1;
  });
  const progressSlices = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([key, value]) => ({
      label: CATEGORY_META[key]?.label || key,
      value,
      color: CATEGORY_META[key]?.color || '#8891B0',
    }));
  const progressTotal = savedCalculations.length;

  // Saved calculations grouped by weekday, for "Quick Stats"
  const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const weekCounts = [0, 0, 0, 0, 0, 0, 0];
  savedCalculations.forEach((sc: any) => {
    const d = new Date(sc.timestamp);
    const idx = (d.getDay() + 6) % 7;
    weekCounts[idx] += 1;
  });
  const weekActivity = WEEKDAYS.map((label, i) => ({ label, value: weekCounts[i] }));
  const weeklyTotal = weekCounts.reduce((a, b) => a + b, 0);

  const recentItems = recentCalculatorIds.slice(0, 5).map((id) => {
    const def = CALCULATORS_LIST.find((c) => c.id === id);
    const meta = def ? CATEGORY_META[def.category] : undefined;
    return { id, name: def?.name || id, time: '', color: meta?.color || '#8891B0' };
  }).filter((it) => it.name);

  const LATEST_ARTICLES = [
    { title: 'Types of Foundations and Their Uses', date: 'Structural basics', color: '#4C5FE0' },
    { title: 'Concrete Mix Ratios Explained', date: 'Concrete & materials', color: '#E17055' },
    { title: 'Reading Structural Drawings for Beginners', date: 'Drafting & documentation', color: '#00B894' },
  ];

  return (
    <div className="space-y-14 pb-10">
      <SEO
        title="Civil Engineering Calculators & Design Tools | CivilMath"
        description="Free professional civil engineering calculators for concrete volume, beam analysis, rebar BBS, column design, bearing capacity and surveying. Fast, accurate, code-aligned."
        canonicalUrl="https://civilmath.com/"
        keywords={['civil engineering calculators', 'concrete calculator', 'beam analysis', 'bar bending schedule', 'civil math']}
        type="website"
        schema={[generateOrganizationSchema(), generateWebsiteSchema()]}
      />

      {/* 0. PURPLE DASHBOARD HERO + WIDGET GRID */}
      <section className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5">
        <div className="space-y-5 min-w-0">
          {/* Hero banner */}
          <div className="relative overflow-hidden rounded-3xl p-6 sm:p-10 shadow-sm bg-gradient-to-br from-[#E7ECFB] via-[#EEF1FB] to-white dark:from-[#1A2140] dark:via-[#10142A] dark:to-[#141826]">
            <div className="absolute inset-0 bg-[radial-gradient(#4C5FE0_1px,transparent_1px)] [background-size:22px_22px] opacity-[0.06] pointer-events-none" />
            <div className="relative max-w-xl">
              <span className="text-[11px] font-bold tracking-wider uppercase text-[#4C5FE0]">Civil Engineering Calculators</span>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-[#161A2C] dark:text-[#E7EAF7] mt-2 leading-tight">
                Smart Calculations for a <span className="text-[#4C5FE0]">Stronger Tomorrow</span>
              </h1>
              <p className="text-sm text-[#5C6B8A] dark:text-[#9AA3C4] mt-3 leading-relaxed">
                Everything you need for civil engineering calculations, design, and learning — all in one place.
              </p>
              <Link
                to="/calculators"
                className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-xl bg-[#161A2C] hover:bg-[#4C5FE0] text-white text-sm font-semibold transition-colors no-underline cursor-pointer"
              >
                Explore Calculators <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <PopularCalculatorsGrid />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <ProgressDonut
              total={progressTotal}
              centerLabel="Total Calculations"
              slices={progressSlices}
            />
            <QuickStatsBar
              headline={String(weeklyTotal)}
              sublabel="Calculations this week"
              data={weekActivity}
            />
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5 min-w-0">
          <CalendarWidget />
          <LatestArticlesWidget articles={LATEST_ARTICLES} />
          <RecentCalculationsWidget items={recentItems} onOpen={openCalculator} />
        </div>
      </section>


      {/* 1. ARCHITECTURAL STUDIO HERO */}
      <section className="relative overflow-hidden rounded-3xl backdrop-blur-xl backdrop-saturate-150 bg-[#F7F9FF]/70 dark:bg-[#141826]/70 border border-[#DCE3F5] dark:border-[#2A3350] p-6 sm:p-10 lg:p-12 shadow-xs">
        {/* Subtle architectural grid pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#DCE3F5_1px,transparent_1px)] dark:bg-[radial-gradient(#2A3350_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

        <div className="relative z-10 max-w-4xl space-y-6">
          {/* Studio status tag */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#E7EAF7] dark:bg-[#1D2438] border border-[#DCE3F5] dark:border-[#2A3350] text-[10px] font-mono font-bold tracking-widest uppercase text-[#4C5FE0]">
            <span className="w-2 h-2 rounded-full bg-[#4C5FE0] animate-pulse" />
            <span>PRECISION WORKSPACE · SCALE 1:100 · METRIC & IMPERIAL</span>
          </div>

          {/* Canonical H1 Page Title */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#161A2C] dark:text-[#E7EAF7] tracking-tight leading-[1.12]">
            Civil Engineering Calculators & Design Tools
          </h1>

          <p className="text-sm sm:text-base text-[#7C88B8] dark:text-[#8894BE] leading-relaxed max-w-2xl">
            Accurate, code-aligned engineering calculators and drafting workspaces for structural analysis, 
            concrete estimating, rebar bar bending schedules, and construction site quantities.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => navigate('/calculators')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#4C5FE0] hover:bg-[#3B47B8] text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Calculator className="w-4 h-4" />
              <span>Explore All 50+ Calculators</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>

            <button
              onClick={() => {
                setActiveCalcId('concrete-volume');
                navigate('/concrete/volume');
              }}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/80 dark:bg-[#141826]/80 hover:bg-[#EEF1FB] dark:hover:bg-[#232A3D] border border-[#DCE3F5] dark:border-[#2A3350] text-[#161A2C] dark:text-[#E7EAF7] text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
            >
              <Box className="w-4 h-4 text-[#4C5FE0]" />
              <span>Launch Concrete Volume 3D</span>
            </button>

            <button
              onClick={() => navigate('/guides')}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-transparent hover:bg-[#E7EAF7]/50 dark:hover:bg-[#1D2438]/50 text-[#7C88B8] hover:text-[#161A2C] dark:hover:text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              <span>Reference Guides</span>
            </button>
          </div>

          {/* Technical Spec Metrics Bar */}
          <div className="pt-4 border-t border-[#DCE3F5]/60 dark:border-[#2A3350]/60 flex flex-wrap items-center gap-6 sm:gap-10 text-xs font-mono text-[#7C88B8]">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#161A2C] dark:text-[#E7EAF7] text-base font-sans">50+</span>
              <span>Tools</span>
            </div>
            <div className="w-1 h-3 bg-[#DCE3F5] dark:bg-[#2A3350]" />
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#161A2C] dark:text-[#E7EAF7] text-base font-sans">8</span>
              <span>Disciplines</span>
            </div>
            <div className="w-1 h-3 bg-[#DCE3F5] dark:bg-[#2A3350]" />
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#161A2C] dark:text-[#E7EAF7] text-base font-sans">0.01</span>
              <span>Precision</span>
            </div>
            <div className="w-1 h-3 bg-[#DCE3F5] dark:bg-[#2A3350]" />
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#4C5FE0] text-base font-sans">Free</span>
              <span>Open Engineering</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. EIGHT PRIMARY ENGINEERING DISCIPLINES GRID */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#7C88B8]">DISCIPLINES</div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#161A2C] dark:text-[#E7EAF7]">
              Engineering Calculation Categories
            </h2>
          </div>
          <Link
            to="/calculators"
            className="text-xs font-semibold text-[#4C5FE0] hover:underline inline-flex items-center gap-1 no-underline"
          >
            <span>View All Tools</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {ENGINEERING_DISCIPLINES.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                onClick={() => navigate(item.path)}
                className="group relative backdrop-blur-xl backdrop-saturate-150 bg-[#F7F9FF]/70 dark:bg-[#141826]/70 border border-[#DCE3F5] dark:border-[#2A3350] hover:border-[#4C5FE0] dark:hover:border-[#7C88B8] p-5 rounded-2xl transition-all cursor-pointer shadow-xs hover:shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
                      style={{ backgroundColor: `${item.color}15`, color: item.color }}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-[#E7EAF7] dark:bg-[#1D2438] text-[#7C88B8] border border-[#DCE3F5] dark:border-[#2A3350]">
                      {item.count}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-[#161A2C] dark:text-[#E7EAF7] group-hover:text-[#4C5FE0] transition-colors mb-1.5">
                    {item.title}
                  </h3>

                  <p className="text-xs text-[#7C88B8] dark:text-[#8894BE] leading-relaxed mb-4">
                    {item.desc}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#DCE3F5]/50 dark:border-[#2A3350]/50 flex items-center justify-between text-[10px] font-mono text-[#7C88B8]">
                  <span>{item.tag}</span>
                  <span className="text-[#4C5FE0] font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                    Open →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. SHOWCASE WORKSPACES WITH ARCHITECTURAL CAD PREVIEWS */}
      <section className="space-y-4">
        <div>
          <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#7C88B8]">FEATURED WORKSPACES</div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#161A2C] dark:text-[#E7EAF7]">
            Flagship Engineering Calculators
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {SHOWCASE_CALCS.map((tool) => (
            <div
              key={tool.id}
              onClick={() => {
                setActiveCalcId(tool.id);
                navigate(tool.path);
              }}
              className="backdrop-blur-xl backdrop-saturate-150 bg-[#F7F9FF]/70 dark:bg-[#141826]/70 border border-[#DCE3F5] dark:border-[#2A3350] hover:border-[#4C5FE0] dark:hover:border-[#7C88B8] rounded-2xl p-5 sm:p-6 transition-all cursor-pointer shadow-xs hover:shadow-md flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-md bg-[#4C5FE0]/10 text-[#4C5FE0] border border-[#4C5FE0]/20">
                    {tool.category}
                  </span>
                  <span className="text-[10px] font-mono text-[#7C88B8]">{tool.standard}</span>
                </div>

                <h3 className="text-base font-bold text-[#161A2C] dark:text-[#E7EAF7] group-hover:text-[#4C5FE0] transition-colors">
                  {tool.name}
                </h3>

                <p className="text-xs text-[#7C88B8] leading-relaxed">
                  {tool.details}
                </p>

                {/* Hero Output Metric Box */}
                <div className="p-3.5 rounded-xl bg-white/90 dark:bg-[#141826]/90 border border-[#DCE3F5] dark:border-[#2A3350] flex items-center justify-between">
                  <div>
                    <div className="text-[9px] font-mono text-[#7C88B8] uppercase">Sample Result</div>
                    <div className="text-xl font-bold text-[#161A2C] dark:text-[#E7EAF7]">{tool.metric}</div>
                  </div>
                  <div className="text-[10px] font-mono text-[#4C5FE0] bg-[#E7EAF7] dark:bg-[#1D2438] px-2 py-1 rounded-md border border-[#DCE3F5] dark:border-[#2A3350]">
                    {tool.submetric}
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-[#DCE3F5]/50 dark:border-[#2A3350]/50 flex items-center justify-between text-xs font-semibold text-[#4C5FE0]">
                <span>Launch Interactive Studio</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. DESIGN CODES & ENGINEERING STANDARDS REFERENCE */}
      <section className="backdrop-blur-xl backdrop-saturate-150 bg-[#F7F9FF]/70 dark:bg-[#141826]/70 border border-[#DCE3F5] dark:border-[#2A3350] rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#7C88B8]">METHODOLOGY</div>
            <h2 className="text-lg sm:text-xl font-bold text-[#161A2C] dark:text-[#E7EAF7]">
              Built on Recognized Engineering Standards
            </h2>
          </div>
          <Link
            to="/formulas"
            className="text-xs font-semibold text-[#4C5FE0] hover:underline inline-flex items-center gap-1 no-underline"
          >
            <span>Browse Formula Library</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
          {DESIGN_CODES.map((code) => (
            <div
              key={code.code}
              className="p-3.5 rounded-xl bg-white/80 dark:bg-[#141826]/80 border border-[#DCE3F5]/80 dark:border-[#2A3350]/80 space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#161A2C] dark:text-[#E7EAF7]">{code.code}</span>
                <span className="text-[9px] font-mono text-[#7C88B8]">{code.org}</span>
              </div>
              <p className="text-[11px] text-[#7C88B8] leading-tight">{code.topic}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. ENGINEERING DISCLAIMER & QUALITY PLEDGE */}
      <section className="p-5 rounded-2xl bg-[#E7EAF7]/60 dark:bg-[#141826]/60 border border-[#DCE3F5] dark:border-[#2A3350] flex flex-col sm:flex-row items-start gap-4 text-xs text-[#7C88B8]">
        <ShieldCheck className="w-6 h-6 text-[#4C5FE0] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="font-bold text-[#161A2C] dark:text-[#E7EAF7]">
            Engineering Disclaimer & Professional Verification
          </h4>
          <p className="leading-relaxed">
            All formulas and calculators on this platform are designed for professional estimation, educational review,
            and preliminary planning. Calculations must always be verified against project-specific contract documents,
            local building codes, geotechnical soil reports, and applicable safety factors by a licensed Professional Engineer (PE/CEng).
          </p>
        </div>
      </section>
    </div>
  );
}
