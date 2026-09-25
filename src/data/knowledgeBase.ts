export interface Guide {
  slug: string;
  title: string;
  description: string;
  summary: string;
  formula?: string;
  calculator: { label: string; url: string };
}

export const GUIDES: Guide[] = [
  {
    slug: 'concrete-volume-calculation', title: 'How to Calculate Concrete Volume',
    description: 'Learn how to calculate concrete volume for rectangular slabs, beams, footings and columns.',
    summary: 'Measure each dimension in one consistent unit, calculate the geometric volume, then convert the result only after the calculation. For irregular work, split the work into simple shapes and add their volumes.',
    formula: 'Volume = Length × Width × Depth', calculator: { label: 'Concrete Volume Calculator', url: '/concrete/volume' },
  },
  {
    slug: 'rebar-weight-formula', title: 'How to Calculate Rebar Weight',
    description: 'A practical guide to estimating reinforcing bar weight by diameter and length.',
    summary: 'Use the bar diameter and the total measured length, keeping units consistent. A bar schedule should be checked against project drawings, laps, hooks, bends and the specified material before procurement.',
    formula: 'Mass = unit mass × total length', calculator: { label: 'Rebar Calculator', url: '/concrete/rebar' },
  },
  {
    slug: 'brickwork-quantity', title: 'How to Calculate Brickwork Quantity',
    description: 'Estimate brickwork quantities from wall dimensions and opening deductions.',
    summary: 'Start with net wall area or volume, deduct verified openings, and apply the selected brick and mortar assumptions. Confirm local brick dimensions and bond details before ordering.',
    calculator: { label: 'Brick Quantity Calculator', url: '/concrete/brick' },
  },
  {
    slug: 'coordinate-traverse-basics', title: 'Coordinate Traverse Calculation Basics',
    description: 'Understand coordinate traverse inputs, bearings and closure checks.',
    summary: 'A traverse calculation converts measured distances and directions into coordinate changes. Field observations, datum selection and closure adjustment methodology remain the surveyor’s responsibility.',
    calculator: { label: 'Coordinate Traverse Calculator', url: '/surveying/traverse' },
  },
];

export const FORMULAS = [
  { name: 'Concrete volume', equation: 'V = L × W × D', meaning: 'Geometric volume of a rectangular member.', calculator: '/concrete/volume' },
  { name: 'Rectangular area', equation: 'A = L × W', meaning: 'Plan area with consistent length units.', calculator: '/concrete/volume' },
  { name: 'Steel mass estimate', equation: 'M = m × L', meaning: 'Mass from a verified unit mass and total length.', calculator: '/structural/steel-weight' },
  { name: 'Height of instrument', equation: 'HI = RL + BS', meaning: 'Surveying relation using a benchmark reduced level and backsight.', calculator: '/surveying/hi' },
];

export const REFERENCE_TABLES = [
  { name: 'Length conversion', rows: [['1 m', '100 cm'], ['1 m', '1,000 mm'], ['1 ft', '12 in']] },
  { name: 'Area conversion', rows: [['1 m²', '10,000 cm²'], ['1 ft²', '144 in²']] },
  { name: 'Volume conversion', rows: [['1 m³', '1,000 L'], ['1 ft³', '0.0283168 m³']] },
];
