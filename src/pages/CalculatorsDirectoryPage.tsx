import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Search, Calculator, Sparkles, Layers, Grid, GitCommit,
  Compass, RefreshCw, Activity, Clipboard, Weight,
  ChevronRight, ArrowRight, CheckCircle2, Shield
} from 'lucide-react';
import { SEO, SITE_URL, DEFAULT_IMAGE } from '../utils/seo';
import { CALCULATORS_LIST } from '../data/calculatorsData';
import { useApp } from '../context/AppContext';

interface CalculatorDirectoryItem {
  id: string;
  name: string;
  category: string;
  categoryLabel: string;
  path: string;
  description: string;
  code: string;
  featured?: boolean;
  trending?: boolean;
  icon: typeof Layers;
}

const ALL_DIRECTORY_CALCULATORS: CalculatorDirectoryItem[] = [
  // Concrete & Mix
  {
    id: 'concrete-volume',
    name: 'Concrete Volume & Mix Ratio Calculator',
    category: 'concrete',
    categoryLabel: 'Concrete & Mixes',
    path: '/concrete/volume',
    description: 'Calculate volume, mix ratio proportions (M5 to M25 & custom ratios), cement bags, sand, aggregate, and water weights with customizable shrinkage & waste.',
    code: 'ACI 318 / IS 456',
    featured: true,
    trending: true,
    icon: Layers,
  },
  {
    id: 'concrete-rebar',
    name: 'Reinforcing Rebar Quantity Calculator',
    category: 'concrete',
    categoryLabel: 'Concrete & Mixes',
    path: '/concrete/rebar',
    description: 'Calculate rebar segments, lap splices, steel weight, and spacing configurations.',
    code: 'BS 4449 / ACI 318',
    featured: true,
    trending: true,
    icon: Grid,
  },
  {
    id: 'concrete-brick',
    name: 'Brickwork & Mortar Estimator',
    category: 'concrete',
    categoryLabel: 'Masonry & Finishing',
    path: '/concrete/brick',
    description: 'Estimate required bricks, wet/dry mortar volume, cement bags, and sand requirements.',
    code: 'BS 5628 / IS 2212',
    featured: true,
    trending: true,
    icon: Layers,
  },

  // Structural
  {
    id: 'structural-beam',
    name: 'Beam Analysis (Shear & Moment)',
    category: 'structural',
    categoryLabel: 'Structural Engineering',
    path: '/structural/beam',
    description: 'Compute shear force, bending moments, elastic deflection, and ACI serviceability limits.',
    code: 'ACI 318 / AISC 360',
    featured: true,
    trending: true,
    icon: GitCommit,
  },
  {
    id: 'structural-column',
    name: 'Short Column Capacity Design',
    category: 'structural',
    categoryLabel: 'Structural Engineering',
    path: '/structural/column',
    description: 'Calculate nominal axial load capacity (Pn) and factored capacity (φPn) for tied columns.',
    code: 'ACI 318-19',
    featured: true,
    icon: Grid,
  },
  {
    id: 'structural-slab',
    name: 'Slab Deflection & Thickness',
    category: 'structural',
    categoryLabel: 'Structural Engineering',
    path: '/structural/slab',
    description: 'Determine minimum slab thickness and check immediate & long-term deflection thresholds.',
    code: 'ACI 318 Table 8.3',
    icon: Layers,
  },
  {
    id: 'structural-steel-weight',
    name: 'Structural Steel Section Weight',
    category: 'structural',
    categoryLabel: 'Structural Engineering',
    path: '/structural/steel-weight',
    description: 'Compute unit weight and total tonnage for standard beams, channels, angles, and hollow sections.',
    code: 'AISC / ASTM A6',
    trending: true,
    icon: Weight,
  },

  // Bar Bending Schedules (BBS)
  {
    id: 'bbs-footing',
    name: 'Isolated Pad Footing BBS',
    category: 'bbs',
    categoryLabel: 'Reinforcement & BBS',
    path: '/bbs/footing',
    description: 'Rebar cutting schedule for isolated footings with bend deduction and total tonnage.',
    code: 'BS 8666 / IS 2502',
    featured: true,
    trending: true,
    icon: Clipboard,
  },
  {
    id: 'bbs-beam',
    name: 'Continuous Beam BBS',
    category: 'bbs',
    categoryLabel: 'Reinforcement & BBS',
    path: '/bbs/beam',
    description: 'Top bars, bottom bars, and shear stirrups rebar schedule with 90° and 135° bend deductions.',
    code: 'BS 8666 / ACI 315',
    featured: true,
    trending: true,
    icon: Clipboard,
  },
  {
    id: 'bbs-column',
    name: 'RC Column & Ties BBS',
    category: 'bbs',
    categoryLabel: 'Reinforcement & BBS',
    path: '/bbs/column',
    description: 'Vertical main rebar and lateral tie reinforcement cutting schedule with lap splices.',
    code: 'BS 8666 / ACI 315',
    featured: true,
    icon: Clipboard,
  },
  {
    id: 'bbs-slab',
    name: 'Two-Way Slab Mesh BBS',
    category: 'bbs',
    categoryLabel: 'Reinforcement & BBS',
    path: '/bbs/slab',
    description: 'Bottom mesh, top crack control bars, chair supports, and total rebar weight for slabs.',
    code: 'BS 8666 / IS 2502',
    icon: Clipboard,
  },
  {
    id: 'bbs-staircase',
    name: 'Dog-Legged Staircase BBS',
    category: 'bbs',
    categoryLabel: 'Reinforcement & BBS',
    path: '/bbs/staircase',
    description: 'Flight waist slab, riser-tread rebar detailing, landing reinforcements and lap lengths.',
    code: 'BS 8666 / SP 34',
    icon: Clipboard,
  },
  {
    id: 'bbs-retaining-wall',
    name: 'Cantilever Retaining Wall BBS',
    category: 'bbs',
    categoryLabel: 'Reinforcement & BBS',
    path: '/bbs/retaining-wall',
    description: 'Stem vertical rebar, horizontal distribution rebar, and base heel/toe reinforcement schedules.',
    code: 'BS 8666',
    icon: Clipboard,
  },

  // Geotechnical
  {
    id: 'geotech-bearing',
    name: 'Soil Bearing Capacity Calculator',
    category: 'geotech',
    categoryLabel: 'Geotechnical Engineering',
    path: '/geotechnical/bearing-capacity',
    description: 'Evaluate ultimate and allowable bearing capacity using Terzaghi and Meyerhof methods.',
    code: 'Terzaghi / Meyerhof',
    featured: true,
    icon: Activity,
  },
  {
    id: 'geotech-retaining',
    name: 'Retaining Wall Lateral Earth Pressure',
    category: 'geotech',
    categoryLabel: 'Geotechnical Engineering',
    path: '/geotechnical/retaining-wall',
    description: 'Compute active and passive earth pressures using Rankine and Coulomb soil mechanics.',
    code: 'Rankine / Coulomb',
    icon: Activity,
  },

  // Surveying
  {
    id: 'survey-hi',
    name: 'Height of Instrument (HI) Leveling',
    category: 'survey',
    categoryLabel: 'Surveying & Leveling',
    path: '/surveying/hi',
    description: 'Solve differential leveling runs, benchmark reduced levels, back sights, and fore sights.',
    code: 'Differential Leveling',
    featured: true,
    trending: true,
    icon: Compass,
  },
  {
    id: 'survey-traverse',
    name: 'Coordinate Traverse Adjustment',
    category: 'survey',
    categoryLabel: 'Surveying & Leveling',
    path: '/surveying/traverse',
    description: 'Balance closed and link traverse surveys using Bowditch (compass) rule adjustments.',
    code: 'Bowditch Rule',
    icon: Compass,
  },

  // Utilities & Construction
  {
    id: 'utility-converter',
    name: 'Civil Engineering Unit Converter',
    category: 'utility',
    categoryLabel: 'Utilities & Math',
    path: '/utilities/unit-converter',
    description: 'Instant conversion between metric (SI) and imperial units for length, area, volume, and stress.',
    code: 'ISO 80000 / ASTM',
    featured: true,
    trending: true,
    icon: RefreshCw,
  },
];

