import { DesignStandard } from './types';
import { getStandard } from './standards';
import { calculateCuttingLength } from './shapeCodes';

export interface ReinfCalcResult {
  barsCount: number;
  spacing: number;
  cuttingLength: number;
  totalLength: number;
  unitWeight: number;
  totalWeight: number;
  formulaSteps: {
    barsFormula: string;
    cutLengthFormula: string;
    weightFormula: string;
    details: string[];
  };
}

// Bar weight per meter = d²/162 (metric, kg/m, d in mm)
// Bar weight per foot  = d²/241 (imperial, lb/ft, d in mm) -- derived by converting the
// metric kg/m formula to lb/ft (×0.6720), verified against ASTM nominal bar weights.
export function barUnitWeight(diaMm: number, isMetric: boolean): number {
  if (isMetric) return (diaMm * diaMm) / 162;
  return (diaMm * diaMm) / 241;
}

export function calcNumberOfBars(
  effectiveLength: number,
  spacing: number,
  isMetric: boolean
): { count: number; actualSpacing: number; formula: string } {
  if (spacing <= 0) return { count: 2, actualSpacing: effectiveLength, formula: 'Min 2 bars (invalid spacing)' };
  const eff = effectiveLength * (isMetric ? 1000 : 12);
  const sp = spacing;
  const rawCount = eff / sp;
  const count = Math.max(2, Math.ceil(rawCount) + 1);
  const actualSp = count > 1 ? eff / (count - 1) : eff;
  const formula = `n = ceil(L / s) + 1 = ceil(${eff.toFixed(1)} / ${sp}) + 1 = ${count}`;
  return { count, actualSpacing: actualSp, formula };
}

export function calculateRebarWeight(
  diaMm: number,
  totalLengthM: number,
  isMetric: boolean
): { weight: number; formula: string } {
  const unitWt = barUnitWeight(diaMm, isMetric);
  const formula = `W = ${unitWt.toFixed(4)} × ${totalLengthM.toFixed(3)} = ${(unitWt * totalLengthM).toFixed(2)}`;
  return { weight: unitWt * totalLengthM, formula };
}

export function calculateDevelopmentLength(
  diaMm: number,
  fck: number,
  fy: number,
  isTension: boolean,
  standard: DesignStandard
): { ld: number; formula: string; steps: string[] } {
  const code = getStandard(standard);
  const ld = code.developmentLength(diaMm, fy, fck, isTension);
  const steps: string[] = [];
  if (isTension) {
    steps.push(`Ld = (fy × φ) / (1.7 × √fck)`);
    steps.push(`Ld = (${fy} × ${diaMm}) / (1.7 × √${fck})`);
  } else {
    steps.push(`Ld = (fy × φ) / (4 × √fck) (compression)`);
    steps.push(`Ld = (${fy} × ${diaMm}) / (4 × √${fck})`);
  }
  steps.push(`Ld = ${ld.toFixed(1)} mm (${(ld / 1000).toFixed(3)} m)`);
  return { ld, formula: `Ld = ${ld.toFixed(1)} mm`, steps };
}

export function calculateHookLength(
  diaMm: number,
  angle: '90deg' | '135deg' | '180deg',
  standard: DesignStandard
): { length: number; formula: string; steps: string[] } {
  const code = getStandard(standard);
  const len = code.hookLength(diaMm, angle);
  const angleLabel = { '90deg': '90°', '135deg': '135°', '180deg': '180°' }[angle];
  const steps = [
    `Hook type: ${angleLabel} hook`,
    `Formula: Hook = ${(len / diaMm).toFixed(1)} × d (per ${standard})`,
    `Hook = ${len.toFixed(1)} mm for φ${diaMm}`,
  ];
  return { length: len, formula: `Hook(${angleLabel}) = ${len} mm`, steps };
}

export function calculateLapLength(
  diaMm: number,
  fy: number,
  fck: number,
  lapClass: 'tension' | 'compression',
  standard: DesignStandard
): { ll: number; formula: string; steps: string[] } {
  const code = getStandard(standard);
  const ll = code.lapLength(diaMm, fy, fck, lapClass);
  const steps = [
    `Lap class: ${lapClass}`,
    `Lap length = ${(ll / diaMm).toFixed(1)} × d = ${ll.toFixed(1)} mm`,
    `Per ${standard}: ${lapClass} lap = ${ll.toFixed(1)} mm`,
  ];
  return { ll, formula: `Ll = ${ll.toFixed(1)} mm`, steps };
}

export function getElementFormulas(
  elementType: string,
  standard: DesignStandard,
  inputs: Record<string, number>,
  isMetric: boolean
): Record<string, { value: string; unit: string; formula: string; steps: string[] }> {
  const code = getStandard(standard);
  const formulas: Record<string, { value: string; unit: string; formula: string; steps: string[] }> = {};

  // Concrete cover
  const minCv = code.minCover('moderate', elementType);
  formulas.coverCheck = {
    value: minCv.toString(),
    unit: 'mm',
    formula: `Cover_min = ${minCv} mm (${standard}, moderate exposure)`,
    steps: [
      `Required min cover per ${standard}: ${minCv} mm for moderate exposure`,
      `Provided cover: ${inputs.cover || 0} mm`,
      inputs.cover >= minCv ? '✓ Cover requirement satisfied' : '✗ Cover requirement NOT satisfied',
    ],
  };

  // Min reinforcement ratio
  const rhoMin = code.minReinfRatio(elementType);
  formulas.rhoMin = {
    value: `${(rhoMin * 100).toFixed(3)}%`,
    unit: '%',
    formula: `ρ_min = ${(rhoMin * 100).toFixed(3)}% (${standard})`,
    steps: [
      `Minimum reinforcement ratio per ${standard}: ρ_min = ${(rhoMin * 100).toFixed(3)}%`,
      `This ratio governs the minimum steel area: A_s,min = ρ_min × b × d`,
    ],
  };

  // Max reinforcement ratio
  const rhoMax = code.maxReinfRatio(elementType);
  formulas.rhoMax = {
    value: `${(rhoMax * 100).toFixed(1)}%`,
    unit: '%',
    formula: `ρ_max = ${(rhoMax * 100).toFixed(1)}% (${standard})`,
    steps: [
      `Maximum reinforcement ratio per ${standard}: ρ_max = ${(rhoMax * 100).toFixed(1)}%`,
      `Steel area ratio must not exceed this limit to prevent congestion and ensure ductility.`,
    ],
  };

  // Max spacing
  const maxSp = code.maxSpacing(elementType, true);
  formulas.maxSpacing = {
    value: maxSp.toString(),
    unit: 'mm',
    formula: `s_max = ${maxSp} mm (${standard})`,
    steps: [
      `Maximum permitted bar spacing per ${standard}: s_max = ${maxSp} mm`,
      `Provided spacing must be ≤ ${maxSp} mm to control cracking.`,
    ],
  };

  return formulas;
}

export function generateBarMark(
  prefix: string,
  index: number,
  layer?: string
): string {
  const layerSuffix = layer ? `-${layer}` : '';
  return `${prefix}${String(index).padStart(2, '0')}${layerSuffix}`;
}

export function calcCoverDeduction(cover: number, isMetric: boolean): number {
  return cover * (isMetric ? 0.001 : 1 / 12);
}

export function toUnit(num: number, isMetric: boolean): number {
  return isMetric ? num : num / 1000;
}
