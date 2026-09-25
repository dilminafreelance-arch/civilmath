export type BOQSection =
  | 'project-info'
  | 'foundations'
  | 'columns'
  | 'beams'
  | 'slabs'
  | 'stairs'
  | 'retaining-walls'
  | 'brick-walls'
  | 'materials'
  | 'boq'
  | 'dashboard';

export interface ProjectInfo {
  name: string;
  number: string;
  client: string;
  consultant: string;
  contractor: string;
  location: string;
  preparedBy: string;
  date: string;
  wastePercent: number;
  concreteGrade: string;
  steelGrade: string;
  notes: string;
}

export function defaultProjectInfo(): ProjectInfo {
  return {
    name: '',
    number: '',
    client: '',
    consultant: '',
    contractor: '',
    location: '',
    preparedBy: '',
    date: new Date().toISOString().slice(0, 10),
    wastePercent: 5,
    concreteGrade: 'M25',
    steelGrade: 'Fe500',
    notes: '',
  };
}

export interface FoundationBOQ {
  id: string;
  label: string;
  count: number;
  length: number;
  width: number;
  depth: number;
  concreteGrade: string;
  topReinf: string;
  botReinf: string;
  starterBars: string;
  cover: number;
  spacing: number;

  concreteVolume: number;
  cementBags: number;
  sandVolume: number;
  aggregateVolume: number;
  steelWeight: number;
  tieWire: number;
  cost: number;
}

export interface ColumnBOQ {
  id: string;
  label: string;
  count: number;
  width: number;
  depth: number;
  height: number;
  mainBars: string;
  cornerBars: number;
  sideBars: number;
  tieDia: number;
  tieSpacing: number;
  concreteGrade: string;

  concreteVolume: number;
  verticalBarsWeight: number;
  tieBarsWeight: number;
  steelWeight: number;
  bindingWire: number;
  cost: number;
}

export interface BeamBOQ {
  id: string;
  label: string;
  count: number;
  length: number;
  width: number;
  depth: number;
  topBars: string;
  bottomBars: string;
  extraBars: string;
  stirrupDia: number;
  stirrupSpacing: number;
  concreteGrade: string;

  concreteVolume: number;
  steelWeight: number;
  formworkArea: number;
  bindingWire: number;
  cost: number;
}

export interface SlabBOQ {
  id: string;
  label: string;
  count: number;
  length: number;
  width: number;
  thickness: number;
  topMesh: string;
  bottomMesh: string;
  distBars: string;
  concreteGrade: string;

  concreteVolume: number;
  steelWeight: number;
  cost: number;
}

export interface StairBOQ {
  id: string;
  label: string;
  count: number;
  width: number;
  flightLength: number;
  landingLength: number;
  thickness: number;
  mainBars: string;
  distBars: string;
  concreteGrade: string;

  concreteVolume: number;
  steelWeight: number;
  cost: number;
}

export interface RetainingWallBOQ {
  id: string;
  label: string;
  count: number;
  length: number;
  stemHeight: number;
  stemThickness: number;
  baseWidth: number;
  baseThickness: number;
  vertBars: string;
  horizBars: string;
  concreteGrade: string;

  concreteVolume: number;
  steelWeight: number;
  formworkArea: number;
  cost: number;
}

export interface BrickWallBOQ {
  id: string;
  label: string;
  count: number;
  length: number;
  height: number;
  thickness: number;
  brickType: string;
  mortarMix: string;

  brickCount: number;
  mortarVolume: number;
  cementBags: number;
  sandVolume: number;
  cost: number;
}

export interface MaterialPrices {
  concretePerM3: number;
  cementPerBag: number;
  sandPerM3: number;
  aggregatePerM3: number;
  steelPerKg: Record<string, number>;
  tieWirePerKg: number;
  timberPerM3: number;
  plywoodPerSheet: number;
  formworkPerM2: number;
  labourPerDay: number;
  transport: number;
  equipment: number;
  contractorProfitPercent: number;
  vatPercent: number;
  brickPer1000: number;
}

export function defaultMaterialPrices(): MaterialPrices {
  return {
    concretePerM3: 85,
    cementPerBag: 8,
    sandPerM3: 25,
    aggregatePerM3: 30,
    steelPerKg: { '8': 0.85, '10': 0.82, '12': 0.80, '16': 0.78, '20': 0.76, '25': 0.75, '32': 0.74 },
    tieWirePerKg: 1.2,
    timberPerM3: 350,
    plywoodPerSheet: 25,
    formworkPerM2: 12,
    labourPerDay: 25,
    transport: 500,
    equipment: 200,
    contractorProfitPercent: 10,
    vatPercent: 8,
    brickPer1000: 120,
  };
}

export interface BOQLineItem {
  itemNo: number;
  description: string;
  unit: string;
  quantity: number;
  rate: number;
  amount: number;
  category: string;
  sourceId: string;
}

export interface BOQAggregate {
  totalConcreteM3: number;
  totalCementBags: number;
  totalSandM3: number;
  totalAggregateM3: number;
  totalSteelKg: number;
  totalTieWireKg: number;
  totalFormworkM2: number;
  totalBricks: number;

  materialCost: number;
  labourCost: number;
  equipmentCost: number;
  transportCost: number;
  contractorProfit: number;
  vat: number;
  grandTotal: number;
}

export interface BOQState {
  projectInfo: ProjectInfo;
  foundations: FoundationBOQ[];
  columns: ColumnBOQ[];
  beams: BeamBOQ[];
  slabs: SlabBOQ[];
  stairs: StairBOQ[];
  retainingWalls: RetainingWallBOQ[];
  brickWalls: BrickWallBOQ[];
  materialPrices: MaterialPrices;
  activeSection: BOQSection;
  savedProjects: SavedBOQProject[];
  currentProjectId: string | null;
  isDirty: boolean;
}

export interface SavedBOQProject {
  id: string;
  name: string;
  date: string;
  state: Omit<BOQState, 'savedProjects' | 'activeSection' | 'isDirty'>;
}

export function defaultBOQState(): BOQState {
  return {
    projectInfo: defaultProjectInfo(),
    foundations: [],
    columns: [],
    beams: [],
    slabs: [],
    stairs: [],
    retainingWalls: [],
    brickWalls: [],
    materialPrices: defaultMaterialPrices(),
    activeSection: 'project-info',
    savedProjects: [],
    currentProjectId: null,
    isDirty: false,
  };
}
