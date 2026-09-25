import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import MainDashboard from '../components/MainDashboard';
import { PopularCalculatorsGrid, ProgressDonut, QuickStatsBar, CalendarWidget, LatestArticlesWidget, RecentCalculationsWidget } from '../components/DashboardWidgets';
import { SEOHead, CATEGORY_PATH_MAP, getCalculatorSlug } from '../utils/seo';
import { CALCULATORS_LIST } from '../data/calculatorsData';
import { useApp } from '../context/AppContext';

const CATEGORY_META: Record<string, { label: string; color: string }> = {
  concrete: { label: 'Concrete', color: '#4C5FE0' },
  structural: { label: 'Structural', color: '#00B894' },
  bbs: { label: 'Reinforcement', color: '#7C88B8' },
  geotech: { label: 'Geotechnical', color: '#E17055' },
  survey: { label: 'Surveying', color: '#0984E3' },
  utility: { label: 'Utilities', color: '#FDCB6E' },
};

const LATEST_ARTICLES = [
  { title: 'Types of Foundations and Their Uses', date: 'Structural basics', color: '#4C5FE0' },
  { title: 'Concrete Mix Ratios Explained', date: 'Concrete & materials', color: '#E17055' },
  { title: 'Reading Structural Drawings for Beginners', date: 'Drafting & documentation', color: '#00B894' },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const { savedCalculations, handleLoadSavedCalculation, handleDeleteCalculation, unitSystem, recentCalculatorIds, setActiveCalcId } = useApp();

  const handleLoad = (calc: any) => {
    handleLoadSavedCalculation(calc);
    const def = CALCULATORS_LIST.find((c: any) => c.id === calc.calculatorId);
    if (def) {
      const path = CATEGORY_PATH_MAP[def.category];
      navigate(`/${path}/${getCalculatorSlug(def)}`);
    }
  };
  const openCalculator = (id: string) => {
    const def = CALCULATORS_LIST.find(calc => calc.id === id);
    if (!def) return;
    setActiveCalcId(id);
    const path = CATEGORY_PATH_MAP[def.category];
    navigate(def.category === 'bbs' ? '/bbs/footing' : `/${path}/${getCalculatorSlug(def)}`);
  };

  // Category breakdown for the progress donut
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

  // Saved calculations grouped by weekday
  const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const weekCounts = [0, 0, 0, 0, 0, 0, 0];
  savedCalculations.forEach((sc: any) => {
    const d = new Date(sc.timestamp);
    weekCounts[(d.getDay() + 6) % 7] += 1;
  });
  const weekActivity = WEEKDAYS.map((label, i) => ({ label, value: weekCounts[i] }));
  const weeklyTotal = weekCounts.reduce((a, b) => a + b, 0);

  const recentItems = recentCalculatorIds.slice(0, 5).map((id) => {
    const def = CALCULATORS_LIST.find((c) => c.id === id);
    const meta = def ? CATEGORY_META[def.category] : undefined;
    return { id, name: def?.name || id, time: '', color: meta?.color || '#8891B0' };
  }).filter((it) => it.name);

  return (
    <>
      <SEOHead meta={{
        title: 'Civil Engineering Analytics Dashboard',
        description: 'View saved structural calculations, concrete mix designs, bar bending schedules, and project history from CivilMath calculators. Track rebar quantities, concrete volumes, and engineering analyses.',
        path: '/dashboard',
        noindex: true,
        type: 'website',
        breadcrumbs: [{ name: 'Home', url: '/' }, { name: 'Dashboard', url: '/dashboard' }],
      }} />

      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5">
        <div className="space-y-5 min-w-0">
          <PopularCalculatorsGrid />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <ProgressDonut total={savedCalculations.length} centerLabel="Total Calculations" slices={progressSlices} />
            <QuickStatsBar headline={String(weeklyTotal)} sublabel="Calculations this week" data={weekActivity} />
          </div>
          <MainDashboard
            savedCalculations={savedCalculations}
            onLoadCalculation={handleLoad}
            onDeleteCalculation={handleDeleteCalculation}
            unitSystem={unitSystem}
          />
        </div>

        <div className="space-y-5 min-w-0">
          <CalendarWidget />
          <LatestArticlesWidget articles={LATEST_ARTICLES} />
          <RecentCalculationsWidget items={recentItems} onOpen={openCalculator} />
        </div>
      </motion.div>
    </>
  );
}
