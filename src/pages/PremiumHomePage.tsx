import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Layers, Grid, GitCommit, Compass, RefreshCw,
  HardHat, BookOpen, Calculator, ArrowRight, ShieldCheck,
  CheckCircle2, Box, Sparkles, Scale, ExternalLink,
  ChevronRight, FlaskConical, Award, Zap, SlidersHorizontal
} from 'lucide-react';
import { CALCULATORS_LIST } from '../data/calculatorsData';
import { CATEGORY_PATH_MAP, getCalculatorSlug } from '../utils/seo';
import {
  SEO,
  generateOrganizationSchema,
  generateWebsiteSchema,
} from '../utils/seo';
import { useApp } from '../context/AppContext';
import { Button, Card, Badge, NumericDisplay } from '../components/ui';

// ─── Engineering Disciplines (8 Core Engineering Fields)
const ENGINEERING_DISCIPLINES = [
  {
    id: 'concrete',
    title: 'Concrete & Materials',
    count: 6,
    path: '/concrete',
    desc: 'Volume, cement bags, sand/gravel batching, brickwork and mortar ratios.',
    icon: Layers,
    tag: 'ACI 318 / IS 456',
  },
  {
    id: 'structural',
    title: 'Structural Engineering',
    count: 5,
    path: '/structural',
    desc: 'Shear force, BMD, column axial capacity and elastic deflection checks.',
    icon: GitCommit,
    tag: 'AISC 360 / EC2',
  },
  {
    id: 'bbs',
    title: 'Reinforcement (BBS)',
    count: 12,
    path: '/bbs',
    desc: 'Bar bending schedules, cutting lengths, weight takeoffs and standard shape codes.',
    icon: Grid,
    tag: 'BS 8666 / IS 2502',
  },
  {
    id: 'geotech',
    title: 'Geotechnical & Soils',
    count: 4,
    path: '/geotechnical',
    desc: 'Terzaghi ultimate bearing capacity, Rankine earth pressure, footing safety.',
    icon: ShieldCheck,
    tag: 'Terzaghi / Meyerhof',
  },
  {
    id: 'survey',
    title: 'Surveying & Leveling',
    count: 4,
    path: '/surveying',
    desc: 'Height of instrument, Bowditch traverse balancing, station coordinates.',
    icon: Compass,
    tag: 'Bowditch Rule',
  },
  {
    id: 'utility',
    title: 'Engineering Converters',
    count: 8,
    path: '/utilities/unit-converter',
    desc: 'SI Metric and US Customary units: stress, pressure, density, volume.',
    icon: RefreshCw,
    tag: 'ISO 80000',
  },
  {
    id: 'construction',
    title: 'Site Quantities & BOQ',
    count: 5,
    path: '/construction',
    desc: 'Earthwork excavation, backfill compaction, material takeoffs & bill of quantities.',
    icon: HardHat,
    tag: 'CESMM4 / POMI',
  },
  {
    id: 'masonry',
    title: 'Masonry & Plaster',
    count: 4,
    path: '/concrete/brick',
    desc: 'Modular brick counts, mortar volumes, joint allowances and wall surface areas.',
    icon: Box,
    tag: 'ASTM C270',
  },
];

const SHOWCASE_CALCS = [
  {
    id: 'concrete-volume',
    name: 'Concrete Volume & Mix Batching',
    category: 'Concrete',
    path: '/concrete/volume',
    metric: '3.00 m³',
    submetric: '5.00 × 4.00 × 0.15 m',
    standard: 'ACI 318-19',
    details: 'Calculates structural volume, cement bags, fine sand, coarse aggregate and water requirements with 5% waste tolerance.',
    icon: Box,
  },
  {
    id: 'structural-beam',
    name: 'Simply Supported Beam Analysis',
    category: 'Structural',
    path: '/structural/beam',
    metric: '42.5 kNm',
    submetric: 'Mmax = qL² / 8',
    standard: 'AISC 360-16',
    details: 'Live shear force (SFD), bending moment (BMD), and elastic deflection profiles with serviceability limit checks.',
    icon: GitCommit,
  },
  {
    id: 'bbs-footing',
    name: 'Isolated Footing BBS Schedule',
    category: 'Reinforcement',
    path: '/bbs/footing',
    metric: '184.2 kg',
    submetric: 'Shape Code 21 & 00',
    standard: 'BS 8666:2020',
    details: 'Cutting length schedules, hook deductions, rebar weight schedules and instant export to PDF & Excel.',
    icon: Grid,
  },
];

