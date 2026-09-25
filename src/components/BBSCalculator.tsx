import { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Clipboard, FileText, FileSpreadsheet, Printer, Save, RefreshCw, 
  Plus, Trash2, Sliders, CheckCircle2, ChevronRight, AlertTriangle,
  Layers, Hammer, Box, ArrowRight, Download, Info
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import XLSX from 'xlsx-js-style';
import { UnitSystem, SavedCalculation } from '../types';
import { CALCULATORS_LIST } from '../data/calculatorsData';
import { NumericInput } from './NumericInput';

// ASTM Rebar Standards (US Customary)
const IMPERIAL_REBAR_DATA: Record<number, { name: string, diaMm: number, weightLbFt: number }> = {
  3: { name: '#3', diaMm: 9.5, weightLbFt: 0.376 },
  4: { name: '#4', diaMm: 12.7, weightLbFt: 0.668 },
  5: { name: '#5', diaMm: 15.9, weightLbFt: 1.043 },
  6: { name: '#6', diaMm: 19.1, weightLbFt: 1.502 },
  7: { name: '#7', diaMm: 22.2, weightLbFt: 2.044 },
  8: { name: '#8', diaMm: 25.4, weightLbFt: 2.670 },
  9: { name: '#9', diaMm: 28.7, weightLbFt: 3.400 },
  10: { name: '#10', diaMm: 32.3, weightLbFt: 4.303 },
  11: { name: '#11', diaMm: 35.8, weightLbFt: 5.313 },
};

// Metric Standard Rebar (SI)
const METRIC_REBAR_DATA: Record<number, { name: string, weightKgM: number }> = {
  6: { name: 'T6', weightKgM: 36 / 162 },
  8: { name: 'T8', weightKgM: 64 / 162 },
  10: { name: 'T10', weightKgM: 100 / 162 },
  12: { name: 'T12', weightKgM: 144 / 162 },
  16: { name: 'T16', weightKgM: 256 / 162 },
  20: { name: 'T20', weightKgM: 400 / 162 },
  25: { name: 'T25', weightKgM: 625 / 162 },
  28: { name: 'T28', weightKgM: 784 / 162 },
  32: { name: 'T32', weightKgM: 1024 / 162 },
  40: { name: 'T40', weightKgM: 1600 / 162 },
};

// Helper to check if a specific input key is measured in meters/feet vs mm/inches
const isFieldInMeters = (key: string, calcId: string) => {
  const meterFields = [
    'length', 'width', 'depth', 'height', 'span', 
    'landingTop', 'landingBot', 'landingWidth', 
    'clearSpan', 'bearing', 'stemHeight', 'baseLength', 
    'chairSpacing', 'footing1Length', 'footing1Width', 'footing2Length', 'footing2Width'
  ];
  if (meterFields.includes(key)) return true;
  if (key === 'keyDepth') return true;
  if (key === 'thickness' && (calcId === 'bbs-combined-footing' || calcId === 'bbs-raft-foundation' || calcId === 'bbs-strip-footing')) {
    return true;
  }
  if (key === 'stemBaseThk' || key === 'stemTopThk' || key === 'baseThk') {
    return true;
  }
  return false;
};

// Engineering input tooltips for every BBS field
const FIELD_TOOLTIPS: Record<string, string> = {
  length: 'Total length of the structural member (center-to-center of supports)',
  width: 'Cross-sectional width or breadth of the member',
  depth: 'Overall depth or height of the member section',
  height: 'Vertical height of the column or wall element',
  span: 'Clear span length between supports (face-to-face)',
  cover: 'Clear concrete cover measured to the outermost rebar surface (durability & fire protection)',
  mainDia: 'Nominal diameter of primary/main longitudinal reinforcement',
  mainSpacing: 'Center-to-center spacing of main reinforcement bars',
  distDia: 'Nominal diameter of secondary/distribution reinforcement',
  distSpacing: 'Center-to-center spacing of distribution bars',
  thickness: 'Overall slab or footing thickness',
  mainCount: 'Total number of main longitudinal bars in the cross-section',
  tieDia: 'Diameter of transverse ties or stirrups',
  tieSpacing: 'Center-to-center spacing of ties/stirrups along the member length',
  lapLengthFactor: 'Development/lap length as a multiple of bar diameter (typical: 40-60 for tension)',
  embedment: 'Embedment depth of rebar into supporting member (development length)',
  topDia: 'Diameter of top (compression/hanger) reinforcement',
  topCount: 'Number of top bars in the cross-section',
  botDia: 'Diameter of bottom (tension) reinforcement',
  botCount: 'Number of bottom tension bars',
  stirrupDia: 'Diameter of shear stirrup / link reinforcement',
  stirrupSpacing: 'Spacing of shear stirrups along the beam span',
  hookLengthFactor: 'Hook/anchor length as a multiple of bar diameter',
  crankAngle: 'Angle of bent-up/cranked bars (typically 45° for slabs)',
  chairDia: 'Diameter of chair/ spacer bars used for top mesh support',
  chairCount: 'Number of chair supports per panel',
  chairSpacing: 'Grid spacing of support chairs (center-to-center)',
  waistSlab: 'Thickness of the inclined waist slab in a staircase',
  riser: 'Vertical height of each stair step',
  tread: 'Horizontal depth of each stair step (going)',
  steps: 'Total number of steps in the flight',
  landingTop: 'Length of the top landing slab (measured along the flight direction)',
  landingBot: 'Length of the bottom landing slab',
  landingWidth: 'Width of the staircase (perpendicular to the flight)',
  clearSpan: 'Clear opening span (face-to-face of supports)',
  bearing: 'Length of bearing/support at each end of the lintel',
  stemHeight: 'Height of retaining wall stem from base to top',
  stemBaseThk: 'Thickness of retaining wall stem at the base',
  stemTopThk: 'Thickness of retaining wall stem at the top',
  baseLength: 'Total length of retaining wall base (heel + toe + stem width)',
  baseThk: 'Thickness of retaining wall base slab',
  keyDepth: 'Depth of shear key below retaining wall base',
  starterHook: 'Length of starter bar hook extension above the pedestal',
  vertDia: 'Diameter of vertical reinforcement in the retaining wall stem',
  vertSpacing: 'Spacing of vertical reinforcement bars along the wall',
  horizDia: 'Diameter of horizontal/shrinkage reinforcement',
  horizSpacing: 'Spacing of horizontal reinforcement layers',
  longitudinalDia: 'Diameter of longitudinal bars running along the strip footing length',
  longitudinalCount: 'Number of longitudinal bars in the strip footing',
  transverseDia: 'Diameter of transverse reinforcement bars crossing the footing',
  transverseSpacing: 'Spacing of transverse bars along the strip footing',
  botMainDia: 'Diameter of bottom mesh main reinforcement (parallel to length)',
  botMainSpacing: 'Spacing of bottom mesh main bars',
  botDistDia: 'Diameter of bottom mesh distribution bars (parallel to width)',
  botDistSpacing: 'Spacing of bottom mesh distribution bars',
  topMainDia: 'Diameter of top mesh main reinforcement',
  topMainSpacing: 'Spacing of top mesh main bars',
  topDistDia: 'Diameter of top mesh distribution bars',
  topDistSpacing: 'Spacing of top mesh distribution bars',
};

// Validation rules for engineering inputs
const FIELD_VALIDATION: Record<string, { min: number; max: number; step?: number; warning?: string }> = {
  length: { min: 0.1, max: 100, warning: 'Structural length seems unusual. Verify dimension.' },
  width: { min: 0.05, max: 20, warning: 'Width seems unusual for this member type.' },
  depth: { min: 0.05, max: 10, warning: 'Depth seems unusual. Verify section dimension.' },
  height: { min: 0.1, max: 50, warning: 'Height seems unusual. Verify vertical dimension.' },
  span: { min: 0.1, max: 50, warning: 'Span seems unusual for a typical beam.' },
  cover: { min: 10, max: 150, warning: 'Cover outside typical range (10-150mm / 0.4-6in). Check durability requirements.' },
  thickness: { min: 50, max: 2000, warning: 'Thickness seems unusual for this element type.' },
  mainSpacing: { min: 25, max: 600, warning: 'Bar spacing outside typical range (25-600mm / 1-24in).' },
  distSpacing: { min: 25, max: 600, warning: 'Distribution bar spacing outside typical range.' },
  tieSpacing: { min: 25, max: 600, warning: 'Tie spacing outside typical range (25-600mm).' },
  stirrupSpacing: { min: 25, max: 600, warning: 'Stirrup spacing outside typical range (25-600mm).' },
  mainCount: { min: 2, max: 32, warning: 'Main bar count seems unusual for standard detailing.' },
  topCount: { min: 2, max: 20, warning: 'Top bar count seems unusual.' },
  botCount: { min: 2, max: 20, warning: 'Bottom bar count seems unusual.' },
  lapLengthFactor: { min: 20, max: 100, warning: 'Lap length factor typically ranges from 30-70 bar diameters.' },
  embedment: { min: 100, max: 2000, warning: 'Embedment length outside typical range.' },
  steps: { min: 1, max: 50, warning: 'Step count seems unusual for a single flight.' },
  riser: { min: 50, max: 300, warning: 'Riser height outside typical range (50-300mm / 2-12in).' },
  tread: { min: 150, max: 600, warning: 'Tread depth outside typical range (150-600mm / 6-24in).' },
  stemHeight: { min: 0.5, max: 25, warning: 'Retaining wall height seems unusual.' },
  bearing: { min: 0.05, max: 1, warning: 'Bearing length seems unusual.' },
  clearSpan: { min: 0.3, max: 10, warning: 'Clear span seems unusual for a lintel.' },
  chairSpacing: { min: 0.2, max: 5, warning: 'Chair spacing seems unusual.' },
  stirrupDia: { min: 4, max: 20, warning: 'Stirrup diameter seems unusual for standard detailing.' },
  mainDia: { min: 6, max: 40, warning: 'Main bar diameter seems unusual.' },
  distDia: { min: 4, max: 25, warning: 'Distribution bar diameter seems unusual.' },
  topDia: { min: 6, max: 40, warning: 'Top bar diameter seems unusual.' },
  botDia: { min: 6, max: 40, warning: 'Bottom bar diameter seems unusual.' },
  tieDia: { min: 4, max: 20, warning: 'Tie diameter seems unusual for standard detailing.' },
};

const getFieldTooltip = (key: string): string => {
  const cleanKey = key.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
  return FIELD_TOOLTIPS[cleanKey] || FIELD_TOOLTIPS[key] || '';
};

const getFieldValidation = (key: string): { min: number; max: number; warning?: string } | null => {
  const cleanKey = key.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
  return FIELD_VALIDATION[cleanKey] || FIELD_VALIDATION[key] || null;
};

interface BBSRebarItem {
  mark: string;
  description: string;
  dia: number; // diameter (mm for metric, bar number for imperial)
  shapeCode: string; // '00' (Straight), '11' (L-bend), '21' (U-bend), '31' (Crank), '51' (Stirrup), '61' (Chair)
  dims: { a: number; b: number; c: number; d: number; e: number }; // dimensions in mm or inches
  numMembers: number;
  barsPerMember: number;
  totalBars: number;
  cuttingLength: number; // in meters or feet
  totalLength: number; // in meters or feet
  unitWeight: number; // kg/m or lb/ft
  totalWeight: number; // kg or lb
}

interface BBSCalculatorProps {
  calculatorId: string;
  unitSystem: UnitSystem;
  setUnitSystem: (system: UnitSystem) => void;
  onSaveCalculation: (calc: SavedCalculation) => void;
  savedCalculations: SavedCalculation[];
  loadedCalculation?: SavedCalculation | null;
  currency: string;
  isPrintPreviewMode?: boolean;
  setIsPrintPreviewMode?: (val: boolean) => void;
}

export default function BBSCalculator({
  calculatorId,
  unitSystem,
  setUnitSystem,
  onSaveCalculation,
  savedCalculations,
  loadedCalculation = null,
  currency,
  isPrintPreviewMode = false,
  setIsPrintPreviewMode,
}: BBSCalculatorProps) {
  const isMetric = unitSystem === 'metric';
  const cleanNum = (val: number, fallback = 0) => isNaN(val) || !isFinite(val) ? fallback : val;
  const [paramUnits, setParamUnits] = useState<Record<string, string>>({});

  const getDefaultUnitForField = (key: string) => {
    if (isFieldInMeters(key, calculatorId)) return isMetric ? 'm' : 'ft';
    if (
      key === 'cover' ||
      key === 'thickness' ||
      key === 'waistSlab' ||
      key === 'riser' ||
      key === 'tread' ||
      key === 'stemBaseThk' ||
      key === 'stemTopThk' ||
      key === 'baseThk' ||
      key === 'keyDepth' ||
      key === 'starterHook' ||
      key === 'embedment' ||
      key.endsWith('Spacing')
    ) {
      return isMetric ? 'mm' : 'in';
    }
    return '';
  };

  const convertLengthValue = (value: number, from: string, to: string) => {
    const toMeters: Record<string, number> = {
      mm: 0.001,
      cm: 0.01,
      m: 1,
      in: 0.0254,
      ft: 0.3048,
    };
    if (!(from in toMeters) || !(to in toMeters)) return value;
    const meters = value * toMeters[from];
    return meters / toMeters[to];
  };

  const getDisplayValue = (key: string, value: number | string) => {
    if (value === '' || value === undefined || value === null) return '';
    const unit = paramUnits[key];
    if (!unit || typeof value !== 'number') return value;
    const baseUnit = getDefaultUnitForField(key);
    if (!baseUnit) return value;
    return parseFloat(convertLengthValue(value, baseUnit, unit).toFixed(3));
  };

  const convertDisplayToBase = (key: string, value: number) => {
    const unit = paramUnits[key];
    const baseUnit = getDefaultUnitForField(key);
    if (!unit || !baseUnit) return value;
    return parseFloat(convertLengthValue(value, unit, baseUnit).toFixed(6));
  };

  const handleDisplayInputChange = (field: string, rawValue: string) => {
    if (rawValue === '') {
      handleInputChange(field, '');
      return;
    }
    const parsed = parseFloat(rawValue);
    handleInputChange(field, isNaN(parsed) ? 0 : convertDisplayToBase(field, parsed));
  };

  const handleFieldUnitChange = (field: string, unit: string) => {
    setParamUnits(prev => ({ ...prev, [field]: unit }));
  };

  const createFootingSection = (index: number) => ({
    label: `F${index + 1}`,
    length: 2.6,
    width: 2.4,
    thickness: 0.65,
    cover: 50,
    includeBottomBars: true,
    botMainDia: 16,
    botMainSpacing: 150,
    botDistDia: 12,
    botDistSpacing: 150,
    includeTopBars: true,
    topMainDia: 16,
    topMainSpacing: 150,
    topDistDia: 12,
    topDistSpacing: 200
  });

  // State metadata
  const [projectName, setProjectName] = useState('Reinforcement Phase 1');
  const [engineerName, setEngineerName] = useState('Structural QC');
  const [codeStandard, setCodeStandard] = useState('IS 2502 / ACI 318');
  const [notes, setNotes] = useState('Default bar bending schedule for construction-ready validation.');
  const [steelPrice, setSteelPrice] = useState(() => currency === 'LKR' ? 280000 : 1200); // per metric ton or US ton
  const [steelPriceUnit, setSteelPriceUnit] = useState<'tonne' | 'kg'>('tonne'); // 'tonne' (per tonne/ton) or 'kg' (per kg/lb)
  const [concretePrice, setConcretePrice] = useState(() => currency === 'LKR' ? 35000 : 110); // per m3 or yd3
  const [isSavedSuccessfully, setIsSavedSuccessfully] = useState(false);

  // Sync prices if currency changes
  useEffect(() => {
    if (currency === 'LKR') {
      setSteelPrice(280000);
      setConcretePrice(35000);
    } else {
      setSteelPrice(1200);
      setConcretePrice(110);
    }
  }, [currency]);

  // Core dimensions and parameters depending on active calculatorId
  const [inputs, setInputs] = useState<Record<string, any>>({});
  const footingSections = Array.isArray(inputs.footings) ? inputs.footings : [];
  const [warnings, setWarnings] = useState<Record<string, string>>({});
  const [isCalculating, setIsCalculating] = useState(false);
  const [calcHistory, setCalcHistory] = useState<{ timestamp: number; totalSteel: number; concreteVol: number; totalCost: number }[]>(() => {
    try {
      const stored = localStorage.getItem('civilmath_bbs_history');
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });
  const draftKey = `civilmath_bbs_draft_${calculatorId}`;

  // Restore draft from localStorage on mount
  useEffect(() => {
    try {
      const draft = localStorage.getItem(draftKey);
      if (draft) {
        const parsed = JSON.parse(draft);
        if (parsed.inputs && Object.keys(parsed.inputs).length > 0) {
          setInputs(parsed.inputs);
          if (parsed.paramUnits) setParamUnits(parsed.paramUnits);
          if (parsed.projectName) setProjectName(parsed.projectName);
          if (parsed.engineerName) setEngineerName(parsed.engineerName);
          if (parsed.codeStandard) setCodeStandard(parsed.codeStandard);
          if (parsed.notes) setNotes(parsed.notes);
        }
      }
    } catch (e) {
      console.warn('Failed to restore BBS draft:', e);
    }
  }, []);

  // Auto-save draft on every input change (debounced via the dependency)
  useEffect(() => {
    const hasInputs = Object.keys(inputs).length > 0;
    if (!hasInputs) return;
    const timer = setTimeout(() => {
      try {
        const draft = {
          inputs,
          paramUnits,
          projectName,
          engineerName,
          codeStandard,
          notes,
          savedAt: Date.now(),
        };
        localStorage.setItem(draftKey, JSON.stringify(draft));
      } catch (e) {
        console.warn('Failed to auto-save BBS draft:', e);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [inputs, paramUnits, projectName, engineerName, codeStandard, notes]);

  const updateFootingSection = (index: number, field: string, value: any) => {
    const nextFootings = footingSections.map((footing: Record<string, any>, footingIndex: number) =>
      footingIndex === index ? { ...footing, [field]: value } : footing
    );
    setInputs((prev: Record<string, any>) => ({ ...prev, footings: nextFootings }));
    setIsSavedSuccessfully(false);
  };

  const addFootingSection = () => {
    setInputs((prev: Record<string, any>) => {
      const existingFootings = Array.isArray(prev.footings) ? prev.footings : [];
      return {
        ...prev,
        footings: [...existingFootings, createFootingSection(existingFootings.length)]
      };
    });
    setIsSavedSuccessfully(false);
  };

  const removeFootingSection = (index: number) => {
    if (footingSections.length <= 1) return;
    setInputs((prev: Record<string, any>) => ({
      ...prev,
      footings: (prev.footings || []).filter((_: unknown, footingIndex: number) => footingIndex !== index)
        .map((footing: Record<string, any>, footingIndex: number) => ({ ...footing, label: `F${footingIndex + 1}` }))
    }));
    setIsSavedSuccessfully(false);
  };

  // Establish standard initial inputs for each of the 14 modules
  useEffect(() => {
    const defaults: Record<string, Record<string, any>> = {
      'bbs-footing': { length: 2.0, width: 2.0, depth: 0.45, cover: 50, mainDia: 12, mainSpacing: 150, distDia: 10, distSpacing: 150, padType: 'pad' },
      'bbs-foundation': { length: 3.5, width: 3.5, depth: 0.6, cover: 50, botMainDia: 16, botMainSpacing: 150, botDistDia: 12, botDistSpacing: 150, topMainDia: 12, topMainSpacing: 200, topDistDia: 10, topDistSpacing: 200 },
      'bbs-column': { height: 3.4, width: 0.4, depth: 0.4, cover: 40, mainDia: 16, mainCount: 6, tieDia: 8, tieSpacing: 150, lapLengthFactor: 50, embedment: 600 },
      'bbs-beam': { span: 4.8, width: 0.3, depth: 0.5, cover: 30, topDia: 12, topCount: 2, botDia: 16, botCount: 3, sideDia: 10, sideCount: 0, stirrupDia: 8, stirrupSpacing: 150, hookLengthFactor: 10 },
      'bbs-slab': { length: 5.5, width: 4.2, thickness: 150, cover: 20, mainDia: 10, mainSpacing: 150, distDia: 8, distSpacing: 180, crankAngle: 45, chairDia: 10, chairCount: 15 },
      'bbs-stair': { waistSlab: 150, cover: 20, riser: 150, tread: 250, steps: 10, landingTop: 1.0, landingBot: 1.0, mainDia: 12, mainSpacing: 150, distDia: 10, distSpacing: 200, landingWidth: 1.2 },
      'bbs-tie-beam': { length: 3.8, width: 0.25, depth: 0.3, cover: 30, topDia: 12, topCount: 2, botDia: 12, botCount: 2, stirrupDia: 8, stirrupSpacing: 200 },
      'bbs-plinth-beam': { length: 5.0, width: 0.3, depth: 0.35, cover: 30, topDia: 12, topCount: 3, botDia: 16, botCount: 3, stirrupDia: 8, stirrupSpacing: 150 },
      'bbs-lintel-beam': { clearSpan: 1.8, bearing: 0.23, width: 0.23, depth: 0.23, cover: 25, topDia: 10, topCount: 2, botDia: 12, botCount: 2, stirrupDia: 6, stirrupSpacing: 150 },
      'bbs-retaining-wall': { stemHeight: 3.2, stemBaseThk: 0.35, stemTopThk: 0.2, baseLength: 2.2, baseThk: 0.4, cover: 50, vertDia: 16, vertSpacing: 150, horizDia: 10, horizSpacing: 200, keyDepth: 0.4 },
      'bbs-pedestal': { height: 1.2, width: 0.4, depth: 0.4, cover: 40, mainDia: 16, mainCount: 4, tieDia: 8, tieSpacing: 150, starterHook: 300 },
      'bbs-combined-footing': {
        footings: [
          {
            label: 'F1',
            length: 2.6,
            width: 2.4,
            thickness: 0.65,
            cover: 50,
            includeBottomBars: true,
            botMainDia: 16,
            botMainSpacing: 150,
            botDistDia: 12,
            botDistSpacing: 150,
            includeTopBars: true,
            topMainDia: 16,
            topMainSpacing: 150,
            topDistDia: 12,
            topDistSpacing: 200
          }
        ]
      },
      'bbs-raft-foundation': { length: 12.0, width: 10.0, thickness: 0.8, cover: 50, botMainDia: 20, botMainSpacing: 150, botDistDia: 16, botDistSpacing: 150, topMainDia: 16, topMainSpacing: 150, topDistDia: 12, topDistSpacing: 200, chairDia: 16, chairSpacing: 1.0 },
      'bbs-strip-footing': { length: 15.0, width: 0.9, thickness: 0.35, cover: 50, longitudinalDia: 12, longitudinalCount: 5, transverseDia: 10, transverseSpacing: 150 }
    };

    const currentDefaults = defaults[calculatorId] || {};
    // Map default values based on unit systems (SI vs US Imperial)
    const convertedDefaults: Record<string, any> = {};

    Object.entries(currentDefaults).forEach(([key, val]) => {
      if (typeof val === 'number') {
        // Simple conversion if system initialized to imperial
        if (!isMetric) {
          if (isFieldInMeters(key, calculatorId)) {
            convertedDefaults[key] = parseFloat((val * 3.28084).toFixed(2));
          } else if (key === 'cover' || key === 'thickness' || key === 'waistSlab' || key === 'riser' || key === 'tread' || key === 'stemBaseThk' || key === 'stemTopThk' || key === 'baseThk' || key === 'keyDepth' || key === 'starterHook' || key === 'embedment') {
            convertedDefaults[key] = parseFloat((val * (isMetric ? 1 : 0.03937)).toFixed(2)); // mm to inch if we scale standardly
          } else if (key.endsWith('Spacing')) {
            convertedDefaults[key] = parseFloat((val / 25.4).toFixed(1)); // spacing in inches
          } else if (key.endsWith('Dia')) {
            // Map typical metric bar dia to imperial rebar numbers
            const diaMap: Record<number, number> = { 6:3, 8:3, 10:4, 12:4, 16:5, 20:6, 25:8, 28:9, 32:10, 40:11 };
            convertedDefaults[key] = diaMap[val] || 4;
          } else {
            convertedDefaults[key] = val;
          }
        } else {
          convertedDefaults[key] = val;
        }
      } else {
        convertedDefaults[key] = val;
      }
    });

    setInputs(convertedDefaults);
    const nextUnits: Record<string, string> = {};
    Object.keys(convertedDefaults).forEach((key) => {
      const defaultUnit = getDefaultUnitForField(key);
      if (defaultUnit) nextUnits[key] = defaultUnit;
    });
    setParamUnits(nextUnits);
    setIsSavedSuccessfully(false);
  }, [calculatorId, unitSystem]);

  useEffect(() => {
    if (!loadedCalculation || loadedCalculation.calculatorId !== calculatorId) return;
    setProjectName(loadedCalculation.name || 'Reinforcement Phase 1');
    setInputs(loadedCalculation.inputs || {});
    const restoredUnits: Record<string, string> = {};
    Object.keys(loadedCalculation.inputs || {}).forEach((key) => {
      const defaultUnit = getDefaultUnitForField(key);
      if (defaultUnit) restoredUnits[key] = defaultUnit;
    });
    setParamUnits(restoredUnits);
    setIsSavedSuccessfully(false);
  }, [loadedCalculation, calculatorId]);

  // Brief calculation indicator
  useEffect(() => {
    if (Object.keys(inputs).length > 0) {
      setIsCalculating(true);
      const timer = setTimeout(() => setIsCalculating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [inputs]);

  // Handle single input adjustment with validation
  const handleInputChange = (field: string, value: number | string) => {
    setInputs(prev => ({ ...prev, [field]: value }));
    setIsSavedSuccessfully(false);

    // Validate field if it's a number
    if (typeof value === 'number' && !isNaN(value)) {
      const rule = getFieldValidation(field);
      if (rule && value > 0) {
        const metricMin = isMetric ? rule.min : rule.min * (field.endsWith('Spacing') ? 25.4 : 0.03937);
        const metricMax = isMetric ? rule.max : rule.max * (field.endsWith('Spacing') ? 25.4 : 0.03937);
        if (value < metricMin || value > metricMax) {
          setWarnings(prev => ({ ...prev, [field]: rule.warning || `Value outside recommended range (${rule.min}-${rule.max}).` }));
        } else {
          setWarnings(prev => {
            const next = { ...prev };
            delete next[field];
            return next;
          });
        }
      } else {
        setWarnings(prev => {
          const next = { ...prev };
          delete next[field];
          return next;
        });
      }
    }
  };

  // Convert generic rebar diameter to actual mm and weight factor
  const getRebarData = (diaNum: number) => {
    if (isMetric) {
      const data = METRIC_REBAR_DATA[diaNum] || { name: `T${diaNum}`, weightKgM: (diaNum * diaNum) / 162 };
      return {
        label: data.name,
        diaMm: diaNum,
        unitWeight: data.weightKgM, // kg/m
      };
    } else {
      const data = IMPERIAL_REBAR_DATA[diaNum] || { name: `#${diaNum}`, diaMm: diaNum * 3.175, weightLbFt: 0.668 };
      return {
        label: data.name,
        diaMm: data.diaMm,
        unitWeight: data.weightLbFt, // lb/ft
      };
    }
  };

  // Live Calculations Core Engine
  const calculateBBS = (): {
    rebarList: BBSRebarItem[];
    concreteVolume: number; // m3 or yd3
    totalSteelWeight: number; // kg or lb
    steelWeightByDia: Record<string, number>;
  } => {
    const list: BBSRebarItem[] = [];
    let concreteVol = 0;
    const lFactor = isMetric ? 1 : 1/12; // length multiplier (inch to feet or mm to meters)

    // Helper to format values smoothly
    const getNum = (field: string, fallback = 0) => {
      const val = inputs[field];
      if (val === undefined || val === '') return fallback;
      const num = Number(val);
      return isNaN(num) || !isFinite(num) ? fallback : num;
    };

    // Helper to calculate bar counts accurately while avoiding floating-point division precision errors
    const calcBarsCount = (effectiveLength: number, spacing: number, minCount = 2): number => {
      if (spacing <= 0) return minCount;
      const ratio = effectiveLength / spacing;
      // Precision round to 4 decimal places to handle precision issues (e.g. 5.1 / 0.15 = 34.00000000000001)
      const roundedRatio = Math.round(ratio * 10000) / 10000;
      return Math.max(minCount, Math.ceil(roundedRatio) + 1);
    };

    // Helper to generate dynamic items
    const addItem = (
      mark: string,
      desc: string,
      dia: number,
      shape: string,
      a: number, b: number, c: number, d: number, e: number,
      membersCount: number,
      barsPerMember: number
    ) => {
      const rebar = getRebarData(dia);
      
      // Calculate cutting length based on shape code
      // Deduct standard bends: 90 deg = 2d, 135 deg = 3d
      const dMm = rebar.diaMm;
      const dUnit = isMetric ? dMm : dMm / 25.4; // bar dia in calculation units (mm or inches)
      
      let cuttingLenUnit = 0; // final cutting length in meters or feet
      if (isMetric) {
        // METRIC CALCULATIONS (Inputs in meters/mm, output in meters)
        let totalLmm = 0;
        if (shape === '00') {
          totalLmm = a; // simple straight
        } else if (shape === '11') {
          totalLmm = a + b - (2 * dMm); // L-bend with 90 deg bend deduction
        } else if (shape === '21') {
          totalLmm = a + b + c - (4 * dMm); // U-shape (two 90 deg bends)
        } else if (shape === '31') {
          // Cranked bar: Crank height b, crank inclined length is added (approx 0.42 * crank clear height)
          totalLmm = a + c + d + e + (0.42 * b) - (4 * dMm);
        } else if (shape === '51') {
          // Stirrup / Closed Tie: perimeter is 2a + 2b. Add two 135 deg hooks (10d each)
          totalLmm = 2 * a + 2 * b + 2 * (10 * dMm) - (3 * 2 * dMm); // deduct three 90 deg bends
        } else if (shape === '61') {
          // Chair: head (a), 2 legs (c), 2 vertical heights (b)
          totalLmm = a + 2 * b + 2 * c;
        }
        cuttingLenUnit = Math.max(0.1, totalLmm / 1000);
      } else {
        // IMPERIAL CALCULATIONS (Inputs in feet/inches, output in feet)
        // a,b,c,d,e are specified in inches inside this engine to keep high precision
        let totalLinches = 0;
        if (shape === '00') {
          totalLinches = a;
        } else if (shape === '11') {
          totalLinches = a + b - (2 * dUnit);
        } else if (shape === '21') {
          totalLinches = a + b + c - (4 * dUnit);
        } else if (shape === '31') {
          totalLinches = a + c + d + e + (0.42 * b) - (4 * dUnit);
        } else if (shape === '51') {
          totalLinches = 2 * a + 2 * b + 2 * (10 * dUnit) - (6 * dUnit);
        } else if (shape === '61') {
          totalLinches = a + 2 * b + 2 * c;
        }
        cuttingLenUnit = Math.max(0.3, totalLinches / 12);
      }

      const totalBars = cleanNum(membersCount * barsPerMember);
      const totalLen = cleanNum(cuttingLenUnit * totalBars);
      const unitWeight = cleanNum(rebar.unitWeight);
      const totalWeight = cleanNum(totalLen * unitWeight);

      list.push({
        mark,
        description: desc,
        dia: cleanNum(dia),
        shapeCode: shape,
        dims: { 
          a: cleanNum(a), 
          b: cleanNum(b), 
          c: cleanNum(c), 
          d: cleanNum(d), 
          e: cleanNum(e) 
        },
        numMembers: cleanNum(membersCount),
        barsPerMember: cleanNum(barsPerMember),
        totalBars,
        cuttingLength: cleanNum(parseFloat(cuttingLenUnit.toFixed(3))),
        totalLength: cleanNum(parseFloat(totalLen.toFixed(3))),
        unitWeight: cleanNum(parseFloat(unitWeight.toFixed(4))),
        totalWeight: cleanNum(parseFloat(totalWeight.toFixed(2))),
      });
    };

    // Calculate structural metrics depending on calculatorId
    if (calculatorId === 'bbs-footing') {
      const L = getNum('length'); // m or ft
      const W = getNum('width'); // m or ft
      const D = getNum('depth'); // m or ft
      const cv = getNum('cover'); // mm or inches
      const mainDia = getNum('mainDia');
      const mainSp = getNum('mainSpacing');
      const distDia = getNum('distDia');
      const distSp = getNum('distSpacing');

      concreteVol = L * W * D;

      // Cover deduction factors
      const clearL = L - 2 * (cv * (isMetric ? 0.001 : 1/12));
      const clearW = W - 2 * (cv * (isMetric ? 0.001 : 1/12));

      // Calculate number of bars
      const spacingUnitMain = mainSp * (isMetric ? 0.001 : 1/12);
      const spacingUnitDist = distSp * (isMetric ? 0.001 : 1/12);
      
      const barsCountMain = calcBarsCount(clearW, spacingUnitMain, 2);
      const barsCountDist = calcBarsCount(clearL, spacingUnitDist, 2);

      // Footing hooks (standard bend of D - 2*cover)
      const hookLen = D - 2 * (cv * (isMetric ? 0.001 : 1/12));
      const hookUnit = hookLen * (isMetric ? 1000 : 12); // hook in mm or inches

      const aMain = clearL * (isMetric ? 1000 : 12);
      const aDist = clearW * (isMetric ? 1000 : 12);

      // Main bars (Bottom Mesh - Length direction) - Shape Code 21 (U shape)
      addItem('F1-01', 'Main Reinforcement (X-mesh)', mainDia, '21', hookUnit, aMain, hookUnit, 0, 0, 1, barsCountMain);
      // Distribution bars (Bottom Mesh - Width direction)
      addItem('F1-02', 'Distribution Reinforcement (Y-mesh)', distDia, '21', hookUnit, aDist, hookUnit, 0, 0, 1, barsCountDist);

    } else if (calculatorId === 'bbs-foundation') {
      const L = getNum('length');
      const W = getNum('width');
      const D = getNum('depth');
      const cv = getNum('cover');
      const botMainDia = getNum('botMainDia');
      const botMainSp = getNum('botMainSpacing');
      const botDistDia = getNum('botDistDia');
      const botDistSp = getNum('botDistSpacing');
      const topMainDia = getNum('topMainDia');
      const topMainSp = getNum('topMainSpacing');
      const topDistDia = getNum('topDistDia');
      const topDistSp = getNum('topDistSpacing');

      concreteVol = L * W * D;

      const clearL = L - 2 * (cv * (isMetric ? 0.001 : 1/12));
      const clearW = W - 2 * (cv * (isMetric ? 0.001 : 1/12));
      const hookUnit = (D - 2 * (cv * (isMetric ? 0.001 : 1/12))) * (isMetric ? 1000 : 12);

      const botMainSpUnit = botMainSp * (isMetric ? 0.001 : 1/12);
      const botDistSpUnit = botDistSp * (isMetric ? 0.001 : 1/12);
      const topMainSpUnit = topMainSp * (isMetric ? 0.001 : 1/12);
      const topDistSpUnit = topDistSp * (isMetric ? 0.001 : 1/12);

      const botMainCount = calcBarsCount(clearW, botMainSpUnit, 2);
      const botDistCount = calcBarsCount(clearL, botDistSpUnit, 2);
      const topMainCount = calcBarsCount(clearW, topMainSpUnit, 2);
      const topDistCount = calcBarsCount(clearL, topDistSpUnit, 2);

      addItem('FD-B1', 'Bottom Mesh Main (X-Dir)', botMainDia, '21', hookUnit, clearL * (isMetric ? 1000 : 12), hookUnit, 0, 0, 1, botMainCount);
      addItem('FD-B2', 'Bottom Mesh Dist (Y-Dir)', botDistDia, '21', hookUnit, clearW * (isMetric ? 1000 : 12), hookUnit, 0, 0, 1, botDistCount);
      addItem('FD-T1', 'Top Mesh Main (X-Dir)', topMainDia, '21', hookUnit, clearL * (isMetric ? 1000 : 12), hookUnit, 0, 0, 1, topMainCount);
      addItem('FD-T2', 'Top Mesh Dist (Y-Dir)', topDistDia, '21', hookUnit, clearW * (isMetric ? 1000 : 12), hookUnit, 0, 0, 1, topDistCount);

    } else if (calculatorId === 'bbs-column') {
      const H = getNum('height');
      const B = getNum('width');
      const D = getNum('depth');
      const cv = getNum('cover');
      const mainDia = getNum('mainDia');
      const mainCount = getNum('mainCount');
      const tieDia = getNum('tieDia');
      const tieSp = getNum('tieSpacing');
      const lapF = getNum('lapLengthFactor');
      const embed = getNum('embedment');

      concreteVol = H * B * D;

      // Longitudinal Rebars: Height + lap length + foundation starter embedment
      const lapLen = mainDia * lapF; // mm or inches
      const embedUnit = embed; // in mm or inches
      const heightUnit = H * (isMetric ? 1000 : 12);
      
      const aVert = heightUnit + lapLen + embedUnit;
      addItem('C1-01', 'Longitudinal Main Steel', mainDia, '00', aVert, 0, 0, 0, 0, 1, mainCount);

      // Ties / Stirrup Dimensions (rect perimeter)
      const clearB = B * (isMetric ? 1000 : 12) - 2 * cv;
      const clearD = D * (isMetric ? 1000 : 12) - 2 * cv;
      const tiesCount = calcBarsCount(H * (isMetric ? 1000 : 12), tieSp, 3);

      addItem('C1-02', 'Transverse Ties (Stirrups)', tieDia, '51', clearB, clearD, 0, 0, 0, 1, tiesCount);

    } else if (calculatorId === 'bbs-beam') {
      const span = getNum('span');
      const width = getNum('width');
      const depth = getNum('depth');
      const cv = getNum('cover');
      const topDia = getNum('topDia');
      const topCount = getNum('topCount');
      const botDia = getNum('botDia');
      const botCount = getNum('botCount');
      const stirrupDia = getNum('stirrupDia');
      const stirrupSp = getNum('stirrupSpacing');
      const hookF = getNum('hookLengthFactor');

      concreteVol = span * width * depth;

      // Anchor lengths
      const hookL = hookF * topDia; // top anchors
      const hookLBot = hookF * botDia; // bottom anchors
      const clearSpanUnit = span * (isMetric ? 1000 : 12) - 2 * cv;

      // Hanger Bars (Top)
      addItem('B1-01', 'Top Support Hangers', topDia, '21', hookL, clearSpanUnit, hookL, 0, 0, 1, topCount);
      // Tensile Bars (Bottom)
      addItem('B1-02', 'Bottom Tensile Rebars', botDia, '21', hookLBot, clearSpanUnit, hookLBot, 0, 0, 1, botCount);

      // Stirrups (Shear Links)
      const clearB = width * (isMetric ? 1000 : 12) - 2 * cv;
      const clearD = depth * (isMetric ? 1000 : 12) - 2 * cv;
      const stirCount = calcBarsCount(span * (isMetric ? 1000 : 12), stirrupSp, 2);

      addItem('B1-03', 'Shear Stirrup Links', stirrupDia, '51', clearB, clearD, 0, 0, 0, 1, stirCount);

    } else if (calculatorId === 'bbs-slab') {
      const L = getNum('length');
      const W = getNum('width');
      const thk = getNum('thickness');
      const cv = getNum('cover');
      const mainDia = getNum('mainDia');
      const mainSp = getNum('mainSpacing');
      const distDia = getNum('distDia');
      const distSp = getNum('distSpacing');
      const crankA = getNum('crankAngle', 45);
      const chairDia = getNum('chairDia');
      const chairCount = getNum('chairCount');

      concreteVol = L * W * (thk * (isMetric ? 0.001 : 1/12));

      const clearL = L * (isMetric ? 1000 : 12) - 2 * cv;
      const clearW = W * (isMetric ? 1000 : 12) - 2 * cv;

      // Crank bar height calculation: Slab thickness - 2 * cover - main rebar dia
      const crankH = thk - 2 * cv - mainDia;
      const crankAddition = crankA === 45 ? 0.42 * crankH : 0.27 * crankH; // mm or inches addition

      // Main Cranked bars counts (along slab width directions)
      const mainBarsCount = calcBarsCount(clearW, mainSp, 2);
      addItem('S1-01', 'Main Tensile Crank Bars', mainDia, '31', 10 * mainDia, crankH, clearL, 10 * mainDia, 0, 1, mainBarsCount);

      // Distribution bars (straight along length)
      const distBarsCount = calcBarsCount(clearL, distSp, 2);
      addItem('S1-02', 'Distribution Rebars', distDia, '00', clearW, 0, 0, 0, 0, 1, distBarsCount);

      // Chair bars to support top mesh elevation
      if (chairCount > 0) {
        const chairHead = isMetric ? 250 : 10; // 10 inch
        const chairHeight = thk - 2 * cv - (2 * mainDia);
        const chairLeg = isMetric ? 200 : 8; // 8 inch
        addItem('S1-03', 'Spacing Chairs (Grid Support)', chairDia, '61', chairHead, chairHeight, chairLeg, 0, 0, 1, chairCount);
      }

    } else if (calculatorId === 'bbs-stair') {
      const waist = getNum('waistSlab');
      const cv = getNum('cover');
      const riser = getNum('riser');
      const tread = getNum('tread');
      const steps = getNum('steps');
      const topLanding = getNum('landingTop');
      const botLanding = getNum('landingBot');
      const landWidth = getNum('landingWidth');
      const mainDia = getNum('mainDia');
      const mainSp = getNum('mainSpacing');
      const distDia = getNum('distDia');
      const distSp = getNum('distSpacing');

      // Concrete volume estimation of staircase
      const going = steps * tread; // mm or inches
      const height = steps * riser; // mm or inches
      const waistSlabL = Math.sqrt(going * going + height * height) / (isMetric ? 1000 : 12); // m or ft
      const landingL = topLanding + botLanding; // m or ft
      
      concreteVol = ((waistSlabL + landingL) * landWidth * (waist * (isMetric ? 0.001 : 1/12))) + 
                    (0.5 * (riser * (isMetric ? 0.001 : 1/12)) * (tread * (isMetric ? 0.001 : 1/12)) * steps * landWidth);

      const inclUnit = Math.sqrt(going * going + height * height); // mm or inches
      const totalLenMain = inclUnit + (topLanding * (isMetric ? 1000 : 12)) + (botLanding * (isMetric ? 1000 : 12)) - 2 * cv;
      const mainBarsCount = calcBarsCount(landWidth * (isMetric ? 1000 : 12) - 2 * cv, mainSp, 2);

      // Main Inclined waist steel with hooked anchors
      addItem('ST-01', 'Main Longitudinal Inclined Steel', mainDia, '21', 12 * mainDia, totalLenMain, 12 * mainDia, 0, 0, 1, mainBarsCount);

      // Distribution bars across staircase width
      const distSpacedLen = waistSlabL * (isMetric ? 1000 : 12) + landingL * (isMetric ? 1000 : 12);
      const distBarsCount = calcBarsCount(distSpacedLen, distSp, 2);
      addItem('ST-02', 'Steps & Landing Distribution Steel', distDia, '00', landWidth * (isMetric ? 1000 : 12) - 2 * cv, 0, 0, 0, 0, 1, distBarsCount);

    } else if (calculatorId === 'bbs-tie-beam' || calculatorId === 'bbs-plinth-beam' || calculatorId === 'bbs-lintel-beam') {
      // Generic beam calculation models
      const L = calculatorId === 'bbs-lintel-beam' 
        ? getNum('clearSpan') + 2 * getNum('bearing')
        : getNum('length', getNum('span'));
      const W = getNum('width');
      const D = getNum('depth');
      const cv = getNum('cover');
      const topDia = getNum('topDia');
      const topCount = getNum('topCount');
      const botDia = getNum('botDia');
      const botCount = getNum('botCount');
      const stirrupDia = getNum('stirrupDia');
      const stirrupSp = getNum('stirrupSpacing');

      concreteVol = L * W * D;

      const clearL = L * (isMetric ? 1000 : 12) - 2 * cv;
      const clearB = W * (isMetric ? 1000 : 12) - 2 * cv;
      const clearD = D * (isMetric ? 1000 : 12) - 2 * cv;

      addItem('BM-01', 'Top Main Bar Hangers', topDia, '11', 12 * topDia, clearL, 0, 0, 0, 1, topCount);
      addItem('BM-02', 'Bottom Tensile Bars', botDia, '11', 12 * botDia, clearL, 0, 0, 0, 1, botCount);

      const stirCount = calcBarsCount(L * (isMetric ? 1000 : 12), stirrupSp, 2);
      addItem('BM-03', 'Shear Stirrup Links', stirrupDia, '51', clearB, clearD, 0, 0, 0, 1, stirCount);

    } else if (calculatorId === 'bbs-retaining-wall') {
      const stemH = getNum('stemHeight');
      const stemB = getNum('stemBaseThk');
      const stemT = getNum('stemTopThk');
      const baseL = getNum('baseLength');
      const baseThk = getNum('baseThk');
      const cv = getNum('cover');
      const vertDia = getNum('vertDia');
      const vertSp = getNum('vertSpacing');
      const horizDia = getNum('horizDia');
      const horizSp = getNum('horizSpacing');

      // Retaining wall concrete volume estimate per unit length
      concreteVol = ((0.5 * (stemB + stemT) * stemH) + (baseL * baseThk)); // volume per running meter/foot

      const stemVertCount = calcBarsCount(isMetric ? 1000 : 12, vertSp, 2); // per running meter/foot
      const stemHorizCount = calcBarsCount(stemH * (isMetric ? 1000 : 12), horizSp, 2);

      // Vertical Dowels (Tension face - Shape code 11)
      const vertStemL = stemH * (isMetric ? 1000 : 12);
      const vertBaseHook = baseThk * (isMetric ? 1000 : 12) - cv;
      addItem('RW-01', 'Stem Tension Main Vert Dowels', vertDia, '11', vertBaseHook, vertStemL, 0, 0, 0, 1, stemVertCount);

      // Horizontal shear/shrinkage distribution steel
      const wallRunningLen = isMetric ? 1000 : 12; // 1m or 1ft slice
      addItem('RW-02', 'Horizontal Distribution Rebars', horizDia, '00', wallRunningLen, 0, 0, 0, 0, 1, stemHorizCount * 2);

    } else if (calculatorId === 'bbs-pedestal') {
      const H = getNum('height');
      const B = getNum('width');
      const D = getNum('depth');
      const cv = getNum('cover');
      const mainDia = getNum('mainDia');
      const mainCount = getNum('mainCount');
      const tieDia = getNum('tieDia');
      const tieSp = getNum('tieSpacing');
      const starterHook = getNum('starterHook');

      concreteVol = H * B * D;

      const vertLen = H * (isMetric ? 1000 : 12) + starterHook;
      addItem('PD-01', 'Starter Main Vert Rebars', mainDia, '11', starterHook, H * (isMetric ? 1000 : 12), 0, 0, 0, 1, mainCount);

      const clearB = B * (isMetric ? 1000 : 12) - 2 * cv;
      const clearD = D * (isMetric ? 1000 : 12) - 2 * cv;
      const tiesCount = calcBarsCount(H * (isMetric ? 1000 : 12), tieSp, 3);

      addItem('PD-02', 'Starter Lacing Ties', tieDia, '51', clearB, clearD, 0, 0, 0, 1, tiesCount);

    } else if (calculatorId === 'bbs-combined-footing') {
      footingSections.forEach((footing: Record<string, any>, footingIndex: number) => {
        const footingLabel = String(footing.label || `F${footingIndex + 1}`).trim() || `F${footingIndex + 1}`;
        const footingLength = Number(footing.length) || 0;
        const footingWidth = Number(footing.width) || 0;
        const thk = Number(footing.thickness) || 0;
        const cv = Number(footing.cover) || 0;
        const includeBottomBars = Boolean(footing.includeBottomBars);
        const includeTopBars = Boolean(footing.includeTopBars);
        const botMainDia = Number(footing.botMainDia) || 0;
        const botMainSp = Number(footing.botMainSpacing) || 0;
        const botDistDia = Number(footing.botDistDia) || 0;
        const botDistSp = Number(footing.botDistSpacing) || 0;
        const topMainDia = Number(footing.topMainDia) || 0;
        const topMainSp = Number(footing.topMainSpacing) || 0;
        const topDistDia = Number(footing.topDistDia) || 0;
        const topDistSp = Number(footing.topDistSpacing) || 0;

        concreteVol += footingLength * footingWidth * thk;

        const botMainSpUnit = botMainSp * (isMetric ? 0.001 : 1/12);
        const botDistSpUnit = botDistSp * (isMetric ? 0.001 : 1/12);
        const topMainSpUnit = topMainSp * (isMetric ? 0.001 : 1/12);
        const topDistSpUnit = topDistSp * (isMetric ? 0.001 : 1/12);

        const clearL = footingLength - 2 * (cv * (isMetric ? 0.001 : 1/12));
        const clearW = footingWidth - 2 * (cv * (isMetric ? 0.001 : 1/12));
        const clearThk = thk - 2 * (cv * (isMetric ? 0.001 : 1/12));
        const clearLUnit = clearL * (isMetric ? 1000 : 12);
        const clearWUnit = clearW * (isMetric ? 1000 : 12);
        const hookUnit = clearThk * (isMetric ? 1000 : 12);

        if (includeBottomBars) {
          const botMainCount = calcBarsCount(clearW, botMainSpUnit, 2);
          const botDistCount = calcBarsCount(clearL, botDistSpUnit, 2);
          addItem(`${footingLabel}-B1`, `${footingLabel} Bottom Mesh Main (Lengthwise)`, botMainDia, '21', hookUnit, clearLUnit, hookUnit, 0, 0, 1, botMainCount);
          addItem(`${footingLabel}-B2`, `${footingLabel} Bottom Mesh Dist (Crosswise)`, botDistDia, '21', hookUnit, clearWUnit, hookUnit, 0, 0, 1, botDistCount);
        }

        if (includeTopBars) {
          const topMainCount = calcBarsCount(clearW, topMainSpUnit, 2);
          const topDistCount = calcBarsCount(clearL, topDistSpUnit, 2);
          addItem(`${footingLabel}-T1`, `${footingLabel} Top Tension Main`, topMainDia, '21', hookUnit, clearLUnit, hookUnit, 0, 0, 1, topMainCount);
          addItem(`${footingLabel}-T2`, `${footingLabel} Top Distribution Rebars`, topDistDia, '21', hookUnit, clearWUnit, hookUnit, 0, 0, 1, topDistCount);
        }
      });

    } else if (calculatorId === 'bbs-raft-foundation') {
      const L = getNum('length');
      const W = getNum('width');
      const thk = getNum('thickness');
      const cv = getNum('cover');
      const botMainDia = getNum('botMainDia');
      const botMainSp = getNum('botMainSpacing');
      const botDistDia = getNum('botDistDia');
      const botDistSp = getNum('botDistSpacing');
      const topMainDia = getNum('topMainDia');
      const topMainSp = getNum('topMainSpacing');
      const topDistDia = getNum('topDistDia');
      const topDistSp = getNum('topDistSpacing');
      const chairDia = getNum('chairDia');
      const chairSp = getNum('chairSpacing');

      concreteVol = L * W * thk;

      // Ensure spacing is in the same unit system as length/width for count calculation
      // If spacing is in mm (metric), convert to meters. If in inches (imperial), convert to feet.
      const botMainSpUnit = botMainSp * (isMetric ? 0.001 : 1/12);
      const botDistSpUnit = botDistSp * (isMetric ? 0.001 : 1/12);
      const topMainSpUnit = topMainSp * (isMetric ? 0.001 : 1/12);
      const topDistSpUnit = topDistSp * (isMetric ? 0.001 : 1/12);

      // Clear dimensions inside cover (same units as L, W, thk - meters or feet)
      const clearL = L - 2 * (cv * (isMetric ? 0.001 : 1/12));
      const clearW = W - 2 * (cv * (isMetric ? 0.001 : 1/12));
      const clearThk = thk - 2 * (cv * (isMetric ? 0.001 : 1/12));

      // Bar count calculation: dividing same-unit dimensions (meters/meters or feet/feet)
      const botMainCount = calcBarsCount(clearW, botMainSpUnit, 2);
      const botDistCount = calcBarsCount(clearL, botDistSpUnit, 2);
      const topMainCount = calcBarsCount(clearW, topMainSpUnit, 2);
      const topDistCount = calcBarsCount(clearL, topDistSpUnit, 2);

      // Pass dimensions to addItem in standard units (mm for metric, inches for imperial)
      const clearLUnit = clearL * (isMetric ? 1000 : 12);
      const clearWUnit = clearW * (isMetric ? 1000 : 12);
      const hookUnit = clearThk * (isMetric ? 1000 : 12);

      addItem('RF-B1', 'Heavy Bottom Mesh X-Mat', botMainDia, '21', hookUnit, clearLUnit, hookUnit, 0, 0, 1, botMainCount);
      addItem('RF-B2', 'Heavy Bottom Mesh Y-Mat', botDistDia, '21', hookUnit, clearWUnit, hookUnit, 0, 0, 1, botDistCount);
      addItem('RF-T1', 'Heavy Top Mesh X-Mat', topMainDia, '21', hookUnit, clearLUnit, hookUnit, 0, 0, 1, topMainCount);
      addItem('RF-T2', 'Heavy Top Mesh Y-Mat', topDistDia, '21', hookUnit, clearWUnit, hookUnit, 0, 0, 1, topDistCount);

      // Space chairs: 1 chair per chairSp (sq meters/feet grid)
      const totalChairs = chairSp > 0 ? Math.max(4, Math.floor((L * W) / (chairSp * chairSp))) : 4;
      const chairHead = isMetric ? 300 : 12;
      const chairLeg = isMetric ? 300 : 12;
      // Chair vertical height = Raft depth - 2*cover - top main/dist dia - bottom main/dist dia
      const botDmm = getRebarData(botMainDia).diaMm;
      const topDmm = getRebarData(topMainDia).diaMm;
      const chairHeight = thk * (isMetric ? 1000 : 12) - (2 * cv) - (botDmm + topDmm) * (isMetric ? 2 : 2/25.4);

      addItem('RF-C1', 'Grid Supporting Chairs', chairDia, '61', chairHead, chairHeight, chairLeg, 0, 0, 1, totalChairs);

    } else if (calculatorId === 'bbs-strip-footing') {
      const L = getNum('length');
      const W = getNum('width');
      const thk = getNum('thickness');
      const cv = getNum('cover');
      const longDia = getNum('longitudinalDia');
      const longCount = getNum('longitudinalCount');
      const transDia = getNum('transverseDia');
      const transSp = getNum('transverseSpacing');

      concreteVol = L * W * thk;

      // Clear dimensions inside cover (same units as L, W, thk - meters or feet)
      const clearL = L - 2 * (cv * (isMetric ? 0.001 : 1/12));
      const clearW = W - 2 * (cv * (isMetric ? 0.001 : 1/12));
      const clearThk = thk - 2 * (cv * (isMetric ? 0.001 : 1/12));

      const transSpUnit = transSp * (isMetric ? 0.001 : 1/12);
      const transBarsCount = calcBarsCount(clearL, transSpUnit, 2);

      const clearLUnit = clearL * (isMetric ? 1000 : 12);
      const clearWUnit = clearW * (isMetric ? 1000 : 12);
      const hookUnit = clearThk * (isMetric ? 1000 : 12);

      // Longitudinal Rebars running along footing length (Shape code 11)
      addItem('SF-01', 'Longitudinal Foundation Ties', longDia, '11', hookUnit, clearLUnit, 0, 0, 0, 1, longCount);

      // Transverse Rebars spacing (Shape code 21)
      addItem('SF-02', 'Transverse Distribution Ties', transDia, '21', hookUnit, clearWUnit, hookUnit, 0, 0, 1, transBarsCount);
    }

    // Accumulate weights & aggregates by diameter
    let totalSteelWeight = 0;
    const steelWeightByDia: Record<string, number> = {};

    list.forEach(item => {
      totalSteelWeight += item.totalWeight;
      const key = isMetric ? `T${item.dia}` : `#${item.dia}`;
      steelWeightByDia[key] = (steelWeightByDia[key] || 0) + item.totalWeight;
    });

    return {
      rebarList: list,
      concreteVolume: cleanNum(parseFloat(concreteVol.toFixed(3))),
      totalSteelWeight: cleanNum(parseFloat(totalSteelWeight.toFixed(2))),
      steelWeightByDia,
    };
  };

  const { rebarList, concreteVolume, totalSteelWeight, steelWeightByDia } = calculateBBS();

  // Reinforcement ratio in kg/m³ with two decimal places
  const reinforcementRatio = useMemo(() => {
    if (concreteVolume <= 0) return 0;
    if (isMetric) {
      return totalSteelWeight / concreteVolume;
    } else {
      // Convert Imperial to Metric for kg/m³ calculation
      const weightInKg = totalSteelWeight * 0.45359237;
      const volumeInM3 = concreteVolume * 0.764554858;
      return weightInKg / volumeInM3;
    }
  }, [totalSteelWeight, concreteVolume, isMetric]);

  // Price estimations based on user adjustments
  const actualSteelPricePerUnit = useMemo(() => {
    if (steelPriceUnit === 'tonne') {
      return steelPrice / (isMetric ? 1000 : 2000);
    }
    return steelPrice;
  }, [steelPrice, steelPriceUnit, isMetric]);

  const totalSteelCost = totalSteelWeight * actualSteelPricePerUnit;
  const totalConcreteCost = concreteVolume * concretePrice;
  const totalProjectCost = totalSteelCost + totalConcreteCost;

  // Track calculation history when results change
  useEffect(() => {
    if (rebarList.length > 0 && !isNaN(totalSteelWeight) && totalSteelWeight > 0) {
      const entry = { timestamp: Date.now(), totalSteel: totalSteelWeight, concreteVol: concreteVolume, totalCost: totalProjectCost };
      setCalcHistory(prev => {
        const updated = [entry, ...prev].filter(e => e.totalSteel > 0).slice(0, 25);
        try { localStorage.setItem('civilmath_bbs_history', JSON.stringify(updated)); } catch {}
        return updated;
      });
    }
  }, [rebarList.length, totalSteelWeight]);

  // Project Save implementation
  const handleSaveProject = () => {
    const calcOutput = {
      concreteVolume,
      totalSteelWeight,
      totalProjectCost,
      rebarCount: rebarList.length
    };

    const calcObj: SavedCalculation = {
      id: `bbs_saved_${Date.now()}`,
      calculatorId,
      name: `${projectName} (${CALCULATORS_LIST.find(c => c.id === calculatorId)?.name || 'BBS'})`,
      timestamp: Date.now(),
      unitSystem,
      inputs: {
        ...inputs,
        projectName,
        engineerName,
        codeStandard,
        notes,
        steelPrice,
        concretePrice
      },
      outputs: calcOutput,
      notes,
    };

    onSaveCalculation(calcObj);
    setIsSavedSuccessfully(true);
    setTimeout(() => setIsSavedSuccessfully(false), 4000);
  };

  // SVG Bar Shape Generator based on Shape Code
  const renderShapeDiagram = (shape: string, dims: BBSRebarItem['dims']) => {
    const a = isNaN(dims.a) ? 0 : Math.round(dims.a);
    const b = isNaN(dims.b) ? 0 : Math.round(dims.b);
    const c = isNaN(dims.c) ? 0 : Math.round(dims.c);
    const d = isNaN(dims.d) ? 0 : Math.round(dims.d);
    
    const svgClass = "w-28 h-14 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200/50 dark:border-slate-800 p-1 flex items-center justify-center";

    if (shape === '00') {
      return (
        <div className={svgClass}>
          <svg viewBox="0 0 120 40" className="w-full h-full text-blue-600">
            <line x1="10" y1="20" x2="110" y2="20" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            <text x="60" y="15" className="text-[10px] font-mono fill-slate-500 font-bold" textAnchor="middle">{a}</text>
          </svg>
        </div>
      );
    } else if (shape === '11') {
      return (
        <div className={svgClass}>
          <svg viewBox="0 0 120 40" className="w-full h-full text-[#0A84FF]">
            <path d="M 20 10 L 20 30 L 100 30" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <text x="12" y="22" className="text-[9px] font-mono fill-slate-500 font-bold" textAnchor="end">{a}</text>
            <text x="60" y="38" className="text-[9px] font-mono fill-slate-500 font-bold" textAnchor="middle">{b}</text>
          </svg>
        </div>
      );
    } else if (shape === '21') {
      return (
        <div className={svgClass}>
          <svg viewBox="0 0 120 40" className="w-full h-full text-[#0A84FF]">
            <path d="M 20 10 L 20 30 L 100 30 L 100 10" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <text x="12" y="22" className="text-[9px] font-mono fill-slate-500 font-bold" textAnchor="end">{a}</text>
            <text x="60" y="38" className="text-[9px] font-mono fill-slate-500 font-bold" textAnchor="middle">{b}</text>
            <text x="108" y="22" className="text-[9px] font-mono fill-slate-500 font-bold" textAnchor="start">{c}</text>
          </svg>
        </div>
      );
    } else if (shape === '31') {
      return (
        <div className={svgClass}>
          <svg viewBox="0 0 120 40" className="w-full h-full text-emerald-600">
            <path d="M 10 30 L 40 30 L 55 10 L 80 10 L 110 10" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <text x="25" y="38" className="text-[8px] font-mono fill-slate-500 font-bold" textAnchor="middle">{a}</text>
            <text x="44" y="22" className="text-[8px] font-mono fill-slate-500 font-bold" textAnchor="middle">{b}</text>
            <text x="68" y="8" className="text-[8px] font-mono fill-slate-500 font-bold" textAnchor="middle">{c}</text>
            <text x="95" y="8" className="text-[8px] font-mono fill-slate-500 font-bold" textAnchor="middle">{d}</text>
          </svg>
        </div>
      );
    } else if (shape === '51') {
      return (
        <div className={svgClass}>
          <svg viewBox="0 0 120 40" className="w-full h-full text-indigo-600">
            <rect x="30" y="8" width="60" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
            <path d="M 30 8 L 22 2 M 90 8 L 98 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <text x="60" y="38" className="text-[8px] font-mono fill-slate-500 font-bold" textAnchor="middle">{a}</text>
            <text x="24" y="22" className="text-[8px] font-mono fill-slate-500 font-bold" textAnchor="end">{b}</text>
            <text x="50" y="16" className="text-[7px] font-mono fill-slate-400">135° hook</text>
          </svg>
        </div>
      );
    } else if (shape === '61') {
      return (
        <div className={svgClass}>
          <svg viewBox="0 0 120 40" className="w-full h-full text-amber-600">
            <path d="M 15 30 L 35 30 L 35 15 L 85 15 L 85 30 L 105 30" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <text x="60" y="10" className="text-[8px] font-mono fill-slate-500 font-bold" textAnchor="middle">{a}</text>
            <text x="28" y="22" className="text-[8px] font-mono fill-slate-500 font-bold" textAnchor="end">{b}</text>
            <text x="100" y="38" className="text-[8px] font-mono fill-slate-500 font-bold" textAnchor="middle">{c}</text>
          </svg>
        </div>
      );
    }
    return <span className="font-mono text-[9px] text-slate-400">Shape {shape}</span>;
  };

  // PDF Export Engine with beautiful civil engineering style sheet
  const handleExportPDF = () => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const primaryColor = [15, 23, 42]; // slate-900
    const accentColor = [10, 132, 255]; // vivid blue

    // Print Header Band
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 297, 25, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(14);
    doc.text("CIVILMATH BAR BENDING SCHEDULE REPORT", 12, 11);
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8);
    doc.text(`REGULATORY COMPLIANCE STANDARD: ${codeStandard.toUpperCase()}`, 12, 18);

    doc.setTextColor(255, 255, 255);
    doc.setFont("Courier", "bold");
    doc.setFontSize(9);
    doc.text(`DATE: ${new Date().toLocaleDateString()}`, 240, 11);
    doc.text(`SYSTEM: ${unitSystem.toUpperCase()}`, 240, 18);

    // Metadata details block
    doc.setFillColor(248, 250, 252);
    doc.rect(12, 28, 273, 32, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(12, 28, 273, 32, 'D');

    doc.setTextColor(51, 65, 85);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(8);

    // Row 1: Project Information
    doc.text("PROJECT NAME:", 16, 34);
    doc.text("QC ENGINEER:", 110, 34);
    doc.text("STANDARD CODE:", 205, 34);

    doc.setFont("Helvetica", "normal");
    doc.text(projectName, 45, 34);
    doc.text(engineerName, 138, 34);
    doc.text(codeStandard, 235, 34);

    // Row 2: Material Quantities & Ratios
    doc.setFont("Helvetica", "bold");
    doc.text("CONCRETE VOLUME:", 16, 42);
    doc.text("STEEL WEIGHT:", 110, 42);
    doc.text("REINFORCEMENT RATIO:", 205, 42);

    doc.setFont("Helvetica", "normal");
    doc.text(`${concreteVolume} ${isMetric ? 'm³' : 'yd³'}`, 50, 42);
    doc.text(`${totalSteelWeight} ${isMetric ? 'kg' : 'lbs'}`, 138, 42);
    doc.text(`${reinforcementRatio.toFixed(2)} kg/m³`, 245, 42);

    // Row 3: Material Costs
    doc.setFont("Helvetica", "bold");
    doc.text("CONCRETE COST:", 16, 50);
    doc.text("STEEL COST:", 110, 50);
    doc.text("GRAND TOTAL COST:", 205, 50);

    doc.setFont("Helvetica", "normal");
    doc.text(`${currency} ${totalConcreteCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, 48, 50);
    doc.text(`${currency} ${totalSteelCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, 134, 50);
    
    doc.setFont("Helvetica", "bold");
    doc.setTextColor(180, 83, 9); // brown-700
    doc.text(`${currency} ${totalProjectCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, 240, 50);

    // Drawing table headers
    const startY = 65;
    doc.setFillColor(30, 41, 59);
    doc.rect(12, startY, 273, 8, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text("MARK", 14, startY + 5.5);
    doc.text("DESCRIPTION", 28, startY + 5.5);
    doc.text("DIA", 95, startY + 5.5);
    doc.text("SHAPE", 108, startY + 5.5);
    doc.text("DIM A", 123, startY + 5.5);
    doc.text("DIM B", 138, startY + 5.5);
    doc.text("DIM C", 153, startY + 5.5);
    doc.text("PCS / MEM", 168, startY + 5.5);
    doc.text("TOT BARS", 188, startY + 5.5);
    doc.text(isMetric ? "CUT LEN (m)" : "CUT LEN (ft)", 205, startY + 5.5);
    doc.text(isMetric ? "TOT LEN (m)" : "TOT LEN (ft)", 225, startY + 5.5);
    doc.text(isMetric ? "UNIT WT (kg/m)" : "UNIT WT (lb/ft)", 245, startY + 5.5);
    doc.text(isMetric ? "TOT WT (kg)" : "TOT WT (lb)", 268, startY + 5.5);

    let rowY = startY + 8;
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(7.5);

    rebarList.forEach((row, index) => {
      // Alternating row background
      if (index % 2 === 0) {
        doc.setFillColor(255, 255, 255);
      } else {
        doc.setFillColor(241, 245, 249);
      }
      doc.rect(12, rowY, 273, 7.5, 'F');
      doc.setDrawColor(241, 245, 249);
      doc.line(12, rowY + 7.5, 285, rowY + 7.5);

      doc.setTextColor(15, 23, 42);
      doc.text(row.mark, 14, rowY + 5);
      doc.text(row.description.length > 38 ? row.description.substring(0, 38) + "..." : row.description, 28, rowY + 5);
      doc.text(getRebarData(row.dia).label, 95, rowY + 5);
      doc.text(`Code ${row.shapeCode}`, 108, rowY + 5);
      doc.text(row.dims.a.toFixed(0), 123, rowY + 5);
      doc.text(row.dims.b.toFixed(0), 138, rowY + 5);
      doc.text(row.dims.c.toFixed(0), 153, rowY + 5);
      doc.text(`${row.barsPerMember}`, 168, rowY + 5);
      doc.text(`${row.totalBars}`, 188, rowY + 5);
      doc.text(row.cuttingLength.toFixed(3), 205, rowY + 5);
      doc.text(row.totalLength.toFixed(3), 225, rowY + 5);
      doc.text(row.unitWeight.toFixed(3), 245, rowY + 5);
      
      doc.setFont("Helvetica", "bold");
      doc.text(row.totalWeight.toFixed(2), 268, rowY + 5);
      doc.setFont("Helvetica", "normal");

      rowY += 7.5;
    });

    // Summary box at bottom
    rowY += 3;
    doc.setFillColor(240, 253, 250);
    doc.rect(12, rowY, 273, 14, 'F');
    doc.setDrawColor(45, 212, 191);
    doc.rect(12, rowY, 273, 14, 'D');

    doc.setTextColor(13, 148, 136);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(8.5);
    doc.text("ENGINEERING QUANTITY SURVEY REFERENCE:", 16, rowY + 5.5);
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    doc.text(`This bar bending schedule references ${codeStandard}. Verify against project requirements with a qualified professional. Total computed steel reinforcing weight: ${totalSteelWeight} ${isMetric ? 'kg' : 'lbs'} across ${rebarList.length} distinct rebar items.`, 16, rowY + 10);

    // Save PDF
    doc.save(`BBS-Report-${calculatorId}-${projectName.replace(/\s+/g, '_')}.pdf`);
  };

  // Styled Excel Sheet Export using xlsx-js-style
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    // Data grid preparation
    const rows: any[] = [];

    // Title Row
    rows.push([`CIVILMATH STRUCTURAL BBS - ${projectName.toUpperCase()}`]);
    rows.push([`Standard Code: ${codeStandard} | Engineer: ${engineerName} | Date: ${new Date().toLocaleDateString()}`]);
    rows.push([]); // blank

    // Headers Row
    const headers = [
      "Bar Mark", 
      "Description", 
      "Diameter", 
      "Shape Code", 
      "Dim A (in/mm)", 
      "Dim B (in/mm)", 
      "Dim C (in/mm)", 
      "Bars/Member", 
      "Total Bars", 
      isMetric ? "Cutting Len (m)" : "Cutting Len (ft)", 
      isMetric ? "Total Len (m)" : "Total Len (ft)", 
      isMetric ? "Unit Wt (kg/m)" : "Unit Wt (lb/ft)", 
      isMetric ? "Total Wt (kg)" : "Total Wt (lb)"
    ];
    rows.push(headers);

    // Rebar items
    rebarList.forEach(row => {
      rows.push([
        row.mark,
        row.description,
        getRebarData(row.dia).label,
        `Shape ${row.shapeCode}`,
        row.dims.a,
        row.dims.b,
        row.dims.c,
        row.barsPerMember,
        row.totalBars,
        row.cuttingLength,
        row.totalLength,
        row.unitWeight,
        row.totalWeight
      ]);
    });

    rows.push([]); // blank
    rows.push(["Summary Quantities:"]);
    rows.push(["Concrete Volume", `${concreteVolume} ${isMetric ? 'm³' : 'yd³'}`]);
    rows.push(["Total Steel Weight", `${totalSteelWeight} ${isMetric ? 'kg' : 'lbs'}`]);
    rows.push(["Reinforcement Ratio", `${reinforcementRatio.toFixed(2)} kg/m³`]);
    rows.push(["Concrete Cost", `${currency} ${totalConcreteCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`]);
    rows.push(["Steel Cost", `${currency} ${totalSteelCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`]);
    rows.push(["Grand Total Cost", `${currency} ${totalProjectCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`]);

    const ws = XLSX.utils.aoa_to_sheet(rows);

    // Apply high-fidelity styling to Excel cells
    const headerStyle = {
      fill: { fgColor: { rgb: "1E293B" } }, // dark slate
      font: { color: { rgb: "FFFFFF" }, bold: true, sz: 10 },
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        bottom: { style: "medium", color: { rgb: "0A84FF" } }
      }
    };

    const normalStyle = {
      font: { sz: 9.5 },
      alignment: { vertical: "center" }
    };

    const titleStyle = {
      font: { bold: true, sz: 14, color: { rgb: "0F172A" } }
    };

    // Auto fit column widths
    const colWidths = [
      { wch: 10 }, { wch: 35 }, { wch: 10 }, { wch: 12 }, 
      { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, 
      { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }
    ];
    ws['!cols'] = colWidths;

    // Apply styles
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
    for (let r = range.s.r; r <= range.e.r; r++) {
      for (let c = range.s.c; c <= range.e.c; c++) {
        const cellRef = XLSX.utils.encode_cell({ r, c });
        const cell = ws[cellRef];
        if (!cell) continue;

        if (r === 0) {
          cell.s = titleStyle;
        } else if (r === 3) {
          cell.s = headerStyle;
        } else {
          cell.s = normalStyle;
        }
      }
    }

    XLSX.utils.book_append_sheet(wb, ws, "Bar Bending Schedule");
    XLSX.writeFile(wb, `BBS-${projectName.replace(/\s+/g, '_')}.xlsx`);
  };

  // CSV Export
  const handleExportCSV = () => {
    const rows: string[] = [];
    rows.push(`CIVILMATH STRUCTURAL BBS - ${projectName.toUpperCase()}`);
    rows.push(`Standard Code: ${codeStandard} | Engineer: ${engineerName} | Date: ${new Date().toLocaleDateString()}`);
    rows.push('');
    const headers = [
      'Bar Mark', 'Description', 'Diameter', 'Shape Code',
      'Dim A', 'Dim B', 'Dim C', 'Bars/Member', 'Total Bars',
      isMetric ? 'Cut Len (m)' : 'Cut Len (ft)',
      isMetric ? 'Total Len (m)' : 'Total Len (ft)',
      isMetric ? 'Unit Wt (kg/m)' : 'Unit Wt (lb/ft)',
      isMetric ? 'Total Wt (kg)' : 'Total Wt (lb)'
    ];
    rows.push(headers.join(','));

    rebarList.forEach(row => {
      rows.push([
        row.mark,
        `"${row.description}"`,
        getRebarData(row.dia).label,
        `Shape ${row.shapeCode}`,
        row.dims.a, row.dims.b, row.dims.c,
        row.barsPerMember, row.totalBars,
        row.cuttingLength, row.totalLength,
        row.unitWeight, row.totalWeight
      ].join(','));
    });

    rows.push('');
    rows.push('Summary Quantities:');
    rows.push(`Concrete Volume,${concreteVolume} ${isMetric ? 'm³' : 'yd³'}`);
    rows.push(`Total Steel Weight,${totalSteelWeight} ${isMetric ? 'kg' : 'lbs'}`);
    rows.push(`Reinforcement Ratio,${reinforcementRatio.toFixed(2)} kg/m³`);
    rows.push(`Concrete Cost,${currency} ${totalConcreteCost.toFixed(2)}`);
    rows.push(`Steel Cost,${currency} ${totalSteelCost.toFixed(2)}`);
    rows.push(`Grand Total Cost,${currency} ${totalProjectCost.toFixed(2)}`);

    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BBS-${projectName.replace(/\s+/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Formula explanations for each calculator type
  const getFormulaExplanation = (): { title: string; formula: string; steps: string[] } => {
    const formulas: Record<string, { title: string; formula: string; steps: string[] }> = {
      'bbs-footing': {
        title: 'Isolated Footing Reinforcement',
        formula: 'Cut Len = L_clear + 2×Hook - 2×d (bends) | Bars = ceil(L_eff / Spacing) + 1',
        steps: [
          'Clear dimension = Member dimension - 2 × cover',
          'Hook length = Thickness - 2 × cover (standard 90° hook)',
          'Total bars = ceil(Clear span / Spacing) + 1 (starter bar)',
          'Cutting length = Clear length + 2 × Hook - 2 × d (90° bend deduction)',
          'Steel weight = Total length × (d² / 162) for metric (d in mm)'
        ]
      },
      'bbs-column': {
        title: 'Reinforced Column (Longitudinal + Ties)',
        formula: 'Cut Len = H + L_d + L_embed | Tie Len = 2×(b+d) + 2×10d - 6d',
        steps: [
          'Longitudinal bar length = Column height + lap length + foundation embedment',
          'Lap length = bar dia × lap factor (typically 40-60d)',
          'Tie perimeter = 2 × (clear width + clear depth)',
          'Tie cutting length = perimeter + 2 × 10d (hooks) - 6d (3 × 90° bends)',
          'Number of ties = ceil(Column height / tie spacing) + 1'
        ]
      },
      'bbs-beam': {
        title: 'Structural Beam (Top + Bottom + Stirrups)',
        formula: 'Main Len = Span_clear + 2×Hook - 2×d | Stirrup Len = 2×(b+d) + hook allowance',
        steps: [
          'Top & bottom bar length = Clear span + 2 × hook length - 2 × d (bend deduction)',
          'Hook length = bar dia × hook factor (typically 10-12d)',
          'Stirrup perimeter = 2 × (beam width - 2×cover + beam depth - 2×cover)',
          'Stirrup cutting length = Perimeter + 2 × 10d - 6d (bend deductions)',
          'Number of stirrups = ceil(Beam span / stirrup spacing) + 1'
        ]
      },
      'bbs-slab': {
        title: 'One/Two-Way Slab (Cranked + Distribution + Chairs)',
        formula: 'Crank Len = L_clear + 2×hook + 0.42×crank_h - 4×d',
        steps: [
          'Main cranked bar length = Clear span + 2 × hook + 0.42 × crank height - 4 × d',
          'Crank height = Slab thickness - 2 × cover - bar diameter',
          'Crank angle addition: 0.42×h for 45°, 0.27×h for 30°',
          'Distribution bars = Straight bars across the secondary direction',
          'Chair height = Thickness - 2 × cover - 2 × bar diameter (top + bottom)'
        ]
      },
      'bbs-stair': {
        title: 'Staircase Waist Slab Reinforcement',
        formula: 'Inclined Len = √(Going² + Height²) | Main Steel = Inclined + Landing - Cover',
        steps: [
          'Going = Step count × tread depth',
          'Height = Step count × riser height',
          'Inclined length of waist slab = √(Going² + Height²)',
          'Total main bar length = Inclined length + top landing + bottom landing - 2 × cover',
          'Number of main bars = ceil(Stair width / main spacing) + 1'
        ]
      },
      'bbs-retaining-wall': {
        title: 'Cantilever Retaining Wall',
        formula: 'Vert Dowel = Stem_H + Base_Hook | Horiz Steel = Wall running length',
        steps: [
          'Vertical dowel length = Stem height + base hook (into base slab - cover)',
          'Base hook = Base thickness - cover (for development into heel/toe)',
          'Vertical bars per meter = ceil(1.0m / vertical spacing) + 1 (per running meter)',
          'Horizontal bars = ceil(Stem height / horizontal spacing) × 2 (both faces)',
          'Concrete volume = 0.5 × (base + top) thickness × stem height + base × base thickness'
        ]
      }
    };
    return formulas[calculatorId] || {
      title: 'Reinforcement Schedule',
      formula: 'Cut Len = Σ(segment lengths) - Σ(bend deductions) + Σ(hook allowances)',
      steps: [
        'Bar dimensions derived from clear member dimensions minus cover',
        'Shape code determines bend deductions: 90° = 2d, 135° = 3d',
        'Hook allowance: 180° = 9d, 135° stirrup hook = 10d',
        'Total bars = Number of members × bars per member',
        'Total weight = Total length × unit weight (d²/162 for metric)'
      ]
    };
  };

  const formulaInfo = getFormulaExplanation();

  // Human descriptive title for the active module
  const calculatorTitle = CALCULATORS_LIST.find(c => c.id === calculatorId)?.name || "Bar Bending Schedule";

  return (
    <div className={`space-y-6 text-left ${isPrintPreviewMode ? 'print-preview-mode' : ''}`} id="bbs-calculator-main">
      
      {isPrintPreviewMode && (
        <div className="bg-blue-600 dark:bg-blue-800 text-white p-3.5 rounded-2xl flex flex-col sm:flex-row items-center justify-between shadow-lg border border-blue-500/30 gap-3 mb-2 print-hide z-50">
          <div className="flex items-center space-x-2.5">
            <Printer className="w-5 h-5 text-white animate-pulse" />
            <div className="text-left">
              <p className="text-xs font-bold font-sans">Print Preview Mode Active</p>
              <p className="text-[10px] text-blue-100 dark:text-blue-200 font-mono">
                The worksheet is styled for printing. Sidebars, assistant panels, and interactive elements are hidden.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 self-stretch sm:self-auto justify-end">
            <button
              onClick={() => {
                try {
                  window.focus();
                  window.print();
                } catch (e) {
                  alert("Please use the 'Open in New Tab' button in the top right, as browser rules can limit print modals inside preview iframes.");
                }
              }}
              className="px-3 py-1.5 bg-white text-blue-600 hover:bg-blue-50 text-[10px] font-bold font-mono rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Print Now
            </button>
            <button
              onClick={() => setIsPrintPreviewMode?.(false)}
              className="px-3 py-1.5 bg-blue-700 hover:bg-blue-900 text-[10px] font-bold font-mono rounded-xl text-white transition-colors cursor-pointer border border-blue-600"
            >
              Exit Preview
            </button>
          </div>
        </div>
      )}
      
      {/* HEADER BAR AND OPTIONS */}
      <div className="bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl backdrop-blur-lg shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-blue-50 dark:bg-blue-950/40 text-[#0A84FF] rounded-xl border border-blue-100/50 dark:border-blue-900/40">
              <Clipboard className="w-5 h-5 text-[#0A84FF]" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white font-sans tracking-tight">{calculatorTitle}</h2>
              <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">CIVIL ENGINEERING REINFORCEMENT MODULE</p>
            </div>
          </div>
        </div>

        {/* Global actions: units, PDF, EXCEL, PRINT, SAVE */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-0.5 flex items-center shadow-2xs">
            <button
              type="button"
              onClick={() => setUnitSystem('metric')}
              className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                unitSystem === 'metric'
                  ? 'bg-[#0A84FF] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Use metric units"
            >
              METRIC (m)
            </button>
            <button
              type="button"
              onClick={() => setUnitSystem('imperial')}
              className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                unitSystem === 'imperial'
                  ? 'bg-[#0A84FF] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Use imperial units"
            >
              IMPERIAL (ft)
            </button>
          </div>

          <button 
            onClick={handleExportPDF}
            className="px-3.5 py-1.5 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5 cursor-pointer shadow-3xs transition-all"
            title="Export high-fidelity PDF schedule report"
          >
            <FileText className="w-3.5 h-3.5 text-red-500" />
            <span>Export PDF</span>
          </button>
          
          <button 
            onClick={handleExportExcel}
            className="px-3.5 py-1.5 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5 cursor-pointer shadow-3xs transition-all"
            title="Export spreadsheet matrix sheet"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export Excel</span>
          </button>

          <button 
            onClick={handleExportCSV}
            className="px-3.5 py-1.5 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5 cursor-pointer shadow-3xs transition-all"
            title="Export CSV data file"
          >
            <Download className="w-3.5 h-3.5 text-purple-500" />
            <span>Export CSV</span>
          </button>

          <button 
            onClick={() => setIsPrintPreviewMode?.(!isPrintPreviewMode)}
            className={`px-3.5 py-1.5 border rounded-xl text-xs font-semibold flex items-center space-x-1.5 cursor-pointer shadow-3xs transition-all ${isPrintPreviewMode ? 'bg-[#0A84FF] text-white border-blue-500 hover:bg-blue-600' : 'bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'}`}
            title="Toggle high-fidelity Print Preview state"
          >
            <Printer className="w-3.5 h-3.5 text-blue-500" />
            <span>{isPrintPreviewMode ? "Exit Print Mode" : "Print Mode"}</span>
          </button>

          <button 
            onClick={handleSaveProject}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-2xs cursor-pointer transition-all ${isSavedSuccessfully ? 'bg-emerald-500 text-white' : 'bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white'}`}
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSavedSuccessfully ? "Saved to Analytics!" : "Save Sheet"}</span>
          </button>
        </div>
      </div>

      {/* THREE BENTO PANELS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* PANEL A (Span 4): Metadata and Input Specifications */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Project Details */}
          <div className="bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl backdrop-blur-lg shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h3 className="text-xs font-bold font-mono text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-[#0A84FF]" />
                PROJECT METADATA
              </h3>
              {calcHistory.length > 0 && (
                <span className="text-[8px] font-mono text-slate-400">{calcHistory.length} calculations</span>
              )}
            </div>
            
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-600 dark:text-slate-400 block mb-1 font-semibold" title="Name of the construction project or structural element">Project Name</label>
                <input 
                  type="text" 
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500"
                  placeholder="e.g. Residential Building Phase 1"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-600 dark:text-slate-400 block mb-1 font-semibold" title="Name of the responsible QC engineer or structural designer">QC / Civil Engineer</label>
                  <input 
                    type="text" 
                    value={engineerName}
                    onChange={(e) => setEngineerName(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500"
                    placeholder="e.g. John Smith, P.E."
                  />
                </div>
                <div>
                  <label className="text-slate-600 dark:text-slate-400 block mb-1 font-semibold" title="Structural design code standard used for reference and verification">Standard Code</label>
                  <input 
                    type="text" 
                    value={codeStandard}
                    onChange={(e) => setCodeStandard(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500"
                    placeholder="e.g. ACI 318-19 / IS 456:2000"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-600 dark:text-slate-400 block mb-1 font-semibold" title="Additional engineering remarks or site-specific notes">Engineering Remarks / Notes</label>
                <textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full h-16 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 text-xs font-sans resize-none"
                  placeholder="Enter project-specific notes, material specs, or construction remarks..."
                />
              </div>

              {/* Quick calculation history */}
              {calcHistory.length > 0 && (
                <div className="border-t border-slate-100 dark:border-slate-800 pt-3 mt-3">
                  <div className="flex items-center gap-1 mb-2">
                    <RefreshCw className="w-3 h-3 text-slate-400" />
                    <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider font-bold">Recent Calculations</span>
                  </div>
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {calcHistory.slice(0, 5).map((entry, i) => (
                      <div key={i} className="flex justify-between text-[9px] font-mono text-slate-500 bg-slate-50 dark:bg-slate-950 rounded-lg px-2 py-1">
                        <span>{new Date(entry.timestamp).toLocaleTimeString()}</span>
                        <span className="font-bold">{entry.totalSteel.toFixed(1)} {isMetric ? 'kg' : 'lbs'}</span>
                        <span className="text-emerald-600 dark:text-emerald-400">{entry.concreteVol.toFixed(2)} {isMetric ? 'm³' : 'yd³'}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      setCalcHistory([]);
                      try { localStorage.removeItem('civilmath_bbs_history'); } catch {}
                    }}
                    className="mt-1 text-[8px] font-mono text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                  >
                    Clear history
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* DYNAMIC FORM INPUTS BASED ON calculatorId */}
          <div className="bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl backdrop-blur-lg shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h3 className="text-xs font-bold font-mono text-slate-400 dark:text-slate-500 uppercase tracking-widest">REINFORCEMENT INPUTS</h3>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    try { localStorage.removeItem(draftKey); } catch {}
                    setWarnings({});
                  }}
                  className="text-[8px] font-mono text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                  title="Clear auto-saved draft"
                >
                  Clear draft
                </button>
                <span className="text-[9px] font-mono bg-blue-50 dark:bg-blue-950 text-[#0A84FF] px-2 py-0.5 rounded-full border border-blue-100/50 dark:border-blue-900/40 font-bold uppercase">
                  {unitSystem.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="space-y-4 text-xs font-mono">
              {calculatorId === 'bbs-combined-footing' ? (
                <div className="space-y-4">
                  {footingSections.map((footing: Record<string, any>, index: number) => (
                    <div key={index} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono bg-blue-50 dark:bg-blue-950 text-[#0A84FF] px-2 py-0.5 rounded-full border border-blue-100/50 dark:border-blue-900/40 font-bold uppercase">
                            {footing.label || `F${index + 1}`}
                          </span>
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Footing {index + 1}</span>
                        </div>
                        {footingSections.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeFootingSection(index)}
                            className="p-1.5 rounded-lg bg-red-50 dark:bg-red-950 hover:bg-red-100 dark:hover:bg-red-900 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30 cursor-pointer transition-colors"
                            title="Remove footing"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-slate-600 dark:text-slate-400 block mb-1 font-semibold font-sans">Footing Label</label>
                          <input
                            type="text"
                            value={footing.label ?? ''}
                            onChange={(e) => updateFootingSection(index, 'label', e.target.value)}
                            className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 font-bold"
                          />
                        </div>
                        <div className="flex items-end">
                          <div className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 flex items-center justify-between">
                            <span className="text-slate-700 dark:text-slate-300 font-semibold">Bottom Bars</span>
                            <input type="checkbox" checked={Boolean(footing.includeBottomBars)} onChange={(e) => updateFootingSection(index, 'includeBottomBars', e.target.checked)} className="h-4 w-4 accent-[#0A84FF]" />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {[
                          ['length', 'Length', isMetric ? 'm' : 'ft'],
                          ['width', 'Width', isMetric ? 'm' : 'ft'],
                          ['thickness', 'Height', isMetric ? 'm' : 'ft'],
                          ['cover', 'Cover', isMetric ? 'mm' : 'in']
                        ].map(([field, label, unit]) => {
                          const ft = getFieldTooltip(field);
                          const fv = getFieldValidation(field);
                          return (
                          <div key={field}>
                            <label className="text-slate-600 dark:text-slate-400 block mb-1 font-semibold font-sans flex items-center gap-1" title={ft}>
                              {label}
                              {ft && (
                                <span className="inline-flex items-center justify-center w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-[7px] font-bold cursor-help" title={ft}>?</span>
                              )}
                            </label>
                            <div className="relative flex items-center">
                              <NumericInput
                                step="any"
                                value={footing[field] ?? ''}
                                onChange={(raw, num) => updateFootingSection(index, field, raw === '' ? '' : num)}
                                variant="none" className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-3 pr-10 py-2 text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 font-bold"
                                title={ft}
                               suffix={unit}/>
                            </div>
                          </div>
                          );
                        })}
                      </div>

                      {footing.includeBottomBars && (
                        <div className="space-y-3">
                          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">Bottom Bars</div>
                          <div className="grid grid-cols-2 gap-3">
                            {[
                              ['botMainDia', 'Main Diameter'],
                              ['botDistDia', 'Dist Diameter']
                            ].map(([field, label]) => (
                              <div key={field}>
                                <label className="text-slate-600 dark:text-slate-400 block mb-1 font-semibold font-sans">{label}</label>
                                <select
                                  value={footing[field] || ''}
                                  onChange={(e) => updateFootingSection(index, field, parseInt(e.target.value) || 0)}
                                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 cursor-pointer h-9 text-xs"
                                >
                                  {isMetric ? Object.keys(METRIC_REBAR_DATA).map(dia => <option key={dia} value={dia}>Ø {dia} mm (T{dia})</option>) : Object.keys(IMPERIAL_REBAR_DATA).map(dia => <option key={dia} value={dia}>{IMPERIAL_REBAR_DATA[Number(dia)].name}</option>)}
                                </select>
                              </div>
                            ))}
                            {[
                              ['botMainSpacing', 'Main Spacing'],
                              ['botDistSpacing', 'Dist Spacing']
                            ].map(([field, label]) => (
                              <div key={field}>
                                <label className="text-slate-600 dark:text-slate-400 block mb-1 font-semibold font-sans">{label}</label>
                                <div className="relative flex items-center">
                                  <NumericInput
                                    step="any"
                                    value={footing[field] ?? ''}
                                    onChange={(raw, num) => updateFootingSection(index, field, raw === '' ? '' : num)}
                                    variant="none" className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-3 pr-10 py-2 text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 font-bold"
                                   suffix={isMetric ? 'mm' : 'in'}/>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 flex items-center justify-between">
                        <span className="text-slate-700 dark:text-slate-300 font-semibold">Top Bars</span>
                        <input type="checkbox" checked={Boolean(footing.includeTopBars)} onChange={(e) => updateFootingSection(index, 'includeTopBars', e.target.checked)} className="h-4 w-4 accent-[#0A84FF]" />
                      </div>

                      {footing.includeTopBars && (
                        <div className="space-y-3">
                          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">Top Bars</div>
                          <div className="grid grid-cols-2 gap-3">
                            {[
                              ['topMainDia', 'Main Diameter'],
                              ['topDistDia', 'Dist Diameter']
                            ].map(([field, label]) => (
                              <div key={field}>
                                <label className="text-slate-600 dark:text-slate-400 block mb-1 font-semibold font-sans">{label}</label>
                                <select
                                  value={footing[field] || ''}
                                  onChange={(e) => updateFootingSection(index, field, parseInt(e.target.value) || 0)}
                                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 cursor-pointer h-9 text-xs"
                                >
                                  {isMetric ? Object.keys(METRIC_REBAR_DATA).map(dia => <option key={dia} value={dia}>Ø {dia} mm (T{dia})</option>) : Object.keys(IMPERIAL_REBAR_DATA).map(dia => <option key={dia} value={dia}>{IMPERIAL_REBAR_DATA[Number(dia)].name}</option>)}
                                </select>
                              </div>
                            ))}
                            {[
                              ['topMainSpacing', 'Main Spacing'],
                              ['topDistSpacing', 'Dist Spacing']
                            ].map(([field, label]) => (
                              <div key={field}>
                                <label className="text-slate-600 dark:text-slate-400 block mb-1 font-semibold font-sans">{label}</label>
                                <div className="relative flex items-center">
                                  <NumericInput
                                    step="any"
                                    value={footing[field] ?? ''}
                                    onChange={(raw, num) => updateFootingSection(index, field, raw === '' ? '' : num)}
                                    variant="none" className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-3 pr-10 py-2 text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 font-bold"
                                   suffix={isMetric ? 'mm' : 'in'}/>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addFootingSection}
                    className="w-full py-2.5 px-4 border border-dashed border-[#0A84FF]/40 bg-blue-50/60 dark:bg-blue-950/20 hover:bg-blue-50 dark:hover:bg-blue-950/30 text-[#0A84FF] font-sans text-xs font-semibold rounded-xl flex items-center justify-center space-x-2 cursor-pointer transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Footing</span>
                  </button>
                </div>
              ) : (
              Object.keys(inputs).map((key) => {
                if (key === 'projectName' || key === 'engineerName' || key === 'codeStandard' || key === 'notes' || key === 'padType') return null;
                if (calculatorId === 'bbs-combined-footing') {
                  if (!inputs.useFooting2 && (key === 'footingLabel2' || key === 'footing2Length' || key === 'footing2Width')) return null;
                  if (!inputs.includeBottomBars && (key === 'botMainDia' || key === 'botMainSpacing' || key === 'botDistDia' || key === 'botDistSpacing')) return null;
                  if (!inputs.includeTopBars && (key === 'topMainDia' || key === 'topMainSpacing' || key === 'topDistDia' || key === 'topDistSpacing')) return null;
                }

                // Humanize key names
                let label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                let suffix = '';
                const supportsMultiUnits =
                  isFieldInMeters(key, calculatorId) ||
                  key === 'cover' ||
                  key === 'thickness' ||
                  key === 'waistSlab' ||
                  key === 'riser' ||
                  key === 'tread' ||
                  key === 'stemBaseThk' ||
                  key === 'stemTopThk' ||
                  key === 'baseThk' ||
                  key === 'keyDepth' ||
                  key === 'starterHook' ||
                  key === 'embedment' ||
                  key.endsWith('Spacing');

                if (isFieldInMeters(key, calculatorId)) {
                  suffix = paramUnits[key] || (isMetric ? 'm' : 'ft');
                } else if (key === 'cover' || key === 'thickness' || key === 'waistSlab' || key === 'riser' || key === 'tread' || key === 'stemBaseThk' || key === 'stemTopThk' || key === 'baseThk' || key === 'keyDepth' || key === 'starterHook' || key === 'embedment') {
                  suffix = paramUnits[key] || (isMetric ? 'mm' : 'in');
                } else if (key.endsWith('Spacing')) {
                  suffix = paramUnits[key] || (isMetric ? 'mm' : 'in');
                  label = label.replace('Spacing', ' Spacing');
                  } else if (key.endsWith('Dia')) {
                    label = label.replace('Dia', ' Diameter');
                    const diaTooltip = getFieldTooltip(key);
                    return (
                      <div key={key}>
                        <label className="text-slate-600 dark:text-slate-400 block mb-1 font-semibold font-sans flex items-center gap-1" title={diaTooltip}>
                          {label}
                          {diaTooltip && (
                            <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-[8px] font-bold cursor-help" title={diaTooltip}>?</span>
                          )}
                        </label>
                        <select
                          value={inputs[key] || ''}
                          onChange={(e) => handleInputChange(key, parseInt(e.target.value) || 0)}
                          className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 cursor-pointer h-9 text-xs"
                          title={diaTooltip}
                        >
                          {isMetric ? (
                            Object.keys(METRIC_REBAR_DATA).map(dia => (
                              <option key={dia} value={dia}>Ø {dia} mm (T{dia})</option>
                            ))
                          ) : (
                            Object.keys(IMPERIAL_REBAR_DATA).map(dia => (
                              <option key={dia} value={dia}>{IMPERIAL_REBAR_DATA[Number(dia)].name} rebar (Ø {IMPERIAL_REBAR_DATA[Number(dia)].diaMm}mm)</option>
                            ))
                          )}
                        </select>
                      </div>
                    );
                }
                
                if (typeof inputs[key] === 'boolean') {
                  return (
                    <label key={key} className="flex items-center justify-between bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 cursor-pointer">
                      <span className="text-slate-700 dark:text-slate-300 font-semibold font-sans">{label}</span>
                      <input
                        type="checkbox"
                        checked={Boolean(inputs[key])}
                        onChange={(e) => handleInputChange(key, e.target.checked as any)}
                        className="h-4 w-4 accent-[#0A84FF] cursor-pointer"
                      />
                    </label>
                  );
                }

                if (typeof inputs[key] === 'string' && (key === 'footingLabel1' || key === 'footingLabel2')) {
                  return (
                    <div key={key}>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-slate-600 dark:text-slate-400 font-semibold font-sans">{label}</label>
                      </div>
                      <input
                        type="text"
                        value={inputs[key] ?? ''}
                        onChange={(e) => handleInputChange(key, e.target.value)}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 font-bold"
                      />
                    </div>
                  );
                }

                const tooltip = getFieldTooltip(key);
                const warning = warnings[key];
                return (
                  <div key={key}>
                    <div className="flex justify-between items-center mb-1 gap-2">
                      <label className="text-slate-600 dark:text-slate-400 font-semibold font-sans flex items-center gap-1" title={tooltip}>
                        {label}
                        {tooltip && (
                          <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-[8px] font-bold cursor-help" title={tooltip}>?</span>
                        )}
                      </label>
                      {supportsMultiUnits && (
                        <select
                          value={paramUnits[key] || getDefaultUnitForField(key)}
                          onChange={(e) => handleFieldUnitChange(key, e.target.value)}
                          className="text-[10px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-0.5 text-slate-600 dark:text-slate-300 outline-none focus:border-blue-500 cursor-pointer h-6 font-mono"
                        >
                          <option value="m">meter (m)</option>
                          <option value="cm">centimeter (cm)</option>
                          <option value="mm">millimeter (mm)</option>
                          <option value="ft">feet (ft)</option>
                          <option value="in">inch (in)</option>
                        </select>
                      )}
                    </div>
                    <div className="relative flex items-center">
                      <NumericInput
                        step="any"
                        value={getDisplayValue(key, inputs[key])}
                        onChange={(raw, num) => handleDisplayInputChange(key, raw)}
                        variant="none" className={`w-full bg-white dark:bg-slate-950 border ${warning ? 'border-amber-400 dark:border-amber-500' : 'border-slate-200 dark:border-slate-800'} rounded-xl pl-3 pr-10 py-2 text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 font-bold transition-colors`}
                        title={tooltip}
                      />
                      {suffix && (
                        <span className="absolute right-3 text-[10px] uppercase text-slate-400 font-bold pointer-events-none">{suffix}</span>
                      )}
                    </div>
                    {warning && (
                      <p className="text-[9px] mt-1 text-amber-600 dark:text-amber-400 font-mono flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                        {warning}
                      </p>
                    )}
                  </div>
                );
              })
              )}
            </div>
          </div>
        </div>

        {/* PANEL B (Span 8): Real-time output schedule, shape drawing, and live rebar analysis */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* MATERIAL ESTIMATE SUMMARY PANEL */}
          <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-lg border border-slate-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <Box className="w-40 h-40" />
            </div>

            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Layers className="w-5 h-5 text-[#0A84FF]" />
                <h3 className="text-xs font-mono text-slate-400 uppercase tracking-widest">QUANTITY SURVEY SUMMARY</h3>
              </div>
              {isCalculating && (
                <RefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin" />
              )}
              <span className={`text-[8px] font-mono text-slate-500 transition-opacity ${rebarList.length > 0 ? 'opacity-100' : 'opacity-0'}`}>
                {rebarList.length} items · {Object.keys(steelWeightByDia).length} sizes
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase block tracking-wider">Concrete Volume</span>
                <span className="text-xl font-bold font-sans text-white">{concreteVolume} <span className="text-xs font-mono text-slate-400">{isMetric ? 'm³' : 'yd³'}</span></span>
              </div>
              
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase block tracking-wider">Total Rebar Weight</span>
                <span className="text-xl font-bold font-sans text-[#0A84FF]">{totalSteelWeight} <span className="text-xs font-mono text-slate-400">{isMetric ? 'kg' : 'lbs'}</span></span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase block tracking-wider">Reinforcement Ratio</span>
                <span className="text-xl font-bold font-sans text-emerald-400">
                  {reinforcementRatio.toFixed(2)} <span className="text-xs font-mono text-slate-400">kg/m³</span>
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase block tracking-wider">Estimated Materials Cost</span>
                <span className="text-xl font-bold font-sans text-amber-400">{currency} {totalProjectCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>
            </div>

            {/* Cost Breakdown Details */}
            <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
              <div className="flex justify-between md:block md:space-y-1">
                <span className="text-[10px] text-slate-400 uppercase block tracking-wider font-sans">Concrete Cost</span>
                <span className="text-sm font-semibold text-white">
                  {currency} {totalConcreteCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </span>
              </div>
              <div className="flex justify-between md:block md:space-y-1">
                <span className="text-[10px] text-slate-400 uppercase block tracking-wider font-sans">Steel Cost</span>
                <span className="text-sm font-semibold text-white">
                  {currency} {totalSteelCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </span>
              </div>
              <div className="flex justify-between md:block md:space-y-1">
                <span className="text-[10px] text-slate-400 uppercase block tracking-wider font-sans">Grand Total Cost</span>
                <span className="text-sm font-bold text-amber-400">
                  {currency} {totalProjectCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </span>
              </div>
            </div>

            {/* Custom pricing variables inputs */}
            <div className="mt-5 pt-4 border-t border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-mono text-slate-400">STEEL PRICE</label>
                  <select
                    value={steelPriceUnit}
                    onChange={(e) => setSteelPriceUnit(e.target.value as 'tonne' | 'kg')}
                    className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-0.5 text-slate-300 outline-none focus:border-blue-500 font-mono text-[9px] cursor-pointer"
                  >
                    <option value="tonne">{isMetric ? 'per Tonne' : 'per Ton'}</option>
                    <option value="kg">{isMetric ? 'per kg' : 'per lb'}</option>
                  </select>
                </div>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-[10px] text-slate-500 font-bold">{currency}</span>
                  <NumericInput 
                    value={steelPrice || ''} 
                    onChange={(raw, num) => setSteelPrice(num)}
                    variant="none" className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-3 py-1.5 text-white outline-none focus:border-blue-500 font-mono font-bold text-xs h-9"
                    placeholder="Enter steel price"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                  <span>CONCRETE PRICE ({isMetric ? '/m³' : '/yd³'})</span>
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-[10px] text-slate-500 font-bold">{currency}</span>
                  <NumericInput 
                    value={concretePrice || ''} 
                    onChange={(raw, num) => setConcretePrice(num)}
                    variant="none" className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-3 py-1.5 text-white outline-none focus:border-emerald-500 font-mono font-bold text-xs h-9"
                    placeholder="Enter concrete price"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* DYNAMIC BAR BENDING SCHEDULE OUTPUT TABLE */}
          <div className="bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl backdrop-blur-lg shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <div className="flex items-center space-x-2">
                <Hammer className="w-4 h-4 text-[#0A84FF]" />
                <h3 className="text-xs font-bold font-mono text-slate-700 dark:text-slate-350 uppercase tracking-wider">BAR BENDING SCHEDULE</h3>
              </div>
              <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md text-slate-500 font-bold">
                {rebarList.length} rebar schedules
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-mono text-[10px] uppercase tracking-wider">
                    <th className="py-2.5 pr-2">Mark</th>
                    <th className="py-2.5">Description</th>
                    <th className="py-2.5 text-center">Dia</th>
                    <th className="py-2.5 text-center">Shape Drawing</th>
                    <th className="py-2.5 text-center">Pcs/Mem</th>
                    <th className="py-2.5 text-center">Tot Bars</th>
                    <th className="py-2.5 text-right">{isMetric ? "Cut Len (m)" : "Cut Len (ft)"}</th>
                    <th className="py-2.5 text-right">{isMetric ? "Total Len (m)" : "Total Len (ft)"}</th>
                    <th className="py-2.5 text-right">{isMetric ? "Total Wt (kg)" : "Total Wt (lb)"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {rebarList.map((row) => (
                    <tr key={row.mark} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-all font-mono">
                      <td className="py-3 font-bold text-[#0A84FF]">{row.mark}</td>
                      <td className="py-3 font-sans pr-2 font-medium text-slate-800 dark:text-slate-200">{row.description}</td>
                      <td className="py-3 text-center font-bold">{getRebarData(row.dia).label}</td>
                      <td className="py-3 flex justify-center">{renderShapeDiagram(row.shapeCode, row.dims)}</td>
                      <td className="py-3 text-center">{row.barsPerMember}</td>
                      <td className="py-3 text-center font-bold text-slate-700 dark:text-slate-300">{row.totalBars}</td>
                      <td className="py-3 text-right">{row.cuttingLength.toFixed(3)}</td>
                      <td className="py-3 text-right font-bold">{row.totalLength.toFixed(3)}</td>
                      <td className="py-3 text-right font-extrabold text-slate-900 dark:text-emerald-400">{row.totalWeight.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* WEIGHT DISTRIBUTION BY REBAR SIZE */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block mb-2 font-bold">REBAR SIZE BREAKDOWN</span>
              <div className="flex flex-wrap gap-2">
                {Object.entries(steelWeightByDia).map(([dia, wt]) => (
                  <span 
                    key={dia}
                    className="text-[10px] font-mono bg-slate-100 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 px-3 py-1 rounded-xl flex items-center space-x-1.5"
                  >
                    <span className="font-bold text-[#0A84FF]">{dia}</span>
                    <span className="text-slate-300">|</span>
                    <span className="font-extrabold text-slate-700 dark:text-slate-200">{wt.toFixed(1)} {isMetric ? 'kg' : 'lbs'}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* FORMULA EXPLANATION SECTION */}
          <div className="bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl backdrop-blur-lg shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h4 className="text-xs font-bold font-mono text-slate-700 dark:text-slate-350 uppercase tracking-wider flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-[#0A84FF]" />
                {formulaInfo.title} — Formula Reference
              </h4>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 font-mono text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed">
              <code className="text-[#0A84FF] font-bold">{formulaInfo.formula}</code>
            </div>
            <div className="space-y-2">
              <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest font-bold">Calculation Steps</span>
              <ol className="space-y-1.5">
                {formulaInfo.steps.map((step, si) => (
                  <li key={si} className="flex items-start gap-2 text-[10px] text-slate-600 dark:text-slate-400 font-sans">
                    <span className="flex-shrink-0 w-4 h-4 rounded-full bg-[#0A84FF]/10 text-[#0A84FF] flex items-center justify-center text-[8px] font-bold mt-0.5">{si + 1}</span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* CODE COMPLIANCE METRICS & FORMULA DOCUMENTATION */}
          <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl text-xs space-y-3">
            <span className="text-slate-500 font-mono text-[9px] uppercase tracking-widest block font-bold">ENGINEERING COMPLIANCE & VERIFICATION STEPS</span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 leading-relaxed text-slate-600 dark:text-slate-400">
              <div className="space-y-1.5">
                <h4 className="font-bold text-slate-700 dark:text-slate-300 flex items-center">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mr-1" />
                  Hook and Bend Equations
                </h4>
                <p className="font-mono text-[10px]">
                  • 180° hook: Cutting length adds <code className="text-blue-500 font-bold">9 × d</code>.<br />
                  • 135° stirrup hook: Cutting length adds <code className="text-blue-500 font-bold">10 × d</code>.<br />
                  • 90° bend: Deducts <code className="text-red-500 font-bold">2 × d</code> from pure bounding perimeter length lines.<br />
                  • 45° bend: Deducts <code className="text-red-500 font-bold">1 × d</code>.
                </p>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-bold text-slate-700 dark:text-slate-300 flex items-center">
                  <Info className="w-3.5 h-3.5 text-blue-500 mr-1" />
                  Material Quality Assurance
                </h4>
                <p className="font-sans">
                  Concrete volumes represent gross structural boundaries without rebar exclusion (per typical surveying standard rules). Rebar weights are computed from steel density of <code className="text-[#0A84FF] font-mono">7,850 kg/m³</code> (or <code className="text-[#0A84FF] font-mono">490 lbs/ft³</code> for ASTM US standards). Double check lap zones.
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
