import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import CalculatorWorkspace from '../components/CalculatorWorkspace';
import CalculatorPageTemplate from '../components/CalculatorPageTemplate';
import { useApp } from '../context/AppContext';
import { CALCULATORS_LIST } from '../data/calculatorsData';
import { CalculatorCategory } from '../types';
import { CATEGORY_PATH_MAP } from '../utils/seo';

const CATEGORY_ID_MAP: Record<string, CalculatorCategory> = {
  structural: 'structural',
  concrete: 'concrete',
  geotechnical: 'geotech',
  surveying: 'survey',
  utilities: 'utility',
};

export default function CalculatorPage() {
  const { calculatorId } = useParams<{ calculatorId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { unitSystem, setUnitSystem, handleSaveCalculation, savedCalculations, loadedCalculation, currency, setActiveCalcId } = useApp();
  const [beginnerMode, setBeginnerMode] = useState(true);

  const category = location.pathname.split('/').filter(Boolean)[0] || '';

  const calcDef = useMemo(() => {
    if (!category || !calculatorId) return null;
    const catPrefix = CATEGORY_ID_MAP[category];
    if (!catPrefix) return null;
    const reconstructed = `${catPrefix}-${calculatorId}`;
    let match = CALCULATORS_LIST.find(c => c.id === reconstructed);
    if (match) return match;
    match = CALCULATORS_LIST.find(c => c.id === calculatorId && c.category === catPrefix);
    return match || null;
  }, [category, calculatorId]);

  const fullId = calcDef?.id || null;

  useEffect(() => {
    if (fullId) setActiveCalcId(fullId);
  }, [fullId, setActiveCalcId]);

  if (!calcDef) {
    return (
      <div className="text-center py-20">
        <h2 className="text-lg font-bold text-slate-600">Calculator not found</h2>
        <p className="text-xs text-slate-400 mt-2">The calculator you requested does not exist.</p>
        <button onClick={() => navigate('/')} className="mt-4 px-4 py-2 bg-[#0A84FF] text-white rounded-xl text-xs font-semibold cursor-pointer">
          Return Home
        </button>
      </div>
    );
  }

  const calcCategory = CATEGORY_ID_MAP[category] || 'structural';
  const breadcrumbLabel = calcDef.name;

  return (
    <CalculatorPageTemplate
      title={calcDef.name}
      description={calcDef.description}
      category={calcCategory}
      path={`/${category}/${calculatorId}`}
      breadcrumbLabel={breadcrumbLabel}
      beginnerMode={beginnerMode}
      onBeginnerModeChange={setBeginnerMode}
      currentStep={1}
      onStepChange={() => {}}
    >
      <CalculatorWorkspace
        calculatorId={fullId!}
        unitSystem={unitSystem}
        setUnitSystem={setUnitSystem}
        onSaveCalculation={handleSaveCalculation}
        savedCalculations={savedCalculations}
        loadedCalculation={loadedCalculation}
        currency={currency}
      />
    </CalculatorPageTemplate>
  );
}
