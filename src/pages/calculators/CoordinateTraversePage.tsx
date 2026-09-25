import CalculatorPageShell from './CalculatorPageShell';

const TITLE = 'Coordinate Traverse Calculator - Surveying';
const DESC = 'Free survey traverse coordinate calculator. Computes northing, easting, and elevation coordinates from a known station using bearing angles, horizontal distances, and vertical curves for a single traverse leg.';

export default function CoordinateTraversePage() {
  return (
    <CalculatorPageShell
      calculatorId="survey-coordinate"
      category="survey"
      path="/surveying/traverse"
      title={TITLE}
      description={DESC}
      breadcrumbLabel="Coordinate Traverse"
      faqs={[
        { question: 'How are new coordinates computed?', answer: 'Northing change (latitude) = D × cos(θ) and Easting change (departure) = D × sin(θ), where D is the horizontal distance and θ is the bearing angle from north. New coordinates are added to the starting station.' },
        { question: 'What bearing format is used?', answer: 'Bearing angles are entered in decimal degrees measured clockwise from north (0° to 360°). The calculator also computes the quadrant bearing for field survey notes.' },
        { question: 'Can I include elevation changes?', answer: 'Yes. Enter the vertical angle or slope percentage to compute the elevation change and the new station elevation alongside the horizontal coordinates.' },
      ]}
    />
  );
}
