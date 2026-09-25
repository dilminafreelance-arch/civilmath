import CalculatorPageShell from './CalculatorPageShell';

const TITLE = 'Steel Section Weight Calculator';
const DESC = 'Free structural steel weight calculator for plates, round bars, hollow pipes, and H-beams. Computes total weight, volume, cross-sectional area, and surface area using standard steel density (7850 kg/m³ or 490 lb/ft³).';

export default function SteelWeightPage() {
  return (
    <CalculatorPageShell
      calculatorId="steel-calculator"
      category="structural"
      path="/structural/steel-weight"
      title={TITLE}
      description={DESC}
      breadcrumbLabel="Steel Weight"
      faqs={[
        { question: 'What steel section shapes are supported?', answer: 'Four standard structural profiles: flat plate/bar, circular solid rod, hollow pipe/tube, and H-beam (wide flange). Each has its own geometric calculation for cross-sectional area.' },
        { question: 'What density value is used?', answer: 'Standard structural steel density: 7850 kg/m³ (metric) or 490 lb/ft³ (imperial). This is the standard density for A36, A992, and most common structural steel grades.' },
        { question: 'Can I calculate unit weight per meter?', answer: 'Yes. The calculator shows both total weight for the given length and weight per unit length, which is useful for estimating linear material takeoffs.' },
      ]}
    />
  );
}
