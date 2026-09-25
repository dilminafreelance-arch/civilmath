import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CalculatorWorkspace from '../../components/CalculatorWorkspace';
import CalculatorPageTemplate from '../../components/CalculatorPageTemplate';
import ArticleSection from '../../components/ArticleSection';
import { useApp } from '../../context/AppContext';
import { FORMULA_REFERENCES, CALCULATORS_LIST } from '../../data/calculatorsData';
import { CalculatorCategory } from '../../types';
import { BookOpen, ThumbsUp, ThumbsDown, ChevronRight } from 'lucide-react';
import { CATEGORY_PATH_MAP, getCalculatorSlug } from '../../utils/seo';
import { trackEvent } from '../../utils/analytics';
import { motion } from 'motion/react';

export interface CalculatorPageConfig {
  calculatorId: string;
  category: CalculatorCategory;
  path: string;
  title: string;
  description: string;
  breadcrumbLabel: string;
  faqs?: { question: string; answer: string }[];
}

export default function CalculatorPageShell({
  calculatorId, category, path, title, description, breadcrumbLabel, faqs,
}: CalculatorPageConfig) {
  const {
    unitSystem, setUnitSystem, handleSaveCalculation,
    savedCalculations, loadedCalculation, currency, setActiveCalcId,
  } = useApp();
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);

  useEffect(() => {
    setActiveCalcId(calculatorId);
    trackEvent('calculator_view', { calculator_id: calculatorId, category });
  }, [calculatorId, category, setActiveCalcId]);

interface RelatedLink {
  id: string;
  name: string;
  description: string;
  path: string;
}

