import { BBSOutput, BBSRebarItem } from '../types';
import { addItem, calcBarsCount, cleanNum, getSteelWeightByDia } from './shared';
import { DesignStandard } from '../engine/types';

export interface BeamInputs {
  span: number; width: number; depth: number; cover: number;
  topDia: number; topCount: number; botDia: number; botCount: number;
  sideDia?: number; sideCount?: number;
  stirrupDia: number; stirrupSpacing: number; hookLengthFactor: number;
  extraTopDia?: number; extraTopCount?: number;
  extraBotDia?: number; extraBotCount?: number;
  bentUpDia?: number; bentUpCount?: number;
  stirrupEndSpacing?: number; // closer spacing at supports
  supportZoneLength?: number;
}

export function calculateBeam(inputs: BeamInputs, isMetric: boolean, standard: DesignStandard = 'ACI 318'): BBSOutput {
  const list: BBSRebarItem[] = [];
  const getNum = (val: number | undefined, fallback = 0) => val ?? fallback;

  const span = getNum(inputs.span);
  const width = getNum(inputs.width);
  const depth = getNum(inputs.depth);
  const cv = getNum(inputs.cover);
  const topDia = getNum(inputs.topDia);
  const topCount = getNum(inputs.topCount);
  const botDia = getNum(inputs.botDia);
  const botCount = getNum(inputs.botCount);
  const stirrupDia = getNum(inputs.stirrupDia);
  const stirrupSp = getNum(inputs.stirrupSpacing);
  const hookF = getNum(inputs.hookLengthFactor);
  const extraTopDia = getNum(inputs.extraTopDia);
  const extraTopCount = getNum(inputs.extraTopCount);
  const extraBotDia = getNum(inputs.extraBotDia);
  const extraBotCount = getNum(inputs.extraBotCount);
  const sideDia = getNum(inputs.sideDia);
  const sideCount = getNum(inputs.sideCount);
  const endSp = getNum(inputs.stirrupEndSpacing, stirrupSp);

  const concreteVol = span * width * depth;
  const clearSpanMm = span * (isMetric ? 1000 : 12) - 2 * cv;
  const clearBMm = width * (isMetric ? 1000 : 12) - 2 * cv;
  const clearDMm = depth * (isMetric ? 1000 : 12) - 2 * cv;

  const hookL = hookF * topDia;
  const hookLBot = hookF * botDia;

  // Top reinforcement — continuous through span with hooks
  addItem(list, 'B1-01', 'Top Continuous Support Bars', topDia, '21', hookL, clearSpanMm, hookL, 0, 0, 1, topCount, isMetric,
    [`Beam top longitudinal reinforcement`, `Hook length: ${hookF}×d = ${hookL} mm each end`]);

  // Bottom reinforcement — continuous
  addItem(list, 'B1-02', 'Bottom Continuous Tensile Bars', botDia, '21', hookLBot, clearSpanMm, hookLBot, 0, 0, 1, botCount, isMetric,
    [`Beam bottom longitudinal reinforcement`, `Clear span between supports: ${clearSpanMm.toFixed(0)} mm`]);

  // Extra top bars at supports (negative moment)
  if (extraTopCount > 0 && extraTopDia > 0) {
    const extraLen = Math.min(clearSpanMm / 3, 5000); // curtail at L/3
    addItem(list, 'B1-03', 'Extra Top Support Bars (Negative Moment)', extraTopDia, '11', extraLen, 0, 0, 0, 0, 1, extraTopCount, isMetric,
      [`Extra top bars at supports for negative moment`, `Curtailment: span/3 = ${(clearSpanMm / 3).toFixed(0)} mm`]);
  }

  // Extra bottom bars at midspan (positive moment)
  if (extraBotCount > 0 && extraBotDia > 0) {
    const extraLen = Math.min(clearSpanMm / 2, 6000);
    addItem(list, 'B1-04', 'Extra Bottom Bars (Midspan Positive)', extraBotDia, '11', extraLen, 0, 0, 0, 0, 1, extraBotCount, isMetric,
      [`Extra bottom bars at midspan for positive moment`]);
  }

  // Side face bars for deep beams
  if (sideCount > 0 && sideDia > 0) {
    addItem(list, 'B1-05', 'Side Face Temperature Bars', sideDia, '00', clearSpanMm, 0, 0, 0, 0, 1, sideCount, isMetric,
      [`Side face bars for beams > 750mm depth`, `Total: ${sideCount} bars along beam sides`]);
  }

  // Stirrups — variable spacing (closer at supports)
  const stirCountMid = calcBarsCount(span * (isMetric ? 1000 : 12), stirrupSp, 2);
  const totalStirrups = stirCountMid;

  addItem(list, 'B1-06', 'Shear Stirrup Links', stirrupDia, '51', clearBMm, clearDMm, 0, 0, 0, 1, totalStirrups, isMetric,
    [`Beam shear reinforcement — closed stirrups`, `Stirrup spacing: ${stirrupSp} mm (${endSp} mm at supports)`,
     `Stirrup dimensions: ${clearBMm.toFixed(0)} × ${clearDMm.toFixed(0)} mm (c/c)`]);

  const totalSteelWeight = list.reduce((s, i) => s + i.totalWeight, 0);
  return {
    rebarList: list,
    concreteVolume: cleanNum(parseFloat(concreteVol.toFixed(3))),
    totalSteelWeight: cleanNum(parseFloat(totalSteelWeight.toFixed(2))),
    steelWeightByDia: getSteelWeightByDia(list, isMetric)
  };
}
