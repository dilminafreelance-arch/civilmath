import { BBSOutput, BBSRebarItem } from '../types';
import { addItem, calcBarsCount, cleanNum, getSteelWeightByDia } from './shared';
import { DesignStandard } from '../engine/types';

export interface FoundationMeshInputs {
  length: number; width: number; depth: number; cover: number;
  botMainDia: number; botMainSpacing: number; botDistDia: number; botDistSpacing: number;
  topMainDia: number; topMainSpacing: number; topDistDia: number; topDistSpacing: number;
}

export function calculateFoundationMesh(inputs: FoundationMeshInputs, isMetric: boolean, standard: DesignStandard = 'ACI 318'): BBSOutput {
  const list: BBSRebarItem[] = [];
  const getNum = (val: number | undefined, fallback = 0) => val ?? fallback;

  const L = getNum(inputs.length);
  const W = getNum(inputs.width);
  const D = getNum(inputs.depth);
  const cv = getNum(inputs.cover);
  const botMainDia = getNum(inputs.botMainDia);
  const botMainSp = getNum(inputs.botMainSpacing);
  const botDistDia = getNum(inputs.botDistDia);
  const botDistSp = getNum(inputs.botDistSpacing);
  const topMainDia = getNum(inputs.topMainDia);
  const topMainSp = getNum(inputs.topMainSpacing);
  const topDistDia = getNum(inputs.topDistDia);
  const topDistSp = getNum(inputs.topDistSpacing);

  const concreteVol = L * W * D;
  const coverDed = cv * (isMetric ? 0.001 : 1/12);
  const clearL = L - 2 * coverDed;
  const clearW = W - 2 * coverDed;
  const hookUnit = (D - 2 * coverDed) * (isMetric ? 1000 : 12);

  const botMainSpUnit = botMainSp * (isMetric ? 0.001 : 1/12);
  const botDistSpUnit = botDistSp * (isMetric ? 0.001 : 1/12);
  const topMainSpUnit = topMainSp * (isMetric ? 0.001 : 1/12);
  const topDistSpUnit = topDistSp * (isMetric ? 0.001 : 1/12);

  const botMainCount = calcBarsCount(clearW, botMainSpUnit, 2);
  const botDistCount = calcBarsCount(clearL, botDistSpUnit, 2);
  const topMainCount = calcBarsCount(clearW, topMainSpUnit, 2);
  const topDistCount = calcBarsCount(clearL, topDistSpUnit, 2);

  const clearLUnit = clearL * (isMetric ? 1000 : 12);
  const clearWUnit = clearW * (isMetric ? 1000 : 12);

  // Bottom mesh
  addItem(list, 'FM-B1', 'Bottom Mesh Main Bars (X-Direction)', botMainDia, '21', hookUnit, clearLUnit, hookUnit, 0, 0, 1, botMainCount, isMetric,
    [`Foundation mesh — bottom main (X)`, `${botMainCount} bars φ${botMainDia} @ ${botMainSp} mm`]);
  addItem(list, 'FM-B2', 'Bottom Mesh Distribution Bars (Y-Direction)', botDistDia, '21', hookUnit, clearWUnit, hookUnit, 0, 0, 1, botDistCount, isMetric,
    [`Foundation mesh — bottom distribution (Y)`, `${botDistCount} bars φ${botDistDia} @ ${botDistSp} mm`]);

  // Top mesh
  addItem(list, 'FM-T1', 'Top Mesh Main Bars (X-Direction)', topMainDia, '21', hookUnit, clearLUnit, hookUnit, 0, 0, 1, topMainCount, isMetric,
    [`Foundation mesh — top main (X)`, `${topMainCount} bars φ${topMainDia} @ ${topMainSp} mm`]);
  addItem(list, 'FM-T2', 'Top Mesh Distribution Bars (Y-Direction)', topDistDia, '21', hookUnit, clearWUnit, hookUnit, 0, 0, 1, topDistCount, isMetric,
    [`Foundation mesh — top distribution (Y)`, `${topDistCount} bars φ${topDistDia} @ ${topDistSp} mm`]);

  const totalSteelWeight = list.reduce((s, i) => s + i.totalWeight, 0);
  return {
    rebarList: list,
    concreteVolume: cleanNum(parseFloat(concreteVol.toFixed(3))),
    totalSteelWeight: cleanNum(parseFloat(totalSteelWeight.toFixed(2))),
    steelWeightByDia: getSteelWeightByDia(list, isMetric)
  };
}
