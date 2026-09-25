import CalculatorPageShell from './CalculatorPageShell';

const TITLE = 'Brick Calculator & Wall Mortar Estimator';
const DESC = 'Free brick quantity calculator for walls. Estimates number of bricks, mortar volume, dry sand weight, and cement bags required for brick masonry construction. Supports standard and custom brick sizes with adjustable mortar joints.';

export default function BrickCalculatorPage() {
  return (
    <CalculatorPageShell
      calculatorId="brick-calculator"
      category="concrete"
      path="/concrete/brick"
      title={TITLE}
      description={DESC}
      breadcrumbLabel="Brick & Mortar"
      faqs={[
        { question: 'What brick sizes are supported?', answer: 'Standard modular brick (190×90×90mm), UK brick (215×102.5×65mm), and custom sizes. You can specify brick length, height, and thickness in any unit.' },
        { question: 'How is mortar volume calculated?', answer: 'The calculator computes total wall volume, subtracts the volume occupied by bricks, and adds a waste factor. The dry mortar volume is then split into cement and sand based on your mix ratio (e.g., 1:4, 1:6).' },
        { question: 'What mortar ratios can I use?', answer: 'Common mix ratios like 1:3, 1:4, 1:5, and 1:6 (cement:sand) are supported. You can also enter a custom ratio for your specific mortar specification.' },
      ]}
    />
  );
}
