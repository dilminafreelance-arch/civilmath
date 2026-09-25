import React from 'react';
import { StructureType } from '../types';

function SvgWrapper({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="w-full max-w-xs mx-auto bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
      <div className="text-[9px] font-mono text-slate-400 uppercase tracking-wider mb-3 text-center font-bold">{label}</div>
      <svg viewBox="0 0 200 160" className="w-full h-auto text-slate-700 dark:text-slate-300">
        {children}
      </svg>
    </div>
  );
}

export function FootingDrawing() {
  return (
    <SvgWrapper label="Isolated Footing - Reinforcement Layout">
      <rect x="20" y="30" width="160" height="100" fill="none" stroke="currentColor" strokeWidth="2" rx="4" />
      <line x1="30" y1="50" x2="170" y2="50" stroke="#0A84FF" strokeWidth="1.5" strokeDasharray="4 3" />
      <line x1="30" y1="80" x2="170" y2="80" stroke="#0A84FF" strokeWidth="1.5" strokeDasharray="4 3" />
      <line x1="30" y1="110" x2="170" y2="110" stroke="#0A84FF" strokeWidth="1.5" strokeDasharray="4 3" />
      <line x1="50" y1="30" x2="50" y2="130" stroke="#22C55E" strokeWidth="1.5" strokeDasharray="3 3" />
      <line x1="90" y1="30" x2="90" y2="130" stroke="#22C55E" strokeWidth="1.5" strokeDasharray="3 3" />
      <line x1="130" y1="30" x2="130" y2="130" stroke="#22C55E" strokeWidth="1.5" strokeDasharray="3 3" />
      <line x1="170" y1="30" x2="170" y2="130" stroke="#22C55E" strokeWidth="1.5" strokeDasharray="3 3" />
      <text x="100" y="145" className="text-[8px] fill-slate-400 font-mono" textAnchor="middle">L - 2×Cover</text>
      <text x="12" y="80" className="text-[7px] fill-slate-400 font-mono" textAnchor="middle" transform="rotate(-90, 12, 80)">W - 2×Cover</text>
      <text x="100" y="20" className="text-[7px] fill-slate-400 font-mono" textAnchor="middle">Main Bars (X) / Distribution Bars (Y)</text>
    </SvgWrapper>
  );
}

export function CombinedFootingDrawing() {
  return (
    <SvgWrapper label="Combined Footing - Multi-Column Layout">
      <rect x="15" y="35" width="170" height="90" fill="none" stroke="currentColor" strokeWidth="2" rx="4" />
      <rect x="25" y="45" width="55" height="70" fill="none" stroke="#0A84FF" strokeWidth="1" strokeDasharray="3 3" />
      <rect x="120" y="45" width="55" height="70" fill="none" stroke="#0A84FF" strokeWidth="1" strokeDasharray="3 3" />
      <rect x="40" y="55" width="12" height="12" fill="#0A84FF" opacity="0.3" />
      <rect x="148" y="55" width="12" height="12" fill="#0A84FF" opacity="0.3" />
      <text x="52" y="62" className="text-[6px] fill-[#0A84FF] font-mono" textAnchor="middle">C1</text>
      <text x="160" y="62" className="text-[6px] fill-[#0A84FF] font-mono" textAnchor="middle">C2</text>
      <line x1="30" y1="50" x2="170" y2="50" stroke="#22C55E" strokeWidth="1" strokeDasharray="3 2" />
      <line x1="30" y1="110" x2="170" y2="110" stroke="#22C55E" strokeWidth="1" strokeDasharray="3 2" />
      <text x="100" y="140" className="text-[7px] fill-slate-400 font-mono" textAnchor="middle">Combined Footing - Bottom &amp; Top Mesh</text>
    </SvgWrapper>
  );
}

