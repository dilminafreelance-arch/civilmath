import { Link } from 'react-router-dom';
import {
  Layers, Calculator, HardHat, Compass, FileSpreadsheet,
  CheckCircle2, Target, Shield, BookOpen, Cpu, Eye, ArrowRight
} from 'lucide-react';

const DISCIPLINES = [
  {
    icon: Layers,
    title: 'Concrete Technology & Mix Design',
    desc: 'Interactive calculators for concrete nominal volume, cement-sand-aggregate batch weights, water-cement ratios, and brick masonry quantity estimates.',
    path: '/concrete',
  },
  {
    icon: Calculator,
    title: 'Bar Bending Schedules (BBS)',
    desc: 'Complete reinforcement cut-length and weight calculation algorithms for footings, beams, columns, slabs, retaining walls, and foundation meshes according to BS 8666 and IS 2502.',
    path: '/bbs',
  },
  {
    icon: Cpu,
    title: 'Structural Engineering Concepts',
    desc: 'Simply supported and continuous beam analysis (shear force & bending moment diagrams), column axial-flexural checks, slab deflection estimations, and structural steel tonnage takeoffs.',
    path: '/structural',
  },
  {
    icon: Compass,
    title: 'Surveying & Leveling Geodesy',
    desc: 'Height of Instrument (HI) reduction algorithms, Rise & Fall balancing tables, and closed traverse coordinate computations (Northing, Easting, closing error, and precision ratio).',
    path: '/surveying',
  },
  {
    icon: HardHat,
    title: 'Geotechnical Soil Mechanics',
    desc: 'Ultimate and allowable shallow bearing capacity equations (Terzaghi & Meyerhof formulations), water table depth adjustments, and Rankine lateral earth pressure on cantilever retaining walls.',
    path: '/geotechnical',
  },
  {
    icon: FileSpreadsheet,
    title: 'BOQ, Estimation & Material Takeoff',
    desc: 'Transparent quantity calculations, Bill of Quantities (BOQ) structure breakdowns, and instant Excel/PDF export capabilities for procurement and site planning.',
    path: '/calculators',
  },
  {
    icon: BookOpen,
    title: 'AutoCAD & Technical Drafting References',
    desc: 'Clear cover requirements, standard hook dimensions, 90° and 135° bend deductions, and practical detailing rules aligned with standard site practice.',
    path: '/articles',
  },
  {
    icon: Shield,
    title: 'Site Engineering & Construction Methods',
    desc: 'Practical guides connecting textbook engineering theory to real job-site challenges, formwork striking times, concrete curing periods, and quality inspection protocols.',
    path: '/guides',
  },
];

