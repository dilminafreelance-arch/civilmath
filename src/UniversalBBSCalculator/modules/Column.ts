import { BBSOutput, BBSRebarItem, TieArrangement } from '../types';
import { addItem, calcBarsCount, cleanNum, getSteelWeightByDia } from './shared';
import { DesignStandard } from '../engine/types';

export interface ColumnInputs {
  height: number; width: number; depth: number; cover: number;
  mainDia: number; mainCount: number; tieDia: number; tieSpacing: number;
  lapLengthFactor: number; embedment: number;
  tieArrangement?: TieArrangement;
  confinementZoneSpacing?: number;
  lapZoneLength?: number;
}

export function calculateColumn(inputs: ColumnInputs, isMetric: boolean, standard: DesignStandard = 'ACI 318'): BBSOutput {
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
  const lapF = getNum(inputs.lapLengthFactor);
  const embed = getNum(inputs.embedment);
  const tieArr = inputs.tieArrangement || 'single';

  const concreteVol = H * B * D;

  // Vertical main reinforcement
  const lapLen = mainDia * lapF;
  const embedUnit = embed;
  const heightUnit = H * (isMetric ? 1000 : 12);
  // Straight bar (shape 00) with full length = height + embed + lap (for splicing)
  const aVert = heightUnit + embedUnit + lapLen;

  addItem(list, 'C1-01', 'Longitudinal Main Steel (Column Verticals)', mainDia, '00', aVert, 0, 0, 0, 0, 1, mainCount, isMetric,
    [`Column vertical bars — main longitudinal reinforcement`, `L = H + embedment + lap length`, `= ${heightUnit.toFixed(0)} + ${embedUnit} + ${lapLen} = ${aVert.toFixed(0)} mm`]);

  // Transverse ties based on arrangement
  const clearB = B * (isMetric ? 1000 : 12) - 2 * cv;
  const clearD = D * (isMetric ? 1000 : 12) - 2 * cv;
  const totalHeightMm = H * (isMetric ? 1000 : 12);

  // Standard ties: shape 51 (closed stirrup)
  let tiesCount = calcBarsCount(totalHeightMm, tieSp, 3);
  addItem(list, 'C1-02', `Transverse Ties (${tieArr} arrangement)`, tieDia, '51', clearB, clearD, 0, 0, 0, 1, tiesCount, isMetric,
    [`Column ties — ${tieArr} arrangement`, `Tie spacing: ${tieSp} mm`, `Tie dimensions: ${clearB.toFixed(0)} × ${clearD.toFixed(0)} mm`]);

  // Additional cross ties if double arrangement
  if (tieArr === 'double' || tieArr === 'cross') {
    addItem(list, 'C1-03', 'Additional Cross Ties', tieDia, '11', clearB, 0, 0, 0, 0, 1, tiesCount, isMetric,
      [`Cross ties at same spacing as main ties`, `Length: ${clearB.toFixed(0)} mm with hooks`]);
  }

  const totalSteelWeight = list.reduce((s, i) => s + i.totalWeight, 0);
  return {
    rebarList: list,
    concreteVolume: cleanNum(parseFloat(concreteVol.toFixed(3))),
    totalSteelWeight: cleanNum(parseFloat(totalSteelWeight.toFixed(2))),
    steelWeightByDia: getSteelWeightByDia(list, isMetric)
  };
}
