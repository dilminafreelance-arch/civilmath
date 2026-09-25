import { BBSOutput, BBSRebarItem } from '../types';
import { addItem, calcBarsCount, cleanNum, getSteelWeightByDia } from './shared';
import { DesignStandard } from '../engine/types';

export interface StripFootingInputs {
  length: number; width: number; thickness: number; cover: number;
  longitudinalDia: number; longitudinalCount: number;
  transverseDia: number; transverseSpacing: number;
}

export function calculateStripFooting(inputs: StripFootingInputs, isMetric: boolean, standard: DesignStandard = 'ACI 318'): BBSOutput {
  const list: BBSRebarItem[] = [];
  const getNum = (val: number | undefined, fallback = 0) => val ?? fallback;

  const L = getNum(inputs.length);
  const W = getNum(inputs.width);
  const thk = getNum(inputs.thickness);
  const cv = getNum(inputs.cover);
  const longDia = getNum(inputs.longitudinalDia);
  const longCount = getNum(inputs.longitudinalCount);
  const transDia = getNum(inputs.transverseDia);
  const transSp = getNum(inputs.transverseSpacing);

  const concreteVol = L * W * thk;
  const coverDed = cv * (isMetric ? 0.001 : 1/12);
  const clearL = L - 2 * coverDed;
  const clearW = W - 2 * coverDed;
  const clearThk = thk - 2 * coverDed;
  const transSpUnit = transSp * (isMetric ? 0.001 : 1/12);
  const transBarsCount = calcBarsCount(clearL, transSpUnit, 2);
  const clearLUnit = clearL * (isMetric ? 1000 : 12);
  const clearWUnit = clearW * (isMetric ? 1000 : 12);
  const hookUnit = clearThk * (isMetric ? 1000 : 12);

  // Longitudinal bars — continuous along strip length
  addItem(list, 'SF-01', 'Longitudinal Main Bars (Along Strip)', longDia, '11', 12 * longDia, clearLUnit, 0, 0, 0, 1, longCount, isMetric,
    [`Strip footing longitudinal reinforcement`, `Count: ${longCount} bars, Length: ${clearLUnit.toFixed(0)} mm`]);

  // Transverse bars — distribution across strip width
  addItem(list, 'SF-02', 'Transverse Distribution Bars (Across Strip)', transDia, '21', hookUnit, clearWUnit, hookUnit, 0, 0, 1, transBarsCount, isMetric,
    [`Strip footing transverse distribution bars`, `Count: ${transBarsCount} bars @ ${transSp} mm spacing`]);

  const totalSteelWeight = list.reduce((s, i) => s + i.totalWeight, 0);
  return {
    rebarList: list,
    concreteVolume: cleanNum(parseFloat(concreteVol.toFixed(3))),
    totalSteelWeight: cleanNum(parseFloat(totalSteelWeight.toFixed(2))),
    steelWeightByDia: getSteelWeightByDia(list, isMetric)
  };
}
