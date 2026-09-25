import CalculatorPageShell from './CalculatorPageShell';

const TITLE = 'Short Concrete Column Axial Capacity Estimator';
const DESC = 'Educational short reinforced-concrete column axial-capacity estimator. It calculates nominal and factored values from the displayed assumptions for tied rectangular columns.';

export default function ColumnDesignPage() {
  return (
    <CalculatorPageShell
      calculatorId="structural-column"
      category="structural"
      path="/structural/column"
      title={TITLE}
      description={DESC}
      breadcrumbLabel="Column Design"
      faqs={[
        { question: 'What column types are supported?', answer: 'The estimator is limited to short rectangular tied columns under axial compression. It does not replace an interaction, slenderness, seismic or project-specific design check.' },
        { question: 'How is the steel ratio shown?', answer: 'The tool calculates ρ = Ast/Ag and displays a warning based on its internal assumptions. Verify any acceptance limits against the applicable project requirements.' },
        { question: 'What safety factors are applied?', answer: 'The displayed result uses the factors built into this educational method. Confirm factor selection and applicability with a qualified professional before relying on it.' },
      ]}
    />
  );
}
