import { ArticleData } from './index';

export function getArticle(): ArticleData {
  return {
    seoTitle: 'Reinforced Concrete Beam Bar Bending Schedule (BBS) Calculator | CivILMath',
    metaDescription: 'Complete BBS calculator for RC beams. Calculate top and bottom reinforcement, stirrups, extra bars for negative moment, side face bars, cutting lengths, and steel weights per ACI 318, BS 8666, Eurocode 2, IS 456.',
    slug: 'bbs-beam',
    primaryKeyword: 'bar bending schedule for RC beam',
    secondaryKeywords: [
      'beam reinforcement calculation',
      'beam stirrup cutting length',
      'beam BBS example',
      'RC beam top and bottom bars',
      'beam extra top bars negative moment',
      'beam side face reinforcement',
      'beam stirrup spacing calculation',
      'beam bar bending schedule format',
      'beam main reinforcement cutting length',
      'beam bent up bars BBS'
    ],
    lsiKeywords: [
      'beam reinforcement details',
      'RC beam steel quantity',
      'beam stirrup weight calculation',
      'beam BBS pdf',
      'beam reinforcement drawing',
      'beam longitudinal section',
      'beam cross section reinforcement',
      'beam shear reinforcement',
      'beam development length',
      'beam curtailment of bars'
    ],
    breadcrumb: [
      { label: 'Home', url: '/' },
      { label: 'BBS Calculator', url: '/bbs-universal' },
      { label: 'RC Beam', url: '/bbs-beam' }
    ],
    h1: 'Bar Bending Schedule for Reinforced Concrete Beam — Complete Engineering Guide with Stirrups, Extra Bars, and Curtailment',
    introduction: `A reinforced concrete beam is one of the most fundamental structural elements in building construction, transferring loads from slabs and walls to columns or load-bearing walls. The reinforcement in a beam is considerably more complex than in a footing because beams resist both bending and shear forces, requiring longitudinal bars (tension and compression reinforcement) and transverse stirrups (shear reinforcement). Additional complexities arise from the need for extra top bars at supports for negative moment, extra bottom bars at midspan for positive moment, bent-up bars for shear resistance, and side face bars for deep beams.

The bar bending schedule for a beam must capture every one of these reinforcement types with precise cutting lengths, bend allowances, and placement locations. A typical simply supported or continuous beam has top bars (hanger bars) running along the full span near the top face, bottom bars (tensile reinforcement) near the bottom face, and stirrups wrapping around the beam cross-section at regular intervals. In continuous beams, the negative moment over supports requires additional top bars that extend into the span for a distance of approximately L/3 from the support face. Similarly, additional bottom bars may be required at midspan for positive moment, extending roughly L/2 from the midspan region.

The CivILMath BBS Beam calculator is designed to handle all of these reinforcement types. The user inputs the beam span, width, depth, cover, the main top and bottom bar diameters and counts, the stirrup diameter and spacing (with separate end-zone spacing for support regions), and optional parameters for extra top bars, extra bottom bars, bent-up bars, and side face bars. The engine then calculates the cutting lengths for each bar type using the appropriate shape codes, applies bend deductions per the selected design standard, and generates a complete reinforcement schedule with bar marks, dimensions, quantities, and weights.

This article provides a comprehensive engineering guide to beam BBS calculations. We cover the structural theory of beam reinforcement, the full set of input parameters, the sequential calculation logic, the key formulas with code references, a detailed step-by-step example for a continuous beam, and extensive sections on common errors, best practices, and frequently asked questions. Whether you are a structural engineer preparing beam details or a site engineer verifying a contractor's bar schedule, this guide will serve as your definitive reference.`,
    theory: `The structural behaviour of a reinforced concrete beam is governed by the coupled actions of bending moment and shear force. The bending moment creates tension on one face of the beam and compression on the opposite face — for a simply supported beam under gravity loads, the bottom fibre is in tension and the top fibre is in compression. The longitudinal reinforcement is placed on the tension face to resist this tensile force. The shear force creates diagonal tension cracks near the supports, which are resisted by vertical stirrups (also called links or shear reinforcement). The combination of longitudinal bars and stirrups forms a reinforcement cage that must be carefully detailed in the BBS.

For a simply supported beam, the main tensile reinforcement is placed at the bottom. The top bars (often called hanger bars) are smaller in diameter and serve to support the stirrups during construction and to resist any incidental compression or negative moment from partially fixed supports. For continuous beams, the moment reversal over supports means the top face is in tension in the support region, requiring additional top bars (extra top bars) that extend beyond the support into the span. The curtailment (cut-off) points for these extra bars are determined by the bending moment envelope — typically L/3 from the support face for top extra bars and L/2 from midspan for bottom extra bars.

Stirrups are closed loops that wrap around the longitudinal bars. They resist shear forces and provide lateral restraint to the longitudinal compression bars, preventing them from buckling. The stirrup spacing is not uniform along the beam — it is closer near the supports (where shear is higher) and wider at midspan. The BBS must capture the stirrup count based on the spacing and the span length. For a simply supported beam with total span L, the number of stirrups is typically calculated as N_stirrups = ceil(L / s) + 1, where s is the stirrup spacing. If variable spacing is used, the beam is divided into zones (end zones and middle zone), each with its own spacing.

Side face bars (skin reinforcement) are required for beams deeper than 750 mm per ACI 318 or 450 mm per IS 456. These bars are placed on both vertical faces of the beam, midway between the top and bottom reinforcement, to control cracking in the web region. The number of side face bars and their diameter depend on the beam depth and the code requirements.

The cutting length for each bar type depends on its shape code. Straight longitudinal bars use shape code 11 (one hook) or 21 (hooks both ends) depending on the anchorage condition. Stirrups use shape code 51 (closed stirrup with four 90° bends) or 52 (closed stirrup with 135° seismic hooks), depending on the seismic requirements. The CivILMath engine supports all standard shape codes and applies the correct bend deductions per the selected design standard.`,
    realWorldApplications: [
      { title: 'Residential Building Floor Beams', description: 'Simply supported or continuous beams in residential floor systems, typically 200–300 mm wide, 300–500 mm deep, with T12–T16 main bars and T8–T10 stirrups.' },
      { title: 'Commercial Office Building Transfer Beams', description: 'Deep transfer beams that carry loads from upper floors to widely spaced columns, requiring heavy reinforcement with T25–T32 bars and closely spaced stirrups.' },
      { title: 'Industrial Crane Gantry Beams', description: 'Beams supporting overhead crane rails, subjected to dynamic loads and requiring fatigue-resistant detailing with full anchorage hooks and weldable steel grades.' },
      { title: 'Bridge Deck Girders', description: 'Precast or cast-in-place bridge girders with complex reinforcement patterns including prestressing ducts in addition to passive reinforcement.' },
      { title: 'Plinth and Grade Beams', description: 'Beams at ground level that tie column footings together and support masonry walls, typically with T12–T16 bars and moderate stirrup spacing.' },
      { title: 'Roof Beams in Industrial Sheds', description: 'Long-span roof beams (15–30 m) in industrial sheds, often with bent-up bars to control shear and reduce stirrup congestion at supports.' },
      { title: 'Cantilever Balcony Beams', description: 'Cantilever beams supporting balconies and overhangs, with top reinforcement (tension face) as the main steel and bottom hanger bars.' },
      { title: 'Underground Water Tank Beams', description: 'Beams in water-retaining structures requiring crack-width-limited design with smaller diameter bars at closer spacing.' },
      { title: 'Earthquake-Resistant Frame Beams', description: 'Special moment-resisting frame (SMRF) beams with seismic detailing — closely spaced stirrups with 135° hooks, continuous top and bottom bars through beam-column joints.' },
      { title: 'Staircase Stringer Beams', description: 'Inclined beams supporting staircase flights, with reinforcement bent to match the slope and special detailing at the landing connections.' },
      { title: 'Concrete Frame for High-Rise Buildings', description: 'Perimeter and interior beams in high-rise concrete frames with heavy reinforcement, requiring careful detailing for moment redistribution and ductility.' },
      { title: 'Precast Concrete Beam Connections', description: 'Precast beams with corbels or haunches at ends, requiring additional reinforcement at the connection zone and special shape codes for the bent bars.' },
      { title: 'T-Beam and L-Beam Bridge Superstructures', description: 'T-beam bridge decks where the beam acts integrally with the slab, requiring reinforcement for both the beam web and the flange in a single integrated BBS.' }
    ],
    inputParameters: [
      { name: 'Beam Span (L)', purpose: 'Clear span or centre-to-centre span of the beam', unit: 'm (metric) or ft (imperial)', meaning: 'Determines the length of all longitudinal bars and the number of stirrups', range: '1.0–30.0 m (typical 3.0–12.0 m)', mistakes: 'Using the clear span when the design requires centre-to-centre span, or vice versa.' },
      { name: 'Beam Width (b)', purpose: 'Width of the beam cross-section', unit: 'm (metric) or ft (imperial)', meaning: 'Determines the stirrup width dimension and the space available for bars', range: '0.15–1.0 m (typical 0.2–0.4 m)', mistakes: 'Forgetting that stirrup width = beam width − 2 × cover, not the full beam width.' },
      { name: 'Beam Depth (D)', purpose: 'Overall depth of the beam', unit: 'm (metric) or ft (imperial)', meaning: 'Determines the stirrup height, side face bar requirements, and effective depth', range: '0.2–2.0 m (typical 0.3–0.8 m)', mistakes: 'Using effective depth (d) instead of overall depth (D) for stirrup height calculation.' },
      { name: 'Clear Cover', purpose: 'Concrete cover to the stirrup (outermost reinforcement)', unit: 'mm (metric) or in (imperial)', meaning: 'Deducted from all sides for stirrup dimensions; protects steel from corrosion and fire', range: '20–50 mm (typical 25–40 mm)', mistakes: 'Using cover measured to the longitudinal bar instead of the stirrup.' },
      { name: 'Top Bar Diameter', purpose: 'Diameter of continuous top (hanger) bars', unit: 'mm (metric) or imperial bar number', meaning: 'Supports stirrups and provides compression reinforcement for continuous beams', range: '10–32 mm (typical T12–T20)', mistakes: 'Using a diameter larger than the bottom bar when the beam is simply supported (top bars need less area).' },
      { name: 'Number of Top Bars', purpose: 'Count of continuous top bars', unit: 'Integer', meaning: 'Together with diameter, determines the top steel area', range: '2–8 bars', mistakes: 'Specifying too few top bars to form a proper stirrup support cage (minimum 2 top bars).' },
      { name: 'Bottom Bar Diameter', purpose: 'Diameter of main bottom tensile reinforcement', unit: 'mm (metric) or imperial bar number', meaning: 'Primary tensile reinforcement for positive bending moment', range: '12–40 mm (typical T16–T25)', mistakes: 'Selecting a diameter that does not fit in a single layer with proper spacing.' },
      { name: 'Number of Bottom Bars', purpose: 'Count of bottom tensile bars', unit: 'Integer', meaning: 'Determines the tensile steel area and the moment capacity', range: '2–10 bars', mistakes: 'Placing all bottom bars in a single layer when spacing is insufficient; specify multiple layers.' },
      { name: 'Stirrup Diameter', purpose: 'Diameter of shear stirrup reinforcement', unit: 'mm (metric) or imperial bar number', meaning: 'Shear reinforcement; smaller diameters used at closer spacing for efficiency', range: '6–16 mm (typical T8–T12)', mistakes: 'Using stirrup diameter larger than necessary, causing bendability issues and cost increase.' },
      { name: 'Stirrup Spacing', purpose: 'Centre-to-centre spacing of stirrups along the beam', unit: 'mm (metric) or in (imperial)', meaning: 'Determines the number of stirrups and the shear capacity', range: '50–400 mm (typical 100–250 mm)', mistakes: 'Using uniform spacing when closer spacing is needed at supports (end zones).' },
      { name: 'Hook Length Factor', purpose: 'Multiplier on bar diameter for hook length (e.g., 12d)', unit: 'Numeric', meaning: 'Determines anchorage length for longitudinal bars at beam ends', range: '4–16 (typical 12 for ACI, 9 for IS)', mistakes: 'Using the same hook length for stirrups and longitudinal bars — stirrups use 6d or 75 mm minimum.' },
      { name: 'Extra Top Bar Diameter', purpose: 'Diameter of additional top bars at supports for negative moment', unit: 'mm (metric) or imperial bar number', meaning: 'Resists negative moment over supports in continuous beams', range: '10–32 mm', mistakes: 'Making extra top bars too short (extending less than L/3 from support face).' },
      { name: 'Extra Top Bar Count', purpose: 'Number of extra top bars at each support', unit: 'Integer', meaning: 'Additional area for negative moment over the support', range: '2–6 bars per support', mistakes: 'Placing extra top bars outside the beam width — they must fit within the width covered by stirrups.' },
      { name: 'Extra Bottom Bar Diameter & Count', purpose: 'Additional bottom bars at midspan for positive moment', unit: 'mm / Integer', meaning: 'Reinforcement for positive moment that curtails near supports', range: '12–32 mm', mistakes: 'Extending extra bottom bars too close to supports where moment reverses.' },
      { name: 'Side Face Bar Dia & Count', purpose: 'Skin reinforcement for deep beams on vertical faces', unit: 'mm / Integer', meaning: 'Controls cracking in the web of deep beams (> 750 mm depth)', range: '10–16 mm', mistakes: 'Omitting side face bars for beams deeper than 750 mm per ACI 318.' }
    ],
    calculationLogic: `The beam BBS calculation processes each reinforcement component in a logical sequence. First, the engine computes the effective clear span, width, and depth dimensions: clear_span_mm = span × 1000 − 2 × cover, clear_width_mm = width × 1000 − 2 × cover, clear_depth_mm = depth × 1000 − 2 × cover. These define the stirrup internal dimensions and the longitudinal bar straight portions.

For the top continuous bars, the cutting length is calculated using shape code 21 (hooks at both ends) with the straight portion equal to the effective span. The hook length is the user-specified hook_factor × bar_diameter (e.g., 12d for ACI 318). Bend deductions for two 90° bends are applied. The same logic applies to the bottom continuous bars.

For the extra top bars (negative moment reinforcement), the cutting length is calculated as the curtailment length — typically span / 3 from each support face. In the calculator, the extra top bar is assigned a cutting length equal to the curtailment length with shape code 11 (one hook or straight). These bars are placed only at the support regions, not the full span. The extra bottom bars at midspan follow a similar logic with curtailment at span / 2 from midspan.

Stirrups are calculated using shape code 51 (closed rectangular stirrup). The stirrup dimensions are: a = clear_width_mm (width between legs) and b = clear_depth_mm (height between legs). The cutting length for a closed stirrup with four 90° bends is: L_cut = 2 × (a + b) + 2 × hook_length − 8 × bend_deduction_90 − 3 × bend_deduction_135 (for seismic hooks). For standard stirrups (90° hooks), the formula is simpler. The number of stirrups is computed from the total span and the spacing: N_stirrups = ceil(L_total / s) + 1. If end-zone spacing is specified separately, the beam is divided into three zones (two end zones and a middle zone) with different spacing.

Side face bars (if required) are calculated as straight bars running the full span (shape code 00 or 11) placed on both vertical faces. The number of side face bars per face depends on the beam depth. The bar diameter is typically T10 to T16.

The total steel weight aggregates all component weights. The concrete volume is span × width × depth. The final output is a complete BBS with bar marks (B1-01 for top bars, B1-02 for bottom bars, B1-03 for extra top, B1-04 for extra bottom, B1-05 for side face, B1-06 for stirrups), each with detailed dimensions, cutting lengths, quantities, and weights.`,
    formulas: [
      {
        name: 'Stirrup Cutting Length (Shape Code 51 — Closed Rectangular Stirrup)',
        equation: 'L_cut = 2 × (a + b) + 2 × hook_length − 8 × Δ_90',
        variables: [
          { symbol: 'a', meaning: 'Stirrup width = beam width − 2c', unit: 'mm' },
          { symbol: 'b', meaning: 'Stirrup depth = beam depth − 2c', unit: 'mm' },
          { symbol: 'hook_length', meaning: 'Stirrup hook extension (typically 6d or 75 mm min)', unit: 'mm' },
          { symbol: 'Δ_90', meaning: 'Bend deduction for one 90° bend in stirrup', unit: 'mm' }
        ],
        reference: 'BS 8666:2020 Shape Code 51, IS 2502:1963'
      },
      {
        name: 'Number of Stirrups (Uniform Spacing)',
        equation: 'N_stirrups = ceil(L_span / s) + 1',
        variables: [
          { symbol: 'L_span', meaning: 'Total span length', unit: 'mm' },
          { symbol: 's', meaning: 'Stirrup spacing centre-to-centre', unit: 'mm' },
          { symbol: 'N_stirrups', meaning: 'Total number of stirrups', unit: 'count' }
        ],
        reference: 'ACI 318-19 Section 9.7.6.2, IS 456:2000 Clause 26.5.1.6'
      },
      {
        name: 'Extra Top Bar Curtailment Length',
        equation: 'L_extra_top = L_span / 3',
        variables: [
          { symbol: 'L_span', meaning: 'Effective span of the beam', unit: 'mm' },
          { symbol: 'L_extra_top', meaning: 'Length of extra top bar from support face', unit: 'mm' }
        ],
        reference: 'SP 34:1987, standard curtailment rules for continuous beams'
      },
      {
        name: 'Unit Weight of Steel Bar',
        equation: 'W_unit = d² / 162 (metric) or standard tabulated value (imperial)',
        variables: [
          { symbol: 'd', meaning: 'Nominal bar diameter', unit: 'mm' },
          { symbol: 'W_unit', meaning: 'Weight per unit length', unit: 'kg/m (metric) or lb/ft (imperial)' }
        ],
        reference: 'IS 1786:2008, BS 4449:2005'
      },
      {
        name: 'Side Face Reinforcement Requirement',
        equation: 'A_skin = 0.001 × (D − 750) × b per side (ACI 318)',
        variables: [
          { symbol: 'D', meaning: 'Overall beam depth', unit: 'mm' },
          { symbol: 'b', meaning: 'Beam width', unit: 'mm' },
          { symbol: 'A_skin', meaning: 'Required side face reinforcement area per vertical face', unit: 'mm²' }
        ],
        reference: 'ACI 318-19 Section 9.7.2.3'
      }
    ],
    stepByStepExample: {
      scenario: 'BBS calculation for a continuous RC beam in a commercial building, spanning 7.5 m between columns, with intermediate supports creating negative moments at both ends.',
      given: {
        'Beam Type': 'Continuous rectangular beam (interior span)',
        'Beam Span (L)': '7.5 m (centre-to-centre)',
        'Beam Width (b)': '0.30 m',
        'Beam Depth (D)': '0.60 m',
        'Clear Cover': '30 mm (to stirrup)',
        'Concrete Grade': 'M30',
        'Steel Grade': 'Fe500',
        'Top Bar Diameter': '16 mm (T16)',
        'Number of Top Bars': '3 (continuous hanger bars)',
        'Bottom Bar Diameter': '20 mm (T20)',
        'Number of Bottom Bars': '4 (main tensile reinforcement)',
        'Stirrup Diameter': '10 mm (T10)',
        'Stirrup Spacing': '200 mm (midspan), 150 mm (at supports for 1.5 m end zones)',
        'Hook Length Factor': '12d (12 × bar diameter)',
        'Extra Top Bar Diameter': '16 mm (T16)',
        'Extra Top Bar Count': '2 (at each support)',
        'Extra Bottom Bars': 'None for this example',
        'Side Face Bars': 'Not required (D = 600 mm < 750 mm)',
        'Number of Identical Beams': '8'
      },
      steps: [
        { title: 'Compute effective clear dimensions for stirrups', explanation: 'Stirrup width a = 300 − 2 × 30 = 240 mm. Stirrup depth b = 600 − 2 × 30 = 540 mm. Effective span for longitudinal bars = 7500 − 2 × 30 = 7440 mm.' },
        { title: 'Calculate continuous top bars (T16 × 3) cutting length', explanation: 'Shape code 21. Straight portion B = 7440 mm. Hook length = 12 × 16 = 192 mm per end. Bend deduction for T16 (90°): 14.9 mm per bend. Total deduction = 29.8 mm. Cutting length = 7440 + 192 + 192 − 29.8 = 7794.2 mm ≈ 7794 mm.' },
        { title: 'Calculate continuous bottom bars (T20 × 4) cutting length', explanation: 'Shape code 21. Straight portion B = 7440 mm. Hook length = 12 × 20 = 240 mm per end. Bend deduction for T20: 18.6 mm per bend. Total = 37.2 mm. Cutting length = 7440 + 240 + 240 − 37.2 = 7882.8 mm ≈ 7883 mm.' },
        { title: 'Calculate extra top bars (T16 × 2 at each support)', explanation: 'Two supports (left and right), each with 2 extra bars. Curtailment length = L/3 = 7500/3 = 2500 mm. Shape code 11 (straight with one hook at support end). Hook = 12 × 16 = 192 mm. Cutting length per bar = 2500 + 192 − 14.9 = 2677.1 mm ≈ 2677 mm. Total extra top bars = 2 supports × 2 bars = 4 bars per beam.' },
        { title: 'Calculate stirrup cutting length (T10 @ variable spacing)', explanation: 'Shape code 51 (closed stirrup). a = 240 mm, b = 540 mm. Hook length for T10 stirrup = 6 × 10 = 60 mm (or 75 mm min, take 75 mm). Bend deduction for T10 (90°): 9.3 mm per bend × 8 bends = 74.4 mm. Cutting length = 2 × (240 + 540) + 2 × 75 − 74.4 = 1560 + 150 − 74.4 = 1635.6 mm ≈ 1636 mm.' },
        { title: 'Calculate number of stirrups with variable spacing', explanation: 'End zones: 2 zones × 1.5 m each = 3.0 m @ 150 mm spacing. Stirrups in each end zone = ceil(1.5 / 0.150) + 1 = 11 per zone. Total end stirrups = 22 — but note the stirrup at the support is counted once, so total end = 21. Midspan: 4.5 m @ 200 mm = ceil(4.5 / 0.200) + 1 = 23 + 1 = 24 — but adjust for overlap: total = 21 + 24 − 1 (shared) = 44 stirrups per beam.' },
        { title: 'Calculate unit weights', explanation: 'T20: 400/162 = 2.469 kg/m. T16: 256/162 = 1.580 kg/m. T10: 100/162 = 0.617 kg/m.' },
        { title: 'Calculate steel weight — continuous bars', explanation: 'Top bars: 3 bars × 7.794 m × 1.580 kg/m = 36.94 kg. Bottom bars: 4 bars × 7.883 m × 2.469 kg/m = 77.84 kg. Extra top bars: 4 bars × 2.677 m × 1.580 kg/m = 16.92 kg.' },
        { title: 'Calculate steel weight — stirrups', explanation: '44 stirrups × 1.636 m × 0.617 kg/m = 44.42 kg.' },
        { title: 'Total steel per beam', explanation: 'Total = 36.94 + 77.84 + 16.92 + 44.42 = 176.12 kg. Concrete volume = 7.5 × 0.30 × 0.60 = 1.35 m³. Steel density = 176.12 / 1.35 = 130.5 kg/m³.' },
        { title: 'Scale for 8 identical beams', explanation: 'Total steel = 176.12 × 8 = 1409.0 kg (1.41 tonnes). Add 5% waste = 1479.4 kg. Total concrete = 1.35 × 8 = 10.80 m³.' },
        { title: 'Check against reference standards', explanation: 'Min spacing between bottom bars: 4 T20 bars in 300 mm width with 2×30 cover + 2×10 stirrup = 80 mm, leaving 220 mm for 3 gaps = 73 mm/gap > 20 mm and > aggregate+5mm (OK). Stirrup spacing: 150 mm at ends < d/2 = 275 mm (ACI 318). Extra top bar extension = 2500 mm > L/3 = 2500 mm exactly (OK). All checks pass.' }
      ],
      finalAnswer: 'For 8 beams 7.5 m span × 300 mm × 600 mm: Continuous top: 24 bars T16 (cut 7794 mm, 296 kg). Continuous bottom: 32 bars T20 (cut 7883 mm, 623 kg). Extra top at supports: 32 bars T16 (cut 2677 mm, 135 kg). Stirrups T10: 352 stirrups (cut 1636 mm, 355 kg). Grand total = 1.41 tonnes (1.48 t with 5% waste). Concrete = 10.80 m³. Prepared to the provisions of ACI 318-19, IS 456:2000, and BS 8666:2020 (shape codes 21, 11, and 51); verify against project requirements.'
    },
    resultExplanation: `The BBS output for a beam presents a row for each reinforcement component. The continuous top and bottom bars use bar marks B1-01 and B1-02 respectively, with shape code 21 (hooks at both ends). The extra top bars at supports are marked B1-03 with shape code 11 (straight bar with one hook at the support end). The stirrups are marked B1-06 with shape code 51 (closed rectangular stirrup). Each row includes the cutting length, the number of bars per beam, the total number across all beams, the unit weight, and the total weight.

The cutting length for stirrups (1636 mm) is less than the perimeter of the beam cross-section (2 × (300 + 600) = 1800 mm) due to the deduction of cover and the application of bend deductions. This is correct — the stirrup fits inside the beam profile with the specified cover, and the bend deductions account for the material consumed in forming the 90° corners.

The variable stirrup spacing (150 mm at ends, 200 mm at midspan) is clearly visible in the bar count calculation. The site engineer should verify that the stirrups are placed correctly — closer spacing in the end zones (first 1.5 m from each support) and wider spacing in the middle. The total of 44 stirrups per beam is a realistic number that the steel fixer can easily count and place.

The steel density of 130.5 kg/m³ is typical for a medium-sized beam with moderate reinforcement. Highly reinforced beams can reach 200–300 kg/m³. The procurement team should note that this beam requires three bar diameters (T20, T16, T10) and order them in the correct proportions: 44% T20, 21% T16 continuous, 10% T16 extra, and 25% T10 stirrups by weight.`,
    commonErrors: [
      { error: 'Using effective depth (d) instead of overall depth (D) for stirrup height', cause: 'Confusing the structural design parameter d with the geometric D for BBS', solution: 'Stirrup height = overall depth − 2 × cover. Effective depth d is not used in BBS calculations.' },
      { error: 'Incorrect stirrup cutting length formula', cause: 'Using 2(a+b) without deducting for bends', solution: 'Use the full formula: 2(a+b) + 2 × hook − 8 × Δ_90 (for 90° hooks) or with 135° deduction for seismic hooks.' },
      { error: 'Not accounting for extra top bars at supports in continuous beams', cause: 'Designing the BBS for a simply supported beam when the beam is continuous', solution: 'Continuous beams always require extra top bars at supports for negative moment. Include them in the BBS.' },
      { error: 'Extra top bars not extended enough into the span', cause: 'Cutting extra bars to L/4 instead of L/3 from the support', solution: 'Extra top bars at supports should extend a minimum of L/3 from the support face into the span (or as per the moment envelope).' },
      { error: 'Using the same hook length for stirrups as for longitudinal bars', cause: 'Applying 12d hook to stirrups when 6d or 75 mm is sufficient', solution: 'Stirrup hook length = 6d or 75 mm minimum (ACI 318). For seismic stirrups with 135° hooks, use 6d or 75 mm at the hook end.' },
      { error: 'Stirrup spacing too wide at supports', cause: 'Using uniform spacing throughout when shear is higher at supports', solution: 'Provide closer stirrup spacing at supports (typically s = d/2 minimum per ACI 318) and wider spacing at midspan.' },
      { error: 'Not checking bar congestion in the beam cross-section', cause: 'Specifying too many bars in a single layer without adequate spacing', solution: 'Verify clear spacing between bars ≥ max(bar diameter, 20 mm, aggregate size + 5 mm). Use multiple layers if needed.' },
      { error: 'Forgetting side face (skin) reinforcement for deep beams', cause: 'Omitting side bars for beams deeper than 750 mm per ACI 318', solution: 'For beams with depth > 750 mm, provide skin reinforcement on both vertical faces with total area = 0.001 × (D − 750) × b per side.' },
      { error: 'Using the wrong shape code for stirrups', cause: 'Using shape code 11 (straight) instead of 51 (closed stirrup)', solution: 'Closed stirrups use shape code 51 (rectangular closed) or code 52 (with seismic 135° hooks).' },
      { error: 'Incorrect curtailment of bottom bars near supports', cause: 'Running all bottom bars full length when some can be curtailed at L/4 from support', solution: 'In continuous beams, approximately 50% of bottom bars can be curtailed at L/4 from the support face. The remaining 50% run full span.' },
      { error: 'Not providing adequate anchorage for top bars at exterior supports', cause: 'Top bars at exterior supports not having sufficient embedment into the support column', solution: 'Ensure top bars at exterior supports have a standard hook (12d) embedded into the column or a development length Ld past the support face.' },
      { error: 'Bent-up bars not properly accounted for in the BBS', cause: 'Treating bent-up bars as straight bars with an extra hook', solution: 'Bent-up bars (for shear) use shape code 31 or 32 with the bend angle specified. The cutting length must account for the inclined portion and the bend at the top.' },
      { error: 'Stirrup hook length too short for seismic requirements', cause: 'Using 90° hooks instead of 135° seismic hooks in earthquake zones', solution: 'In seismic zones (SMRF/OMRF), use 135° hooks on stirrups with an extension of 6d or 75 mm, engaging the longitudinal bar.' },
      { error: 'Using the wrong bar diameter for stirrups in seismic zones', cause: 'Specifying T6 stirrups when the code minimum is T8 or T10 for seismic frames', solution: 'Check the code minimum stirrup diameter for seismic frames: typically T8 minimum for OMRF, T10 minimum for SMRF.' },
      { error: 'Not accounting for the bearing length at beam ends', cause: 'Using the full centre-to-centre span for cutting length without allowing for bearing on supports', solution: 'The beam BBS uses the clear span between column faces plus bearing length if applicable. Verify against the structural GA drawing.' },
      { error: 'Confusing the number of stirrup legs with the number of stirrups', cause: 'Ordering multi-leg stirrups as separate items', solution: 'One stirrup (shape code 51) can have multiple legs (2-legged, 4-legged, etc.). The count N_stirrups refers to the number of closed loops, not the number of individual legs.' },
      { error: 'Extra top bars placed outside the stirrup cage', cause: 'Adding extra top bars that are wider than the stirrup internal width', solution: 'Extra top bars must fit within the stirrup ties. If more bars are needed, increase the beam width or use multiple layers.' },
      { error: 'Using straight bars (shape code 00) where hooks are needed', cause: 'Assuming straight bars provide adequate anchorage at beam ends', solution: 'Beam longitudinal bars require standard hooks (shape code 21, 11) or headed anchors at exterior supports to develop the yield strength.' },
      { error: 'Not updating the BBS when the beam depth changes', cause: 'Reusing a BBS from a previous beam of different depth', solution: 'Every change in beam dimensions requires a complete BBS recalculation. Stirrup dimensions, cutting lengths, and bar counts all change.' },
      { error: 'Ordering beam steel without verifying the bendability of large-diameter stirrups', cause: 'Specifying T16 stirrups that are difficult to bend accurately on site', solution: 'Stirrups larger than T12 are difficult to bend on standard site bending benches. Consider using T10 or T12 stirrups in double or quadruple legs instead.' }
    ],
    bestPractices: [
      'Always provide a minimum of 2 top continuous bars (hanger bars) to support the stirrup cage. Even in simply supported beams, top bars are needed for the stirrup assembly.',
      'Use variable stirrup spacing — closer at supports (d/4 to d/2 per code) and wider at midspan. This optimises steel usage and satisfies the shear demand envelope.',
      'For continuous beams, extend extra top bars at supports to at least L/3 of the adjacent span. Verify the actual curtailment point from the bending moment diagram.',
      'Use the minimum practical stirrup diameter (T8 for light beams, T10 for medium beams, T12 for heavy beams). Larger diameter stirrups are harder to bend and add unnecessary cost.',
      'Always check bar congestion before finalising the BBS. The clear spacing between bars should allow concrete to flow freely through the reinforcement cage.',
      'For beams deeper than 750 mm (ACI 318) or 450 mm (IS 456), include side face (skin) reinforcement on both vertical faces. This controls web cracking and improves ductility.',
      'Use 135° seismic hooks (shape code 52) on stirrups in earthquake-resistant frames. The hook extension must engage the longitudinal bar to prevent shear failure.',
      'Prepare a separate BBS line item for each bar type (top bars, bottom bars, extra top, extra bottom, stirrups, side face bars). Do not combine different bar types into one row.',
      'Verify that the cutting length of stirrups accounts for both the 90° corner bends and the hook bends. The total bend deduction for a closed stirrup is substantial (8 bends for 90° hooks).',
      'Label beam BBS marks with a clear convention: B1-01 for top bars, B1-02 for bottom bars, B1-03 for extra top, B1-06 for stirrups. Use the beam number as a prefix.',
      'Include the lap length in the BBS for beams longer than the stock bar length (12 m). Stagger lap locations to avoid a continuous plane of weakness.',
      'Cross-check the total beam steel weight against the structural engineer\'s estimate. A discrepancy of more than 5% indicates a possible error in the BBS or the design.',
      'Document the design standard and the concrete/steel grades in the BBS header. Beam hook lengths and bend deductions vary between ACI 318, IS 456, and Eurocode 2.',
      'For beams supporting heavy point loads (e.g., transfer beams), provide additional stirrups or bent-up bars at the load application point. The BBS must capture these separately.',
      'Always have the beam BBS reviewed by a second engineer. Beam failures due to incorrect reinforcement detailing are among the most dangerous structural failures.'
    ],
    designCodes: [
      { code: 'ACI 318-19', description: 'Building Code Requirements for Structural Concrete — Sections 9.6 (minimum reinforcement), 9.7 (stirrup spacing), 10.7 (beam detailing), and 18.6 (seismic beam requirements).' },
      { code: 'BS 8666:2020', description: 'Scheduling of Reinforcement for Concrete — defines shape codes 00, 11, 21 (longitudinal bars), 51 (closed stirrups), and 52 (stirrups with seismic hooks).' },
      { code: 'BS 4449:2005+A3:2016', description: 'Steel for the Reinforcement of Concrete — weldable grades B500A, B500B, B500C with ductility classifications critical for beam reinforcement in seismic zones.' },
      { code: 'Eurocode 2 (EN 1992-1-1:2004)', description: 'Design of Concrete Structures — Sections 8 (detailing of reinforcement) and 9 (member detailing) cover beam rules for anchorage, laps, and shear reinforcement.' },
      { code: 'IS 456:2000', description: 'Plain and Reinforced Concrete Code of Practice — Clauses 26.3–26.5 (spacing, cover, minimum reinforcement) and Clause 40 (shear reinforcement) for beam detailing.' },
      { code: 'IS 2502:1963', description: 'Code of Practice for Bending and Fixing of Bars for Reinforcement — Indian standard for beam BBS with shape codes, bend deductions, and hook length tables.' },
      { code: 'SP 34:1987', description: 'Handbook on Concrete Reinforcement and Detailing — provides standard beam reinforcement details, bar curtailment diagrams, and stirrup arrangement sketches.' },
      { code: 'AS 3600:2018', description: 'Concrete Structures — Australian standard for beam reinforcement, cover, minimum steel ratios, and shear reinforcement detailing.' }
    ],
    faqs: [
      { question: 'What is the difference between top bars and extra top bars in a beam?', answer: 'Top bars (hanger bars) run continuously along the full beam span. Extra top bars are additional bars placed only in the support regions (typically L/3 from each support) to resist negative bending moment in continuous beams.' },
      { question: 'Why are stirrups spaced closer at beam supports?', answer: 'Shear force is maximum at the supports and decreases toward midspan. Closer stirrup spacing at supports provides the required shear capacity where the demand is highest.' },
      { question: 'What shape code is used for closed rectangular stirrups?', answer: 'BS 8666 shape code 51 for standard closed stirrups with 90° hooks, and code 52 for stirrups with 135° seismic hooks. Both are rectangular closed loops.' },
      { question: 'How is the stirrup cutting length calculated?', answer: 'L_cut = 2 × (a + b) + 2 × hook − 8 × Δ_90 (for 90° hooks). Here a = beam width − 2c, b = beam depth − 2c, hook = 6d or 75 mm min, and Δ_90 is the 90° bend deduction.' },
      { question: 'What is the minimum stirrup spacing in beams?', answer: 'Per ACI 318, the maximum stirrup spacing for shear is the smaller of d/2 or 600 mm. For seismic frames, the spacing is much tighter — typically d/4 at the ends.' },
      { question: 'When are side face bars required in beams?', answer: 'Side face (skin) bars are required when the overall beam depth exceeds 750 mm per ACI 318-19 Section 9.7.2.3, or 450 mm per IS 456:2000 Clause 26.5.1.2.' },
      { question: 'What is bar curtailment and why is it important?', answer: 'Curtailment means cutting off bars where they are no longer required by the moment envelope. It saves steel and reduces congestion. However, bars must extend beyond the theoretical cut-off point by the development length Ld.' },
      { question: 'How are extra top bars anchored at exterior supports?', answer: 'Extra top bars at exterior supports require a standard 90° or 180° hook (12d extension) embedded into the supporting column or beam to develop the full tensile strength.' },
      { question: 'What is the hook length for beam longitudinal bars?', answer: 'For ACI 318, a standard 90° hook has a 12d extension (12 × bar diameter). For IS 456, a standard hook has a 9d extension (or 4d + extension length per IS 2502).' },
      { question: 'Can bent-up bars replace stirrups for shear reinforcement?', answer: 'Bent-up bars can supplement stirrups but cannot fully replace them per most modern codes. Stirrups are the primary shear reinforcement; bent-up bars provide additional shear capacity in specific cases.' },
      { question: 'What is the minimum number of stirrup legs required?', answer: 'For beams up to 400 mm wide, 2-legged stirrups are sufficient. For wider beams, 4-legged or 6-legged stirrups may be required to provide lateral support to all longitudinal bars.' },
      { question: 'How does the calculator handle imperial units for beams?', answer: 'Toggle to imperial mode. Beam dimensions are in inches/feet, bar diameters use imperial numbers (#3, #4, etc.), stirrup spacing is in inches, and weights are in lb/ft.' },
      { question: 'What is the typical steel density (kg/m³) for beams?', answer: 'Beam steel density typically ranges from 80–180 kg/m³. Lightly reinforced beams: 60–100 kg/m³. Medium: 100–150 kg/m³. Heavily reinforced: 150–250 kg/m³.' },
      { question: 'How are lap splices handled in beam longitudinal bars?', answer: 'For beams longer than the stock bar length (12 m), lap splices of 40–60d are required. Laps should be staggered so no more than 50% of bars are lapped at any section.' },
      { question: 'What is the purpose of the top bars in a simply supported beam?', answer: 'In simply supported beams, top bars (hanger bars) support the stirrup cage during construction and resist any incidental negative moment from partially fixed supports or lateral loads.' },
      { question: 'How do I calculate the number of stirrups for a beam with variable spacing?', answer: 'Divide the beam into zones — typically two end zones (each L/4 or L/5) with closer spacing and a middle zone with wider spacing. Calculate stirrups for each zone using N = ceil(zone_length / s) + 1 per zone, adjusting for overlap.' },
      { question: 'What does "shape code 11" represent for beam bars?', answer: 'Shape code 11 (BS 8666) represents a straight bar with a hook at one end. This is used for extra top bars at supports where the hook end is at the support and the straight end extends into the span.' },
      { question: 'Why are hooks needed at beam bar ends?', answer: 'Hooks provide mechanical anchorage that prevents the bar from pulling out of the concrete at the support. The hook transfers the tensile force into the concrete through bearing at the inside of the hook.' },
      { question: 'What is the minimum cover for beam reinforcement?', answer: 'Minimum cover depends on exposure: 20 mm for mild interior (IS 456), 30 mm for moderate (ACI 318), 40 mm for severe, 50 mm for very severe. Cover is measured to the stirrup (outermost reinforcement).' },
      { question: 'Can I use the beam BBS calculator for a cantilever beam?', answer: 'Yes. For a cantilever beam, the top reinforcement is the main tensile reinforcement (since tension is on the top face). Enter the top bars as the main reinforcement and bottom bars as hanger bars.' }
    ],
    relatedCalculators: [
      { name: 'BBS Plinth Beam Calculator', url: '/bbs-plinth-beam' },
      { name: 'BBS Tie Beam Calculator', url: '/bbs-tie-beam' },
      { name: 'BBS Lintel Beam Calculator', url: '/bbs-lintel-beam' },
      { name: 'BBS Column Calculator', url: '/bbs-column' },
      { name: 'BBS Slab Calculator', url: '/bbs-slab' },
      { name: 'BBS Staircase Calculator', url: '/bbs-staircase' },
      { name: 'BBS Pedestal Calculator', url: '/bbs-pedestal' },
      { name: 'BBS Retaining Wall Calculator', url: '/bbs-retaining-wall' },
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
      'Bureau of Indian Standards. (1987). SP 34:1987 — Handbook on Concrete Reinforcement and Detailing. BIS, New Delhi.',
      'Park, R. & Paulay, T. (1975). Reinforced Concrete Structures. John Wiley & Sons.'
    ]
  };
}