const CORE_PRINCIPLES = [
  {
    title: 'Transparent Math — No Black Boxes',
    desc: 'Engineers should never be asked to trust a mysterious number. CivilMath displays the governing equation, nominal assumptions, and step-by-step intermediate variables for every calculation.',
  },
  {
    title: 'Client-Side Privacy & Instant Speed',
    desc: 'Computations run immediately in your browser using optimized JavaScript. Your project dimensions, load cases, and drafting parameters remain on your local device—never uploaded to an external server.',
  },
  {
    title: 'Grounded in Recognized Codes',
    desc: 'Our formulations reference established civil engineering literature and design standards, including ACI 318, Eurocode 2, IS 456, and BS 8666, with explicit disclaimers regarding nominal assumptions.',
  },
  {
    title: 'Built for Field & Office Workflows',
    desc: 'Designed with a clean, low-latency, mobile-responsive interface that works seamlessly on desktop workstations in the design office or on smartphones and tablets on the construction site.',
  },
];

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-10 text-left pb-12 font-sans">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-[#7B8978] font-mono">
        <Link to="/" className="hover:text-[#20231F] dark:hover:text-white transition-colors no-underline">
          Home
        </Link>
        <span>/</span>
        <span className="text-[#20231F] dark:text-[#EAE7E0] font-semibold">
          About Us
        </span>
      </nav>

      {/* Header Block with Mission */}
      <header className="space-y-4 border-b border-[#D8D0C2] dark:border-[#333C33] pb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-semibold bg-[#657565]/10 dark:bg-[#657565]/20 text-[#657565] dark:text-[#9FB19F]">
          <Target className="w-3.5 h-3.5" />
          <span>Our Core Mission</span>
        </div>

        {/* Single H1 for SEO compliance */}
        <h1 className="text-3xl sm:text-4xl font-black text-[#20231F] dark:text-[#EAE7E0] tracking-tight leading-tight">
          About CivilMath
        </h1>

        <blockquote className="border-l-4 border-[#657565] pl-4 py-2 my-2 text-lg sm:text-xl font-bold text-[#20231F] dark:text-[#EAE7E0] italic font-serif">
          “Making practical civil engineering knowledge easier to understand, calculate, and apply.”
        </blockquote>

        <p className="text-sm sm:text-base text-[#555C55] dark:text-[#C5D0C5] leading-relaxed">
          CivilMath is a practical civil engineering calculation and knowledge platform developed to bridge the gap between academic textbook theory, complex structural software, and daily construction site realities.
        </p>
      </header>

      {/* The Story & Why CivilMath Exists */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-[#20231F] dark:text-[#EAE7E0]">
          Why We Built CivilMath
        </h2>
        <div className="prose prose-slate dark:prose-invert max-w-none text-sm text-[#333933] dark:text-[#D0DDD0] leading-relaxed space-y-3">
          <p>
            In everyday civil engineering practice, engineers and site supervisors frequently need quick, verified mathematical answers:
            <em> What is the required lap length for a 20mm rebar in M25 concrete? How many cubic meters of concrete are needed for an eccentric isolated footing? What is the adjusted bearing capacity when the water table rises to foundation level?</em>
          </p>
          <p>
            Traditional options are often flawed: complex commercial finite element software takes hours to set up for simple preliminary checks, while informal online calculators are full of broken formulas, hidden conversion errors, and aggressive advertising that interrupts workflow.
          </p>
          <p>
            CivilMath was built to provide an open, transparent, engineer-crafted alternative: fast, reliable, well-documented computational tools that make every calculation step visible, verifiable, and educational.
          </p>
        </div>
      </section>

      {/* Areas Covered / Core Disciplines */}
      <section className="space-y-5">
        <div>
          <h2 className="text-xl font-bold text-[#20231F] dark:text-[#EAE7E0]">
            Core Disciplines Covered
          </h2>
          <p className="text-xs text-[#7B8978] mt-1">
            Explore our specialized engineering calculator suites and technical guides:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {DISCIPLINES.map((d) => {
            const Icon = d.icon;
            return (
              <Link
                key={d.title}
                to={d.path}
                className="group p-4 rounded-xl bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#333C33] hover:border-[#657565] transition-all no-underline text-left flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#657565]/10 text-[#657565] dark:text-[#9FB19F] flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <h3 className="text-xs font-bold text-[#20231F] dark:text-[#EAE7E0] group-hover:text-[#657565] transition-colors m-0">
                      {d.title}
                    </h3>
                  </div>
                  <p className="text-xs text-[#7B8978] dark:text-[#A1AFA0] leading-relaxed m-0">
                    {d.desc}
                  </p>
                </div>
                <div className="pt-3 flex items-center gap-1 text-[11px] font-semibold text-[#657565] dark:text-[#9FB19F]">
                  <span>Explore tools</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Our Engineering Principles */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-[#20231F] dark:text-[#EAE7E0]">
          Our Engineering Philosophy
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {CORE_PRINCIPLES.map((principle) => (
            <div
              key={principle.title}
              className="p-5 rounded-2xl bg-white dark:bg-[#222822] border border-[#D8D0C2] dark:border-[#333C33] space-y-2"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#657565] shrink-0" />
                <h3 className="text-xs font-bold text-[#20231F] dark:text-[#EAE7E0] m-0">
                  {principle.title}
                </h3>
              </div>
              <p className="text-xs text-[#555C55] dark:text-[#A4B2A4] leading-relaxed m-0 pl-6">
                {principle.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Development & Authorship */}
      <section className="p-6 rounded-2xl bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#333C33] space-y-3">
        <h2 className="text-base font-bold text-[#20231F] dark:text-[#EAE7E0] m-0">
          Platform Leadership &amp; Engineering Team
        </h2>
        <p className="text-xs sm:text-sm text-[#555C55] dark:text-[#C5D0C5] leading-relaxed m-0">
          CivilMath was founded and is maintained by <strong>Sithum D. Edirisingha</strong>, a civil engineering developer passionate about computational geometry, reinforcement automation, and modern web technologies.
        </p>
        <p className="text-xs text-[#7B8978] leading-relaxed m-0">
          We actively collaborate with structural designers, quantity estimators, and university researchers to continuously audit formulas, review code updates, and add new calculations.
        </p>
        <div className="pt-2 flex flex-wrap gap-3">
          <Link
            to="/contact"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#657565] hover:bg-[#526052] text-white text-xs font-semibold no-underline shadow-xs transition-colors"
          >
            Get in Touch With Us
          </Link>
          <a
            href="https://lk.linkedin.com/in/sithum-d-edirisingha"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white dark:bg-[#252B25] border border-[#D8D0C2] dark:border-[#384238] text-[#20231F] dark:text-[#EAE7E0] text-xs font-semibold no-underline hover:border-[#657565] transition-colors"
          >
            LinkedIn Profile
          </a>
        </div>
      </section>

      {/* Honest Commitment */}
      <div className="p-4 rounded-xl bg-[#EAE7E0]/60 dark:bg-[#242A24]/60 border border-[#D8D0C2] dark:border-[#384238] text-xs text-[#7B8978] leading-relaxed">
        <strong>Our Honest Commitment:</strong> We do not make inflated marketing claims. CivilMath is an evolving engineering project dedicated to clarity, mathematical honesty, and practical utility. We encourage users to verify every computation and help us make these tools even better for the global civil engineering community.
      </div>
    </div>
  );
}