const TOPICAL_RELATED_MAP: Record<string, RelatedLink[]> = {
  'concrete-volume': [
    { id: 'rebar-calculator', name: 'Reinforcing Rebar Quantity Calculator', description: 'Calculate rebar segments, lap splices, and steel weight for concrete members.', path: '/concrete/rebar' },
    { id: 'brick-calculator', name: 'Brick & Wall Mortar Estimator', description: 'Estimate bricks, mortar volume, and dry cement-sand quantities for masonry.', path: '/concrete/brick' },
    { id: 'bbs-footing', name: 'Footing BBS Calculator', description: 'Isolated pad footing reinforcement bar bending schedule and cutting lengths.', path: '/bbs/footing' },
    { id: 'bbs-slab', name: 'Slab BBS Calculator', description: 'One-way and two-way reinforced concrete slab rebar schedule and mesh detailing.', path: '/bbs/slab' },
  ],
  'rebar-calculator': [
    { id: 'concrete-volume', name: 'Concrete Volume Estimator', description: 'Calculate concrete volume, cement bags, sand, and aggregate requirements.', path: '/concrete/volume' },
    { id: 'bbs-beam', name: 'Beam BBS Calculator', description: 'Top, bottom, and stirrup reinforcement schedules with bend deductions.', path: '/bbs/beam' },
    { id: 'bbs-column', name: 'Column BBS Calculator', description: 'Vertical main rebar and lateral tie reinforcement cutting schedules.', path: '/bbs/column' },
    { id: 'steel-calculator', name: 'Steel Section Weight Estimator', description: 'Compute unit and total weight for standard structural steel sections.', path: '/structural/steel-weight' },
  ],
  'brick-calculator': [
    { id: 'concrete-volume', name: 'Concrete Volume Estimator', description: 'Calculate concrete volume, mix ratios, and dry material quantities.', path: '/concrete/volume' },
    { id: 'rebar-calculator', name: 'Reinforcing Rebar Quantity Calculator', description: 'Estimate rebar lengths and steel weights for reinforced brickwork.', path: '/concrete/rebar' },
    { id: 'bbs-lintel-beam', name: 'Lintel Beam BBS Calculator', description: 'Door and window masonry opening lintel reinforcement schedules.', path: '/bbs/lintel-beam' },
    { id: 'unit-converter', name: 'Civil Engineering Unit Converter', description: 'Convert length, area, volume, and material density units instantly.', path: '/utilities/unit-converter' },
  ],
  'structural-beam': [
    { id: 'bbs-beam', name: 'Beam BBS Calculator', description: 'Generate complete rebar cutting schedules for beam top, bottom, and stirrup bars.', path: '/bbs/beam' },
    { id: 'structural-column', name: 'Short Concrete Column Design (ACI 318)', description: 'Determine nominal and factored axial load capacity for RC columns.', path: '/structural/column' },
    { id: 'structural-slab', name: 'Slab Deflection Thickness Estimator', description: 'Check minimum thickness and deflection criteria under ACI standards.', path: '/structural/slab' },
    { id: 'steel-calculator', name: 'Steel Section Weight Estimator', description: 'Calculate weights of structural steel I-beams, channels, and angles.', path: '/structural/steel-weight' },
  ],
  'structural-column': [
    { id: 'bbs-column', name: 'Column BBS Calculator', description: 'Rebar cutting lengths, lap splices, and tie schedules for RC columns.', path: '/bbs/column' },
    { id: 'bbs-pedestal', name: 'Pedestal BBS Calculator', description: 'Foundation stub starter bars and perimeter tie detailing for baseplates.', path: '/bbs/pedestal' },
    { id: 'structural-beam', name: 'Beam Uniform/Point Load Analyst', description: 'Analyze beam moments, shear forces, and deflection profiles.', path: '/structural/beam' },
    { id: 'bearing-capacity', name: 'Soil Bearing Capacity Calculator', description: 'Evaluate foundation bearing capacity supporting column loads.', path: '/geotechnical/bearing-capacity' },
  ],
  'structural-slab': [
    { id: 'bbs-slab', name: 'Slab BBS Calculator', description: 'One-way and two-way slab rebar bending schedule with chair bar supports.', path: '/bbs/slab' },
    { id: 'concrete-volume', name: 'Concrete Volume Estimator', description: 'Calculate concrete volume and mix materials needed for floor slabs.', path: '/concrete/volume' },
    { id: 'structural-beam', name: 'Beam Uniform/Point Load Analyst', description: 'Compute supporting beam bending moments and deflection thresholds.', path: '/structural/beam' },
    { id: 'bbs-foundation-mesh', name: 'Foundation Mesh BBS Calculator', description: 'Mesh reinforcement detailing for ground slabs and mat foundations.', path: '/bbs/foundation-mesh' },
  ],
  'steel-calculator': [
    { id: 'rebar-calculator', name: 'Reinforcing Rebar Quantity Calculator', description: 'Estimate rebar sizes, total segment lengths, and weights.', path: '/concrete/rebar' },
    { id: 'structural-beam', name: 'Beam Uniform/Point Load Analyst', description: 'Analyze bending moments and shear limits on structural steel beams.', path: '/structural/beam' },
    { id: 'unit-converter', name: 'Civil Engineering Unit Converter', description: 'Convert between metric and imperial structural engineering units.', path: '/utilities/unit-converter' },
    { id: 'boq-builder', name: 'Bill of Quantities Builder', description: 'Estimate total structural steel takeoff and fabrication material costs.', path: '/boq-builder' },
  ],
  'height-of-instrument': [
    { id: 'coordinate-traverse', name: 'Coordinate Traverse Adjustment', description: 'Balance closed and link traverse surveys using Bowditch rule.', path: '/surveying/traverse' },
    { id: 'unit-converter', name: 'Civil Engineering Unit Converter', description: 'Convert elevation readings, feet, meters, and slope gradients.', path: '/utilities/unit-converter' },
    { id: 'concrete-volume', name: 'Concrete Volume Estimator', description: 'Calculate concrete quantities for leveled foundation excavations.', path: '/concrete/volume' },
    { id: 'steel-calculator', name: 'Steel Section Weight Estimator', description: 'Calculate structural steel profiles and rebar weights.', path: '/structural/steel-weight' },
  ],
  'coordinate-traverse': [
    { id: 'height-of-instrument', name: 'Height of Instrument Leveling', description: 'Differential leveling calculations and benchmark reduced levels.', path: '/surveying/hi' },
    { id: 'unit-converter', name: 'Civil Engineering Unit Converter', description: 'Convert distance and coordinate units between metric and imperial.', path: '/utilities/unit-converter' },
    { id: 'bearing-capacity', name: 'Soil Bearing Capacity Calculator', description: 'Evaluate foundation bearing capacity at surveyed site coordinates.', path: '/geotechnical/bearing-capacity' },
    { id: 'brick-calculator', name: 'Brick Masonry Estimator', description: 'Calculate brick quantities and mortar batch ratios for site masonry.', path: '/concrete/brick' },
  ],
  'bearing-capacity': [
    { id: 'retaining-wall', name: 'Retaining Wall Earth Pressure', description: 'Calculate lateral earth pressures and stability against overturning.', path: '/geotechnical/retaining-wall' },
    { id: 'bbs-footing', name: 'Footing BBS Calculator', description: 'Reinforcement bar bending schedule for pad footings designed for soil capacity.', path: '/bbs/footing' },
    { id: 'bbs-raft-foundation', name: 'Raft Foundation BBS Calculator', description: 'Dual-layer mesh and chair bar schedules for mat foundation bearing.', path: '/bbs/raft-foundation' },
    { id: 'concrete-volume', name: 'Concrete Volume Estimator', description: 'Calculate concrete volume and mix requirements for shallow foundations.', path: '/concrete/volume' },
  ],
  'retaining-wall': [
    { id: 'bearing-capacity', name: 'Soil Bearing Capacity Calculator', description: 'Check soil bearing capacity beneath the retaining wall footing base.', path: '/geotechnical/bearing-capacity' },
    { id: 'bbs-retaining-wall', name: 'Retaining Wall BBS Calculator', description: 'Complete rebar schedule for cantilever stem and footing base slab.', path: '/bbs/retaining-wall' },
    { id: 'concrete-volume', name: 'Concrete Volume Estimator', description: 'Estimate concrete volume and materials for retaining wall stem and base.', path: '/concrete/volume' },
    { id: 'bbs-footing', name: 'Footing BBS Calculator', description: 'Reinforcement bar bending schedule for retaining wall footings.', path: '/bbs/footing' },
  ],
  'unit-converter': [
    { id: 'concrete-volume', name: 'Concrete Volume Estimator', description: 'Calculate concrete quantities in metric (m³) or imperial (yd³).', path: '/concrete/volume' },
    { id: 'structural-beam', name: 'Beam Uniform/Point Load Analyst', description: 'Convert and calculate beam loads in kN/m or lb/ft.', path: '/structural/beam' },
    { id: 'steel-calculator', name: 'Steel Section Weight Estimator', description: 'Calculate steel section weight in kg/m or lb/ft.', path: '/structural/steel-weight' },
    { id: 'tables', name: 'Construction Reference Tables', description: 'Comprehensive engineering tables for unit conversion factors.', path: '/tables' },
  ],
};

  const formulaRef = FORMULA_REFERENCES[calculatorId];

  const relatedCalculators: RelatedLink[] = TOPICAL_RELATED_MAP[calculatorId] || CALCULATORS_LIST
    .filter(c => c.category === category && c.id !== calculatorId)
    .slice(0, 4)
    .map(c => ({
      id: c.id,
      name: c.name,
      description: c.description,
      path: `/${CATEGORY_PATH_MAP[c.category]}/${getCalculatorSlug(c)}`,
    }));

  const handleFeedback = (type: 'up' | 'down') => {
    setFeedback(type);
    trackEvent('calculator_feedback', { calculator_id: calculatorId, feedback: type });
  };

  return (
    <>
      <CalculatorPageTemplate
        title={title}
        description={description}
        category={category}
        path={path}
        breadcrumbLabel={breadcrumbLabel}
        faqs={faqs}
      >
        <CalculatorWorkspace
          calculatorId={calculatorId}
          unitSystem={unitSystem}
          setUnitSystem={setUnitSystem}
          onSaveCalculation={handleSaveCalculation}
          savedCalculations={savedCalculations}
          loadedCalculation={loadedCalculation}
          currency={currency}
        />
      </CalculatorPageTemplate>

      {formulaRef && (
        <section className="mt-8 max-w-4xl">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-4 h-4 text-[#f97316]" />
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">Engineering Formula & Calculation Steps</h2>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-4 shadow-xs">
            <p className="text-[11px] font-mono text-slate-600 dark:text-slate-300 leading-relaxed">
              {formulaRef.explanation}
            </p>
            <div className="space-y-2">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">Calculation Steps</h3>
              <ol className="space-y-1.5 list-decimal list-inside">
                {formulaRef.steps.map((step, i) => (
                  <li key={i} className="text-[10px] font-mono text-slate-500 dark:text-slate-400 leading-relaxed">{step}</li>
                ))}
              </ol>
            </div>
          </div>
        </section>
      )}

      {/* Engineering Article */}
      <ArticleSection calculatorId={calculatorId} />

      <section className="mt-8 max-w-4xl" aria-label="Related learning resources">
        <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3">Related Learning Resources</h2>
        <div className="flex flex-wrap gap-2">
          <Link to="/guides" className="rounded-xl border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs font-semibold text-[#f97316] hover:bg-[#f97316]/5 no-underline transition-colors">Calculation guides</Link>
          <Link to="/formulas" className="rounded-xl border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs font-semibold text-[#f97316] hover:bg-[#f97316]/5 no-underline transition-colors">Formula library</Link>
          <Link to="/tables" className="rounded-xl border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs font-semibold text-[#f97316] hover:bg-[#f97316]/5 no-underline transition-colors">Reference tables</Link>
        </div>
      </section>

      {/* Feedback Widget */}
      <section className="mt-8 max-w-4xl">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Was this calculator helpful?</span>
            <div className="flex items-center gap-3">
              <button onClick={() => handleFeedback('up')}
                className={`p-2 rounded-xl transition-all cursor-pointer ${feedback === 'up' ? 'bg-green-100 dark:bg-green-900/30 text-green-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'}`}>
                <ThumbsUp className="w-4 h-4" />
              </button>
              <button onClick={() => handleFeedback('down')}
                className={`p-2 rounded-xl transition-all cursor-pointer ${feedback === 'down' ? 'bg-red-100 dark:bg-red-900/30 text-red-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'}`}>
                <ThumbsDown className="w-4 h-4" />
              </button>
            </div>
          </div>
          {feedback && (
            <p className="mt-2 text-[10px] font-mono text-slate-400 dark:text-slate-500">Thank you for your feedback!</p>
          )}
        </div>
      </section>

      {/* Related Calculators */}
      {relatedCalculators.length > 0 && (
        <section className="mt-8 max-w-4xl">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">Related Calculators</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {relatedCalculators.map((calc, idx) => (
              <motion.div key={calc.id} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: idx * 0.05 }}>
                <Link
                  to={calc.path}
                  onClick={() => {
                    trackEvent('related_calculator_click', { from: calculatorId, to: calc.id });
                  }}
                  className="group block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl hover:border-[#f97316]/50 shadow-xs hover:shadow-md transition-all no-underline text-left">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 group-hover:text-[#f97316] transition-colors">{calc.name}</h3>
                  <p className="mt-1 text-[10px] font-mono text-slate-500 dark:text-slate-400 line-clamp-2">{calc.description}</p>
                  <div className="mt-3 flex items-center text-[9px] font-mono text-[#f97316]">
                    <span>Open Calculator</span>
                    <ChevronRight className="w-3 h-3 ml-0.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
