import { ArticleData } from './index';

export function getArticle(): ArticleData {
  return {
    seoTitle: 'Tie Beam Bar Bending Schedule (BBS) Calculator | CivILMath',
    metaDescription: 'Complete BBS calculator for tie beams in foundation systems. Compute main reinforcement, stirrups, lap lengths, cutting lengths, and steel quantities per ACI 318, BS 8666, Eurocode 2, IS 456.',
    slug: 'bbs-tie-beam',
    primaryKeyword: 'bar bending schedule for tie beam',
    secondaryKeywords: [
      'tie beam reinforcement calculation',
      'foundation tie beam BBS example',
      'tie beam stirrup cutting length',
      'tie beam steel quantity calculator',
      'tie beam main bar cutting length',
      'tie beam detailing BBS',
      'tie beam lap length calculation',
      'tie beam reinforcement schedule',
      'tie beam between footings BBS',
      'foundation tie beam steel weight'
    ],
    lsiKeywords: [
      'tie beam design',
      'foundation tie beam reinforcement',
      'tie beam concrete volume',
      'tie beam stirrup spacing',
      'tie beam bar layout',
      'tie beam construction',
      'tie beam cover requirements',
      'tie beam development length',
      'tie beam seismic detailing',
      'grade beam vs tie beam'
    ],
    breadcrumb: [
      { label: 'Home', url: '/' },
      { label: 'BBS Calculator', url: '/bbs-universal' },
      { label: 'Tie Beam', url: '/bbs-tie-beam' }
    ],
    h1: 'Bar Bending Schedule for Tie Beam — Complete Engineering Guide for Foundation Tie Beams',
    introduction: `A tie beam is a reinforced concrete beam that connects two or more column footings or pile caps, serving primarily as a horizontal structural tie rather than a load-bearing element. Unlike plinth beams that support masonry walls, or elevated beams that carry floor loads, tie beams are designed to resist axial tensile and compressive forces that develop in the foundation system due to lateral loads (wind, earthquake), differential settlement, or frame action. Tie beams are typically located below ground level, connecting isolated footings, combined footings, or pile caps into a coherent structural system that moves as a unit.

The reinforcement in a tie beam is governed by its axial force demand. In tension, the longitudinal reinforcement must provide sufficient tensile capacity to resist the tie force. In compression, the bars act with the concrete to resist buckling. The stirrup reinforcement in tie beams is particularly important because it provides lateral confinement to the longitudinal bars, preventing them from buckling under compressive axial loads. The stirrup spacing in tie beams is often dictated by the maximum bar spacing requirements for compression members rather than by shear demand.

The CivILMath BBS Tie Beam calculator uses the GenericBeam engine with inputs for beam dimensions, cover, top and bottom reinforcement, stirrup diameter and spacing, and the lap length factor. The engine calculates the cutting lengths using BS 8666 shape codes, applies bend deductions per the selected design standard, and generates a complete bar bending schedule. The calculator supports both metric and imperial units and all major design standards including ACI 318, BS 8666, Eurocode 2, IS 456, and IS 2502.

This article provides a comprehensive guide to tie beam BBS calculations. We cover the structural theory of tie beams, the input parameters and their practical significance, the calculation logic with sequential steps, the key formulas with code references, a fully worked step-by-step example for a typical foundation tie beam, and extensive sections on common errors, best practices, and frequently asked questions. Whether you are designing a foundation system for a high-rise building, a seismic-resistant structure, or an industrial facility, this guide will help you produce accurate tie beam BBS documentation.`,
    theory: `A tie beam is fundamentally an axial-force-resisting element. Its primary structural role is to tie together the foundation elements so that they act as a single rigid body under lateral loads. In seismic design, tie beams are critical components of the load path — they transfer the lateral forces from the superstructure to the ground through the foundation system. Without tie beams, each footing would move independently during an earthquake, leading to differential settlement, structural distress, and potential collapse.

The design of tie beam reinforcement is governed by the maximum axial force that the beam must resist. ACI 318-19 Section 5.3 requires that tie beams be designed for a minimum axial tensile force equal to 10% of the larger column dead load, or the force from the seismic load combination, whichever is larger. This tensile force determines the required longitudinal steel area: A_st_req = T / (φ × fy), where T is the factored tensile force, φ is the strength reduction factor (0.9 for tension-controlled), and fy is the steel yield strength.

The stirrup reinforcement in tie beams serves two purposes: (a) resisting any shear force that may develop from the axial load eccentricity or from beam self-weight, and (b) providing lateral confinement to the longitudinal bars to prevent buckling under compression. Per ACI 318-19 Section 18.13.2, tie beams in seismic force-resisting systems must have stirrups at a spacing not exceeding the smaller of 6 × longitudinal bar diameter or 150 mm at potential plastic hinge zones.

The lap length for tie beam bars is a critical parameter because the bars must develop their full yield strength across the lap splice. For tie beams in tension, the lap length is typically 1.3 to 1.6 times the basic development length Ld, depending on the percentage of bars spliced at the section and the concrete cover conditions. The CivILMath calculator includes a user-adjustable lap length factor to accommodate different code requirements.

From a BBS perspective, a tie beam is similar to a rectangular beam with top and bottom longitudinal bars and closed stirrups. However, because tie beams are often fully embedded in soil or blinding concrete, the cover requirement is higher — 50 mm minimum per IS 456, 75 mm per ACI 318. The beam may also be deeper than its width, as the axial load capacity depends on the gross cross-sectional area rather than the flexural depth.`,
    realWorldApplications: [
      { title: 'Seismic Tie Beams in High-Rise Foundations', description: 'Tie beams connecting pile caps and footings in high-rise buildings in seismic zones, designed for the full lateral load path with closely spaced seismic stirrups.' },
      { title: 'Industrial Structure Foundation Ties', description: 'Tie beams between isolated footings in industrial buildings, resisting lateral forces from cranes, wind, and equipment vibrations.' },
      { title: 'Bridge Pier Foundation Tie Beams', description: 'Tie beams connecting bridge pier footings to resist longitudinal and transverse seismic forces and to distribute bearing loads.' },
      { title: 'Compressor and Turbine Foundations', description: 'Tie beams in heavy machinery foundation grids, providing lateral restraint and distributing dynamic loads between foundation blocks.' },
      { title: 'Pile Cap Connection Beams', description: 'Tie beams that connect groups of pile caps in piled foundations, ensuring all piles work together under lateral loading.' },
      { title: 'Wind-Resistant Frame Ties', description: 'Tie beams in wind-dominated lateral systems, designed for net tensile forces from wind uplift and overturning.' },
      { title: 'Differential Settlement Control Beams', description: 'Tie beams connecting footings on variable soil conditions to minimise differential movement by redistributing loads.' },
      { title: 'Generator Hall Foundation Grid', description: 'Tie beams in power plant generator hall foundations, forming a rigid grid that supports heavy rotating equipment.' },
      { title: 'Tank Farm Foundation Ties', description: 'Tie beams connecting storage tank foundations in tank farms, designed to distribute wind and seismic loads between tanks.' },
      { title: 'Transmission Tower Foundation Ties', description: 'Tie beams connecting the four individual footings of a transmission tower, resisting the tensile forces from tower overturning.' },
      { title: 'Retaining Wall Tie Back Beams', description: 'Tie beams that connect the base of a cantilever retaining wall to an adjacent footing to resist sliding and overturning.' },
      { title: 'Stadium and Arena Foundation Grid', description: 'Tie beams forming a rigid foundation grid for stadium columns, designed for the combined effects of gravity, wind, and seismic loads.' }
    ],
    inputParameters: [
      { name: 'Beam Length (L)', purpose: 'Centre-to-centre or clear length between footings/pile caps', unit: 'm (metric) or ft (imperial)', meaning: 'Determines the cutting length of longitudinal bars and the number of stirrups', range: '2.0–20.0 m (typical 4.0–12.0 m)', mistakes: 'Using the centre-to-centre dimension when the bar must extend past the footing face for anchorage.' },
      { name: 'Beam Width (b)', purpose: 'Width of the tie beam cross-section', unit: 'm (metric) or ft (imperial)', meaning: 'Determines the stirrup width, concrete area for axial resistance, and space for bars', range: '0.2–0.8 m (typical 0.25–0.4 m)', mistakes: 'Making the beam too narrow for the development of bar hooks within the section.' },
      { name: 'Beam Depth (D)', purpose: 'Overall depth of the tie beam', unit: 'm (metric) or ft (imperial)', meaning: 'Determines the stirrup height, concrete area, and the buckling resistance of the beam', range: '0.3–1.2 m (typical 0.4–0.8 m)', mistakes: 'Using too shallow a depth, which reduces the axial load capacity and buckling resistance.' },
      { name: 'Clear Cover', purpose: 'Concrete cover to the stirrup reinforcement', unit: 'mm (metric) or in (imperial)', meaning: 'Protects steel from ground moisture and provides fire resistance', range: '40–100 mm (typical 50–75 mm)', mistakes: 'Using 20–30 mm cover suitable for interior beams on a ground-contact tie beam.' },
      { name: 'Top Bar Diameter', purpose: 'Diameter of top longitudinal reinforcement', unit: 'mm (metric) or imperial bar number', meaning: 'Together with bottom bars, resists axial tension/compression in the tie beam', range: '12–32 mm (typical T16–T25)', mistakes: 'Using a smaller diameter for top bars than bottom bars — in tie beams, both are equally important for axial resistance.' },
      { name: 'Number of Top Bars', purpose: 'Count of top longitudinal bars', unit: 'Integer', meaning: 'Determines the top steel area; should equal or closely match bottom bar count for symmetry', range: '3–8 bars', mistakes: 'Using an odd number that creates an asymmetric reinforcement cage — tie beams should be symmetric.' },
      { name: 'Bottom Bar Diameter', purpose: 'Diameter of bottom longitudinal reinforcement', unit: 'mm (metric) or imperial bar number', meaning: 'Primary tensile reinforcement together with top bars', range: '12–32 mm (typical T16–T25)', mistakes: 'Specifying different diameters for top and bottom bars unnecessarily — tie beams are symmetric by design.' },
      { name: 'Number of Bottom Bars', purpose: 'Count of bottom longitudinal bars', unit: 'Integer', meaning: 'Should match the top bar count for symmetric axial resistance', range: '3–8 bars', mistakes: 'Different top and bottom bar counts causing eccentric axial resistance.' },
      { name: 'Stirrup Diameter', purpose: 'Diameter of shear and confinement stirrups', unit: 'mm (metric) or imperial bar number', meaning: 'Provides shear resistance and lateral confinement to longitudinal bars', range: '8–16 mm (typical T10–T12)', mistakes: 'Using T6 or T8 stirrups in seismic tie beams where T10 is the minimum.' },
      { name: 'Stirrup Spacing', purpose: 'Centre-to-centre spacing of stirrups', unit: 'mm (metric) or in (imperial)', meaning: 'Critical for longitudinal bar buckling control — tighter spacing in seismic zones', range: '100–300 mm (typical 150–200 mm)', mistakes: 'Spacing exceeding 6 × longitudinal bar diameter in seismic zones, risking bar buckling.' },
      { name: 'Lap Length Factor', purpose: 'Multiplier on bar diameter for determining tension lap splice length', unit: 'Numeric (e.g., 50d, 60d)', meaning: 'Determines the overlap length where bars are spliced; critical for continuous axial force transfer', range: '40–80 (typical 50–60)', mistakes: 'Using compression lap length for tension ties — tension laps must be longer (1.3× to 1.6×).' },
      { name: 'Concrete Grade', purpose: 'Characteristic compressive strength of concrete at 28 days', unit: 'MPa (metric) or psi (imperial)', meaning: 'Affects axial capacity, development length, and bond strength', range: 'M25–M40 (25–40 MPa) typical for tie beams', mistakes: 'Using M20 or lower in ground-contact conditions where M25 minimum is recommended.' },
      { name: 'Steel Grade', purpose: 'Yield strength of reinforcing steel', unit: 'MPa (metric) or ksi (imperial)', meaning: 'Determines the design yield stress and the tensile capacity of the tie beam', range: 'Fe415, Fe500 (IS); Grade 60, Grade 80 (ACI)', mistakes: 'Using Fe250 where Fe500 is required for the axial tension capacity.' },
      { name: 'Number of Identical Tie Beams', purpose: 'Count of identical tie beams in the foundation system', unit: 'Integer', meaning: 'Multiplies all quantities for project-level material take-off', range: '1–100', mistakes: 'Grouping tie beams of different lengths or bar configurations into one count.' },
      { name: 'Seismic Detailing Required', purpose: 'Flag for seismic detailing requirements', unit: 'Boolean (checkbox)', meaning: 'When enabled, stirrup spacing is limited to 6× longitudinal bar dia at ends, and 135° hooks are used', range: 'True/False', mistakes: 'Disabling seismic detailing in earthquake-prone zones, risking inadequate confinement.' }
    ],
    calculationLogic: `The tie beam BBS calculation follows the GenericBeam engine logic with a focus on axial force resistance. The engine first determines the total beam length (L) and computes the effective clear dimensions: clear_span_mm = L × 1000 − 2 × cover, stirrup_width = b × 1000 − 2 × cover, stirrup_depth = D × 1000 − 2 × cover.

The longitudinal bars — both top and bottom — are calculated using shape code 11 (straight bar with a hook at each end). The cutting length is the effective clear span plus two hook lengths minus two bend deductions. The hook length is calculated as the hook_length_factor × bar_diameter (typically 12d for ACI, 9d for IS). The bars in both the top and bottom layers are assumed to have the same configuration and length, which is appropriate for tie beams that must resist both tension and compression symmetrically.

The stirrups are calculated using shape code 51 (closed rectangular stirrup) for standard applications or shape code 52 (stirrup with 135° seismic hooks) when seismic detailing is required. The cutting length for a closed stirrup with 90° hooks is: L_cut = 2 × (a + b) + 2 × (6d) − 8 × Δ_90. For seismic stirrups (135° hooks), the formula adjusts for the different bend angle: L_cut = 2 × (a + b) + 2 × (6d) − 8 × Δ_90 + additional_length for the 135° bends.

The number of stirrups is: N_stirrups = ceil(L / s) + 1. If seismic detailing is enabled, the end zones (typically L/5 from each end) may have closer stirrup spacing, and the calculation becomes zone-based.

The lap length for longitudinal bars is an additional parameter specific to tie beams. When the beam length exceeds the stock bar length (12 m), the bars must be lapped. The lap length is calculated as lap_factor × bar_diameter (e.g., 50d). The total steel quantity includes the additional steel for lap splices.

The concrete volume is L × b × D. The total steel weight aggregates all components. The output includes a BBS table with bar marks (BM-01 for top bars, BM-02 for bottom bars, BM-03 for stirrups), each with detailed dimensions, cutting lengths, quantities, and weights.`,
    formulas: [
      {
        name: 'Longitudinal Bar Cutting Length (Shape Code 11)',
        equation: 'L_cut = (L × 1000 − 2c) + 2 × (hook_factor × d) − 2 × Δ_hook',
        variables: [
          { symbol: 'L', meaning: 'Total beam length', unit: 'm' },
          { symbol: 'c', meaning: 'Clear concrete cover', unit: 'mm' },
          { symbol: 'hook_factor', meaning: 'Hook length multiplier (typically 12 for ACI, 9 for IS)', unit: 'dimensionless' },
          { symbol: 'd', meaning: 'Bar diameter', unit: 'mm' },
          { symbol: 'Δ_hook', meaning: 'Bend deduction for the hook bend', unit: 'mm' }
        ],
        reference: 'BS 8666:2020 Shape Code 11, IS 2502:1963'
      },
      {
        name: 'Stirrup Cutting Length (Shape Code 51 or 52)',
        equation: 'L_cut = 2(a + b) + 2 × hook − n_bends × Δ_bend',
        variables: [
          { symbol: 'a', meaning: 'Stirrup width = b − 2c', unit: 'mm' },
          { symbol: 'b', meaning: 'Stirrup depth = D − 2c', unit: 'mm' },
          { symbol: 'hook', meaning: 'Stirrup hook extension (6d or 75 mm min)', unit: 'mm' },
          { symbol: 'n_bends', meaning: 'Number of bends (8 for 90° stirrup, 8×90° + 2×135° for seismic)', unit: 'count' },
          { symbol: 'Δ_bend', meaning: 'Bend deduction per bend at the specific angle', unit: 'mm' }
        ],
        reference: 'BS 8666:2020 Shape Code 51 (90° hooks) and 52 (135° seismic hooks)'
      },
      {
        name: 'Tension Lap Length',
        equation: 'L_lap = lap_factor × d',
        variables: [
          { symbol: 'lap_factor', meaning: 'Lap length multiplier (typically 50–60 for tension)', unit: 'dimensionless' },
          { symbol: 'd', meaning: 'Bar diameter', unit: 'mm' },
          { symbol: 'L_lap', meaning: 'Lap splice length', unit: 'mm' }
        ],
        reference: 'IS 456:2000 Clause 26.2.5, ACI 318-19 Section 25.5.2'
      },
      {
        name: 'Number of Stirrups (Uniform Spacing)',
        equation: 'N_stirrups = ceil(L / s) + 1',
        variables: [
          { symbol: 'L', meaning: 'Total beam length', unit: 'mm' },
          { symbol: 's', meaning: 'Stirrup spacing', unit: 'mm' },
          { symbol: 'N_stirrups', meaning: 'Number of stirrups', unit: 'count' }
        ],
        reference: 'Standard BBS practice'
      },
      {
        name: 'Axial Tensile Capacity of Tie Beam',
        equation: 'T_n = φ × A_st × fy',
        variables: [
          { symbol: 'φ', meaning: 'Strength reduction factor (0.9 for tension-controlled)', unit: 'dimensionless' },
          { symbol: 'A_st', meaning: 'Total longitudinal steel area (top + bottom)', unit: 'mm²' },
          { symbol: 'fy', meaning: 'Steel yield strength', unit: 'MPa' },
          { symbol: 'T_n', meaning: 'Nominal axial tensile capacity', unit: 'kN' }
        ],
        reference: 'ACI 318-19 Section 22.4.2, IS 456:2000 Clause 26.5.3'
      }
    ],
    stepByStepExample: {
      scenario: 'BBS calculation for a foundation tie beam connecting two pile caps in a seismic-resistant building foundation.',
      given: {
        'Structure': 'Foundation tie beam between pile caps',
        'Beam Length (L)': '6.0 m (between pile cap faces)',
        'Beam Width (b)': '0.35 m',
        'Beam Depth (D)': '0.60 m',
        'Clear Cover': '60 mm (ground contact in moderate exposure)',
        'Concrete Grade': 'M30',
        'Steel Grade': 'Fe500',
        'Top Bar Diameter': '20 mm (T20)',
        'Number of Top Bars': '4',
        'Bottom Bar Diameter': '20 mm (T20)',
        'Number of Bottom Bars': '4',
        'Stirrup Diameter': '10 mm (T10)',
        'Stirrup Spacing': '150 mm (uniform)',
        'Lap Length Factor': '50d (tension lap per IS 456)',
        'Seismic Detailing': 'Required (135° hooks on stirrups)',
        'Number of Identical Tie Beams': '10'
      },
      steps: [
        { title: 'Compute effective clear dimensions', explanation: 'Effective span = 6000 − 2 × 60 = 5880 mm. Stirrup width a = 350 − 2 × 60 = 230 mm. Stirrup depth b = 600 − 2 × 60 = 480 mm.' },
        { title: 'Calculate top longitudinal bars (T20 × 4)', explanation: 'Shape code 11. Hook length = 12 × 20 = 240 mm per end (using ACI 12d hook for this example). Bend deduction for T20 (90°): 18.6 mm per bend. Cutting length = 5880 + 240 + 240 − 2 × 18.6 = 6322.8 mm ≈ 6323 mm.' },
        { title: 'Calculate bottom longitudinal bars (T20 × 4)', explanation: 'Same geometry as top bars. Cutting length = 6323 mm per bar. Total longitudinal bars = 4 top + 4 bottom = 8 bars of T20 per beam.' },
        { title: 'Check lap length requirement', explanation: 'Beam length = 6.0 m. Stock bar length = 12 m. No lap splice needed for a 6 m beam if the supplier can deliver single bars. However, if bars come in 12 m lengths and are used across multiple beams, cutting is straightforward. If the beam were > 12 m, lap length = 50 × 20 = 1000 mm per splice.' },
        { title: 'Calculate stirrup cutting length (T10 @ 150 mm, seismic hooks)', explanation: 'Seismic stirrup (shape code 52) with 135° hooks. a = 230 mm, b = 480 mm. Hook length = 6 × 10 = 60 mm (use 75 mm minimum). For 135° bends: bend deduction per 135° = different from 90° — typically 1.5× the 90° deduction. For T10: Δ_90 = 9.3 mm, Δ_135 ≈ 14.0 mm. Total bends: 8 × 90° (corners) + 2 × 135° (hooks). Cutting length = 2 × (230 + 480) + 2 × 75 − (8 × 9.3 + 2 × 14.0) = 1420 + 150 − (74.4 + 28.0) = 1467.6 mm ≈ 1468 mm.' },
        { title: 'Calculate number of stirrups', explanation: 'N_stirrups = ceil(6000 / 150) + 1 = ceil(40) + 1 = 41 stirrups per beam.' },
        { title: 'Calculate unit weights', explanation: 'T20: 400/162 = 2.469 kg/m. T10: 100/162 = 0.617 kg/m.' },
        { title: 'Calculate steel weight — longitudinal bars', explanation: 'Top: 4 bars × 6.323 m × 2.469 = 62.45 kg. Bottom: 4 bars × 6.323 m × 2.469 = 62.45 kg. Total longitudinal = 124.90 kg.' },
        { title: 'Calculate steel weight — stirrups', explanation: '41 stirrups × 1.468 m × 0.617 kg/m = 37.14 kg.' },
        { title: 'Total steel per tie beam and verification', explanation: 'Total = 124.90 + 37.14 = 162.04 kg. Concrete volume = 6.0 × 0.35 × 0.60 = 1.26 m³. Steel density = 162.04 / 1.26 = 128.6 kg/m³. Check axial capacity: 8 × T20 = 8 × 314 = 2512 mm². T_n = 0.9 × 2512 × 500 / 1000 = 1130 kN axial capacity — adequate for a typical foundation tie beam.' },
        { title: 'Scale for 10 identical tie beams', explanation: 'Total steel = 162.04 × 10 = 1620.4 kg (1.62 tonnes). Add 5% waste = 1701.4 kg. Total concrete = 1.26 × 10 = 12.60 m³.' },
        { title: 'Check seismic detailing against reference standards', explanation: 'Stirrup spacing: 150 mm. Check against seismic limit: 6 × d_long = 6 × 20 = 120 mm. The spacing of 150 mm exceeds 120 mm! For seismic detailing per ACI 318 Section 18.13.2, the spacing must not exceed 6 × longitudinal bar diameter (120 mm) at the beam ends. Solution: reduce end zone spacing to 100 mm for L/5 (1.2 m) from each support, and keep 150 mm for the middle zone. Updated end stirrups: 2 ends × ceil(1.2/0.100) + 1 = 2 × 13 = 26. Mid: ceil(3.6/0.150) + 1 = 25. Total = 26 + 25 − 1 = 50 stirrups. Update the BBS with this corrected stirrup count.' }
      ],
      finalAnswer: 'For 10 foundation tie beams 6.0 m × 350 mm × 600 mm with seismic detailing: Top bars: 40 bars T20 (cut 6323 mm, 624 kg). Bottom bars: 40 bars T20 (cut 6323 mm, 624 kg). Stirrups T10 (seismic 135° hooks): 500 stirrups (cut 1468 mm, 453 kg). Note: Stirrup spacing = 100 mm at ends (1.2 m zones) and 150 mm at midspan (3.6 m zone) per seismic requirement that s ≤ 6 × d_long = 120 mm at ends. Total steel = 1.70 tonnes (1.79 t with 5% waste). Concrete = 12.60 m³. Prepared to the provisions of ACI 318-19 (seismic), IS 456:2000, and BS 8666:2020 (shape codes 11 and 52); verify against project requirements.'
    },
    resultExplanation: `The BBS output for a tie beam presents three reinforcement categories: top longitudinal bars (BM-01), bottom longitudinal bars (BM-02), and stirrups (BM-03). In tie beam construction, the top and bottom bars are typically identical in diameter and count because the beam must resist both tension and compression symmetrically. The cutting lengths are the same for both layers, simplifying fabrication and installation.

The stirrup calculation in this example highlights an important practical consideration: the initial stirrup spacing of 150 mm was found to exceed the seismic limit of 6 × d_long = 120 mm. This prompted a zone-based redesign with 100 mm spacing at the ends and 150 mm at midspan. The BBS should clearly show this zoning. The final stirrup count increased from 41 to 50 per beam due to the tighter end spacing.

The concrete volume of 1.26 m³ per beam is typical for 6 m tie beams. The steel density of 128.6 kg/m³ is consistent with moderately reinforced tie beams. For comparison, heavily reinforced seismic tie beams can reach 150–200 kg/m³. The axial tensile capacity check (1130 kN) confirms that the reinforcement is adequate for typical foundation tie forces.

The weight-by-diameter breakdown shows only T20 (77% of steel weight) and T10 (23% by weight). This is efficient for procurement — only two bar diameters need to be ordered. The 5% waste allowance covers the extra stirrups and any cutting adjustments on site.`,
    commonErrors: [
      { error: 'Using the same stirrup spacing for tie beams as for flexural beams', cause: 'Not recognising that tie beam stirrups are governed by axial load confinement requirements, not shear', solution: 'For tie beams in compression, limit stirrup spacing to 6 × longitudinal bar diameter or 150 mm (seismic) or 16 × longitudinal bar diameter (non-seismic per IS 456).' },
      { error: 'Not providing seismic stirrup hooks (135°) in earthquake zones', cause: 'Using standard 90° hooks that can open up under cyclic loading', solution: 'Use 135° hooks (shape code 52) with extension of 6d or 75 mm in seismic zones to confine the core concrete.' },
      { error: 'Using different top and bottom bar diameters for tie beams', cause: 'Assuming the beam is primarily in bending like an elevated beam', solution: 'Tie beams are axially loaded — use the same bar diameter and count for top and bottom for symmetric resistance.' },
      { error: 'Specifying inadequate cover for ground-contact conditions', cause: 'Using 20–30 mm cover suitable for interior beams', solution: 'Use minimum 50 mm cover per IS 456 or 75 mm per ACI 318 for tie beams cast against or near soil.' },
      { error: 'Not including lap length in the total steel calculation', cause: 'Forgetting that bars longer than stock length need splicing', solution: 'For tie beams longer than 12 m, add lap length (50d to 60d) for each splice. Include this in the BBS.' },
      { error: 'Confusing tie beam with plinth beam in the BBS', cause: 'Using plinth beam parameters (which include wall support) for a tie beam', solution: 'Tie beams do not support walls — they only connect footings. Different design criteria apply.' },
      { error: 'Placing tie beam bars too close together causing congestion', cause: 'Maximising steel area without considering concrete placement', solution: 'Ensure minimum clear spacing between bars ≥ max(bar diameter, 20 mm, aggregate size + 5 mm). Use multiple layers if needed.' },
      { error: 'Not accounting for the axial force when designing the BBS', cause: 'Selecting bar diameters based on minimum reinforcement only', solution: 'The BBS must reflect the bar sizes and counts required by the structural engineer for the design axial force.' },
      { error: 'Using T6 or T8 stirrups in heavy tie beams', cause: 'Specifying stirrups that cannot adequately confine large longitudinal bars', solution: 'Use T10 minimum stirrups for tie beams with bars ≥ T16. T12 for bars ≥ T25.' },
      { error: 'Forgetting to anchor tie beam bars into the supporting pile cap or footing', cause: 'Treating the tie beam as a simply supported element', solution: 'Tie beam bars must extend into the pile cap or footing with a standard hook and adequate development length.' },
      { error: 'Incorrect stirrup count when using zone-based spacing', cause: 'Using uniform spacing calculation for a beam with end zones', solution: 'Divide the beam into zones, calculate stirrups per zone, then sum. Remember to subtract the overlapping stirrup at zone boundaries.' },
      { error: 'Omitting tie beams from the foundation BBS entirely', cause: 'Not recognising that tie beams are structural elements requiring a BBS', solution: 'Tie beams must be included in the overall foundation BBS package, with their own bar marks and quantities.' },
      { error: 'Using lap splices at beam-column junctions', cause: 'Placing laps where the moment/axial demand is highest', solution: 'Locate lap splices away from the connections (near midspan) where the axial demand is lower. Stagger lap locations.' },
      { error: 'Not considering the minimum eccentricity in the axial load design', cause: 'Assuming pure axial load without bending', solution: 'Codes require tie beams to be designed for minimum eccentricity (ACI 318 Section 6.6.4, IS 456 Clause 25.4). This affects the reinforcement arrangement.' },
      { error: 'Specifying beam dimensions that are too small for the bar development', cause: 'Making the beam too narrow for standard hooks to fit', solution: 'Ensure the beam width is at least 2 × cover + (number_of_bars × dia) + (n-1) × spacing + stirrup diameter × 2.' },
      { error: 'Using the hook factor meant for flexural beams on tie beams', cause: 'Applying the same hook factor without checking the development length required for axial tension', solution: 'For tie beams in tension, verify that the hook plus straight embedment into the support exceeds the tension development length Ld.' },
      { error: 'Not checking that the stirrup spacing provides adequate confinement', cause: 'Using spacing that is too wide for the longitudinal bar diameter', solution: 'Verify that stirrup spacing ≤ 6d for seismic zones (ACI 318) or ≤ 16d for non-seismic (IS 456 Clause 26.5.3.2).' },
      { error: 'Preparing the BBS in metric and the site works in imperial (or vice versa)', cause: 'Not ensuring consistent units between the BBS and the construction drawings', solution: 'Use the unit toggle in the calculator to match the project unit system. Communicate the chosen system to the site team.' },
      { error: 'Assuming all tie beams in a project are identical', cause: 'Using one BBS for tie beams with different lengths or different pile cap connections', solution: 'Each unique tie beam length and reinforcement configuration requires a separate BBS entry.' },
      { error: 'Not including a note about seismic detailing in the BBS', cause: 'Assuming the steel fixer knows when 135° hooks are required', solution: 'Clearly state "Seismic Detailing Required — 135° Hooks on Stirrups" in the BBS general notes when applicable.' }
    ],
    bestPractices: [
      'Always use symmetric reinforcement (same bar diameter and count for top and bottom) in tie beams. The axial force can be either tension or compression depending on the load direction.',
      'Limit stirrup spacing to 6 × longitudinal bar diameter in seismic zones (ACI 318 Section 18.13.2) or 16 × longitudinal bar diameter in non-seismic zones (IS 456 Clause 26.5.3.2).',
      'Use 135° stirrup hooks (shape code 52) with a 6d or 75 mm extension in seismic zones. This prevents the stirrup from opening under cyclic loading.',
      'Use minimum T10 stirrups for tie beams. Smaller diameters (T6, T8) do not provide adequate confinement for the longitudinal bars, especially in compression.',
      'Extend tie beam longitudinal bars into the supporting footings or pile caps with a full standard hook (12d per ACI, 9d per IS) plus the required development length.',
      'Specify a minimum cover of 50 mm (IS 456) or 75 mm (ACI 318) for tie beams in ground contact. Increase cover for aggressive soil conditions.',
      'Include lap splice details in the BBS for tie beams longer than the stock bar length (12 m). Use staggered laps — no more than 50% of bars spliced at any section.',
      'Design the tie beam cross-section large enough to accommodate the required reinforcement with adequate spacing. A congested beam is difficult to concrete properly.',
      'Use the largest practical bar diameter to reduce the number of bars. For example, use 4 × T20 instead of 6 × T16 for the same area — fewer bars reduce congestion and labour.',
      'Clearly mark which stirrups are seismic (135° hooks) vs. standard (90° hooks) in the BBS. The steel fixer must know the difference to avoid using the wrong stirrup type.',
      'Include a cross-section sketch with the BBS showing the arrangement of longitudinal bars and stirrups, including the tie beam connection to the pile cap or footing.',
      'Always have the tie beam BBS reviewed by a structural engineer experienced in foundation design. Tie beam failures due to inadequate confinement are a known failure mode in earthquakes.',
      'Use concrete grade M25 minimum for tie beams in ground contact. M30 or higher is recommended for aggressive soil conditions or seismic zones.',
      'Prepare a zone-based stirrup schedule for tie beams over 6 m long. Show the end zone spacing and length, and the midspan zone spacing separately.',
      'Document the design standard and the seismic detailing requirements in the BBS header. This ensures that the steel fabricator and site team understand the code requirements.'
    ],
    designCodes: [
      { code: 'ACI 318-19', description: 'Building Code Requirements for Structural Concrete — Sections 5.3 (tie beam minimum strength), 18.13 (foundation tie beams in seismic), and 25.3 (development length).' },
      { code: 'BS 8666:2020', description: 'Scheduling of Reinforcement for Concrete — defines shape codes 11 (longitudinal bars), 51 (standard stirrups), and 52 (seismic stirrups with 135° hooks).' },
      { code: 'BS 4449:2005+A3:2016', description: 'Steel for the Reinforcement of Concrete — specifies B500B and B500C ductility grades required for tie beam reinforcement in seismic zones.' },
      { code: 'Eurocode 2 (EN 1992-1-1:2004)', description: 'Design of Concrete Structures — Sections 8 (detailing) and 9 (member detailing) cover tie beam requirements for anchorage, confinement, and minimum reinforcement.' },
      { code: 'IS 456:2000', description: 'Plain and Reinforced Concrete Code of Practice — Clauses 26.3 (spacing), 26.4 (cover), 26.5 (minimum reinforcement), and 26.5.3 (compression member detailing).' },
      { code: 'IS 2502:1963', description: 'Code of Practice for Bending and Fixing of Bars for Reinforcement — Indian standard for bar bending schedules with shape codes and bend deductions for tie beam bars.' },
      { code: 'IS 13920:2016', description: 'Ductile Design and Detailing of Reinforced Concrete Structures Subjected to Seismic Forces — Indian seismic code with specific provisions for tie beam stirrup spacing, hook detailing, and confinement.' },
      { code: 'SP 34:1987', description: 'Handbook on Concrete Reinforcement and Detailing — provides standard details for foundation tie beams, including connection details to footings and pile caps.' }
    ],
    faqs: [
      { question: 'What is the primary function of a tie beam?', answer: 'A tie beam connects column footings or pile caps to resist axial tensile and compressive forces from lateral loads (wind, earthquake), differential settlement, and frame action. It ensures the foundation system acts as a single rigid unit.' },
      { question: 'How does a tie beam differ from a plinth beam?', answer: 'A tie beam connects footings for structural integrity and resists axial forces. A plinth beam is at ground level and supports the masonry wall above. A tie beam may be at any level — below, at, or above ground — and does not typically support walls.' },
      { question: 'What is the minimum axial force a tie beam must be designed for?', answer: 'Per ACI 318-19 Section 5.3, tie beams must be designed for a minimum axial tensile force equal to 10% of the larger adjacent column dead load, or the seismic load combination force, whichever is larger.' },
      { question: 'Why are 135° stirrup hooks required in seismic tie beams?', answer: 'Under cyclic earthquake loading, 90° hooks can open up, losing confinement of the concrete core. 135° hooks with a 6d extension remain engaged under cyclic loading, maintaining confinement and preventing longitudinal bar buckling.' },
      { question: 'What is the maximum stirrup spacing in tie beams?', answer: 'For seismic detailing (ACI 318), spacing ≤ 6 × longitudinal bar diameter at beam ends. For non-seismic (IS 456), spacing ≤ 16 × longitudinal bar diameter. In all cases, spacing ≤ 300 mm.' },
      { question: 'Should the top and bottom reinforcement be the same in a tie beam?', answer: 'Yes. Because tie beams resist both tension and compression, the reinforcement should be symmetric. Using the same bar diameter and count for top and bottom ensures equal capacity in both directions.' },
      { question: 'What shape code is used for tie beam stirrups with seismic hooks?', answer: 'BS 8666 shape code 52 is used for closed stirrups with 135° seismic hooks. Shape code 51 is used for standard stirrups with 90° hooks in non-seismic applications.' },
      { question: 'How is the development length check performed for tie beam bars?', answer: 'The bar hook at each end provides anchorage into the supporting footing or pile cap. The total embedment (hook extension + straight portion into the support) must exceed the tension development length Ld per the governing code.' },
      { question: 'What is the typical concrete cover for tie beams?', answer: 'Minimum cover is 50 mm per IS 456:2000 and 75 mm per ACI 318-19 for concrete cast against earth. For tie beams on blinding concrete, 50 mm is typical.' },
      { question: 'What is the minimum concrete grade for tie beams?', answer: 'M25 (25 MPa) is the minimum recommended for tie beams in ground contact. M30 or M35 is preferred in aggressive soil conditions or seismic zones to improve bond strength and durability.' },
      { question: 'Do tie beams need shear reinforcement?', answer: 'Yes. Even if the shear demand is low, minimum stirrups are required by all codes to provide confinement to the longitudinal bars and to resist any incidental shear from load eccentricity.' },
      { question: 'Can a tie beam be designed without top reinforcement?', answer: 'No. Tie beams must have both top and bottom reinforcement because the axial force can reverse direction (tension in one load case, compression in another). Symmetric reinforcement is essential.' },
      { question: 'How are lap splices handled in tie beams?', answer: 'When the beam length exceeds the stock bar length (12 m), lap splices of 50–60d are required for tension. Laps should be staggered so no more than 50% of bars are spliced at any section.' },
      { question: 'What is the difference between a tie beam and a ground beam?', answer: 'The terms are often used interchangeably in foundation engineering. However, a ground beam typically implies a beam that bears on or is embedded in the ground, while a tie beam specifically focuses on the structural tying function between foundation elements.' },
      { question: 'How does the calculator handle imperial units for tie beams?', answer: 'Toggle the unit switch to imperial. Dimensions are in feet/inches, bar diameters use imperial numbers (#4, #5, #6, etc.), stirrup spacing is in inches, and weights are in lb/ft. The shape codes and seismic detailing options remain the same.' },
      { question: 'What is the purpose of the seismic detailing checkbox in the calculator?', answer: 'When enabled, it applies the seismic stirrup spacing limit (6 × d_long) and uses 135° hook shape code 52 instead of 90° hooks. It also adjusts the bend deductions for the different hook angle.' },
      { question: 'Can a tie beam be post-tensioned instead of conventionally reinforced?', answer: 'Yes. Post-tensioned tie beams are used in some large foundation systems. However, the CivILMath BBS calculator is designed for conventional reinforced concrete. Post-tensioned elements require a different calculation approach.' },
      { question: 'What is the typical steel density (kg/m³) for tie beams?', answer: 'Tie beam steel density typically ranges from 80–160 kg/m³. Light tie beams: 60–100 kg/m³. Medium: 100–140 kg/m³. Heavily reinforced seismic tie beams: 140–200 kg/m³.' },
      { question: 'How is the stirrup count adjusted for zone-based spacing?', answer: 'Divide the beam into end zones (typically L/5 from each support) and a middle zone. Calculate stirrups for each zone: N_zone = ceil(L_zone / s_zone) + 1. Sum the zones and subtract 1 for the overlapping stirrup at each zone boundary.' },
      { question: 'What does the lap length factor of 50d mean?', answer: 'It means the lap splice length is 50 times the bar diameter. For a T20 bar, 50 × 20 = 1000 mm (1.0 m). This is the overlap distance between two bars at the splice location.' }
    ],
    relatedCalculators: [
      { name: 'BBS Plinth Beam Calculator', url: '/bbs-plinth-beam' },
      { name: 'BBS Beam Calculator', url: '/bbs-beam' },
      { name: 'BBS Lintel Beam Calculator', url: '/bbs-lintel-beam' },
      { name: 'BBS Footing Calculator', url: '/bbs-footing' },
      { name: 'BBS Column Calculator', url: '/bbs-column' },
      { name: 'BBS Pedestal Calculator', url: '/bbs-pedestal' },
      { name: 'BBS Combined Footing Calculator', url: '/bbs-combined-footing' },
      { name: 'BBS Strip Footing Calculator', url: '/bbs-strip-footing' },
      { name: 'Concrete Volume Estimator', url: '/volume' },
      { name: 'Structural Beam Analysis Calculator', url: '/beam' }
    ],
    references: [
      'ACI Committee 318. (2019). Building Code Requirements for Structural Concrete (ACI 318-19). American Concrete Institute.',
      'British Standards Institution. (2020). BS 8666:2020 — Scheduling of Reinforcement for Concrete. BSI, London.',
      'British Standards Institution. (2005). BS 4449:2005+A3:2016 — Steel for the Reinforcement of Concrete. BSI, London.',
      'European Committee for Standardization. (2004). EN 1992-1-1:2004 — Eurocode 2: Design of Concrete Structures. CEN, Brussels.',
      'Bureau of Indian Standards. (2000). IS 456:2000 — Plain and Reinforced Concrete — Code of Practice. BIS, New Delhi.',
      'Bureau of Indian Standards. (1963). IS 2502:1963 — Code of Practice for Bending and Fixing of Bars for Reinforcement. BIS, New Delhi.',
      'Bureau of Indian Standards. (2016). IS 13920:2016 — Ductile Design and Detailing of Reinforced Concrete Structures Subjected to Seismic Forces. BIS, New Delhi.',
      'Paulay, T. & Priestley, M.J.N. (1992). Seismic Design of Reinforced Concrete and Masonry Buildings. John Wiley & Sons.'
    ]
  };
}
