import CalculatorPageShell from './CalculatorPageShell';

const TITLE = 'Slab Deflection Thickness Estimator';
const DESC = 'Educational one-way concrete slab thickness estimator for simply supported, continuous and cantilever spans. Review its stated assumptions against the applicable project requirements.';

export default function SlabDeflectionPage() {
  return (
    <CalculatorPageShell
      calculatorId="structural-slab"
      category="structural"
      path="/structural/slab"
      title={TITLE}
      description={DESC}
      breadcrumbLabel="Slab Deflection"
      faqs={[
        { question: 'What span conditions are supported?', answer: 'The calculator supports four boundary conditions: simply supported (span/20), one end continuous (span/24), both ends continuous (span/28), and cantilever (span/10).' },
        { question: 'How does steel grade affect the estimate?', answer: 'The estimator applies the displayed modification factor to its assumptions. Confirm whether that method and material grade are suitable for the project before using the result.' },
        { question: 'Is this for one-way or two-way slabs?', answer: 'This calculator is designed for one-way slabs where the long-span to short-span ratio exceeds 2.0. For two-way slabs, both span directions should be considered.' },
      ]}
    />
  );
}
