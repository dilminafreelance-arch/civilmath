import { BBSOutput, BBSRebarItem, StairSubType } from '../types';
import { addItem, calcBarsCount, cleanNum, getSteelWeightByDia } from './shared';
import { DesignStandard } from '../engine/types';

export interface StaircaseInputs {
  waistSlab: number; cover: number; riser: number; tread: number;
  steps: number; landingTop: number; landingBot: number;
  mainDia: number; mainSpacing: number; distDia: number; distSpacing: number;
  landingWidth: number;
  subType?: StairSubType;
  landingReinfDia?: number; landingReinfSpacing?: number;
}

export function calculateStaircase(inputs: StaircaseInputs, isMetric: boolean, standard: DesignStandard = 'ACI 318'): BBSOutput {
  const list: BBSRebarItem[] = [];
  const getNum = (val: number | undefined, fallback = 0) => val ?? fallback;

  const waist = getNum(inputs.waistSlab);
  const cv = getNum(inputs.cover);
  const riser = getNum(inputs.riser);
  const tread = getNum(inputs.tread);
  const steps = getNum(inputs.steps);
  const topLanding = getNum(inputs.landingTop);
  const botLanding = getNum(inputs.landingBot);
  const landWidth = getNum(inputs.landingWidth);
  const mainDia = getNum(inputs.mainDia);
  const mainSp = getNum(inputs.mainSpacing);
  const distDia = getNum(inputs.distDia);
  const distSp = getNum(inputs.distSpacing);

  const going = steps * tread;
  const height = steps * riser;
  const waistSlabL = Math.sqrt(going * going + height * height) / (isMetric ? 1000 : 12);
  const landingL = topLanding + botLanding;
  const waistM = waist * (isMetric ? 0.001 : 1/12);

  // Concrete volume = waist volume + landing volume + step triangles
  const concreteVol = ((waistSlabL + landingL) * landWidth * waistM) +
    (0.5 * (riser * (isMetric ? 0.001 : 1/12)) * (tread * (isMetric ? 0.001 : 1/12)) * steps * landWidth);

  const inclUnit = Math.sqrt(going * going + height * height);
  const totalLenMain = inclUnit + (topLanding * (isMetric ? 1000 : 12)) + (botLanding * (isMetric ? 1000 : 12)) - 2 * cv;

  // Main longitudinal reinforcement (inclined along waist)
  const mainBarsCount = calcBarsCount(landWidth * (isMetric ? 1000 : 12) - 2 * cv, mainSp, 2);
  addItem(list, 'ST-01', 'Main Longitudinal Inclined Steel (Waist + Landings)', mainDia, '21', 12 * mainDia, totalLenMain, 12 * mainDia, 0, 0, 1, mainBarsCount, isMetric,
    [`Staircase main reinforcement along inclined waist slab`,
     `Total inclined length: ${inclUnit.toFixed(0)} mm (going: ${going} mm, rise: ${height} mm)`,
     `Landing extension: ${(topLanding * (isMetric ? 1000 : 12)).toFixed(0)} + ${(botLanding * (isMetric ? 1000 : 12)).toFixed(0)} mm`]);

  // Distribution bars (perpendicular to flight direction)
  const distSpacedLen = waistSlabL * (isMetric ? 1000 : 12) + landingL * (isMetric ? 1000 : 12);
  const distBarsCount = calcBarsCount(distSpacedLen, distSp, 2);
  addItem(list, 'ST-02', 'Distribution Bars (Transverse to Flight)', distDia, '00', landWidth * (isMetric ? 1000 : 12) - 2 * cv, 0, 0, 0, 0, 1, distBarsCount, isMetric,
    [`Staircase distribution steel perpendicular to main bars`,
     `Total distribution length: ${distSpacedLen.toFixed(0)} mm`]);

  // Landing additional reinforcement
  const landingDia = getNum(inputs.landingReinfDia, distDia);
  const landingSp = getNum(inputs.landingReinfSpacing, distSp);
  if (landingDia > 0 && landingSp > 0) {
    const landingLen = (topLanding + botLanding) * (isMetric ? 1000 : 12);
    const landingBarCount = calcBarsCount(landingLen, landingSp, 2);
    addItem(list, 'ST-03', 'Landing Additional Reinforcement', landingDia, '00', landWidth * (isMetric ? 1000 : 12) - 2 * cv, 0, 0, 0, 0, 1, landingBarCount, isMetric,
      [`Additional landing reinforcement for support moments`]);
  }

  const totalSteelWeight = list.reduce((s, i) => s + i.totalWeight, 0);
  return {
    rebarList: list,
    concreteVolume: cleanNum(parseFloat(concreteVol.toFixed(3))),
    totalSteelWeight: cleanNum(parseFloat(totalSteelWeight.toFixed(2))),
    steelWeightByDia: getSteelWeightByDia(list, isMetric)
  };
}
