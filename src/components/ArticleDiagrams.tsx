import React from 'react';

interface DiagramProps {
  slug: string;
}

export default function ArticleDiagram({ slug }: DiagramProps) {
  const norm = slug.toLowerCase();

  if (norm.includes('beam')) {
    return (
      <figure className="my-6 rounded-2xl overflow-hidden border border-[#D8D0C2] dark:border-[#384238] bg-white dark:bg-[#1E221E] p-4 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between mb-3 text-xs font-mono font-bold text-[#657565] dark:text-[#A1B3A1]">
          <span>Fig 1.1 — Simply Supported Beam: Load, BMD & SFD Distribution</span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-[#657565]/10">Euler-Bernoulli Mechanics</span>
        </div>
        <svg viewBox="0 0 760 300" className="w-full h-auto text-[#20231F] dark:text-[#EAE7E0] select-none font-mono text-[11px]">
          {/* Defs for arrowheads */}
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="currentColor" />
            </marker>
            <marker id="arrowGreen" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#657565" />
            </marker>
          </defs>

          {/* 1. Beam Line & Supports */}
          <text x="50" y="25" className="font-bold fill-[#657565] dark:fill-[#A1B3A1]">A. Loading Diagram (UDL w kN/m)</text>
          {/* UDL arrows */}
          {Array.from({ length: 11 }).map((_, i) => {
            const x = 110 + i * 54;
            return (
              <g key={i}>
                <line x1={x} y1="42" x2={x} y2="70" stroke="#B56F50" strokeWidth="1.5" markerEnd="url(#arrow)" />
              </g>
            );
          })}
          <line x1="110" y1="42" x2="650" y2="42" stroke="#B56F50" strokeWidth="2" />
          <text x="380" y="38" textAnchor="middle" className="fill-[#B56F50] font-bold">UDL w (kN/m)</text>

          {/* Beam body */}
          <rect x="110" y="70" width="540" height="12" rx="2" fill="#EAE7E0" stroke="#7B8978" strokeWidth="1.5" className="dark:fill-[#2A312A] dark:stroke-[#555C55]" />

          {/* Supports */}
          {/* Pin A */}
          <polygon points="110,82 98,102 122,102" fill="#657565" />
          <line x1="92" y1="102" x2="128" y2="102" stroke="currentColor" strokeWidth="2" />
          <text x="85" y="96" className="font-bold fill-[#657565]">A</text>
          <text x="65" y="118" className="text-[10px] fill-[#7B8978]">R_A = wL/2</text>

          {/* Roller B */}
          <polygon points="650,82 638,98 662,98" fill="#657565" />
          <circle cx="642" cy="103" r="3" fill="currentColor" />
          <circle cx="658" cy="103" r="3" fill="currentColor" />
          <line x1="632" y1="107" x2="668" y2="107" stroke="currentColor" strokeWidth="2" />
          <text x="670" y="96" className="font-bold fill-[#657565]">B</text>
          <text x="635" y="122" className="text-[10px] fill-[#7B8978]">R_B = wL/2</text>

          {/* Span Dimension */}
          <line x1="110" y1="116" x2="650" y2="116" stroke="#7B8978" strokeWidth="1" strokeDasharray="3 3" />
          <text x="380" y="113" textAnchor="middle" className="font-bold fill-current">Span Length = L</text>

          {/* 2. Bending Moment Diagram (BMD) */}
          <g transform="translate(0, 50)">
            <text x="50" y="105" className="font-bold fill-[#657565] dark:fill-[#A1B3A1]">B. Bending Moment Diagram (BMD)</text>
            <line x1="110" y1="140" x2="650" y2="140" stroke="#7B8978" strokeWidth="1" />
            {/* Parabola */}
            <path d="M 110 140 Q 380 200 650 140" fill="rgba(101, 117, 101, 0.15)" stroke="#657565" strokeWidth="2" />
            <line x1="380" y1="140" x2="380" y2="170" stroke="#657565" strokeWidth="1.5" strokeDasharray="2 2" />
            <circle cx="380" cy="170" r="3" fill="#657565" />
            <text x="380" y="188" textAnchor="middle" className="font-bold fill-[#657565] dark:fill-[#A1B3A1]">
              M_max = + wL² / 8 (Mid-span Tension)
            </text>
            <text x="120" y="135" className="text-[10px] fill-[#7B8978]">M = 0</text>
            <text x="620" y="135" className="text-[10px] fill-[#7B8978]">M = 0</text>
          </g>

          {/* 3. Shear Force Diagram (SFD) */}
          <g transform="translate(0, 150)">
            <text x="50" y="75" className="font-bold fill-[#657565] dark:fill-[#A1B3A1]">C. Shear Force Diagram (SFD)</text>
            <line x1="110" y1="100" x2="650" y2="100" stroke="#7B8978" strokeWidth="1" />
            {/* SFD Polyline */}
            <polygon points="110,100 110,75 380,100 380,100 110,100" fill="rgba(37, 99, 235, 0.1)" />
            <polygon points="380,100 650,125 650,100 380,100" fill="rgba(225, 29, 72, 0.1)" />
            <line x1="110" y1="75" x2="650" y2="125" stroke="#4A5568" strokeWidth="2" />
            <line x1="110" y1="100" x2="110" y2="75" stroke="#4A5568" strokeWidth="1.5" />
            <line x1="650" y1="100" x2="650" y2="125" stroke="#4A5568" strokeWidth="1.5" />
            <text x="115" y="70" className="font-bold fill-blue-600 dark:fill-blue-400">+wL / 2</text>
            <text x="605" y="138" className="font-bold fill-rose-600 dark:fill-rose-400">-wL / 2</text>
            <text x="380" y="93" textAnchor="middle" className="text-[10px] fill-[#7B8978]">V = 0 (Zero Shear)</text>
          </g>
        </svg>
        <figcaption className="mt-2 text-center text-[11px] text-[#7B8978] leading-relaxed">
          Standard structural mechanics relationship: maximum bending moment coincides exactly with the point of zero shear force at mid-span under uniform loading.
        </figcaption>
      </figure>
    );
  }

  if (norm.includes('concrete') || norm.includes('volume')) {
    return (
      <figure className="my-6 rounded-2xl overflow-hidden border border-[#D8D0C2] dark:border-[#384238] bg-white dark:bg-[#1E221E] p-4 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between mb-3 text-xs font-mono font-bold text-[#657565] dark:text-[#A1B3A1]">
          <span>Fig 1.2 — Wet Mixed Concrete to Dry Ingredient Volume Ratio (1.54 Factor)</span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-[#657565]/10">IS 456 / BS 8500</span>
        </div>
        <svg viewBox="0 0 760 210" className="w-full h-auto text-[#20231F] dark:text-[#EAE7E0] select-none font-mono text-[11px]">
          {/* Wet Box */}
          <rect x="70" y="50" width="160" height="110" rx="6" fill="rgba(101, 117, 101, 0.15)" stroke="#657565" strokeWidth="2" />
          <text x="150" y="85" textAnchor="middle" className="font-black text-sm fill-[#20231F] dark:fill-[#EAE7E0]">1.0 m³</text>
          <text x="150" y="105" textAnchor="middle" className="font-bold fill-[#657565] dark:fill-[#A1B3A1]">Wet Compacted</text>
          <text x="150" y="125" textAnchor="middle" className="text-[10px] fill-[#7B8978]">In-Place Concrete</text>

          {/* Transformation Arrow */}
          <g transform="translate(255, 95)">
            <line x1="0" y1="10" x2="80" y2="10" stroke="#B56F50" strokeWidth="3" markerEnd="url(#arrow)" />
            <text x="40" y="-3" textAnchor="middle" className="font-bold fill-[#B56F50] text-[10px]">× 1.54 FACTOR</text>
            <text x="40" y="32" textAnchor="middle" className="text-[9px] fill-[#7B8978]">Void Loss + Shrinkage</text>
          </g>

          {/* Dry Components Stack */}
          <g transform="translate(370, 30)">
            <rect x="0" y="0" width="280" height="150" rx="8" fill="#FAF9F6" stroke="#D8D0C2" strokeWidth="1.5" className="dark:fill-[#252B25] dark:stroke-[#384238]" />
            <text x="140" y="24" textAnchor="middle" className="font-black text-sm fill-[#20231F] dark:fill-[#EAE7E0]">
              1.54 m³ Dry Materials Required
            </text>

            {/* Cement Bar */}
            <rect x="20" y="38" width="50" height="32" rx="4" fill="#657565" />
            <text x="45" y="58" textAnchor="middle" className="fill-white font-bold text-[10px]">Cement</text>
            <text x="45" y="84" textAnchor="middle" className="text-[10px] font-mono fill-[#7B8978]">1 Part</text>

            <text x="85" y="58" className="text-base font-bold fill-[#7B8978]">+</text>

            {/* Sand Bar */}
            <rect x="100" y="38" width="65" height="32" rx="4" fill="#9A8062" />
            <text x="132" y="58" textAnchor="middle" className="fill-white font-bold text-[10px]">Sand</text>
            <text x="132" y="84" textAnchor="middle" className="text-[10px] font-mono fill-[#7B8978]">1.5 Parts</text>

            <text x="180" y="58" className="text-base font-bold fill-[#7B8978]">+</text>

            {/* Aggregate Bar */}
            <rect x="195" y="38" width="70" height="32" rx="4" fill="#5A675A" />
            <text x="230" y="58" textAnchor="middle" className="fill-white font-bold text-[10px]">Aggregate</text>
            <text x="230" y="84" textAnchor="middle" className="text-[10px] font-mono fill-[#7B8978]">3 Parts (M20)</text>

            {/* Bottom calculation reminder */}
            <rect x="20" y="105" width="245" height="30" rx="4" fill="rgba(101,117,101,0.08)" />
            <text x="142" y="124" textAnchor="middle" className="text-[10px] font-mono fill-[#444D44] dark:fill-[#A1B3A1]">
              Sum of Ratios = 1 + 1.5 + 3 = 5.5 Parts
            </text>
          </g>
        </svg>
        <figcaption className="mt-2 text-center text-[11px] text-[#7B8978] leading-relaxed">
          The 1.54 dry volume coefficient compensates for the approximately 35% collapse of interstitial voids when dry sand and coarse gravel are wetted and mixed with cement paste.
        </figcaption>
      </figure>
    );
  }

  if (norm.includes('rebar') || norm.includes('bbs') || norm.includes('steel')) {
    return (
      <figure className="my-6 rounded-2xl overflow-hidden border border-[#D8D0C2] dark:border-[#384238] bg-white dark:bg-[#1E221E] p-4 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between mb-3 text-xs font-mono font-bold text-[#657565] dark:text-[#A1B3A1]">
          <span>Fig 1.3 — Standard Rebar Bends, Hook Lengths & Bend Deduction Allowances</span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-[#657565]/10">BS 8666 / IS 2502</span>
        </div>
        <svg viewBox="0 0 760 190" className="w-full h-auto text-[#20231F] dark:text-[#EAE7E0] select-none font-mono text-[11px]">
          {/* Card 1: 45 Degree Bend */}
          <g transform="translate(40, 20)">
            <rect x="0" y="0" width="200" height="145" rx="8" fill="#FAF9F6" stroke="#D8D0C2" strokeWidth="1" className="dark:fill-[#252B25] dark:stroke-[#384238]" />
            <text x="100" y="24" textAnchor="middle" className="font-bold text-xs fill-[#20231F] dark:fill-[#EAE7E0]">45° Crank Bend</text>
            <path d="M 25 105 L 90 105 L 155 45" fill="none" stroke="#657565" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
            <text x="100" y="125" textAnchor="middle" className="font-bold fill-[#B56F50] text-[11px]">Deduction = 1 × d</text>
            <text x="100" y="139" textAnchor="middle" className="text-[9px] fill-[#7B8978]">d = bar diameter</text>
          </g>

          {/* Card 2: 90 Degree L-Bend */}
          <g transform="translate(280, 20)">
            <rect x="0" y="0" width="200" height="145" rx="8" fill="#FAF9F6" stroke="#D8D0C2" strokeWidth="1" className="dark:fill-[#252B25] dark:stroke-[#384238]" />
            <text x="100" y="24" textAnchor="middle" className="font-bold text-xs fill-[#20231F] dark:fill-[#EAE7E0]">90° Standard Bend</text>
            <path d="M 40 105 L 120 105 L 120 38" fill="none" stroke="#657565" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
            <text x="100" y="125" textAnchor="middle" className="font-bold fill-[#B56F50] text-[11px]">Deduction = 2 × d</text>
            <text x="100" y="139" textAnchor="middle" className="text-[9px] fill-[#7B8978]">Common beam/column L-hook</text>
          </g>

          {/* Card 3: 135 Degree Stirrup Hook */}
          <g transform="translate(520, 20)">
            <rect x="0" y="0" width="200" height="145" rx="8" fill="#FAF9F6" stroke="#D8D0C2" strokeWidth="1" className="dark:fill-[#252B25] dark:stroke-[#384238]" />
            <text x="100" y="24" textAnchor="middle" className="font-bold text-xs fill-[#20231F] dark:fill-[#EAE7E0]">135° Seismic Hook</text>
            <path d="M 40 105 L 120 105 L 155 70" fill="none" stroke="#657565" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
            <text x="100" y="125" textAnchor="middle" className="font-bold fill-[#B56F50] text-[11px]">Hook Length = 10 × d</text>
            <text x="100" y="139" textAnchor="middle" className="text-[9px] fill-[#7B8978]">Deduction = 3 × d (Ties)</text>
          </g>
        </svg>
        <figcaption className="mt-2 text-center text-[11px] text-[#7B8978] leading-relaxed">
          Standard bend deductions must be subtracted from the sum of external dimensions to yield the exact unbent cutting length of steel bars according to code elongation allowances.
        </figcaption>
      </figure>
    );
  }

  if (norm.includes('column') || norm.includes('pedestal')) {
    return (
      <figure className="my-6 rounded-2xl overflow-hidden border border-[#D8D0C2] dark:border-[#384238] bg-white dark:bg-[#1E221E] p-4 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between mb-3 text-xs font-mono font-bold text-[#657565] dark:text-[#A1B3A1]">
          <span>Fig 1.4 — Reinforced Concrete Column Cross-Section Detailing</span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-[#657565]/10">ACI 318 / IS 456</span>
        </div>
        <svg viewBox="0 0 760 200" className="w-full h-auto text-[#20231F] dark:text-[#EAE7E0] select-none font-mono text-[11px]">
          {/* Column Outline */}
          <rect x="280" y="20" width="200" height="150" rx="4" fill="#FAF9F6" stroke="#657565" strokeWidth="2.5" className="dark:fill-[#252B25]" />

          {/* Lateral Tie Hoop */}
          <rect x="305" y="45" width="150" height="100" rx="8" fill="none" stroke="#B56F50" strokeWidth="2.5" strokeDasharray="6 2" />

          {/* 4 Corner Main Bars */}
          <circle cx="312" cy="52" r="8" fill="#657565" />
          <circle cx="448" cy="52" r="8" fill="#657565" />
          <circle cx="312" cy="138" r="8" fill="#657565" />
          <circle cx="448" cy="138" r="8" fill="#657565" />

          {/* Side Longitudinal Bars */}
          <circle cx="380" cy="52" r="7" fill="#657565" />
          <circle cx="380" cy="138" r="7" fill="#657565" />

          {/* Dimension Width b */}
          <line x1="280" y1="185" x2="480" y2="185" stroke="#7B8978" strokeWidth="1" />
          <text x="380" y="195" textAnchor="middle" className="font-bold fill-current">Column Width (b = 300 mm)</text>

          {/* Dimension Depth D */}
          <line x1="260" y1="20" x2="260" y2="170" stroke="#7B8978" strokeWidth="1" />
          <text x="245" y="100" textAnchor="middle" className="font-bold fill-current" transform="rotate(-90 245 100)">Depth (D = 450 mm)</text>

          {/* Callouts */}
          <path d="M 456 52 L 540 40" stroke="#657565" strokeWidth="1" />
          <text x="548" y="44" className="font-bold fill-[#657565] dark:fill-[#A1B3A1]">Main Longitudinal Rebar (4-8 bars)</text>

          <path d="M 455 100 L 540 100" stroke="#B56F50" strokeWidth="1" />
          <text x="548" y="104" className="font-bold fill-[#B56F50]">Lateral Ties with 135° Seismic Hooks</text>

          <path d="M 285 30 L 170 30" stroke="#7B8978" strokeWidth="1" />
          <text x="60" y="34" className="font-mono text-[10px] fill-[#7B8978]">Clear Concrete Cover = 40 mm</text>
        </svg>
        <figcaption className="mt-2 text-center text-[11px] text-[#7B8978] leading-relaxed">
          Longitudinal column rebar carries primary compression while lateral ties prevent bar buckling and provide core concrete confinement under earthquake excitation.
        </figcaption>
      </figure>
    );
  }

  if (norm.includes('bearing') || norm.includes('retaining') || norm.includes('geotech')) {
    return (
      <figure className="my-6 rounded-2xl overflow-hidden border border-[#D8D0C2] dark:border-[#384238] bg-white dark:bg-[#1E221E] p-4 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between mb-3 text-xs font-mono font-bold text-[#657565] dark:text-[#A1B3A1]">
          <span>Fig 1.5 — Terzaghi General Bearing Capacity Soil Failure Wedges</span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-[#657565]/10">Geotechnical Mechanics</span>
        </div>
        <svg viewBox="0 0 760 210" className="w-full h-auto text-[#20231F] dark:text-[#EAE7E0] select-none font-mono text-[11px]">
          {/* Ground surface line */}
          <line x1="50" y1="60" x2="710" y2="60" stroke="#9A8062" strokeWidth="2.5" />
          <text x="660" y="52" className="text-[10px] font-bold fill-[#9A8062]">Ground Level</text>

          {/* Footing body */}
          <rect x="290" y="60" width="180" height="40" fill="#657565" stroke="#444D44" strokeWidth="2" rx="2" />
          <text x="380" y="85" textAnchor="middle" className="fill-white font-bold text-xs">Foundation Footing (B)</text>

          {/* Footing embedment depth */}
          <line x1="270" y1="60" x2="270" y2="100" stroke="#7B8978" strokeWidth="1" />
          <text x="245" y="84" textAnchor="middle" className="text-[10px] fill-[#7B8978]">Df</text>

          {/* Wedge I: Elastic Triangle */}
          <polygon points="290,100 470,100 380,150" fill="rgba(101,117,101,0.25)" stroke="#657565" strokeWidth="2" />
          <text x="380" y="125" textAnchor="middle" className="font-bold fill-[#657565] dark:fill-[#A1B3A1]">Zone I (Elastic)</text>

          {/* Wedge II: Radial Shear */}
          <polygon points="290,100 380,150 200,150" fill="rgba(181,111,80,0.15)" stroke="#B56F50" strokeWidth="1.5" />
          <polygon points="470,100 380,150 560,150" fill="rgba(181,111,80,0.15)" stroke="#B56F50" strokeWidth="1.5" />
          <text x="280" y="140" textAnchor="middle" className="text-[9px] fill-[#B56F50]">Zone II (Radial)</text>
          <text x="480" y="140" textAnchor="middle" className="text-[9px] fill-[#B56F50]">Zone II (Radial)</text>

          {/* Wedge III: Rankine Passive Zone */}
          <polygon points="290,100 200,150 140,60" fill="rgba(156,181,196,0.2)" stroke="#9CB5C4" strokeWidth="1.5" />
          <polygon points="470,100 560,150 620,60" fill="rgba(156,181,196,0.2)" stroke="#9CB5C4" strokeWidth="1.5" />
          <text x="180" y="90" textAnchor="middle" className="text-[9px] fill-[#4A5568] dark:fill-[#C5D0C5]">Zone III (Passive)</text>
          <text x="580" y="90" textAnchor="middle" className="text-[9px] fill-[#4A5568] dark:fill-[#C5D0C5]">Zone III (Passive)</text>

          {/* Terzaghi Equation Summary */}
          <text x="380" y="195" textAnchor="middle" className="font-bold fill-[#20231F] dark:fill-[#EAE7E0] text-xs">
            Ultimate Capacity: q_ult = c·N_c + γ·D_f·N_q + 0.5·γ·B·N_γ
          </text>
        </svg>
        <figcaption className="mt-2 text-center text-[11px] text-[#7B8978] leading-relaxed">
          Terzaghi's failure surface divides the subsoil into three distinct kinematic zones: the rigid active triangular wedge directly beneath the footing, the log-spiral radial transition zone, and the Rankine passive overburden zone.
        </figcaption>
      </figure>
    );
  }

  if (norm.includes('hi') || norm.includes('survey') || norm.includes('traverse')) {
    return (
      <figure className="my-6 rounded-2xl overflow-hidden border border-[#D8D0C2] dark:border-[#384238] bg-white dark:bg-[#1E221E] p-4 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between mb-3 text-xs font-mono font-bold text-[#657565] dark:text-[#A1B3A1]">
          <span>Fig 1.6 — Height of Instrument (HI) Differential Leveling Survey Geometry</span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-[#657565]/10">Field Surveying</span>
        </div>
        <svg viewBox="0 0 760 210" className="w-full h-auto text-[#20231F] dark:text-[#EAE7E0] select-none font-mono text-[11px]">
          {/* Ground profile curve */}
          <path d="M 40 150 Q 220 170 380 140 T 720 120" fill="none" stroke="#9A8062" strokeWidth="2.5" />

          {/* Benchmark Point A */}
          <rect x="90" y="152" width="20" height="8" fill="#657565" />
          <line x1="100" y1="152" x2="100" y2="40" stroke="#657565" strokeWidth="4" />
          <text x="100" y="32" textAnchor="middle" className="font-bold fill-[#657565]">Staff 1 (BM)</text>
          <text x="100" y="175" textAnchor="middle" className="text-[10px] fill-[#7B8978]">RL = 100.00 m</text>

          {/* Leveling Instrument Tripod at Station */}
          <line x1="380" y1="70" x2="350" y2="142" stroke="#4A5568" strokeWidth="2" />
          <line x1="380" y1="70" x2="410" y2="138" stroke="#4A5568" strokeWidth="2" />
          <line x1="380" y1="70" x2="380" y2="140" stroke="#4A5568" strokeWidth="2" />
          {/* Level Head */}
          <rect x="360" y="62" width="40" height="12" rx="3" fill="#657565" />
          <text x="380" y="55" textAnchor="middle" className="font-bold fill-[#657565] dark:fill-[#A1B3A1]">Dumpy Level</text>

          {/* Horizontal Line of Sight (Collimation Line) */}
          <line x1="80" y1="68" x2="680" y2="68" stroke="#B56F50" strokeWidth="1.5" strokeDasharray="5 3" />
          <text x="240" y="60" textAnchor="middle" className="font-bold fill-[#B56F50] text-[10px]">
            Collimation Axis (HI = 101.450 m)
          </text>

          {/* Backsight Arrow */}
          <line x1="110" y1="152" x2="110" y2="68" stroke="#657565" strokeWidth="1.5" markerEnd="url(#arrow)" />
          <text x="120" y="115" className="font-bold fill-[#657565]">BS = 1.450 m</text>

          {/* Target Staff Point B */}
          <rect x="640" y="122" width="20" height="8" fill="#657565" />
          <line x1="650" y1="122" x2="650" y2="35" stroke="#657565" strokeWidth="4" />
          <text x="650" y="27" textAnchor="middle" className="font-bold fill-[#657565]">Staff 2 (FS)</text>

          {/* Foresight Arrow */}
          <line x1="640" y1="122" x2="640" y2="68" stroke="#B56F50" strokeWidth="1.5" markerEnd="url(#arrow)" />
          <text x="560" y="98" className="font-bold fill-[#B56F50]">FS = 0.850 m</text>
          <text x="650" y="145" textAnchor="middle" className="text-[10px] fill-[#7B8978]">RL = HI - FS = 100.60 m</text>
        </svg>
        <figcaption className="mt-2 text-center text-[11px] text-[#7B8978] leading-relaxed">
          Differential leveling relies on a perfectly horizontal line of sight established by the instrument to transfer elevations from a verified benchmark to unknown ground points.
        </figcaption>
      </figure>
    );
  }

  return null;
}
