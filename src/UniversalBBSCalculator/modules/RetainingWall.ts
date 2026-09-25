import { BBSOutput, BBSRebarItem, RetainingWallSubType } from '../types';
import { addItem, calcBarsCount, cleanNum, getSteelWeightByDia } from './shared';
import { DesignStandard } from '../engine/types';

export interface RetainingWallInputs {
  stemHeight: number; stemBaseThk: number; stemTopThk: number;
  baseLength: number; baseThk: number; cover: number;
  vertDia: number; vertSpacing: number; horizDia: number; horizSpacing: number;
  keyDepth?: number;
  subType?: RetainingWallSubType;
  heelDia?: number; heelSpacing?: number;
  toeDia?: number; toeSpacing?: number;
  shearKeyDia?: number; shearKeySpacing?: number;
}

export function calculateRetainingWall(inputs: RetainingWallInputs, isMetric: boolean, standard: DesignStandard = 'ACI 318'): BBSOutput {
  const list: BBSRebarItem[] = [];
  const getNum = (val: number | undefined, fallback = 0) => val ?? fallback;

  const stemH = getNum(inputs.stemHeight);
  const stemB = getNum(inputs.stemBaseThk);
  const stemT = getNum(inputs.stemTopThk);
  const baseL = getNum(inputs.baseLength);
  const baseThk = getNum(inputs.baseThk);
  const cv = getNum(inputs.cover);
  const vertDia = getNum(inputs.vertDia);
  const vertSp = getNum(inputs.vertSpacing);
  const horizDia = getNum(inputs.horizDia);
  const horizSp = getNum(inputs.horizSpacing);
  const keyD = getNum(inputs.keyDepth);

  // Concrete volume = stem (trapezoid) + base slab
  const concreteVol = ((0.5 * (stemB + stemT) * stemH) + (baseL * baseThk));

  // Stem vertical reinforcement per meter width
  const stemVertCount = calcBarsCount(isMetric ? 1000 : 12, vertSp, 2);
  const stemHorizCount = calcBarsCount(stemH * (isMetric ? 1000 : 12), horizSp, 2);
  const vertStemL = stemH * (isMetric ? 1000 : 12);
  const vertBaseHook = baseThk * (isMetric ? 1000 : 12) - cv;

  // Main vertical bars — L-shaped with hook into base
  addItem(list, 'RW-01', 'Stem Main Vertical Reinforcement (Tension Face)', vertDia, '11', vertStemL, vertBaseHook, 0, 0, 0, 1, stemVertCount, isMetric,
    [`Stem vertical bars — L-bar extending into base slab`,
     `Stem height: ${vertStemL.toFixed(0)} mm, Base hook: ${vertBaseHook.toFixed(0)} mm`]);

  // Horizontal distribution bars
  const wallRunningLen = isMetric ? 1000 : 12;
  addItem(list, 'RW-02', 'Horizontal Distribution Bars (Both Faces)', horizDia, '00', wallRunningLen, 0, 0, 0, 0, 1, stemHorizCount * 2, isMetric,
    [`Horizontal distribution steel on both faces of stem`,
     `Per meter length: ${stemHorizCount} bars each face × 1m = ${stemHorizCount * 2} bars total`]);

  // Heel reinforcement
  const heelDia = getNum(inputs.heelDia, vertDia);
  const heelSp = getNum(inputs.heelSpacing, vertSp);
  if (heelDia > 0 && heelSp > 0) {
    const heelLen = baseL * (isMetric ? 1000 : 12) * 0.5; // heel is ~half base
    const heelCount = calcBarsCount(isMetric ? 1000 : 12, heelSp, 2);
    addItem(list, 'RW-03', 'Heel Slab Top Reinforcement', heelDia, '11', heelLen, 12 * heelDia, 0, 0, 0, 1, heelCount, isMetric,
      [`Heel reinforcement — top mat to resist negative moment`]);
  }

  // Toe reinforcement
  const toeDia = getNum(inputs.toeDia, vertDia);
  const toeSp = getNum(inputs.toeSpacing, vertSp);
  if (toeDia > 0 && toeSp > 0) {
    const toeLen = baseL * (isMetric ? 1000 : 12) * 0.3;
    const toeCount = calcBarsCount(isMetric ? 1000 : 12, toeSp, 2);
    addItem(list, 'RW-04', 'Toe Slab Bottom Reinforcement', toeDia, '11', toeLen, 12 * toeDia, 0, 0, 0, 1, toeCount, isMetric,
      [`Toe reinforcement — bottom mat for positive moment`]);
  }

  // Shear key reinforcement
  if (keyD > 0) {
    const keyDia = getNum(inputs.shearKeyDia, vertDia);
    const keySp = getNum(inputs.shearKeySpacing, vertSp);
    const keyCount = calcBarsCount(isMetric ? 1000 : 12, keySp, 2);
    const keyH = keyD * (isMetric ? 1000 : 12);
    addItem(list, 'RW-05', 'Shear Key Reinforcement', keyDia, '21', 12 * keyDia, keyH, 12 * keyDia, 0, 0, 1, keyCount, isMetric,
      [`Shear key bars — improve sliding resistance`, `Key depth: ${keyD} m`]);
  }

  const totalSteelWeight = list.reduce((s, i) => s + i.totalWeight, 0);
  return {
    rebarList: list,
    concreteVolume: cleanNum(parseFloat(concreteVol.toFixed(3))),
    totalSteelWeight: cleanNum(parseFloat(totalSteelWeight.toFixed(2))),
    steelWeightByDia: getSteelWeightByDia(list, isMetric)
  };
}