const DESIGN_CODES = [
  { code: 'ACI 318-19', org: 'American Concrete Institute', topic: 'Reinforced concrete design, slab thickness & rebar development' },
  { code: 'Eurocode 2 / EN 1992', org: 'European Standards Committee', topic: 'Design of concrete structures & limit state safety factors' },
  { code: 'IS 456:2000', org: 'Bureau of Indian Standards', topic: 'Plain and reinforced concrete code of practice' },
  { code: 'BS 8110 / BS 8666', org: 'British Standards Institution', topic: 'Structural concrete, scheduling, bending & cutting lengths' },
  { code: 'AISC 360-16', org: 'American Institute of Steel', topic: 'Specification for structural steel buildings & section analysis' },
  { code: 'Bowditch Compass Rule', org: 'Geodetic Surveying Standard', topic: 'Angular error distribution for closed boundary traverses' },
];

export default function PremiumHomePage() {
  const navigate = useNavigate();
  const { setActiveCalcId } = useApp();

  // ─── Interactive Hero Sandbox State (Concrete vs Beam)
  const [sandboxTab, setSandboxTab] = useState<'concrete' | 'beam'>('concrete');
  // Concrete parameters
  const [slabLength, setSlabLength] = useState<number>(5.0);
  const [slabWidth, setSlabWidth] = useState<number>(4.0);
  const [slabThickness, setSlabThickness] = useState<number>(0.15);
  // Beam parameters
  const [beamSpan, setBeamSpan] = useState<number>(6.0);
  const [beamLoad, setBeamLoad] = useState<number>(15.0);

  // Concrete calculation results
  const wetVol = slabLength * slabWidth * slabThickness;
  const dryVol = wetVol * 1.54;
  // M20 (1 : 1.5 : 3) sum = 5.5
  const cementBags = Math.ceil((dryVol * (1 / 5.5)) / 0.0347);
  const sandVol = (dryVol * (1.5 / 5.5)).toFixed(2);
  const aggVol = (dryVol * (3 / 5.5)).toFixed(2);

  // Beam calculation results
  const maxMoment = ((beamLoad * Math.pow(beamSpan, 2)) / 8).toFixed(1);
  const maxShear = ((beamLoad * beamSpan) / 2).toFixed(1);

  return (
    <div className="space-y-12 sm:space-y-16 pb-12">
      <SEO
        title="Civil Engineering Calculators & Design Tools | CivilMath"
        description="Free professional civil engineering calculators for concrete volume, beam analysis, rebar BBS, column design, bearing capacity and surveying. Fast, accurate, code-aligned."
        canonicalUrl="https://civilmath.com/"
        keywords={['civil engineering calculators', 'concrete calculator', 'beam analysis', 'bar bending schedule', 'civil math']}
        type="website"
        schema={[generateOrganizationSchema(), generateWebsiteSchema()]}
      />

      {/* ─── 1. HERO SECTION: LINEAR / RAYCAST GRADE ARCHITECTURAL WORKBENCH ─── */}
      <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-white dark:bg-[#111413] border border-[#E2E6E2] dark:border-white/8 p-6 sm:p-10 lg:p-12 shadow-2xs dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] corner-crosshair">
        {/* Subtle engineering grid watermark */}
        <div className="absolute inset-0 bg-[radial-gradient(#E2E6E2_1px,transparent_1px)] dark:bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

        <div className="relative z-10 max-w-4xl space-y-6">
          {/* Coordinate & Workspace Status Strip */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#F2F5F3] dark:bg-[#181E1A] border border-[#E2E6E2] dark:border-white/10 text-[10.5px] font-mono font-semibold tracking-wider text-[#2E6B56] dark:text-[#34D399]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2E6B56] dark:bg-[#34D399] animate-pulse" />
              <span>PRECISION CAD WORKSPACE · SCALE 1:100</span>
            </div>
            <span className="hidden sm:inline font-mono text-[10px] text-[#7A8981] dark:text-[#64736B]">
              LAT 40.7128° N · LON 74.0060° W · METRIC &amp; IMPERIAL
            </span>
          </div>

          {/* Canonical Single H1 Page Heading */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#141A16] dark:text-[#ECF2EE] tracking-tight leading-[1.12]">
            Civil Engineering Calculators &amp; Design Tools
          </h1>

          <p className="text-sm sm:text-base text-[#526058] dark:text-[#97A69E] leading-relaxed max-w-2xl font-normal">
            Accurate, code-aligned engineering workspaces for structural beam analysis, concrete mix estimating, 
            rebar bar bending schedules, and construction site quantities. Built for civil engineers and contractors.
          </p>

          {/* Action Button Row */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              variant="primary"
              size="md"
              icon={Calculator}
              iconRight={ArrowRight}
              onClick={() => navigate('/calculators')}
            >
              Explore All 50+ Calculators
            </Button>

            <Button
              variant="secondary"
              size="md"
              icon={Box}
              onClick={() => {
                setActiveCalcId('concrete-volume');
                navigate('/concrete/volume');
              }}
            >
              Open Concrete Volume 3D
            </Button>

            <Button
              variant="ghost"
              size="md"
              icon={BookOpen}
              onClick={() => navigate('/articles')}
            >
              Browse Articles
            </Button>
          </div>

          {/* Technical Spec Metadata Ticker */}
          <div className="pt-4 border-t border-[#E2E6E2] dark:border-white/8 flex flex-wrap items-center gap-6 sm:gap-8 text-xs font-mono text-[#7A8981] dark:text-[#64736B]">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#141A16] dark:text-[#ECF2EE] text-sm font-sans">50+</span>
              <span>Verified Tools</span>
            </div>
            <div className="w-1 h-3 bg-[#E2E6E2] dark:bg-white/10" />
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#141A16] dark:text-[#ECF2EE] text-sm font-sans">8</span>
              <span>Disciplines</span>
            </div>
            <div className="w-1 h-3 bg-[#E2E6E2] dark:bg-white/10" />
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#141A16] dark:text-[#ECF2EE] text-sm font-sans">6</span>
              <span>Design Standards</span>
            </div>
            <div className="w-1 h-3 bg-[#E2E6E2] dark:bg-white/10" />
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#2E6B56] dark:text-[#34D399] text-sm font-sans">0.01</span>
              <span>Precision Takeoff</span>
            </div>
          </div>
        </div>

        {/* ─── LIVE ENGINEERING SANDBOX PREVIEW WIDGET (Linear / Stripe Quality) ─── */}
        <div className="mt-8 pt-8 border-t border-[#E2E6E2] dark:border-white/8">
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-[#2E6B56] dark:text-[#34D399]" />
              <span className="text-xs font-bold text-[#141A16] dark:text-[#ECF2EE] uppercase tracking-wider font-mono">
                Interactive Engineering Sandbox
              </span>
            </div>

            {/* Sandbox Model Switcher Tabs */}
            <div className="inline-flex p-1 rounded-lg bg-[#F2F5F3] dark:bg-[#181E1A] border border-[#E2E6E2] dark:border-white/10">
              <button
                onClick={() => setSandboxTab('concrete')}
                className={`px-3 py-1 rounded-md text-xs font-semibold font-mono transition-colors cursor-pointer ${
                  sandboxTab === 'concrete'
                    ? 'bg-white dark:bg-[#111413] text-[#2E6B56] dark:text-[#34D399] shadow-2xs'
                    : 'text-[#7A8981] hover:text-[#141A16] dark:hover:text-[#ECF2EE]'
                }`}
              >
                Model 1: Slab Mix
              </button>
              <button
                onClick={() => setSandboxTab('beam')}
                className={`px-3 py-1 rounded-md text-xs font-semibold font-mono transition-colors cursor-pointer ${
                  sandboxTab === 'beam'
                    ? 'bg-white dark:bg-[#111413] text-[#2E6B56] dark:text-[#34D399] shadow-2xs'
                    : 'text-[#7A8981] hover:text-[#141A16] dark:hover:text-[#ECF2EE]'
                }`}
              >
                Model 2: Beam Moment
              </button>
            </div>
          </div>

          {sandboxTab === 'concrete' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 p-5 rounded-xl bg-[#F7F8F7] dark:bg-[#161B18] border border-[#E2E6E2] dark:border-white/10">
              {/* Input Adjusters */}
              <div className="lg:col-span-5 space-y-3">
                <div className="text-[10px] font-mono uppercase tracking-wider text-[#7A8981]">
                  Input Dimensions (M20 Grade 1:1.5:3)
                </div>

                <div>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className="text-[#526058] dark:text-[#97A69E]">Length (L)</span>
                    <span className="font-bold text-[#141A16] dark:text-[#ECF2EE]">{slabLength.toFixed(1)} m</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="12"
                    step="0.5"
                    value={slabLength}
                    onChange={(e) => setSlabLength(parseFloat(e.target.value))}
                    className="w-full accent-[#2E6B56] dark:accent-[#34D399] cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className="text-[#526058] dark:text-[#97A69E]">Width (W)</span>
                    <span className="font-bold text-[#141A16] dark:text-[#ECF2EE]">{slabWidth.toFixed(1)} m</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="8"
                    step="0.5"
                    value={slabWidth}
                    onChange={(e) => setSlabWidth(parseFloat(e.target.value))}
                    className="w-full accent-[#2E6B56] dark:accent-[#34D399] cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className="text-[#526058] dark:text-[#97A69E]">Thickness (T)</span>
                    <span className="font-bold text-[#141A16] dark:text-[#ECF2EE]">{(slabThickness * 1000).toFixed(0)} mm</span>
                  </div>
                  <input
                    type="range"
                    min="0.10"
                    max="0.30"
                    step="0.025"
                    value={slabThickness}
                    onChange={(e) => setSlabThickness(parseFloat(e.target.value))}
                    className="w-full accent-[#2E6B56] dark:accent-[#34D399] cursor-pointer"
                  />
                </div>
              </div>

              {/* Real-time Computed Results */}
              <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-3 self-center">
                <div className="p-3 rounded-lg bg-white dark:bg-[#111413] border border-[#E2E6E2] dark:border-white/10">
                  <div className="text-[9.5px] font-mono uppercase text-[#7A8981]">Wet Volume</div>
                  <div className="text-xl font-bold font-mono text-[#141A16] dark:text-[#ECF2EE]">{wetVol.toFixed(2)}</div>
                  <div className="text-[10px] font-mono text-[#2E6B56] dark:text-[#34D399]">m³ concrete</div>
                </div>

                <div className="p-3 rounded-lg bg-white dark:bg-[#111413] border border-[#E2E6E2] dark:border-white/10">
                  <div className="text-[9.5px] font-mono uppercase text-[#7A8981]">Cement Required</div>
                  <div className="text-xl font-bold font-mono text-[#141A16] dark:text-[#ECF2EE]">{cementBags}</div>
                  <div className="text-[10px] font-mono text-[#2E6B56] dark:text-[#34D399]">bags (50kg)</div>
                </div>

                <div className="p-3 rounded-lg bg-white dark:bg-[#111413] border border-[#E2E6E2] dark:border-white/10">
                  <div className="text-[9.5px] font-mono uppercase text-[#7A8981]">Fine Sand</div>
                  <div className="text-xl font-bold font-mono text-[#141A16] dark:text-[#ECF2EE]">{sandVol}</div>
                  <div className="text-[10px] font-mono text-[#2E6B56] dark:text-[#34D399]">m³ dry</div>
                </div>

                <div className="p-3 rounded-lg bg-white dark:bg-[#111413] border border-[#E2E6E2] dark:border-white/10">
                  <div className="text-[9.5px] font-mono uppercase text-[#7A8981]">Coarse Aggregate</div>
                  <div className="text-xl font-bold font-mono text-[#141A16] dark:text-[#ECF2EE]">{aggVol}</div>
                  <div className="text-[10px] font-mono text-[#2E6B56] dark:text-[#34D399]">m³ 20mm</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 p-5 rounded-xl bg-[#F7F8F7] dark:bg-[#161B18] border border-[#E2E6E2] dark:border-white/10">
              {/* Beam Input Adjusters */}
              <div className="lg:col-span-5 space-y-3">
                <div className="text-[10px] font-mono uppercase tracking-wider text-[#7A8981]">
                  Simply Supported Beam Parameters
                </div>

                <div>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className="text-[#526058] dark:text-[#97A69E]">Span Length (L)</span>
                    <span className="font-bold text-[#141A16] dark:text-[#ECF2EE]">{beamSpan.toFixed(1)} m</span>
                  </div>
                  <input
                    type="range"
                    min="3"
                    max="15"
                    step="0.5"
                    value={beamSpan}
                    onChange={(e) => setBeamSpan(parseFloat(e.target.value))}
                    className="w-full accent-[#2E6B56] dark:accent-[#34D399] cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className="text-[#526058] dark:text-[#97A69E]">Uniform Load (w)</span>
                    <span className="font-bold text-[#141A16] dark:text-[#ECF2EE]">{beamLoad.toFixed(1)} kN/m</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    step="2.5"
                    value={beamLoad}
                    onChange={(e) => setBeamLoad(parseFloat(e.target.value))}
                    className="w-full accent-[#2E6B56] dark:accent-[#34D399] cursor-pointer"
                  />
                </div>
              </div>

              {/* Beam Real-time Computed Results */}
              <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-3 self-center">
                <div className="p-3 rounded-lg bg-white dark:bg-[#111413] border border-[#E2E6E2] dark:border-white/10">
                  <div className="text-[9.5px] font-mono uppercase text-[#7A8981]">Max Moment (Mmax)</div>
                  <div className="text-xl font-bold font-mono text-[#141A16] dark:text-[#ECF2EE]">{maxMoment}</div>
                  <div className="text-[10px] font-mono text-[#2E6B56] dark:text-[#34D399]">kNm (wL²/8)</div>
                </div>

                <div className="p-3 rounded-lg bg-white dark:bg-[#111413] border border-[#E2E6E2] dark:border-white/10">
                  <div className="text-[9.5px] font-mono uppercase text-[#7A8981]">Max Shear (Vmax)</div>
                  <div className="text-xl font-bold font-mono text-[#141A16] dark:text-[#ECF2EE]">{maxShear}</div>
                  <div className="text-[10px] font-mono text-[#2E6B56] dark:text-[#34D399]">kN (wL/2)</div>
                </div>

                <div className="p-3 rounded-lg bg-white dark:bg-[#111413] border border-[#E2E6E2] dark:border-white/10">
                  <div className="text-[9.5px] font-mono uppercase text-[#7A8981]">Support Reactions</div>
                  <div className="text-xl font-bold font-mono text-[#141A16] dark:text-[#ECF2EE]">{maxShear}</div>
                  <div className="text-[10px] font-mono text-[#2E6B56] dark:text-[#34D399]">Ra = Rb (kN)</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ─── 2. EIGHT PRIMARY ENGINEERING DISCIPLINES GRID ─── */}
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#7A8981] dark:text-[#64736B]">
              DISCIPLINES
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#141A16] dark:text-[#ECF2EE] tracking-tight">
              Engineering Calculation Suites
            </h2>
          </div>
          <Link
            to="/calculators"
            className="text-xs font-semibold text-[#2E6B56] dark:text-[#34D399] hover:underline inline-flex items-center gap-1 no-underline font-mono"
          >
            <span>View All Tools</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {ENGINEERING_DISCIPLINES.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.03, duration: 0.25, ease: 'easeOut' }}
                onClick={() => navigate(item.path)}
                className="group relative bg-white dark:bg-[#111413] border border-[#E2E6E2] dark:border-white/8 hover:border-[#2E6B56]/50 dark:hover:border-[#34D399]/40 p-5 rounded-2xl transition-all duration-150 cursor-pointer shadow-2xs hover:shadow-xs flex flex-col justify-between corner-crosshair"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-9 h-9 rounded-lg bg-[#EBF3EE] dark:bg-[#18221D] flex items-center justify-center text-[#2E6B56] dark:text-[#34D399] transition-colors border border-[#2E6B56]/15 dark:border-[#34D399]/20">
                      <Icon className="w-4 h-4" strokeWidth={1.75} />
                    </div>
                    <Badge variant="neutral" size="xs">
                      {item.count} Tools
                    </Badge>
                  </div>

                  <h3 className="text-sm font-bold text-[#141A16] dark:text-[#ECF2EE] group-hover:text-[#2E6B56] dark:group-hover:text-[#34D399] transition-colors mb-1.5">
                    {item.title}
                  </h3>

                  <p className="text-xs text-[#526058] dark:text-[#97A69E] leading-relaxed mb-4">
                    {item.desc}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#E2E6E2] dark:border-white/8 flex items-center justify-between text-[10px] font-mono text-[#7A8981]">
                  <span>{item.tag}</span>
                  <span className="text-[#2E6B56] dark:text-[#34D399] font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                    Open →
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ─── 3. SHOWCASE WORKSPACES WITH ENGINEERING READOUTS ─── */}
      <section className="space-y-5">
        <div>
          <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#7A8981] dark:text-[#64736B]">
            FEATURED WORKSPACES
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#141A16] dark:text-[#ECF2EE] tracking-tight">
            Flagship Engineering Workspaces
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
              className="bg-white dark:bg-[#111413] border border-[#E2E6E2] dark:border-white/8 hover:border-[#2E6B56]/50 dark:hover:border-[#34D399]/40 rounded-2xl p-5 sm:p-6 transition-all duration-150 cursor-pointer shadow-2xs hover:shadow-xs flex flex-col justify-between group corner-crosshair"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="brand" size="xs">
                    {tool.category}
                  </Badge>
                  <span className="text-[10px] font-mono text-[#7A8981]">{tool.standard}</span>
                </div>

                <h3 className="text-base font-bold text-[#141A16] dark:text-[#ECF2EE] group-hover:text-[#2E6B56] dark:group-hover:text-[#34D399] transition-colors">
                  {tool.name}
                </h3>

                <p className="text-xs text-[#526058] dark:text-[#97A69E] leading-relaxed">
                  {tool.details}
                </p>

                {/* Hero Output Metric Box */}
                <div className="p-3.5 rounded-xl bg-[#F7F8F7] dark:bg-[#161B18] border border-[#E2E6E2] dark:border-white/8 flex items-center justify-between">
                  <div>
                    <div className="text-[9px] font-mono text-[#7A8981] uppercase tracking-wider">Sample Output</div>
                    <div className="text-xl font-bold font-mono text-[#141A16] dark:text-[#ECF2EE]">{tool.metric}</div>
                  </div>
                  <div className="text-[10px] font-mono text-[#2E6B56] dark:text-[#34D399] bg-[#EBF3EE] dark:bg-[#18221D] px-2 py-1 rounded-md border border-[#2E6B56]/20 dark:border-[#34D399]/30">
                    {tool.submetric}
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-[#E2E6E2] dark:border-white/8 flex items-center justify-between text-xs font-semibold text-[#2E6B56] dark:text-[#34D399] font-mono">
                <span>Launch Interactive Studio</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 4. DESIGN CODES & ENGINEERING STANDARDS REFERENCE ─── */}
      <section className="bg-white dark:bg-[#111413] border border-[#E2E6E2] dark:border-white/8 rounded-2xl p-6 sm:p-8 shadow-2xs space-y-4 corner-crosshair">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#7A8981] dark:text-[#64736B]">
              METHODOLOGY
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[#141A16] dark:text-[#ECF2EE] tracking-tight">
              Aligned with Civil &amp; Structural Design Standards
            </h2>
          </div>
          <Link
            to="/formulas"
            className="text-xs font-semibold text-[#2E6B56] dark:text-[#34D399] hover:underline inline-flex items-center gap-1 no-underline font-mono"
          >
            <span>Formula Library</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
          {DESIGN_CODES.map((code) => (
            <div
              key={code.code}
              className="p-3.5 rounded-xl bg-[#F7F8F7] dark:bg-[#161B18] border border-[#E2E6E2] dark:border-white/8 space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#141A16] dark:text-[#ECF2EE] font-mono">{code.code}</span>
                <span className="text-[9.5px] font-mono text-[#7A8981]">{code.org}</span>
              </div>
              <p className="text-[11px] text-[#526058] dark:text-[#97A69E] leading-tight">{code.topic}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 5. ENGINEERING DISCLAIMER & QUALITY PLEDGE ─── */}
      <section className="p-5 rounded-2xl bg-[#EBF3EE] dark:bg-[#161B18] border border-[#2E6B56]/20 dark:border-white/8 flex flex-col sm:flex-row items-start gap-4 text-xs text-[#526058] dark:text-[#97A69E]">
        <ShieldCheck className="w-6 h-6 text-[#2E6B56] dark:text-[#34D399] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="font-bold text-[#141A16] dark:text-[#ECF2EE]">
            Engineering Disclaimer &amp; Professional Verification
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
