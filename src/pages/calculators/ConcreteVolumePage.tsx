import CalculatorPageShell from './CalculatorPageShell';

const TITLE = 'Concrete Volume Calculator';
const DESC = 'Free concrete volume calculator for slabs, columns, walls, and footings. Estimate cement bags, sand weight, aggregate weight, water, and total concrete cost with customizable waste and shrinkage factors. Metric and imperial units.';

export default function ConcreteVolumePage() {
  return (
    <CalculatorPageShell
      calculatorId="concrete-volume"
      category="concrete"
      path="/concrete/volume"
      title={TITLE}
      description={DESC}
      breadcrumbLabel="Concrete Volume"
      faqs={[
        { question: 'How does the concrete volume calculator work?', answer: 'Enter your slab, column, or wall dimensions (length, width, thickness). The calculator computes raw volume, adds waste/shrinkage margin, then calculates dry material volumes using a 1.54 multiplier. For M20 grade (1:1.5:3), it estimates cement bags, sand, and aggregate.' },
        { question: 'What concrete grades are supported?', answer: 'The calculator supports standard mix ratios including M5 (1:5:10), M7.5 (1:4:8), M10 (1:3:6), M15 (1:2:4), M20 (1:1.5:3), M25 (1:1:2), and custom ratios.' },
        { question: 'Can I toggle between metric and imperial?', answer: 'Yes. Switch between Metric (m, kg) and Imperial (ft, lbs) units. All inputs, material densities, and cost calculations update in real time.' },
      ]}
    />
  );
}
