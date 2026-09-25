import { BBSOutput, BBSRebarItem } from '../types';
import { addItem, calcBarsCount, cleanNum, getSteelWeightByDia } from './shared';
import { DesignStandard } from '../engine/types';

export interface PedestalInputs {
  height: number; width: number; depth: number; cover: number;
  mainDia: number; mainCount: number; tieDia: number; tieSpacing: number;
  starterHook: number;
}

export function calculatePedestal(inputs: PedestalInputs, isMetric: boolean, standard: DesignStandard = 'ACI 318'): BBSOutput {
  const list: BBSRebarItem[] = [];
  const getNum = (val: number | undefined, fallback = 0) => val ?? fallback;

  const H = getNum(inputs.height);
  const B = getNum(inputs.width);
  const D = getNum(inputs.depth);
  const cv = getNum(inputs.cover);
  const mainDia = getNum(inputs.mainDia);
  const mainCount = getNum(inputs.mainCount);
  const tieDia = getNum(inputs.tieDia);
  const tieSp = getNum(inputs.tieSpacing);
  const starterHook = getNum(inputs.starterHook);

  const concreteVol = H * B * D;

  // Vertical starter bars with hook (L-bar)
  const vertLen = H * (isMetric ? 1000 : 12);
  addItem(list, 'PD-01', 'Vertical Main Starter Bars (Dowels)', mainDia, '11', starterHook, vertLen, 0, 0, 0, 1, mainCount, isMetric,
    [`Pedestal vertical starter bars — dowels extending from foundation`,
     `Total length: ${vertLen.toFixed(0)} mm + hook ${starterHook} mm`,
     `${mainCount} bars φ${mainDia}`]);

  // Ties
  const clearB = B * (isMetric ? 1000 : 12) - 2 * cv;
  const clearD = D * (isMetric ? 1000 : 12) - 2 * cv;
  const tiesCount = calcBarsCount(H * (isMetric ? 1000 : 12), tieSp, 3);
  addItem(list, 'PD-02', 'Lacing Ties / Lateral Ties', tieDia, '51', clearB, clearD, 0, 0, 0, 1, tiesCount, isMetric,
    [`Pedestal lateral ties — closed stirrups`, `Tie spacing: ${tieSp} mm`,
     `Dimensions: ${clearB.toFixed(0)} × ${clearD.toFixed(0)} mm`]);

  const totalSteelWeight = list.reduce((s, i) => s + i.totalWeight, 0);
  return {
    rebarList: list,
    concreteVolume: cleanNum(parseFloat(concreteVol.toFixed(3))),
    totalSteelWeight: cleanNum(parseFloat(totalSteelWeight.toFixed(2))),
    steelWeightByDia: getSteelWeightByDia(list, isMetric)
  };
}
