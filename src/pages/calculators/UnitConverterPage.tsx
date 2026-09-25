import CalculatorPageShell from './CalculatorPageShell';

const TITLE = 'Engineering Unit Converter';
const DESC = 'Free engineering unit converter for civil and structural engineering. Converts between metric and imperial units for length, area, volume, force, pressure, stress, moment, and density with precision formatting.';

export default function UnitConverterPage() {
  return (
    <CalculatorPageShell
      calculatorId="utility-convert"
      category="utility"
      path="/utilities/unit-converter"
      title={TITLE}
      description={DESC}
      breadcrumbLabel="Unit Converter"
      faqs={[
        { question: 'What unit categories are supported?', answer: 'Length (mm/cm/m/km to in/ft/yd/mi), area (m² to ft²), volume (m³ to ft³/yd³), force (kN to kip/lbf), pressure/stress (kPa/MPa to psi/ksi), moment (kN·m to kip·ft), and density (kg/m³ to lb/ft³).' },
        { question: 'Are conversion factors precise?', answer: 'Yes. All conversion factors follow standard engineering definitions: 1 in = 25.4 mm exactly, 1 kip = 4.44822 kN, 1 psi = 6.89476 kPa, and so on. Results show up to 4 decimal places.' },
        { question: 'Can I convert between any two units?', answer: 'Yes. Select a category, choose the source unit and target unit, enter a value, and get the conversion instantly. All units within a category are fully convertible both ways.' },
      ]}
    />
  );
}
