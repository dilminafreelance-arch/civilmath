import { ShapeCodeDef, DesignStandard } from '../types';
import { getStandard } from '../standards';

export const SHAPE_CODES: ShapeCodeDef[] = [
  {
    code: '00',
    name: 'Straight Bar',
    sketch: '━━━━',
    formula: 'L = a',
    params: ['a = total length'],
  },
  {
    code: '11',
    name: 'Bar with One 90° Bend (L-bar)',
    sketch: '┐\n└─',
    formula: 'L = a + b - 2d',
    params: ['a = long leg', 'b = short leg', 'd = bar diameter'],
  },
  {
    code: '21',
    name: 'Bar with Two 90° Bends (U-bar)',
    sketch: '┌─┐\n│ │\n└─┘',
    formula: 'L = a + b + c - 4d',
    params: ['a = base length', 'b, c = leg heights'],
  },
  {
    code: '31',
    name: 'Cranked / Bent-up Bar (45°)',
    sketch: '─╱╲─',
    formula: 'L = a + b + c + d + e + 0.42h - 4d',
    params: ['a = left straight', 'b = crank height', 'c = middle straight', 'd = right upper', 'e = right straight', 'h = crank depth'],
  },
  {
    code: '41',
    name: 'Stirrup / Tie (Closed Rectangle)',
    sketch: '┌──┐\n│  │\n└──┘',
    formula: 'L = 2a + 2b + 2×(hook) - 6d',
    params: ['a = width center-center', 'b = height center-center', 'd = bar diameter'],
  },
  {
    code: '51',
    name: 'Closed Stirrup (90° Hook)',
    sketch: '┌──┐\n│  │\n└──┘',
    formula: 'L = 2a + 2b + 2×(10d) - 6d',
    params: ['a = width (clear + d)', 'b = depth (clear + d)', 'd = bar diameter'],
  },
  {
    code: '61',
    name: 'Chair Bar (U-shaped support)',
    sketch: '∩',
    formula: 'L = a + 2b + 2c',
    params: ['a = top head width', 'b = leg height', 'c = bottom leg'],
  },
  {
    code: '71',
    name: 'Circular Tie / Ring',
    sketch: '○',
    formula: 'L = π × D_center - 3d',
    params: ['D_center = centerline diameter', 'd = bar diameter'],
  },
  {
    code: '81',
    name: 'Hairpin / Dowel (U-bar 180°)',
    sketch: '∩',
    formula: 'L = a + 2b + 2×(hook) - 4d',
    params: ['a = base', 'b = leg', 'hook = 180° hook length'],
  },
  {
    code: '91',
    name: 'Diagonal / Cross Tie',
    sketch: '╱╲',
    formula: 'L = √(a² + b²) + 2×hook - 2d',
    params: ['a = horizontal projection', 'b = vertical projection', 'd = bar diameter'],
  },
];

export function getShapeCode(code: string): ShapeCodeDef | undefined {
  return SHAPE_CODES.find(s => s.code === code);
}

export function calculateCuttingLength(
  shapeCode: string,
  dims: number[],
  diaMm: number,
  standard: DesignStandard = 'IS 456'
): { length: number; formula: string; steps: string[] } {
  const d = diaMm;
  let length = 0;
  let formula = '';
  const steps: string[] = [];

  switch (shapeCode) {
    case '00': {
      const [a] = dims;
      length = a;
      formula = `L = ${a}`;
      steps.push(`Straight bar: L = total length = ${a} mm`);
      break;
    }
    case '11': {
      const [a, b] = dims;
      length = a + b - 2 * d;
      formula = `L = ${a} + ${b} - 2×${d} = ${length}`;
      steps.push(`One 90° bend: L = a + b - 2d`);
      steps.push(`= ${a} + ${b} - 2×${d} = ${length} mm`);
      break;
    }
    case '21': {
      const [a, b, c] = dims;
      length = a + b + c - 4 * d;
      formula = `L = ${a} + ${b} + ${c} - 4×${d} = ${length}`;
      steps.push(`Two 90° bends: L = a + b + c - 4d`);
      steps.push(`= ${a} + ${b} + ${c} - 4×${d} = ${length} mm`);
      break;
    }
    case '31': {
      const [a, h, c, d_, e] = dims;
      const crankAdd = 0.42 * h;
      length = a + c + d_ + e + crankAdd - 4 * d;
      formula = `L = ${a} + ${c} + ${d_} + ${e} + 0.42×${h} - 4×${d} = ${length}`;
      steps.push(`Cranked bar (45°): L = a + c + d + e + 0.42h - 4d`);
      steps.push(`= ${a} + ${c} + ${d_} + ${e} + 0.42×${h} - 4×${d} = ${length} mm`);
      break;
    }
    case '51': {
      const [a, b] = dims;
      const hookL = getStandard(standard).hookLength(d, '135deg');
      length = 2 * a + 2 * b + 2 * hookL - 6 * d;
      formula = `L = 2×${a} + 2×${b} + 2×${hookL} - 6×${d} = ${length}`;
      steps.push(`Closed stirrup: L = 2a + 2b + 2×hook - 6d`);
      steps.push(`= 2×${a} + 2×${b} + 2×${hookL} - 6×${d} = ${length} mm`);
      break;
    }
    case '61': {
      const [a, b, c] = dims;
      length = a + 2 * b + 2 * c;
      formula = `L = ${a} + 2×${b} + 2×${c} = ${length}`;
      steps.push(`Chair bar: L = a + 2b + 2c`);
      steps.push(`= ${a} + 2×${b} + 2×${c} = ${length} mm`);
      break;
    }
    case '71': {
      const [D, ..._] = dims;
      length = Math.PI * D - 3 * d;
      formula = `L = π×${D} - 3×${d} = ${length}`;
      steps.push(`Circular ring: L = πD - 3d`);
      steps.push(`= π×${D} - 3×${d} = ${length} mm`);
      break;
    }
    case '81': {
      const [a, b] = dims;
      const hookL = getStandard(standard).hookLength(d, '180deg');
      length = a + 2 * b + 2 * hookL - 4 * d;
      formula = `L = ${a} + 2×${b} + 2×${hookL} - 4×${d} = ${length}`;
      steps.push(`Hairpin: L = a + 2b + 2×hook - 4d`);
      steps.push(`= ${a} + 2×${b} + 2×${hookL} - 4×${d} = ${length} mm`);
      break;
    }
    case '91': {
      const [a, b] = dims;
      const diag = Math.sqrt(a * a + b * b);
      const hookL = getStandard(standard).hookLength(d, '135deg');
      length = diag + 2 * hookL - 2 * d;
      formula = `L = √(${a}²+${b}²) + 2×${hookL} - 2×${d} = ${length}`;
      steps.push(`Cross tie: L = √(a²+b²) + 2×hook - 2d`);
      steps.push(`= √(${a}²+${b}²) + 2×${hookL} - 2×${d} = ${length} mm`);
      break;
    }
    default: {
      length = dims[0] || 0;
      formula = `L = ${length}`;
      steps.push(`Default straight length: ${length} mm`);
    }
  }

  return { length: Math.max(length, 0), formula, steps };
}
