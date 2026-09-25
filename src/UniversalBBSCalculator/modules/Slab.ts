import { BBSOutput, BBSRebarItem, SlabSubType } from '../types';
import { addItem, calcBarsCount, cleanNum, getSteelWeightByDia } from './shared';
import { DesignStandard } from '../engine/types';

export interface SlabInputs {
  length: number; width: number; thickness: number; cover: number;
  mainDia: number; mainSpacing: number; distDia: number; distSpacing: number;
  crankAngle?: number; chairDia?: number; chairCount?: number;
  subType?: SlabSubType;
  topMainDia?: number; topMainSpacing?: number;
  topDistDia?: number; topDistSpacing?: number;
  negSteelDia?: number; negSteelSpacing?: number;
  openingX?: number; openingY?: number; openingW?: number; openingH?: number;
}

export function calculateSlab(inputs: SlabInputs, isMetric: boolean, standard: DesignStandard = 'ACI 318'): BBSOutput {
  const list: BBSRebarItem[] = [];
  const getNum = (val: number | undefined, fallback = 0) => val ?? fallback;

  const L = getNum(inputs.length);
  const W = getNum(inputs.width);
  const thk = getNum(inputs.thickness);
  const cv = getNum(inputs.cover);
  const mainDia = getNum(inputs.mainDia);
  const mainSp = getNum(inputs.mainSpacing);
  const distDia = getNum(inputs.distDia);
  const distSp = getNum(inputs.distSpacing);
  const crankA = getNum(inputs.crankAngle, 45);
  const chairDia = getNum(inputs.chairDia);
  const chairCount = getNum(inputs.chairCount);
  const negDia = getNum(inputs.negSteelDia);
  const negSp = getNum(inputs.negSteelSpacing);
  const topMainDia = getNum(inputs.topMainDia, mainDia);
  const topMainSp = getNum(inputs.topMainSpacing, mainSp);

  const concreteVol = L * W * (thk * (isMetric ? 0.001 : 1/12));
  const clearL = L * (isMetric ? 1000 : 12) - 2 * cv;
  const clearW = W * (isMetric ? 1000 : 12) - 2 * cv;
  const crankH = thk - 2 * cv - mainDia;
  const crankAddition = crankA === 45 ? 0.42 * crankH : 0.27 * crankH;

  // Bottom main cranked bars (shape code 31 for cranked bar)
  const mainBarsCount = calcBarsCount(clearW, mainSp, 2);
  addItem(list, 'S1-01', 'Bottom Main Cranked Tensile Bars', mainDia, '31', 10 * mainDia, crankH, clearL, 10 * mainDia, 0, 1, mainBarsCount, isMetric,
    [`Slab bottom main reinforcement (cranked at ${crankA}° for continuity)`,
     `Crank depth: ${crankH} mm, Crank addition: ${crankAddition.toFixed(1)} mm`]);

  // Distribution bars
  const distBarsCount = calcBarsCount(clearL, distSp, 2);
  addItem(list, 'S1-02', 'Bottom Distribution Bars', distDia, '00', clearW, 0, 0, 0, 0, 1, distBarsCount, isMetric,
    [`Slab distribution reinforcement (perpendicular to main bars)`,
     `Bar length = slab effective width = ${clearW.toFixed(0)} mm`]);

  // Top mesh (negative reinforcement at supports)
  if (negSp > 0 && negDia > 0) {
    const negLen = Math.min(clearL / 4, 2000); // L/4 extension from support
    const negCount = calcBarsCount(clearW, negSp, 2);
    addItem(list, 'S1-03', 'Top Negative Steel at Supports', negDia, '21', 12 * negDia, negLen, 12 * negDia, 0, 0, 1, negCount, isMetric,
      [`Top negative moment reinforcement at supports`, `Extension: span/4 = ${negLen.toFixed(0)} mm`]);
  }

  // Temperature / shrinkage bars
  const tempDia = Math.max(distDia, 8);
  const tempSp = Math.min(distSp * 1.5, 300);
  const tempCount = calcBarsCount(clearL, tempSp, 2);
  addItem(list, 'S1-04', 'Temperature & Shrinkage Bars (Top)', tempDia, '00', clearW, 0, 0, 0, 0, 1, tempCount, isMetric,
    [`Temperature and shrinkage reinforcement (ACI 318 minimum: 0.0018bt)`,
     `Spacing: ${tempSp} mm, Count: ${tempCount}`]);

  // Chair supports
  if (chairCount > 0 && chairDia > 0) {
    const chairHead = isMetric ? 250 : 10;
    const chairHeight = thk - 2 * cv - (2 * mainDia);
    const chairLeg = isMetric ? 200 : 8;
    addItem(list, 'S1-05', 'Spacing Chairs (Top/Bottom Mesh Support)', chairDia, '61', chairHead, chairHeight, chairLeg, 0, 0, 1, chairCount, isMetric,
      [`Chair supports to maintain spacing between top and bottom mesh`]);
  }

  // Opening reinforcement if specified
  const openW = getNum(inputs.openingW);
  const openH = getNum(inputs.openingH);
  if (openW > 0 && openH > 0) {
    const openBarDia = Math.max(mainDia, 12);
    const extraCountPerSide = 2;
    addItem(list, 'S1-06', 'Opening Trim / Edge Reinforcement', openBarDia, '11', openW + 4 * openBarDia, 0, 0, 0, 0, 1, extraCountPerSide * 4, isMetric,
      [`Opening reinforcement — trim bars around ${openW}×${openH} mm opening`, `Extra bars each side: ${extraCountPerSide}`]);
  }

  const totalSteelWeight = list.reduce((s, i) => s + i.totalWeight, 0);
  return {
    rebarList: list,
    concreteVolume: cleanNum(parseFloat(concreteVol.toFixed(3))),
    totalSteelWeight: cleanNum(parseFloat(totalSteelWeight.toFixed(2))),
    steelWeightByDia: getSteelWeightByDia(list, isMetric)
  };
}
