import { StructureType, BBSOutput } from '../types';
import { UnitSystem } from '../../types';
import { DesignStandard } from '../engine/types';

import { calculateFooting, FootingInputs } from './Footing';
import { calculateCombinedFooting, CombinedFootingInputs } from './CombinedFooting';
import { calculateColumn, ColumnInputs } from './Column';
import { calculateBeam, BeamInputs } from './Beam';
import { calculateSlab, SlabInputs } from './Slab';
import { calculateStaircase, StaircaseInputs } from './Staircase';
import { calculateRetainingWall, RetainingWallInputs } from './RetainingWall';
import { calculateRaftFoundation, RaftFoundationInputs } from './RaftFoundation';
import { calculatePedestal, PedestalInputs } from './Pedestal';
import { calculateStripFooting, StripFootingInputs } from './StripFooting';
import { calculateFoundationMesh, FoundationMeshInputs } from './FoundationMesh';
import { calculateGenericBeam, GenericBeamInputs } from './GenericBeam';

export type StructureInputs =
  | FootingInputs
  | CombinedFootingInputs
  | ColumnInputs
  | BeamInputs
  | SlabInputs
  | StaircaseInputs
  | RetainingWallInputs
  | RaftFoundationInputs
  | PedestalInputs
  | StripFootingInputs
  | FoundationMeshInputs
  | GenericBeamInputs;

export function calculateBBS(
  structureType: StructureType,
  inputs: Record<string, any>,
  isMetric: boolean,
  standard: DesignStandard = 'ACI 318'
): BBSOutput {
  switch (structureType) {
    case 'footing':
      return calculateFooting(inputs as FootingInputs, isMetric, standard);
    case 'combined-footing':
      return calculateCombinedFooting(inputs as CombinedFootingInputs, isMetric, standard);
    case 'column':
      return calculateColumn(inputs as ColumnInputs, isMetric, standard);
    case 'beam':
      return calculateBeam(inputs as BeamInputs, isMetric, standard);
    case 'plinth-beam':
      return calculateGenericBeam({ ...inputs as GenericBeamInputs, isLintel: false }, isMetric, 'Plinth Beam', standard);
    case 'tie-beam':
      return calculateGenericBeam({ ...inputs as GenericBeamInputs, isLintel: false }, isMetric, 'Tie Beam', standard);
    case 'lintel-beam':
      return calculateGenericBeam({ ...inputs as GenericBeamInputs, isLintel: true }, isMetric, 'Lintel Beam', standard);
    case 'slab':
      return calculateSlab(inputs as SlabInputs, isMetric, standard);
    case 'staircase':
      return calculateStaircase(inputs as StaircaseInputs, isMetric, standard);
    case 'retaining-wall':
      return calculateRetainingWall(inputs as RetainingWallInputs, isMetric, standard);
    case 'raft-foundation':
      return calculateRaftFoundation(inputs as RaftFoundationInputs, isMetric, standard);
    case 'pedestal':
      return calculatePedestal(inputs as PedestalInputs, isMetric, standard);
    case 'strip-footing':
      return calculateStripFooting(inputs as StripFootingInputs, isMetric, standard);
    case 'foundation-mesh':
      return calculateFoundationMesh(inputs as FoundationMeshInputs, isMetric, standard);
    default:
      return { rebarList: [], concreteVolume: 0, totalSteelWeight: 0, steelWeightByDia: {} };
  }
}

export { getRebarData, METRIC_REBAR_OPTIONS, IMPERIAL_REBAR_OPTIONS } from './shared';
export type { FootingInputs } from './Footing';
export type { CombinedFootingInputs } from './CombinedFooting';
export type { ColumnInputs } from './Column';
export type { BeamInputs } from './Beam';
export type { SlabInputs } from './Slab';
export type { StaircaseInputs } from './Staircase';
export type { RetainingWallInputs } from './RetainingWall';
export type { RaftFoundationInputs } from './RaftFoundation';
export type { PedestalInputs } from './Pedestal';
export type { StripFootingInputs } from './StripFooting';
export type { FoundationMeshInputs } from './FoundationMesh';
export type { GenericBeamInputs } from './GenericBeam';
