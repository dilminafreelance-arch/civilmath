import { BBSOutput, BBSRebarItem } from '../types';
import { addItem, calcBarsCount, cleanNum, getRebarData, getSteelWeightByDia } from './shared';
import { DesignStandard } from '../engine/types';

export interface RaftFoundationInputs {
  length: number; width: number; thickness: number; cover: number;
  botMainDia: number; botMainSpacing: number; botDistDia: number; botDistSpacing: number;
  topMainDia: number; topMainSpacing: number; topDistDia: number; topDistSpacing: number;
  chairDia: number; chairSpacing: number;
}

export function calculateRaftFoundation(inputs: RaftFoundationInputs, isMetric: boolean, standard: DesignStandard = 'ACI 318'): BBSOutput {
  const list: BBSRebarItem[] = [];
  const getNum = (val: number | undefined, fallback = 0) => val ?? fallback;

  const L = getNum(inputs.length);
  const W = getNum(inputs.width);
  const thk = getNum(inputs.thickness);
  const cv = getNum(inputs.cover);
  const botMainDia = getNum(inputs.botMainDia);
  const botMainSp = getNum(inputs.botMainSpacing);
  const botDistDia = getNum(inputs.botDistDia);
  const botDistSp = getNum(inputs.botDistSpacing);
  const topMainDia = getNum(inputs.topMainDia);
  const topMainSp = getNum(inputs.topMainSpacing);
  const topDistDia = getNum(inputs.topDistDia);
  const topDistSp = getNum(inputs.topDistSpacing);
  const chairDia = getNum(inputs.chairDia);
  const chairSp = getNum(inputs.chairSpacing);

  const concreteVol = L * W * thk;

  const botMainSpUnit = botMainSp * (isMetric ? 0.001 : 1/12);
  const botDistSpUnit = botDistSp * (isMetric ? 0.001 : 1/12);
  const topMainSpUnit = topMainSp * (isMetric ? 0.001 : 1/12);
  const topDistSpUnit = topDistSp * (isMetric ? 0.001 : 1/12);

  const coverDed = cv * (isMetric ? 0.001 : 1/12);
  const clearL = L - 2 * coverDed;
  const clearW = W - 2 * coverDed;
  const clearThk = thk - 2 * coverDed;

  const botMainCount = calcBarsCount(clearW, botMainSpUnit, 2);
  const botDistCount = calcBarsCount(clearL, botDistSpUnit, 2);
  const topMainCount = calcBarsCount(clearW, topMainSpUnit, 2);
  const topDistCount = calcBarsCount(clearL, topDistSpUnit, 2);

  const clearLUnit = clearL * (isMetric ? 1000 : 12);
  const clearWUnit = clearW * (isMetric ? 1000 : 12);
  const hookUnit = clearThk * (isMetric ? 1000 : 12);

  // Bottom mesh
  addItem(list, 'RF-B1', 'Bottom Mesh Main Bars (X-Direction)', botMainDia, '21', hookUnit, clearLUnit, hookUnit, 0, 0, 1, botMainCount, isMetric,
    [`Raft bottom main reinforcement — X direction`, `Effective length: ${clearL.toFixed(2)} m, ${botMainCount} bars @ ${botMainSp} mm`]);
  addItem(list, 'RF-B2', 'Bottom Mesh Distribution Bars (Y-Direction)', botDistDia, '21', hookUnit, clearWUnit, hookUnit, 0, 0, 1, botDistCount, isMetric,
    [`Raft bottom distribution — Y direction`, `Effective width: ${clearW.toFixed(2)} m, ${botDistCount} bars @ ${botDistSp} mm`]);

  // Top mesh
  addItem(list, 'RF-T1', 'Top Mesh Main Bars (X-Direction)', topMainDia, '21', hookUnit, clearLUnit, hookUnit, 0, 0, 1, topMainCount, isMetric,
    [`Raft top main reinforcement — X direction`, `${topMainCount} bars @ ${topMainSp} mm`]);
  addItem(list, 'RF-T2', 'Top Mesh Distribution Bars (Y-Direction)', topDistDia, '21', hookUnit, clearWUnit, hookUnit, 0, 0, 1, topDistCount, isMetric,
    [`Raft top distribution — Y direction`, `${topDistCount} bars @ ${topDistSp} mm`]);

  // Chair supports
  const totalChairs = chairSp > 0 ? Math.max(4, Math.floor((L * W) / (chairSp * chairSp))) : 4;
  const chairHead = isMetric ? 300 : 12;
  const chairLeg = isMetric ? 300 : 12;
  const botDmm = getRebarData(botMainDia, isMetric).diaMm;
  const topDmm = getRebarData(topMainDia, isMetric).diaMm;
  const chairHeight = thk * (isMetric ? 1000 : 12) - (2 * cv) - (botDmm + topDmm) * (isMetric ? 2 : 2/25.4);

  addItem(list, 'RF-C1', 'Chair Supports (Top/Bottom Mesh)', chairDia, '61', chairHead, chairHeight, chairLeg, 0, 0, 1, totalChairs, isMetric,
    [`Raft chair supports — maintain spacing between top and bottom mats`,
     `Chair height: ${chairHeight.toFixed(0)} mm, Total chairs: ${totalChairs} @ ${chairSp} m grid`]);

  const totalSteelWeight = list.reduce((s, i) => s + i.totalWeight, 0);
  return {
    rebarList: list,
    concreteVolume: cleanNum(parseFloat(concreteVol.toFixed(3))),
    totalSteelWeight: cleanNum(parseFloat(totalSteelWeight.toFixed(2))),
    steelWeightByDia: getSteelWeightByDia(list, isMetric)
  };
}
