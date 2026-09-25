import { BBSOutput, BBSRebarItem } from '../types';
import { addItem, calcBarsCount, cleanNum, getSteelWeightByDia } from './shared';
import { DesignStandard } from '../engine/types';

export interface FootingInputs {
  length: number; width: number; depth: number; cover: number;
  mainDia: number; mainSpacing: number; distDia: number; distSpacing: number;
  padType?: string;
  subType?: 'isolated-square' | 'rectangular' | 'circular' | 'stepped' | 'sloped';
}

export function calculateFooting(inputs: FootingInputs, isMetric: boolean, standard: DesignStandard = 'ACI 318'): BBSOutput {
  const list: BBSRebarItem[] = [];
  const getNum = (val: number | undefined, fallback = 0) => val ?? fallback;
  const getLapLen = (d: number) => d * 50; // simple lap factor per standard

  const L = getNum(inputs.length);
  const W = getNum(inputs.width);
  const D = getNum(inputs.depth);
  const cv = getNum(inputs.cover);
  const mainDia = getNum(inputs.mainDia);
  const mainSp = getNum(inputs.mainSpacing);
  const distDia = getNum(inputs.distDia);
  const distSp = getNum(inputs.distSpacing);

  const concreteVol = L * W * D;
  const coverDed = cv * (isMetric ? 0.001 : 1/12);
  const clearL = L - 2 * coverDed;
  const clearW = W - 2 * coverDed;
  const spacingUnitMain = mainSp * (isMetric ? 0.001 : 1/12);
  const spacingUnitDist = distSp * (isMetric ? 0.001 : 1/12);
  const barsCountMain = calcBarsCount(clearW, spacingUnitMain, 2);
  const barsCountDist = calcBarsCount(clearL, spacingUnitDist, 2);

  // Hook length = depth - 2*cover (full-depth hook for footing)
  const hookLenM = D - 2 * coverDed;
  const hookUnit = hookLenM * (isMetric ? 1000 : 12);
  const aMain = clearL * (isMetric ? 1000 : 12);
  const aDist = clearW * (isMetric ? 1000 : 12);

  // Main reinforcement (bottom mesh X-dir) with standard 90° hooks at both ends
  addItem(list, 'F1-01', 'Main Reinforcement (X-direction)', mainDia, '21', hookUnit, aMain, hookUnit, 0, 0, 1, barsCountMain, isMetric,
    [`Footing main bars along longer dimension`, `Effective length: L' = ${L} - 2×${cv/1000} = ${clearL.toFixed(3)} m`]);

  // Distribution reinforcement (bottom mesh Y-dir)
  addItem(list, 'F1-02', 'Distribution Reinforcement (Y-direction)', distDia, '21', hookUnit, aDist, hookUnit, 0, 0, 1, barsCountDist, isMetric,
    [`Footing distribution bars along shorter dimension`, `Effective width: W' = ${W} - 2×${cv/1000} = ${clearW.toFixed(3)} m`]);

  const totalSteelWeight = list.reduce((s, i) => s + i.totalWeight, 0);
  return {
    rebarList: list,
    concreteVolume: cleanNum(parseFloat(concreteVol.toFixed(3))),
    totalSteelWeight: cleanNum(parseFloat(totalSteelWeight.toFixed(2))),
    steelWeightByDia: getSteelWeightByDia(list, isMetric)
  };
}
