import { BBSOutput, BBSRebarItem } from '../types';
import { addItem, calcBarsCount, cleanNum, getSteelWeightByDia } from './shared';
import { DesignStandard } from '../engine/types';

export interface FootingSection {
  label: string;
  length: number; width: number; thickness: number; cover: number;
  includeBottomBars: boolean; botMainDia: number; botMainSpacing: number;
  botDistDia: number; botDistSpacing: number;
  includeTopBars: boolean; topMainDia: number; topMainSpacing: number;
  topDistDia: number; topDistSpacing: number;
}

export interface CombinedFootingInputs {
  footings: FootingSection[];
}

export function calculateCombinedFooting(inputs: CombinedFootingInputs, isMetric: boolean, standard: DesignStandard = 'ACI 318'): BBSOutput {
  const list: BBSRebarItem[] = [];
  let concreteVol = 0;

  const sections = Array.isArray(inputs.footings) ? inputs.footings : [];

  sections.forEach((footing, index) => {
    const footingLabel = String(footing.label || `F${index + 1}`).trim() || `F${index + 1}`;
    const footingLength = Number(footing.length) || 0;
    const footingWidth = Number(footing.width) || 0;
    const thk = Number(footing.thickness) || 0;
    const cv = Number(footing.cover) || 0;
    const includeBottomBars = Boolean(footing.includeBottomBars);
    const includeTopBars = Boolean(footing.includeTopBars);

    concreteVol += footingLength * footingWidth * thk;

    const botMainDia = Number(footing.botMainDia) || 0;
    const botMainSp = Number(footing.botMainSpacing) || 0;
    const botDistDia = Number(footing.botDistDia) || 0;
    const botDistSp = Number(footing.botDistSpacing) || 0;
    const topMainDia = Number(footing.topMainDia) || 0;
    const topMainSp = Number(footing.topMainSpacing) || 0;
    const topDistDia = Number(footing.topDistDia) || 0;
    const topDistSp = Number(footing.topDistSpacing) || 0;

    const botMainSpUnit = botMainSp * (isMetric ? 0.001 : 1/12);
    const botDistSpUnit = botDistSp * (isMetric ? 0.001 : 1/12);
    const topMainSpUnit = topMainSp * (isMetric ? 0.001 : 1/12);
    const topDistSpUnit = topDistSp * (isMetric ? 0.001 : 1/12);
    const coverDed = cv * (isMetric ? 0.001 : 1/12);
    const clearL = footingLength - 2 * coverDed;
    const clearW = footingWidth - 2 * coverDed;
    const clearThk = thk - 2 * coverDed;
    const clearLUnit = clearL * (isMetric ? 1000 : 12);
    const clearWUnit = clearW * (isMetric ? 1000 : 12);
    const hookUnit = clearThk * (isMetric ? 1000 : 12);

    if (includeBottomBars) {
      const botMainCount = calcBarsCount(clearW, botMainSpUnit, 2);
      const botDistCount = calcBarsCount(clearL, botDistSpUnit, 2);
      addItem(list, `${footingLabel}-B1`, `${footingLabel} Bottom Mesh Main`, botMainDia, '21', hookUnit, clearLUnit, hookUnit, 0, 0, 1, botMainCount, isMetric,
        [`Combined footing section ${footingLabel} — bottom main mesh`, `Dimensions: ${clearL.toFixed(2)} × ${clearW.toFixed(2)} m`]);
      addItem(list, `${footingLabel}-B2`, `${footingLabel} Bottom Mesh Dist`, botDistDia, '21', hookUnit, clearWUnit, hookUnit, 0, 0, 1, botDistCount, isMetric);
    }
    if (includeTopBars) {
      const topMainCount = calcBarsCount(clearW, topMainSpUnit, 2);
      const topDistCount = calcBarsCount(clearL, topDistSpUnit, 2);
      addItem(list, `${footingLabel}-T1`, `${footingLabel} Top Mesh Main`, topMainDia, '21', hookUnit, clearLUnit, hookUnit, 0, 0, 1, topMainCount, isMetric,
        [`Combined footing section ${footingLabel} — top mesh reinforcement`]);
      addItem(list, `${footingLabel}-T2`, `${footingLabel} Top Mesh Dist`, topDistDia, '21', hookUnit, clearWUnit, hookUnit, 0, 0, 1, topDistCount, isMetric);
    }
  });

  const totalSteelWeight = list.reduce((s, i) => s + i.totalWeight, 0);
  return {
    rebarList: list,
    concreteVolume: cleanNum(parseFloat(concreteVol.toFixed(3))),
    totalSteelWeight: cleanNum(parseFloat(totalSteelWeight.toFixed(2))),
    steelWeightByDia: getSteelWeightByDia(list, isMetric)
  };
}
