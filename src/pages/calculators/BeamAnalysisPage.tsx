import CalculatorPageShell from './CalculatorPageShell';

const TITLE = 'Beam Analysis Calculator - Bending Moment & Shear Force';
const DESC = 'Educational structural beam analysis calculator for simply supported beams under uniform and point loads. Computes bending moment, shear force, reactions and elastic deflection estimates from the stated inputs.';

export default function BeamAnalysisPage() {
  return (
    <CalculatorPageShell
      calculatorId="structural-beam"
      category="structural"
      path="/structural/beam"
      title={TITLE}
      description={DESC}
      breadcrumbLabel="Beam Analysis"
      faqs={[
        { question: 'What load types are supported?', answer: 'The calculator supports uniformly distributed loads (UDL) in kN/m or lb/ft and point loads at midspan. Both can be combined for composite loading analysis.' },
        { question: 'How is deflection calculated?', answer: 'Maximum elastic deflection is computed using Euler-Bernoulli beam theory: Δ = 5wL⁴/384EI for UDL and Δ = PL³/48EI for point loads. Results are checked against L/240 serviceability limits.' },
        { question: 'What beam properties are required?', answer: 'You need the beam span length, elastic modulus (E), and moment of inertia (I). For concrete beams, the calculator provides standard E values based on the concrete grade (f\'c).' },
      ]}
    />
  );
}