export function ColumnDrawing() {
  return (
    <SvgWrapper label="Reinforced Column - Longitudinal &amp; Ties">
      <rect x="50" y="15" width="100" height="130" fill="none" stroke="currentColor" strokeWidth="2" rx="3" />
      <line x1="62" y1="15" x2="62" y2="145" stroke="#0A84FF" strokeWidth="2" />
      <line x1="85" y1="15" x2="85" y2="145" stroke="#0A84FF" strokeWidth="2" />
      <line x1="115" y1="15" x2="115" y2="145" stroke="#0A84FF" strokeWidth="2" />
      <line x1="138" y1="15" x2="138" y2="145" stroke="#0A84FF" strokeWidth="2" />
      <rect x="55" y="25" width="90" height="12" fill="none" stroke="#22C55E" strokeWidth="1.5" rx="2" />
      <rect x="55" y="55" width="90" height="12" fill="none" stroke="#22C55E" strokeWidth="1.5" rx="2" />
      <rect x="55" y="85" width="90" height="12" fill="none" stroke="#22C55E" strokeWidth="1.5" rx="2" />
      <rect x="55" y="115" width="90" height="12" fill="none" stroke="#22C55E" strokeWidth="1.5" rx="2" />
      <text x="100" y="12" className="text-[7px] fill-slate-400 font-mono" textAnchor="middle">Column Main Bars + Ties @ Spacing</text>
    </SvgWrapper>
  );
}

export function BeamDrawing() {
  return (
    <SvgWrapper label="Beam - Top, Bottom Bars &amp; Stirrups">
      <rect x="15" y="50" width="170" height="60" fill="none" stroke="currentColor" strokeWidth="2" rx="3" />
      <line x1="15" y1="60" x2="185" y2="60" stroke="#0A84FF" strokeWidth="2" />
      <line x1="15" y1="100" x2="185" y2="100" stroke="#0A84FF" strokeWidth="2" />
      <path d="M 30 50 L 30 110" stroke="#22C55E" strokeWidth="1.5" fill="none" />
      <path d="M 60 50 L 60 110" stroke="#22C55E" strokeWidth="1.5" fill="none" />
      <path d="M 100 50 L 100 110" stroke="#22C55E" strokeWidth="1.5" fill="none" />
      <path d="M 140 50 L 140 110" stroke="#22C55E" strokeWidth="1.5" fill="none" />
      <path d="M 170 50 L 170 110" stroke="#22C55E" strokeWidth="1.5" fill="none" />
      <path d="M 30 50 C 25 43, 35 43, 30 50" stroke="#22C55E" strokeWidth="1" fill="none" />
      <path d="M 170 50 C 175 43, 165 43, 170 50" stroke="#22C55E" strokeWidth="1" fill="none" />
      <text x="100" y="125" className="text-[7px] fill-slate-400 font-mono" textAnchor="middle">Top (blue) + Bottom + Stirrups (green)</text>
    </SvgWrapper>
  );
}

export function SlabDrawing() {
  return (
    <SvgWrapper label="Slab - Cranked &amp; Distribution Bars">
      <rect x="15" y="40" width="170" height="80" fill="none" stroke="currentColor" strokeWidth="2" rx="3" />
      <path d="M 20 80 L 40 80 L 55 55 L 80 55 L 180 55" fill="none" stroke="#0A84FF" strokeWidth="2" />
      <path d="M 20 100 L 50 100 L 65 75 L 90 75 L 180 75" fill="none" stroke="#0A84FF" strokeWidth="2" />
      <line x1="60" y1="40" x2="60" y2="120" stroke="#22C55E" strokeWidth="1" strokeDasharray="3 3" />
      <line x1="100" y1="40" x2="100" y2="120" stroke="#22C55E" strokeWidth="1" strokeDasharray="3 3" />
      <line x1="140" y1="40" x2="140" y2="120" stroke="#22C55E" strokeWidth="1" strokeDasharray="3 3" />
      <text x="100" y="135" className="text-[7px] fill-slate-400 font-mono" textAnchor="middle">Cranked Main Bars + Distribution Bars</text>
    </SvgWrapper>
  );
}

export function StaircaseDrawing() {
  return (
    <SvgWrapper label="Staircase Waist Slab Reinforcement">
      <polyline points="20,130 20,80 50,80 50,60 80,60 80,40 110,40 110,30 160,30" fill="none" stroke="currentColor" strokeWidth="2" />
      <line x1="20" y1="95" x2="160" y2="50" stroke="#0A84FF" strokeWidth="2" strokeDasharray="5 3" />
      <line x1="20" y1="85" x2="160" y2="40" stroke="#22C55E" strokeWidth="1.5" strokeDasharray="3 3" />
      <text x="25" y="113" className="text-[7px] fill-slate-400 font-mono">Riser</text>
      <text x="55" y="73" className="text-[7px] fill-slate-400 font-mono">Tread</text>
      <text x="90" y="65" className="text-[7px] fill-[#0A84FF] font-mono">Main Steel</text>
      <text x="110" y="30" className="text-[7px] fill-slate-400 font-mono" textAnchor="middle">Waist Slab</text>
    </SvgWrapper>
  );
}

