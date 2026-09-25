import CalculatorPageShell from './CalculatorPageShell';

const TITLE = 'Rebar Quantity Calculator';
const DESC = 'Free rebar calculator for concrete slabs, beams, columns, and walls. Computes total rebar length, weight per bar size, overlap/splice lengths, spacing counts, and unit conversion between metric and imperial rebar sizes.';

export default function RebarCalculatorPage() {
  return (
    <CalculatorPageShell
      calculatorId="rebar-calculator"
      category="concrete"
      path="/concrete/rebar"
      title={TITLE}
      description={DESC}
      breadcrumbLabel="Rebar Quantity"
      faqs={[
        { question: 'What rebar sizes are supported?', answer: 'The calculator supports standard rebar diameters from #3 (10mm) to #18 (57mm) including metric equivalents. Select your bar size and the calculator uses the corresponding cross-sectional area and unit weight.' },
        { question: 'How are lap splices calculated?', answer: 'Overlap lengths are computed as 40D to 50D (40 to 50 times bar diameter) based on code standards. You can customize the lap ratio and the maximum raw bar length available.' },
        { question: 'Can I specify custom spacing?', answer: 'Yes. Input center-to-center spacing in either direction. The calculator determines the number of bars required to cover the given span at the specified spacing.' },
      ]}
    />
  );
}
