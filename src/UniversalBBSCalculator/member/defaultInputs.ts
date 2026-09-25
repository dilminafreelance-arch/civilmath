import { StructureType } from '../types';
import type { FootingInputs } from '../modules/Footing';
import type { CombinedFootingInputs } from '../modules/CombinedFooting';
import type { ColumnInputs } from '../modules/Column';
import type { BeamInputs } from '../modules/Beam';
import type { SlabInputs } from '../modules/Slab';
import type { StaircaseInputs } from '../modules/Staircase';
import type { RetainingWallInputs } from '../modules/RetainingWall';
import type { RaftFoundationInputs } from '../modules/RaftFoundation';
import type { PedestalInputs } from '../modules/Pedestal';
import type { StripFootingInputs } from '../modules/StripFooting';
import type { FoundationMeshInputs } from '../modules/FoundationMesh';
import type { GenericBeamInputs } from '../modules/GenericBeam';

export const getDefaultInputs = (type: StructureType, isMetric: boolean): Record<string, any> => {
  const m = (val: number) => isMetric ? val : parseFloat((val * 3.28084).toFixed(2));
  const mm = (val: number) => isMetric ? val : parseFloat((val / 25.4).toFixed(1));
  switch (type) {
    case 'footing': return { length: m(2.0), width: m(2.0), depth: m(0.45), cover: mm(50), mainDia: 12, mainSpacing: mm(150), distDia: 10, distSpacing: mm(150), padType: 'pad' } as FootingInputs;
    case 'combined-footing': return { footings: [{ label: 'F1', length: m(2.6), width: m(2.4), thickness: m(0.65), cover: mm(50), includeBottomBars: true, botMainDia: 16, botMainSpacing: mm(150), botDistDia: 12, botDistSpacing: mm(150), includeTopBars: true, topMainDia: 16, topMainSpacing: mm(150), topDistDia: 12, topDistSpacing: mm(200) }] } as CombinedFootingInputs;
    case 'column': return { height: m(3.4), width: m(0.4), depth: m(0.4), cover: mm(40), mainDia: 16, mainCount: 6, tieDia: 8, tieSpacing: mm(150), lapLengthFactor: 50, embedment: mm(600) } as ColumnInputs;
    case 'beam': return { span: m(4.8), width: m(0.3), depth: m(0.5), cover: mm(30), topDia: 12, topCount: 2, botDia: 16, botCount: 3, stirrupDia: 8, stirrupSpacing: mm(150), hookLengthFactor: 10 } as BeamInputs;
    case 'plinth-beam': return { length: m(5.0), width: m(0.3), depth: m(0.35), cover: mm(30), topDia: 12, topCount: 3, botDia: 16, botCount: 3, stirrupDia: 8, stirrupSpacing: mm(150) } as GenericBeamInputs;
    case 'tie-beam': return { length: m(3.8), width: m(0.25), depth: m(0.3), cover: mm(30), topDia: 12, topCount: 2, botDia: 12, botCount: 2, stirrupDia: 8, stirrupSpacing: mm(200) } as GenericBeamInputs;
    case 'lintel-beam': return { clearSpan: m(1.8), bearing: m(0.23), width: m(0.23), depth: m(0.23), cover: mm(25), topDia: 10, topCount: 2, botDia: 12, botCount: 2, stirrupDia: 6, stirrupSpacing: mm(150), isLintel: true } as GenericBeamInputs;
    case 'slab': return { length: m(5.5), width: m(4.2), thickness: mm(150), cover: mm(20), mainDia: 10, mainSpacing: mm(150), distDia: 8, distSpacing: mm(180), crankAngle: 45, chairDia: 10, chairCount: 15 } as SlabInputs;
    case 'staircase': return { waistSlab: mm(150), cover: mm(20), riser: mm(150), tread: mm(250), steps: 10, landingTop: m(1.0), landingBot: m(1.0), mainDia: 12, mainSpacing: mm(150), distDia: 10, distSpacing: mm(200), landingWidth: m(1.2) } as StaircaseInputs;
    case 'retaining-wall': return { stemHeight: m(3.2), stemBaseThk: m(0.35), stemTopThk: m(0.2), baseLength: m(2.2), baseThk: m(0.4), cover: mm(50), vertDia: 16, vertSpacing: mm(150), horizDia: 10, horizSpacing: mm(200) } as RetainingWallInputs;
    case 'raft-foundation': return { length: m(12.0), width: m(10.0), thickness: m(0.8), cover: mm(50), botMainDia: 20, botMainSpacing: mm(150), botDistDia: 16, botDistSpacing: mm(150), topMainDia: 16, topMainSpacing: mm(150), topDistDia: 12, topDistSpacing: mm(200), chairDia: 16, chairSpacing: m(1.0) } as RaftFoundationInputs;
    case 'pedestal': return { height: m(1.2), width: m(0.4), depth: m(0.4), cover: mm(40), mainDia: 16, mainCount: 4, tieDia: 8, tieSpacing: mm(150), starterHook: mm(300) } as PedestalInputs;
    case 'strip-footing': return { length: m(15.0), width: m(0.9), thickness: m(0.35), cover: mm(50), longitudinalDia: 12, longitudinalCount: 5, transverseDia: 10, transverseSpacing: mm(150) } as StripFootingInputs;
    case 'foundation-mesh': return { length: m(3.5), width: m(3.5), depth: m(0.6), cover: mm(50), botMainDia: 16, botMainSpacing: mm(150), botDistDia: 12, botDistSpacing: mm(150), topMainDia: 12, topMainSpacing: mm(200), topDistDia: 10, topDistSpacing: mm(200) } as FoundationMeshInputs;
  }
};