const CATEGORIES = [
  { id: 'all', label: 'All Tools' },
  { id: 'concrete', label: 'Concrete & Mixes' },
  { id: 'structural', label: 'Structural' },
  { id: 'bbs', label: 'Reinforcement (BBS)' },
  { id: 'survey', label: 'Surveying' },
  { id: 'geotech', label: 'Geotechnical' },
  { id: 'utility', label: 'Converters & Math' },
];

export default function CalculatorsDirectoryPage() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const navigate = useNavigate();
  const { setActiveCalcId } = useApp();

  const filteredCalculators = useMemo(() => {
    return ALL_DIRECTORY_CALCULATORS.filter((calc) => {
      const matchesCat = selectedCategory === 'all' || calc.category === selectedCategory;
      const matchesSearch =
        !search.trim() ||
        calc.name.toLowerCase().includes(search.toLowerCase()) ||
        calc.description.toLowerCase().includes(search.toLowerCase()) ||
        calc.code.toLowerCase().includes(search.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [search, selectedCategory]);

  const trendingCalculators = useMemo(() => {
    return ALL_DIRECTORY_CALCULATORS.filter((c) => c.trending).slice(0, 4);
  }, []);

  return (
    <div className="min-h-screen pb-16">
      <SEO
        title="Civil Engineering Calculators Directory | Free Online Tools | CivilMath"
        description="Comprehensive directory of professional civil engineering calculators: concrete volume, beam analysis, rebar BBS schedules, soil bearing capacity, and surveying tools."
        canonicalUrl={`${SITE_URL}/calculators`}
        keywords={[
          'civil engineering calculators',
          'concrete calculator directory',
          'structural beam calculator',
          'rebar bbs schedule',
          'surveying calculators',
          'civilmath tools',
        ]}
        ogImage={DEFAULT_IMAGE}
        type="website"
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Calculators', url: '/calculators' },
        ]}
      />

      <div className="max-w-6xl mx-auto px-4">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs font-medium text-[#7C88B8] pt-6 pb-4 border-b border-[#DCE3F5]/50 dark:border-[#2A3350]/50">
          <Link to="/" className="hover:text-[#161A2C] dark:hover:text-white transition-colors no-underline">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 text-[#DCE3F5]" />
          <span className="text-[#4C5FE0] font-bold">Calculators Directory</span>
        </nav>

        {/* Hero Banner */}
        <div className="pt-8 pb-8 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E7EAF7] dark:bg-[#1D2438] border border-[#DCE3F5] dark:border-[#2A3350] text-[#4C5FE0] text-[10px] font-mono font-bold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            ENGINEERING WORKSPACE · 50+ TOOLS
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#161A2C] dark:text-[#E7EAF7] tracking-tight leading-tight">
            Civil Engineering Calculator Directory
          </h1>
          <p className="mt-3 text-sm sm:text-base text-[#7C88B8] dark:text-[#8894BE] leading-relaxed">
            Fast, code-aligned calculations for concrete volume, structural analysis, reinforcement schedules, surveying, and site management.
          </p>

          {/* Instant Search Bar */}
          <div className="mt-6 relative max-w-xl mx-auto">
            <Search className="w-4 h-4 text-[#7C88B8] absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by tool name, standard (e.g. ACI 318), or keyword..."
              className="w-full backdrop-blur-xl backdrop-saturate-150 bg-[#F7F9FF]/70 dark:bg-[#141826]/70 border border-[#DCE3F5] dark:border-[#2A3350] rounded-2xl pl-11 pr-4 py-3.5 text-sm outline-none focus:border-[#4C5FE0] focus:ring-1 focus:ring-[#4C5FE0] shadow-2xs transition-all placeholder:text-[#7C88B8]"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-[#7C88B8] hover:text-[#161A2C] font-semibold px-2 py-1 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
          {CATEGORIES.map((cat) => {
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  active
                    ? 'bg-[#4C5FE0] text-white shadow-xs'
                    : 'backdrop-blur-xl backdrop-saturate-150 bg-[#F7F9FF]/70 dark:bg-[#141826]/70 border border-[#DCE3F5] dark:border-[#2A3350] text-[#7C88B8] hover:text-[#161A2C] dark:hover:text-white hover:border-[#4C5FE0]'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Trending Strip (when no search active) */}
        {!search && selectedCategory === 'all' && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-[#161A2C] dark:text-[#E7EAF7] uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <span className="w-2 h-2 rounded-full bg-[#4C5FE0]" />
                Most Popular Calculators
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {trendingCalculators.map((calc) => (
                <div
                  key={calc.id}
                  onClick={() => {
                    setActiveCalcId(calc.id);
                    navigate(calc.path);
                  }}
                  className="backdrop-blur-xl backdrop-saturate-150 bg-[#F7F9FF]/70 dark:bg-[#141826]/70 border border-[#DCE3F5] dark:border-[#2A3350] rounded-2xl p-4 hover:border-[#4C5FE0] dark:hover:border-[#7C88B8] hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-8 h-8 rounded-lg bg-[#4C5FE0]/10 text-[#4C5FE0] flex items-center justify-center">
                        <calc.icon className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-mono font-bold text-[#7C88B8] bg-[#E7EAF7] dark:bg-[#1D2438] px-2 py-0.5 rounded-md border border-[#DCE3F5] dark:border-[#2A3350]">
                        {calc.code}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-[#161A2C] dark:text-[#E7EAF7] group-hover:text-[#4C5FE0] transition-colors leading-snug">
                      {calc.name}
                    </h3>
                    <p className="mt-1.5 text-xs text-[#7C88B8] dark:text-[#8894BE] line-clamp-2 leading-relaxed">
                      {calc.description}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#DCE3F5]/50 dark:border-[#2A3350]/50 flex items-center justify-between text-xs font-semibold text-[#4C5FE0]">
                    <span>Calculate Now</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Full Calculator Grid */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-[#161A2C] dark:text-[#E7EAF7]">
              {selectedCategory === 'all' ? 'All Calculators' : CATEGORIES.find((c) => c.id === selectedCategory)?.label}
              <span className="ml-2 text-xs font-normal text-[#7C88B8] font-mono">
                ({filteredCalculators.length} {filteredCalculators.length === 1 ? 'tool' : 'tools'})
              </span>
            </h2>
          </div>

          {filteredCalculators.length === 0 ? (
            <div className="text-center py-16 backdrop-blur-xl backdrop-saturate-150 bg-[#F7F9FF]/70 dark:bg-[#141826]/70 border border-[#DCE3F5] dark:border-[#2A3350] rounded-2xl">
              <Search className="w-8 h-8 text-[#7C88B8] mx-auto mb-2" />
              <p className="text-sm font-semibold text-[#161A2C] dark:text-[#E7EAF7]">No calculators found</p>
              <p className="text-xs text-[#7C88B8] mt-1">Try another search term or select a different category above.</p>
              <button
                onClick={() => {
                  setSearch('');
                  setSelectedCategory('all');
                }}
                className="mt-4 px-4 py-2 rounded-xl bg-[#4C5FE0] text-white text-xs font-semibold cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCalculators.map((calc, idx) => (
                <motion.div
                  key={calc.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(0.12, idx * 0.02) }}
                  onClick={() => {
                    setActiveCalcId(calc.id);
                    navigate(calc.path);
                  }}
                  className="backdrop-blur-xl backdrop-saturate-150 bg-[#F7F9FF]/70 dark:bg-[#141826]/70 border border-[#DCE3F5] dark:border-[#2A3350] rounded-2xl p-5 hover:border-[#4C5FE0] dark:hover:border-[#7C88B8] hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2.5 rounded-xl bg-[#4C5FE0]/10 text-[#4C5FE0]">
                        <calc.icon className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-mono font-bold text-[#7C88B8] bg-[#E7EAF7] dark:bg-[#1D2438] px-2 py-0.5 rounded-md border border-[#DCE3F5] dark:border-[#2A3350]">
                        {calc.code}
                      </span>
                    </div>
                    <div className="text-[10px] font-mono font-bold text-[#4C5FE0] uppercase tracking-wider mb-1">
                      {calc.categoryLabel}
                    </div>
                    <h3 className="text-sm font-bold text-[#161A2C] dark:text-[#E7EAF7] group-hover:text-[#4C5FE0] transition-colors leading-snug">
                      {calc.name}
                    </h3>
                    <p className="mt-1.5 text-xs text-[#7C88B8] dark:text-[#8894BE] line-clamp-2 leading-relaxed">
                      {calc.description}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#DCE3F5]/50 dark:border-[#2A3350]/50 flex items-center justify-between text-xs font-semibold text-[#4C5FE0]">
                    <span>Open Calculator</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Technical Trust & Compliance Box */}
        <div className="backdrop-blur-xl backdrop-saturate-150 bg-[#F7F9FF]/70 dark:bg-[#141826]/70 border border-[#DCE3F5] dark:border-[#2A3350] rounded-2xl p-6 shadow-2xs text-[#7C88B8]">
          <div className="flex items-center gap-2.5 mb-2">
            <Shield className="w-4 h-4 text-[#4C5FE0]" />
            <h3 className="text-sm font-bold text-[#161A2C] dark:text-[#E7EAF7]">Engineering Quality & Disclaimer</h3>
          </div>
          <p className="text-xs leading-relaxed">
            All formulas and calculations follow international design codes including ACI 318, Eurocode 2, BS 8110, BS 8666, and IS 456. Calculations are provided for planning, preliminary estimation, and educational verification. Final structural and construction designs must always be verified by a licensed professional engineer against project-specific drawings.
          </p>
        </div>
      </div>
    </div>
  );
}