export function RetainingWallDrawing() {
  return (
    <SvgWrapper label="Cantilever Retaining Wall">
      <polygon points="50,130 50,30 120,30 120,100 160,100 160,130" fill="none" stroke="currentColor" strokeWidth="2" />
      <line x1="50" y1="40" x2="120" y2="40" stroke="#0A84FF" strokeWidth="1.5" strokeDasharray="4 3" />
      <line x1="50" y1="70" x2="120" y2="70" stroke="#0A84FF" strokeWidth="1.5" strokeDasharray="4 3" />
      <line x1="50" y1="100" x2="120" y2="100" stroke="#0A84FF" strokeWidth="1.5" strokeDasharray="4 3" />
      <line x1="60" y1="30" x2="60" y2="100" stroke="#22C55E" strokeWidth="2" />
      <line x1="90" y1="30" x2="90" y2="100" stroke="#22C55E" strokeWidth="2" />
      <line x1="140" y1="100" x2="140" y2="130" stroke="#22C55E" strokeWidth="1.5" strokeDasharray="3 3" />
      <line x1="160" y1="100" x2="160" y2="130" stroke="#22C55E" strokeWidth="1.5" strokeDasharray="3 3" />
      <text x="85" y="17" className="text-[7px] fill-slate-400 font-mono" textAnchor="middle">Stem Vert/Horiz</text>
      <text x="140" y="118" className="text-[7px] fill-slate-400 font-mono">Base</text>
    </SvgWrapper>
  );
}

export function RaftFoundationDrawing() {
  return (
    <SvgWrapper label="Raft Foundation - Heavy Mesh">
      <rect x="15" y="30" width="170" height="100" fill="none" stroke="currentColor" strokeWidth="2" rx="4" />
      <line x1="25" y1="45" x2="175" y2="45" stroke="#0A84FF" strokeWidth="2" />
      <line x1="25" y1="70" x2="175" y2="70" stroke="#0A84FF" strokeWidth="2" />
      <line x1="25" y1="95" x2="175" y2="95" stroke="#22C55E" strokeWidth="2" />
      <line x1="25" y1="120" x2="175" y2="120" stroke="#22C55E" strokeWidth="2" />
      <line x1="40" y1="30" x2="40" y2="130" stroke="#0A84FF" strokeWidth="1.5" strokeDasharray="4 3" />
      <line x1="80" y1="30" x2="80" y2="130" stroke="#0A84FF" strokeWidth="1.5" strokeDasharray="4 3" />
      <line x1="120" y1="30" x2="120" y2="130" stroke="#22C55E" strokeWidth="1.5" strokeDasharray="4 3" />
      <line x1="160" y1="30" x2="160" y2="130" stroke="#22C55E" strokeWidth="1.5" strokeDasharray="4 3" />
      <text x="100" y="145" className="text-[7px] fill-slate-400 font-mono" textAnchor="middle">Top Mesh (blue) / Bottom Mesh (green)</text>
    </SvgWrapper>
  );
}

export function StripFootingDrawing() {
  return (
    <SvgWrapper label="Strip Footing - Longitudinal &amp; Transverse">
      <rect x="10" y="40" width="180" height="80" fill="none" stroke="currentColor" strokeWidth="2" rx="3" />
      <line x1="20" y1="55" x2="180" y2="55" stroke="#0A84FF" strokeWidth="2" />
      <line x1="20" y1="75" x2="180" y2="75" stroke="#0A84FF" strokeWidth="2" />
      <line x1="20" y1="95" x2="180" y2="95" stroke="#0A84FF" strokeWidth="2" />
      <line x1="45" y1="40" x2="45" y2="120" stroke="#22C55E" strokeWidth="1.5" />
      <line x1="85" y1="40" x2="85" y2="120" stroke="#22C55E" strokeWidth="1.5" />
      <line x1="125" y1="40" x2="125" y2="120" stroke="#22C55E" strokeWidth="1.5" />
      <line x1="165" y1="40" x2="165" y2="120" stroke="#22C55E" strokeWidth="1.5" />
      <text x="100" y="135" className="text-[7px] fill-slate-400 font-mono" textAnchor="middle">Longitudinal (blue) + Transverse (green)</text>
    </SvgWrapper>
  );
}

