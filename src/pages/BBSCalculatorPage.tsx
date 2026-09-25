import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import UniversalBBSCalculator from '../UniversalBBSCalculator/UniversalBBSCalculator';
import CalculatorPageTemplate from '../components/CalculatorPageTemplate';
import ArticleSection from '../components/ArticleSection';
import { useApp } from '../context/AppContext';
import { STRUCTURES } from '../UniversalBBSCalculator/types';

const STRUCTURE_NAMES: Record<string, string> = {};
STRUCTURES.forEach(s => { STRUCTURE_NAMES[s.id] = s.label; });

const STRUCTURE_DESCRIPTIONS: Record<string, string> = {
  footing: 'Isolated footing reinforcement BBS calculator. Computes main and distribution bar cutting lengths, hook allowances, and weight schedules for pad footings.',
  'combined-footing': 'Combined footing reinforcement BBS for multi-column footings. Supports multiple footing sections with independent bottom/top mesh reinforcement configurations.',
  'strip-footing': 'Strip/wall footing reinforcement BBS. Calculates longitudinal and transverse bar schedules for continuous strip footings.',
  'raft-foundation': 'Raft foundation slab reinforcement BBS. Generates top and bottom mesh bar schedules with chair support calculations.',
  beam: 'Reinforced concrete beam BBS calculator. Computes top bars, bottom bars, stirrups, and extra bar schedules with hook and bend allowances.',
  'plinth-beam': 'Plinth/grade beam BBS calculator. Computes longitudinal and stirrup reinforcement for plinth beams at foundation level.',
  'tie-beam': 'Tie beam reinforcement BBS. Calculates bar schedules for connecting beams between columns or footings.',
  'lintel-beam': 'Lintel beam BBS calculator over openings. Computes clear span, bearing length, and reinforcement requirements.',
  column: 'Reinforced concrete column BBS. Calculates vertical main bars, lateral ties, lap lengths, and embedment reinforcement schedules.',
  pedestal: 'Pedestal reinforcement BBS calculator. Computes starter bars, main verticals, and tie reinforcement for concrete pedestals.',
  slab: 'One-way and two-way slab BBS calculator. Generates main, distribution, cranked (bent-up), temperature, and chair bar schedules.',
  staircase: 'Staircase waist slab reinforcement BBS. Computes main, distribution bars for flights and landings with riser/tread geometry.',
  'retaining-wall': 'Cantilever retaining wall BBS calculator. Computes stem vertical/horizontal bars and base slab reinforcement schedules.',
  'foundation-mesh': 'Foundation mesh reinforcement BBS. Generates top and bottom mesh bar schedules for mat foundations and ground slabs.',
};

export default function BBSCalculatorPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const structureType = location.pathname.split('/').filter(Boolean)[1] || '';
  const { unitSystem, setUnitSystem, handleSaveCalculation, savedCalculations, currency, setActiveCalcId } = useApp();
  const [beginnerMode, setBeginnerMode] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    setActiveCalcId('bbs-universal');
  }, [setActiveCalcId]);

  const validType = structureType && STRUCTURE_NAMES[structureType] ? structureType : null;

  if (!validType) {
    return (
      <div className="text-center py-20">
        <h2 className="text-lg font-bold text-slate-600">Invalid structure type</h2>
        <p className="text-xs text-slate-400 mt-2">The BBS calculator you requested does not exist.</p>
        <button onClick={() => navigate('/bbs')}
          className="mt-4 px-4 py-2 bg-[#0A84FF] text-white rounded-xl text-xs font-semibold cursor-pointer">
          Browse BBS Calculators
        </button>
      </div>
    );
  }

  const name = STRUCTURE_NAMES[validType];
  const description = STRUCTURE_DESCRIPTIONS[validType] || `Professional bar bending schedule calculator for ${name.toLowerCase()} reinforcement. Generates cutting lengths, bar marks, weight schedules, and shape codes.`;
  const faqs = [
    { question: `What reinforcement details are calculated for ${name}?`, answer: `The ${name} BBS calculator generates complete reinforcement schedules including bar marks, diameters, cutting lengths, total lengths, weights per bar and total, shape codes with bending dimensions, and bar counts.` },
    { question: 'How should I use the standard selector?', answer: 'Use the selector as an educational reference setting. Verify every development length, hook, lap and detailing requirement against the applicable code edition, project specification and qualified professional review.' },
    { question: 'Can I manage multiple members?', answer: 'Yes. Toggle Multi-Member mode to add, duplicate, and manage multiple independent members. Each member has its own inputs, cover, grade, and quantity, with a project-wide material summary.' },
  ];

  return (
    <CalculatorPageTemplate
      title={`${name} BBS Calculator`}
      description={description}
      category="bbs"
      path={`/bbs/${validType}`}
      breadcrumbLabel={name}
      faqs={faqs}
      beginnerMode={beginnerMode}
      onBeginnerModeChange={setBeginnerMode}
      currentStep={currentStep}
      onStepChange={setCurrentStep}
    >
      <UniversalBBSCalculator
        calculatorId={`bbs-${validType}`}
        unitSystem={unitSystem}
        setUnitSystem={setUnitSystem}
        onSaveCalculation={handleSaveCalculation}
        savedCalculations={savedCalculations}
        currency={currency}
      />
      <ArticleSection calculatorId={`bbs-${validType}`} />
    </CalculatorPageTemplate>
  );
}
