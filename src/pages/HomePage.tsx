import { useNavigate } from 'react-router-dom';
import LandingPage from '../components/LandingPage';
import { SEO, CATEGORY_PATH_MAP, getCalculatorSlug, generateOrganizationSchema, generateWebsiteSchema } from '../utils/seo';
import { CALCULATORS_LIST } from '../data/calculatorsData';
import { useApp } from '../context/AppContext';

export default function HomePage() {
  const navigate = useNavigate();
  const { setActiveCalcId } = useApp();

  const handleSelectCalculator = (id: string) => {
    const calc = CALCULATORS_LIST.find(c => c.id === id);
    setActiveCalcId(id);
    if (calc) {
      const path = CATEGORY_PATH_MAP[calc.category];
      if (calc.category === 'bbs') {
        navigate('/bbs/footing');
      } else {
        navigate(`/${path}/${getCalculatorSlug(calc)}`);
      }
    }
  };

  return (
    <>
      <SEO
        title="Civil Engineering Calculators & Design Tools | CivilMath"
        description="Free professional civil engineering calculators for concrete volume, beam analysis, rebar BBS, column design, and surveying. Fast, accurate, and code-aligned."
        canonicalUrl="https://civilmath.com/"
        keywords={['civil engineering calculators', 'concrete calculator', 'beam analysis', 'bar bending schedule', 'civil math']}
        ogImage="https://civilmath.com/og-image.png"
        type="website"
        breadcrumbs={[{ name: 'Home', url: '/' }]}
        schema={{
          '@context': 'https://schema.org',
          '@graph': [generateOrganizationSchema(), generateWebsiteSchema()],
        }}
      />
      <LandingPage
        onSelectCalculator={handleSelectCalculator}
        onLaunchDashboard={() => navigate('/dashboard')}
        onNavigate={(page: string) => navigate(`/${page}`)}
      />
    </>
  );
}
