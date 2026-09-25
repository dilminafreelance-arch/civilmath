import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Briefcase, FolderOpen, History, Bookmark, Sparkles, Plus, Trash2, 
  ChevronRight, ArrowUpRight, BarChart2, HardHat, FileCheck, Layers, Clipboard,
  Calendar, ShieldAlert, BadgePercent, CheckCircle, Scale
} from 'lucide-react';
import { SavedCalculation, Project, UnitSystem } from '../types';
import { CALCULATORS_LIST } from '../data/calculatorsData';

interface MainDashboardProps {
  savedCalculations: SavedCalculation[];
  onLoadCalculation: (calc: SavedCalculation) => void;
  onDeleteCalculation: (id: string) => void;
  unitSystem: UnitSystem;
}

export default function MainDashboard({ 
  savedCalculations, 
  onLoadCalculation, 
  onDeleteCalculation,
  unitSystem
}: MainDashboardProps) {
  
  // Local project creation state
  const [projects, setProjects] = useState<Project[]>([
    {
      id: "project_default",
      name: "Downtown Plaza Structure",
      description: "Substructure columns and geotechnical site analysis for Downtown Commercial Plaza.",
      createdAt: Date.now() - 3600000 * 24 * 3, // 3 days ago
      calculations: []
    },
    {
      id: "project_residential",
      name: "Coastal Modular Villa",
      description: "Slab deflection specs and aggregate casting bills for residential foundation.",
      createdAt: Date.now() - 3600000 * 24 * 7,
      calculations: []
    }
  ]);

  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');

  const handleCreateProject = () => {
    if (!newProjectName.trim()) return;
    const project: Project = {
      id: `project_${Date.now()}`,
      name: newProjectName,
      description: newProjectDesc,
      createdAt: Date.now(),
      calculations: []
    };
    setProjects(prev => [...prev, project]);
    setNewProjectName('');
    setNewProjectDesc('');
  };

  // Compute stat matrices
  const concreteCalcs = savedCalculations.filter(c => c.calculatorId === 'concrete-volume');
  const totalVolumeCasted = concreteCalcs.reduce((acc, c) => acc + (Number(c.outputs.volumeTotal) || 0), 0);
  const totalCostIncurred = concreteCalcs.reduce((acc, c) => acc + (Number(c.outputs.totalCost) || 0), 0);

  const beamCalcs = savedCalculations.filter(c => c.calculatorId === 'structural-beam');
  const deflectionAlarms = beamCalcs.filter(c => String(c.outputs.isDeflectionOk) === 'false').length;

  // Saved-calculation review indicator; it is not a code-compliance assessment.
  const complianceIndex = useMemo(() => {
    if (savedCalculations.length === 0) return 100;
    
    let verified = 0;
    let checked = 0;

    savedCalculations.forEach(calc => {
      // Beam deflection check
      if (calc.calculatorId === 'structural-beam' && calc.outputs) {
        checked++;
        if (String(calc.outputs.isDeflectionOk) !== 'false') verified++;
      }
      // Column capacity check
      if (calc.calculatorId === 'structural-column' && calc.outputs) {
        checked++;
        // steelRatio is already stored as percent (e.g. 1.5 for 1.5%)
        const rho = Number(calc.outputs.steelRatio);
        if (rho >= 1.0 && rho <= 8.0) verified++;
      }
      // Geotech bearing safety factor check
      if (calc.calculatorId === 'geotech-bearing' && calc.outputs) {
        checked++;
        const sf = Number(calc.inputs.safetyFactor);
        if (sf >= 3.0) verified++;
      }
    });

    if (checked === 0) return 100;
    return Math.round((verified / checked) * 100);
  }, [savedCalculations]);

  // Clickable interactive rebar state
  const [selectedRebarSize, setSelectedRebarSize] = useState<string>('#4');

  const rebarStandards = [
    { size: '#3', metric: '#10', diaIn: '0.375', diaMm: '9.5', wtLb: '0.376', wtKg: '0.560', app: 'Slab distribution mesh', code: 'ASTM A615 Grade 60' },
    { size: '#4', metric: '#13', diaIn: '0.500', diaMm: '12.7', wtLb: '0.668', wtKg: '0.994', app: 'Standard slab & lintel', code: 'ASTM A615 Grade 60' },
    { size: '#5', metric: '#16', diaIn: '0.625', diaMm: '15.8', wtLb: '1.043', wtKg: '1.552', app: 'Beams & stairs waist', code: 'ASTM A615 Grade 60 / 75' },
    { size: '#6', metric: '#19', diaIn: '0.750', diaMm: '19.0', wtLb: '1.502', wtKg: '2.235', app: 'Column stirrups & main', code: 'ASTM A706 Weldable' },
    { size: '#8', metric: '#25', diaIn: '1.000', diaMm: '25.4', wtLb: '2.670', wtKg: '3.973', app: 'Heavy column / foundations', code: 'ASTM A615 Grade 75 / 80' },
  ];

  const selectedRebarDetails = useMemo(() => {
    return rebarStandards.find(r => r.size === selectedRebarSize) || rebarStandards[1];
  }, [selectedRebarSize]);

  // Pour Casting Schedule timeline simulation list
  const SimulatedTimeline = useMemo(() => {
    const list = [
      { id: 1, title: 'Footing Mesh Pouring', project: 'Downtown Plaza Structure', date: 'Jul 14, 2026', volume: '14.5', status: 'Approved' },
      { id: 2, title: 'Ground Floor Beam Cast', project: 'Coastal Modular Villa', date: 'Jul 18, 2026', volume: '8.2', status: 'Pending Review' },
      { id: 3, title: 'Retaining Wall Wall-Plate Cast', project: 'Downtown Plaza Structure', date: 'Jul 25, 2026', volume: '12.0', status: 'Scheduling' },
    ];
    return list;
  }, []);

  return (
    <div className="space-y-6">
      
      {/* 3 STAT WIDGETS with design enhancements */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* STAT 1: Active Saves */}
        <div className="backdrop-blur-xl backdrop-saturate-150 bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-xs hover:border-[#0A84FF]/30 transition-all">
          <div className="space-y-1 text-left">
            <span className="text-[10px] font-mono text-slate-500 uppercase block tracking-wider font-bold">Saved Computations</span>
            <span className="text-2xl font-black text-slate-800 dark:text-white font-sans">{savedCalculations.length} Sheets</span>
            <span className="text-[9px] font-mono text-slate-400 block">LOCAL COMPILATIONS LOG</span>
          </div>
          <span className="p-3 bg-blue-50 dark:bg-blue-950/50 text-[#0A84FF] rounded-xl border border-blue-100 dark:border-blue-900/40">
            <Bookmark className="w-5 h-5" />
          </span>
        </div>

        {/* STAT 2: Materials volume */}
        <div className="backdrop-blur-xl backdrop-saturate-150 bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-xs hover:border-indigo-500/30 transition-all">
          <div className="space-y-1 text-left">
            <span className="text-[10px] font-mono text-slate-500 uppercase block tracking-wider font-bold">Scheduled Concrete</span>
            <span className="text-2xl font-black text-slate-800 dark:text-white font-sans">
              {totalVolumeCasted.toFixed(1)} {unitSystem === 'metric' ? 'm³' : 'yd³'}
            </span>
            <span className="text-[9px] font-mono text-slate-400 block">TOTAL VOLUME AGGREGATES</span>
          </div>
          <span className="p-3 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-100 dark:border-indigo-900/40">
            <Layers className="w-5 h-5" />
          </span>
        </div>

        {/* STAT 3: Deflection alarm indicators */}
        <div className="backdrop-blur-xl backdrop-saturate-150 bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-xs hover:border-red-500/30 transition-all">
          <div className="space-y-1 text-left">
            <span className="text-[10px] font-mono text-slate-500 uppercase block tracking-wider font-bold">Extreme Deflections</span>
            <span className={`text-2xl font-black ${deflectionAlarms > 0 ? 'text-red-500 animate-pulse' : 'text-slate-800 dark:text-white'} font-sans`}>
              {deflectionAlarms} Alarms
            </span>
            <span className="text-[9px] font-mono text-slate-400 block">EXCEEDING L/240 SERVICE LIMITS</span>
          </div>
          <span className={`p-3 rounded-xl border ${deflectionAlarms > 0 ? 'bg-red-50 dark:bg-red-950/50 text-red-500 border-red-200 dark:border-red-900/40' : 'bg-slate-50 dark:bg-slate-800/60 text-slate-400 border-slate-200 dark:border-slate-800'}`}>
            <BarChart2 className="w-5 h-5" />
          </span>
        </div>

      </div>

      {/* TWO COLUMN MAIN CONTENT PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT COLUMN (Col 7): Saved rolls & Compliance Circular Index */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Saved sheets roll */}
          <div className="backdrop-blur-xl backdrop-saturate-150 bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl backdrop-blur-lg flex flex-col justify-between min-h-[350px] shadow-xs">
            <div className="text-left">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-2">
                  <Bookmark className="w-4 h-4 text-[#0A84FF]" />
                  <h4 className="text-xs font-mono text-slate-700 dark:text-slate-350 uppercase tracking-wider font-bold">SAVED CALCULATION ROLLS</h4>
                </div>
                <span className="text-[10px] bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-2.5 py-1 rounded-md text-slate-550 dark:text-slate-400 font-mono font-bold">
                  {savedCalculations.length} total saved
                </span>
              </div>

              {savedCalculations.length === 0 ? (
                <div className="text-center py-16 space-y-3 bg-slate-50/50 dark:bg-slate-950/20 rounded-2xl border border-slate-100 dark:border-slate-850/60 mt-4">
                  <Bookmark className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono max-w-sm mx-auto p-2">
                    No saved analysis sheets found. Open any calculation panel, tweak dimensions/loading conditions, and save to preserve state here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[330px] overflow-y-auto pr-1">
                  {savedCalculations.map((calc) => {
                    const def = CALCULATORS_LIST.find(c => c.id === calc.calculatorId);
                    return (
                      <div 
                        key={calc.id} 
                        className="bg-white dark:bg-slate-905 border border-slate-200 dark:border-slate-800 hover:border-[#0A84FF]/40 dark:hover:border-[#0A84FF]/40 p-3.5 rounded-2xl flex items-center justify-between hover:bg-slate-50/40 dark:hover:bg-slate-900 shadow-xs transition-all text-left"
                      >
                        <div className="flex-1 min-w-0 pr-3">
                          <span className="text-[9px] font-mono bg-blue-50 dark:bg-blue-950/60 text-[#0A84FF] px-2 py-0.5 rounded-full uppercase border border-blue-100 dark:border-blue-900/40 font-bold">
                            {def?.category || 'General'}
                          </span>
                          <h5 className="text-xs font-bold text-slate-800 dark:text-white mt-2 font-sans overflow-hidden text-ellipsis whitespace-nowrap">
                            {calc.name} ({def?.name})
                          </h5>
                          <p className="text-[9px] font-mono text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider">
                            Saved: {new Date(calc.timestamp).toLocaleString()} // UNIT SYSTEM: {calc.unitSystem}
                          </p>
                        </div>

                        <div className="flex items-center space-x-1.5">
                          <button 
                            onClick={() => onLoadCalculation(calc)}
                            className="py-1 px-3 rounded-lg bg-[#0A84FF] hover:bg-blue-600 text-[10px] font-sans font-semibold text-white flex items-center space-x-0.5 cursor-pointer transition-colors"
                          >
                            <span>Load</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => onDeleteCalculation(calc.id)}
                            className="p-1.5 rounded-lg bg-red-50 dark:bg-red-950 hover:bg-red-100 dark:hover:bg-red-900 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30 cursor-pointer transition-colors"
                            title="Delete simulation sheet"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="text-[10px] font-mono text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-3 mt-4 text-left">
              * Calculations are saved in browser container offline databases securely.
            </div>
          </div>

          {/* Code Compliance radial bento card */}
          <div className="backdrop-blur-xl backdrop-saturate-150 bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl backdrop-blur-lg flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs text-left">
            <div className="space-y-3 flex-1">
              <div className="inline-flex items-center space-x-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 px-2 py-0.5 rounded-lg text-[9px] font-mono uppercase font-bold tracking-wider border border-emerald-500/20">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Structural Security</span>
              </div>
              <h4 className="text-sm font-bold text-slate-850 dark:text-white font-sans">
                Calculation Review Indicator
              </h4>
              <p className="text-[11px] font-mono text-slate-550 dark:text-slate-400 leading-relaxed">
                Calculates ratio of passing criteria limits (shear thresholds, deflection parameters, soil ultimate pressures, column steel reinforcement constraints) evaluated against standard structural standards. Tweak failed sheets to keep this meter optimal.
              </p>
            </div>

            {/* Circular Progress Indicator */}
            <div className="relative flex items-center justify-center w-28 h-28 flex-shrink-0">
              <svg className="w-24 h-24 transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="38"
                  strokeWidth="8"
                  stroke="#e2e8f0"
                  fill="transparent"
                  className="dark:stroke-slate-800"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="38"
                  strokeWidth="8"
                  stroke={complianceIndex >= 85 ? '#10b981' : complianceIndex >= 50 ? '#f59e0b' : '#ef4444'}
                  strokeDasharray={2 * Math.PI * 38}
                  strokeDashoffset={2 * Math.PI * 38 * (1 - complianceIndex / 100)}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-lg font-black text-slate-800 dark:text-white font-mono">{complianceIndex}%</span>
                <span className="text-[8px] font-mono text-slate-400 block font-bold">REVIEW SCORE</span>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN (Col 5): Projects catalog & pour scheduling timeline */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Projects Collaboration */}
          <div className="backdrop-blur-xl backdrop-saturate-150 bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl backdrop-blur-lg flex flex-col justify-between min-h-[350px] shadow-xs">
            <div className="text-left">
              <div className="flex items-center space-x-2 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                <FolderOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h4 className="text-xs font-mono text-slate-700 dark:text-slate-350 uppercase tracking-wider font-bold">PROJECT COLLABORATION</h4>
              </div>

              <div className="space-y-3.5 max-h-[175px] overflow-y-auto pr-1">
                {projects.map((proj) => (
                  <div key={proj.id} className="bg-white dark:bg-slate-905 border border-slate-150 dark:border-slate-850 p-3 rounded-xl flex justify-between items-center shadow-xs">
                    <div className="text-left">
                      <h5 className="text-[11px] font-bold text-slate-800 dark:text-slate-150">{proj.name}</h5>
                      <p className="text-[9px] text-slate-550 dark:text-slate-400 mt-0.5 line-clamp-1">{proj.description}</p>
                      <span className="text-[8px] font-mono text-slate-400 block mt-1">CREATION: {new Date(proj.createdAt).toLocaleDateString()}</span>
                    </div>
                    <span className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-lg border border-emerald-100 dark:border-emerald-900/40">
                      <FolderOpen className="w-4 h-4" />
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* New Project creation form */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-3.5 space-y-2 mt-4 text-left">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block mb-1 font-extrabold">Configure New Project</span>
              <input 
                aria-label="New project title name"
                type="text" 
                placeholder="e.g. West Highway Tunnel" 
                value={newProjectName}
                onChange={e => setNewProjectName(e.target.value)}
                className="w-full backdrop-blur-xl backdrop-saturate-150 bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-[11px] font-mono rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-white outline-none focus:border-emerald-500 h-9 shadow-2xs"
              />
              <input 
                aria-label="New project brief description"
                type="text" 
                placeholder="Brief structural scope note" 
                value={newProjectDesc}
                onChange={e => setNewProjectDesc(e.target.value)}
                className="w-full backdrop-blur-xl backdrop-saturate-150 bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-[11px] font-mono rounded-lg px-2.5 py-1.5 text-slate-600 dark:text-slate-350 outline-none focus:border-emerald-500 h-9 shadow-2xs"
              />
              <button
                onClick={handleCreateProject}
                className="w-full h-9 bg-emerald-600 hover:bg-emerald-500 text-white font-sans text-xs font-bold rounded-lg flex items-center justify-center space-x-1 cursor-pointer transition-colors shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Provision Project</span>
              </button>
            </div>
          </div>

          {/* Pour Casting Schedule timeline */}
          <div className="backdrop-blur-xl backdrop-saturate-150 bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-xs text-left">
            <div className="flex items-center space-x-2 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <Calendar className="w-4 h-4 text-indigo-500" />
              <h4 className="text-xs font-mono text-slate-700 dark:text-slate-350 uppercase tracking-wider font-bold">CASTING SCHEDULES</h4>
            </div>

            <div className="space-y-4">
              {SimulatedTimeline.map((item, idx) => (
                <div key={item.id} className="relative flex items-start pl-6 pb-2 last:pb-0">
                  {/* Timeline indicator line */}
                  {idx !== SimulatedTimeline.length - 1 && (
                    <div className="absolute left-1.5 top-3.5 bottom-0 w-0.5 bg-slate-100 dark:bg-slate-800"></div>
                  )}
                  <div className="absolute left-0 top-1.5 w-3 h-3 bg-indigo-500 rounded-full border-2 border-white dark:border-slate-900"></div>
                  
                  <div className="flex-1 text-left space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-850 dark:text-slate-150">{item.title}</span>
                      <span className="text-[8px] font-mono font-bold uppercase bg-slate-50 dark:bg-slate-950 text-slate-450 dark:text-slate-500 px-1.5 py-0.5 rounded border border-slate-200/60 dark:border-slate-850">
                        {item.status}
                      </span>
                    </div>
                    <p className="text-[9px] text-slate-500 dark:text-slate-400 font-mono">Project: {item.project}</p>
                    <div className="flex items-center space-x-2 text-[9px] font-mono text-slate-450 dark:text-slate-500">
                      <span>DATE: {item.date}</span>
                      <span>•</span>
                      <span>VOL: {item.volume} {unitSystem === 'metric' ? 'm³' : 'yd³'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* FULL WIDTH BOTTOM: ASTM Rebars sizes standards with clickability */}
      <div className="backdrop-blur-xl backdrop-saturate-150 bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs text-left">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <HardHat className="w-5 h-5 text-amber-500" />
            <div>
              <h4 className="text-xs font-mono text-amber-500 uppercase tracking-widest font-bold">CIVILMATH REBAR CODES & MATRICES</h4>
              <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400">ASTM STEEL STANDARDS / REBAR DIAMETERS & NOMINAL WEIGHTS</p>
            </div>
          </div>

          <div className="flex space-x-1 overflow-x-auto scrollbar-none py-1">
            {rebarStandards.map((r) => (
              <button
                key={r.size}
                onClick={() => setSelectedRebarSize(r.size)}
                className={`px-3 py-1 text-[10px] font-mono rounded-lg border uppercase whitespace-nowrap transition-colors cursor-pointer ${selectedRebarSize === r.size ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-450 font-bold' : 'border-slate-200 dark:border-slate-800 backdrop-blur-xl backdrop-saturate-150 bg-white/60 dark:bg-slate-900/60 text-slate-500 hover:text-slate-800 dark:hover:text-white'}`}
              >
                Size {r.size}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left panel: Active rebar details */}
          <div className="lg:col-span-4 p-4 bg-amber-500/5 dark:bg-amber-500/5 border border-amber-500/10 dark:border-amber-500/10 rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-amber-500/15 pb-2">
              <span className="text-xs font-black text-slate-800 dark:text-white font-mono">ASTM {selectedRebarDetails.size} Standard Spec</span>
              <span className="text-[9px] font-mono font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full">
                ACTIVE
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3.5 text-left text-[11px] font-mono">
              <div>
                <span className="text-[9px] text-slate-500 block">Metric Designation</span>
                <span className="font-bold text-slate-800 dark:text-white">{selectedRebarDetails.metric}</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 block">Nominal Diameter</span>
                <span className="font-bold text-slate-800 dark:text-white">{selectedRebarDetails.diaIn}" / {selectedRebarDetails.diaMm} mm</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 block">Unit weight (lbs/ft)</span>
                <span className="font-bold text-slate-800 dark:text-white">{selectedRebarDetails.wtLb} lb/ft</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 block">Unit weight (kg/m)</span>
                <span className="font-bold text-slate-800 dark:text-white">{selectedRebarDetails.wtKg} kg/m</span>
              </div>
              <div className="col-span-2">
                <span className="text-[9px] text-slate-500 block">Typical Structural Use</span>
                <span className="font-bold text-slate-800 dark:text-white">{selectedRebarDetails.app}</span>
              </div>
            </div>
          </div>

          {/* Right panel: Full rebar table */}
          <div className="lg:col-span-8 overflow-x-auto">
            <table className="w-full text-left border-collapse text-[10px] font-mono text-slate-500">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-300 font-bold">
                  <th className="py-2.5 pr-4">US SIZE</th>
                  <th className="py-2.5 pr-4">METRIC NOM</th>
                  <th className="py-2.5 pr-4">DIAMETER (IN)</th>
                  <th className="py-2.5 pr-4">DIAMETER (MM)</th>
                  <th className="py-2.5 pr-4">WEIGHT (LB/FT)</th>
                  <th className="py-2.5 pr-4">WEIGHT (KG/M)</th>
                  <th className="py-2.5">REVIEW STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-600 dark:text-slate-400">
                {rebarStandards.map((r) => (
                  <tr 
                    key={r.size} 
                    onClick={() => setSelectedRebarSize(r.size)}
                    className={`cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-850/60 transition-colors ${selectedRebarSize === r.size ? 'bg-amber-500/5 dark:bg-amber-500/5 font-semibold text-slate-800 dark:text-white' : ''}`}
                  >
                    <td className="py-2.5 font-extrabold text-slate-800 dark:text-slate-200">{r.size}</td>
                    <td className="py-2.5">{r.metric}</td>
                    <td className="py-2.5">{r.diaIn}</td>
                    <td className="py-2.5">{r.diaMm}</td>
                    <td className="py-2.5">{r.wtLb}</td>
                    <td className="py-2.5">{r.wtKg}</td>
                    <td className="py-2.5 text-emerald-600 dark:text-emerald-400 font-bold">{r.code}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </div>

    </div>
  );
}
