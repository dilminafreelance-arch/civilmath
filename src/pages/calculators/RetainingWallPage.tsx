import CalculatorPageShell from './CalculatorPageShell';

const TITLE = 'Retaining Wall Lateral Earth Pressure Calculator';
const DESC = 'Free cantilever retaining wall lateral force calculator using Rankine active earth pressure theory. Computes active earth pressure coefficient (Ka), total lateral thrust, and overturning moment about the toe.';

export default function RetainingWallPage() {
  return (
    <CalculatorPageShell
      calculatorId="geotech-retaining"
      category="geotech"
      path="/geotechnical/retaining-wall"
      title={TITLE}
      description={DESC}
      breadcrumbLabel="Retaining Wall"
      faqs={[
        { question: 'What is the Rankine active earth pressure theory?', answer: 'Rankine theory assumes a vertical retaining wall with horizontal backfill. The active earth pressure coefficient Ka = (1-sinφ)/(1+sinφ), where φ is the soil friction angle. The total lateral thrust is Pa = 0.5·Ka·γ·H².' },
        { question: 'How is overturning moment calculated?', answer: 'The lateral thrust Pa acts at a height of H/3 above the base of the wall for triangular pressure distribution. The overturning moment about the toe is Mo = Pa × (H/3).' },
        { question: 'Can I specify sloping backfill?', answer: 'Yes. If the backfill surface is sloping at an angle β from horizontal, the calculator adjusts the Ka coefficient using the appropriate Rankine equation for sloping backfill.' },
      ]}
    />
  );
}