export function PedestalDrawing() {
  return (
    <SvgWrapper label="Pedestal - Starter Bars + Ties">
      <rect x="50" y="20" width="100" height="80" fill="none" stroke="currentColor" strokeWidth="2" rx="3" />
      <line x1="62" y1="20" x2="62" y2="100" stroke="#0A84FF" strokeWidth="2" />
      <line x1="85" y1="20" x2="85" y2="100" stroke="#0A84FF" strokeWidth="2" />
      <line x1="115" y1="20" x2="115" y2="100" stroke="#0A84FF" strokeWidth="2" />
      <line x1="138" y1="20" x2="138" y2="100" stroke="#0A84FF" strokeWidth="2" />
      <rect x="55" y="25" width="90" height="10" fill="none" stroke="#22C55E" strokeWidth="1.5" rx="1" />
      <rect x="55" y="55" width="90" height="10" fill="none" stroke="#22C55E" strokeWidth="1.5" rx="1" />
      <rect x="55" y="80" width="90" height="10" fill="none" stroke="#22C55E" strokeWidth="1.5" rx="1" />
      <path d="M 62 100 L 55 115" stroke="#0A84FF" strokeWidth="1.5" />
      <path d="M 85 100 L 80 115" stroke="#0A84FF" strokeWidth="1.5" />
      <path d="M 115 100 L 110 115" stroke="#0A84FF" strokeWidth="1.5" />
      <path d="M 138 100 L 145 115" stroke="#0A84FF" strokeWidth="1.5" />
      <text x="100" y="130" className="text-[7px] fill-slate-400 font-mono" textAnchor="middle">Starter Bars + Lacing Ties</text>
    </SvgWrapper>
  );
}

export function FoundationMeshDrawing() {
  return (
    <SvgWrapper label="Foundation Mesh - Top &amp; Bottom Grid">
      <rect x="20" y="30" width="160" height="100" fill="none" stroke="currentColor" strokeWidth="2" rx="4" />
      <line x1="30" y1="45" x2="170" y2="45" stroke="#0A84FF" strokeWidth="1.5" strokeDasharray="4 3" />
      <line x1="30" y1="65" x2="170" y2="65" stroke="#0A84FF" strokeWidth="1.5" strokeDasharray="4 3" />
      <line x1="30" y1="95" x2="170" y2="95" stroke="#22C55E" strokeWidth="1.5" strokeDasharray="4 3" />
      <line x1="30" y1="115" x2="170" y2="115" stroke="#22C55E" strokeWidth="1.5" strokeDasharray="4 3" />
      <line x1="50" y1="30" x2="50" y2="130" stroke="#0A84FF" strokeWidth="1" strokeDasharray="3 3" />
      <line x1="90" y1="30" x2="90" y2="130" stroke="#0A84FF" strokeWidth="1" strokeDasharray="3 3" />
      <line x1="130" y1="30" x2="130" y2="130" stroke="#22C55E" strokeWidth="1" strokeDasharray="3 3" />
      <line x1="170" y1="30" x2="170" y2="130" stroke="#22C55E" strokeWidth="1" strokeDasharray="3 3" />
      <text x="100" y="148" className="text-[7px] fill-slate-400 font-mono" textAnchor="middle">Top Mesh (blue) / Bottom Mesh (green)</text>
    </SvgWrapper>
  );
}

export function getDrawingComponent(type: StructureType) {
  const components: Record<StructureType, React.FC<{}>> = {
    'footing': FootingDrawing,
    'combined-footing': CombinedFootingDrawing,
    'strip-footing': StripFootingDrawing,
    'raft-foundation': RaftFoundationDrawing,
    'beam': BeamDrawing,
    'plinth-beam': BeamDrawing,
    'tie-beam': BeamDrawing,
    'lintel-beam': BeamDrawing,
    'column': ColumnDrawing,
    'pedestal': PedestalDrawing,
    'slab': SlabDrawing,
    'staircase': StaircaseDrawing,
    'retaining-wall': RetainingWallDrawing,
    'foundation-mesh': FoundationMeshDrawing,
  };
  return components[type] || FootingDrawing;
}
