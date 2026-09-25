import CalculatorPageShell from './CalculatorPageShell';

const TITLE = 'Terzaghi Bearing Capacity Calculator';
const DESC = 'Free soil bearing capacity calculator using Terzaghi\'s method for shallow foundations. Computes ultimate bearing capacity (qult) and allowable bearing pressure using cohesion, friction angle, and footing geometry with shape factors.';

export default function BearingCapacityPage() {
  return (
    <CalculatorPageShell
      calculatorId="geotech-bearing"
      category="geotech"
      path="/geotechnical/bearing-capacity"
      title={TITLE}
      description={DESC}
      breadcrumbLabel="Bearing Capacity"
      faqs={[
        { question: 'What is Terzaghi\'s bearing capacity equation?', answer: 'qult = c·Nc·sc + q·Nq + 0.5·γ·B·Nγ·sγ, where c is cohesion, q is overburden pressure, γ is soil unit weight, B is footing width, N factors depend on friction angle, and s factors account for footing shape.' },
        { question: 'What soil parameters are needed?', answer: 'You need the soil cohesion (c), friction angle (φ), unit weight (γ), footing depth (Df), footing width (B) and length (L), and a safety factor (typically 3.0 for bearing capacity).' },
        { question: 'How is the allowable bearing pressure determined?', answer: 'The ultimate bearing capacity qult is divided by the safety factor to obtain the allowable bearing pressure qallow. This is the maximum safe loading the soil can support without shear failure.' },
      ]}
    />
  );
}
