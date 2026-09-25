import { UnitSystem } from '../../types';
import { BBSRebarItem } from '../types';
import { DesignStandard, calculateCuttingLength, barUnitWeight } from '../engine';

const IMPERIAL_REBAR_DATA: Record<number, { name: string; diaMm: number; weightLbFt: number }> = {
  3: { name: '#3', diaMm: 9.525, weightLbFt: 0.376 },
  4: { name: '#4', diaMm: 12.7, weightLbFt: 0.668 },
  5: { name: '#5', diaMm: 15.875, weightLbFt: 1.043 },
  6: { name: '#6', diaMm: 19.05, weightLbFt: 1.502 },
  7: { name: '#7', diaMm: 22.225, weightLbFt: 2.044 },
  8: { name: '#8', diaMm: 25.4, weightLbFt: 2.670 },
  9: { name: '#9', diaMm: 28.65, weightLbFt: 3.400 },
  10: { name: '#10', diaMm: 32.26, weightLbFt: 4.303 },
  11: { name: '#11', diaMm: 35.81, weightLbFt: 5.313 },
};

const METRIC_REBAR_DATA: Record<number, { name: string; weightKgM: number }> = {
  6: { name: 'T6', weightKgM: 36 / 162 },
  8: { name: 'T8', weightKgM: 64 / 162 },
  10: { name: 'T10', weightKgM: 100 / 162 },
  12: { name: 'T12', weightKgM: 144 / 162 },
  16: { name: 'T16', weightKgM: 256 / 162 },
  20: { name: 'T20', weightKgM: 400 / 162 },
  25: { name: 'T25', weightKgM: 625 / 162 },
  28: { name: 'T28', weightKgM: 784 / 162 },
  32: { name: 'T32', weightKgM: 1024 / 162 },
  40: { name: 'T40', weightKgM: 1600 / 162 },
};

export const getRebarData = (diaNum: number, isMetric: boolean) => {
  if (isMetric) {
    const data = METRIC_REBAR_DATA[diaNum] || { name: `T${diaNum}`, weightKgM: (diaNum * diaNum) / 162 };
    return { label: data.name, diaMm: diaNum, unitWeight: data.weightKgM };
  }
  const data = IMPERIAL_REBAR_DATA[diaNum] || { name: `#${diaNum}`, diaMm: diaNum * 3.175, weightLbFt: 0.668 };
  return { label: data.name, diaMm: data.diaMm, unitWeight: data.weightLbFt };
};

export const calcBarsCount = (effectiveLength: number, spacing: number, minCount = 2): number => {
  if (spacing <= 0) return minCount;
  const ratio = effectiveLength / spacing;
  const roundedRatio = Math.round(ratio * 10000) / 10000;
  return Math.max(minCount, Math.ceil(roundedRatio) + 1);
};

export const cleanNum = (val: number, fallback = 0) => isNaN(val) || !isFinite(val) ? fallback : val;

export const addItem = (
  list: BBSRebarItem[],
  mark: string, desc: string, dia: number, shape: string,
  a: number, b: number, c: number, d: number, e: number,
  membersCount: number, barsPerMember: number,
  isMetric: boolean,
  /** Optional formula steps for engineering transparency */
  formulaSteps?: string[],
  /** Design standard for hook length/development length calculations */
  standard: DesignStandard = 'IS 456',
) => {
  const rebar = getRebarData(dia, isMetric);
  const dMm = rebar.diaMm;

  // Use the engine's shape code calculator for cutting length
  let cuttingLenUnit = 0;
  let steps: string[] = [];

  if (isMetric) {
    const result = calculateCuttingLength(shape, [a, b, c, d, e], dMm, standard);
    const totalLmm = result.length;
    cuttingLenUnit = Math.max(0.1, totalLmm / 1000);
    steps = result.steps;
  } else {
    // Imperial: convert to inches, calculate, convert to feet
    const result = calculateCuttingLength(shape, [a, b, c, d, e], dMm, standard);
    const totalLinches = result.length;
    cuttingLenUnit = Math.max(0.3, totalLinches / 12);
    steps = result.steps;
  }

  const totalBars = cleanNum(membersCount * barsPerMember);
  const totalLen = cleanNum(cuttingLenUnit * totalBars);
  const unitWeight = cleanNum(rebar.unitWeight);
  const totalWeight = cleanNum(totalLen * unitWeight);

  // Collect all formula steps
  const stepsJoined = formulaSteps || [];
  stepsJoined.push(`Mark ${mark}: ${desc}`);
  stepsJoined.push(`Shape code: ${shape}`);
  stepsJoined.push(...steps);
  stepsJoined.push(`Unit weight: ${unitWeight.toFixed(4)} ${isMetric ? 'kg/m' : 'lb/ft'}`);
  stepsJoined.push(`Total bars: ${totalBars} (${membersCount} members × ${barsPerMember} each)`);
  stepsJoined.push(`Cutting length: ${cuttingLenUnit.toFixed(3)} ${isMetric ? 'm' : 'ft'}`);
  stepsJoined.push(`Total length: ${totalLen.toFixed(3)} ${isMetric ? 'm' : 'ft'}`);
  stepsJoined.push(`Total weight: ${totalWeight.toFixed(2)} ${isMetric ? 'kg' : 'lb'}`);

  list.push({
    mark, description: desc, dia: cleanNum(dia),
    shapeCode: shape, dims: { a: cleanNum(a), b: cleanNum(b), c: cleanNum(c), d: cleanNum(d), e: cleanNum(e) },
    numMembers: cleanNum(membersCount), barsPerMember: cleanNum(barsPerMember),
    totalBars, cuttingLength: cleanNum(parseFloat(cuttingLenUnit.toFixed(3))),
    totalLength: cleanNum(parseFloat(totalLen.toFixed(3))),
    unitWeight: cleanNum(parseFloat(unitWeight.toFixed(4))),
    totalWeight: cleanNum(parseFloat(totalWeight.toFixed(2))),
    formulaSteps: formulaSteps !== undefined ? stepsJoined : undefined,
  });
};

export const getSteelWeightByDia = (list: BBSRebarItem[], isMetric: boolean): Record<string, number> => {
  const byDia: Record<string, number> = {};
  list.forEach(item => {
    const key = isMetric ? `T${item.dia}` : `#${item.dia}`;
    byDia[key] = (byDia[key] || 0) + item.totalWeight;
  });
  return byDia;
};

export const METRIC_REBAR_OPTIONS = Object.keys(METRIC_REBAR_DATA).map(dia => ({
  value: parseInt(dia),
  label: `Ø ${dia} mm (T${dia})`,
}));

export const IMPERIAL_REBAR_OPTIONS = Object.keys(IMPERIAL_REBAR_DATA).map(dia => ({
  value: parseInt(dia),
  label: `${IMPERIAL_REBAR_DATA[Number(dia)].name} (${IMPERIAL_REBAR_DATA[Number(dia)].diaMm}mm)`,
}));
