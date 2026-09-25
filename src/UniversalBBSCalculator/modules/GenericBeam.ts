import { BBSOutput, BBSRebarItem } from '../types';
import { addItem, calcBarsCount, cleanNum, getSteelWeightByDia } from './shared';
import { DesignStandard } from '../engine/types';

export interface GenericBeamInputs {
  length?: number; span?: number; clearSpan?: number; bearing?: number;
  width: number; depth: number; cover: number;
  topDia: number; topCount: number; botDia: number; botCount: number;
  stirrupDia: number; stirrupSpacing: number;
  isLintel?: boolean;
}

export function calculateGenericBeam(inputs: GenericBeamInputs, isMetric: boolean, beamLabel: string, standard: DesignStandard = 'ACI 318'): BBSOutput {
  const list: BBSRebarItem[] = [];
  const getNum = (val: number | undefined, fallback = 0) => val ?? fallback;

  const L = inputs.isLintel
    ? getNum(inputs.clearSpan) + 2 * getNum(inputs.bearing)
    : getNum(inputs.length, getNum(inputs.span));
  const W = getNum(inputs.width);
  const D = getNum(inputs.depth);
  const cv = getNum(inputs.cover);
  const topDia = getNum(inputs.topDia);
  const topCount = getNum(inputs.topCount);
  const botDia = getNum(inputs.botDia);
  const botCount = getNum(inputs.botCount);
  const stirrupDia = getNum(inputs.stirrupDia);
  const stirrupSp = getNum(inputs.stirrupSpacing);

  const concreteVol = L * W * D;
  const clearL = L * (isMetric ? 1000 : 12) - 2 * cv;
  const clearB = W * (isMetric ? 1000 : 12) - 2 * cv;
  const clearD = D * (isMetric ? 1000 : 12) - 2 * cv;

  // Top bars — straight with hooks at ends
  addItem(list, 'BM-01', `${beamLabel} Top Main Hanger Bars`, topDia, '11', 12 * topDia, clearL, 0, 0, 0, 1, topCount, isMetric,
    [`${beamLabel} top longitudinal bars`, `Length: ${clearL.toFixed(0)} mm, Count: ${topCount} bars φ${topDia}`]);

  // Bottom bars — straight with hooks at ends
  addItem(list, 'BM-02', `${beamLabel} Bottom Tensile Bars`, botDia, '11', 12 * botDia, clearL, 0, 0, 0, 1, botCount, isMetric,
    [`${beamLabel} bottom tension reinforcement`, `Count: ${botCount} bars φ${botDia}`]);

  // Stirrups
  const stirCount = calcBarsCount(L * (isMetric ? 1000 : 12), stirrupSp, 2);
  addItem(list, 'BM-03', `${beamLabel} Shear Stirrup Links`, stirrupDia, '51', clearB, clearD, 0, 0, 0, 1, stirCount, isMetric,
    [`${beamLabel} closed stirrups`, `Spacing: ${stirrupSp} mm, Count: ${stirCount}`,
     `Stirrup dimensions: ${clearB.toFixed(0)} × ${clearD.toFixed(0)} mm`]);

  const totalSteelWeight = list.reduce((s, i) => s + i.totalWeight, 0);
  return {
    rebarList: list,
    concreteVolume: cleanNum(parseFloat(concreteVol.toFixed(3))),
    totalSteelWeight: cleanNum(parseFloat(totalSteelWeight.toFixed(2))),
    steelWeightByDia: getSteelWeightByDia(list, isMetric)
  };
}
