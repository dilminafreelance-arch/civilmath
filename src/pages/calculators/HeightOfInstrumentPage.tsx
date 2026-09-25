import CalculatorPageShell from './CalculatorPageShell';

const TITLE = 'Height of Instrument Calculator - Survey Leveling';
const DESC = 'Free surveying height of instrument (HI) and reduced level (RL) calculator. Solves differential leveling networks using backsights, foresights, and intermediate sights from a known benchmark elevation.';

export default function HeightOfInstrumentPage() {
  return (
    <CalculatorPageShell
      calculatorId="survey-hi"
      category="survey"
      path="/surveying/hi"
      title={TITLE}
      description={DESC}
      breadcrumbLabel="Height of Instrument"
      faqs={[
        { question: 'What is the Height of Instrument method?', answer: 'The HI method establishes the elevation of the instrument line of sight by adding the backsight reading to the known benchmark elevation. Reduced levels of unknown points are then computed by subtracting rod readings from the HI.' },
        { question: 'Can I record multiple survey points?', answer: 'Yes. The calculator supports multiple foresight and intermediate sight readings from a single instrument setup. Each point receives its own reduced level calculation.' },
        { question: 'How is the elevation difference calculated?', answer: 'The elevation difference between any two points is computed as the difference in their reduced levels. The calculator also tracks the total vertical elevation change across the traverse.' },
      ]}
    />
  );
}
