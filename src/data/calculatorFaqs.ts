/**
 * Shared calculator FAQs — single source of truth.
 *
 * Used by calculator pages (CalculatorPageTemplate `faqs` prop) and by
 * seoRoutes.ts so the build-time SEO injection (scripts/inject-seo-meta.ts)
 * can emit FAQPage JSON-LD into the static HTML. Keep question/answer text
 * identical in both places by importing from here.
 */
export interface FaqItem {
  question: string;
  answer: string;
}

export const CALCULATOR_FAQS: Record<string, FaqItem[]> = {
  '/rebar/weight-cost': [
    {
      question: 'How is rebar weight calculated?',
      answer:
        'Imperial: total weight = number of bars × length per bar × the ASTM A615 standard unit weight for the selected bar size (#3–#11), e.g. #4 bar weighs 0.668 lb/ft. Metric: unit weight (kg/m) = diameter² ÷ 162.2, where diameter is in mm — this comes from the steel density of 7850 kg/m³. Your waste margin is added on top.',
    },
    {
      question: 'What steel price should I enter?',
      answer:
        'Enter the price your local supplier quotes per pound (US) or per kilogram. US retail rebar is often roughly $0.50–$0.90/lb depending on region, bar size, and quantity, and prices move with steel markets — confirm with a supplier before budgeting. Delivery, cutting, bending, tax, and lap-splice extras are not included.',
    },
    {
      question: 'Does this include lap splices and hooks?',
      answer:
        'No. Lap splice lengths and hooks must be added to your bar lengths before calculating — check the project drawings and specifications for the required lap lengths. The waste margin covers cutting waste only, not splices.',
    },
  ],
  '/concrete/cost': [
    {
      question: 'How is the concrete slab cost calculated?',
      answer:
        'The calculator finds the slab volume (length × width × thickness), converts it to cubic yards (or cubic metres), adds your waste margin for spillage and over-excavation, then multiplies by the ready-mix price you enter. It also shows the price per square foot (or square metre) so you can compare quotes.',
    },
    {
      question: 'What ready-mix price should I enter?',
      answer:
        'Enter the price your local supplier quotes per cubic yard (US typical range is roughly $120–$180/yd³ depending on region, mix strength, and delivery distance). Prices move with fuel and cement costs, so confirm with a supplier before ordering. Delivery, short-load, and weekend fees are not included.',
    },
    {
      question: 'Does this include labor, forms, and rebar?',
      answer:
        'No. This is a ready-mix material cost estimate only. Formwork, reinforcement, subgrade preparation, placement labor, and finishing are separate costs — typically they exceed the concrete material cost on residential slabs.',
    },
  ],
  '/concrete/steps': [
    {
      question: 'How is the concrete volume for steps calculated?',
      answer:
        'Each step is treated as a rectangular block: riser height × tread depth × stair width, multiplied by the number of steps. If you enter a waist slab thickness, the sloped slab under the steps is added (thickness × slope length × width), and an optional top landing is added as length × width × thickness. A waste margin is then applied and the result is priced at your ready-mix rate.',
    },
    {
      question: 'What is the waist slab and do I need it?',
      answer:
        'The waist slab is the sloped concrete slab that the steps sit on, spanning the full incline of the staircase. Freestanding exterior stairs usually need one (typically 4–6 in thick). If your steps are built over solid compacted fill or sit on an existing slab, enter 0 and the calculator estimates the steps alone.',
    },
    {
      question: 'What riser and tread sizes should I use?',
      answer:
        'Common residential guidance (e.g., IRC R311.7) limits risers to about 7¾ in (197 mm) and requires treads of at least 10 in (254 mm). Many builders aim for a comfortable 7 in riser with an 11 in tread. Always verify against your local building code before construction — requirements vary by jurisdiction.',
    },
    {
      question: 'Does this include rebar, formwork, and labor?',
      answer:
        'No. This is a ready-mix material volume and cost estimate only. Reinforcement, formwork, subgrade preparation, placement labor, finishing, delivery and short-load fees are separate costs — get a written supplier quote before ordering.',
    },
  ],
  '/concrete/volume': [
    {
      question: 'How does the concrete volume calculator work?',
      answer:
        'Enter your slab, column, or wall dimensions (length, width, thickness). The calculator computes raw volume, adds waste/shrinkage margin, then calculates dry material volumes using a 1.54 multiplier. For M20 grade (1:1.5:3), it estimates cement bags, sand, and aggregate.',
    },
    {
      question: 'What concrete grades are supported?',
      answer:
        'The calculator supports standard mix ratios including M5 (1:5:10), M7.5 (1:4:8), M10 (1:3:6), M15 (1:2:4), M20 (1:1.5:3), M25 (1:1:2), and custom ratios.',
    },
    {
      question: 'Can I toggle between metric and imperial?',
      answer:
        'Yes. Switch between Metric (m, kg) and Imperial (ft, lbs) units. All inputs, material densities, and cost calculations update in real time.',
    },
  ],
  '/concrete/rebar': [
    {
      question: 'What rebar sizes are supported?',
      answer:
        'The calculator supports standard rebar diameters from #3 (10mm) to #18 (57mm) including metric equivalents. Select your bar size and the calculator uses the corresponding cross-sectional area and unit weight.',
    },
    {
      question: 'How are lap splices calculated?',
      answer:
        'Overlap lengths are computed as 40D to 50D (40 to 50 times bar diameter) based on code standards. You can customize the lap ratio and the maximum raw bar length available.',
    },
    {
      question: 'Can I specify custom spacing?',
      answer:
        'Yes. Input center-to-center spacing in either direction. The calculator determines the number of bars required to cover the given span at the specified spacing.',
    },
  ],
  '/concrete/brick': [
    {
      question: 'What brick sizes are supported?',
      answer:
        'Standard modular brick (190×90×90mm), UK brick (215×102.5×65mm), and custom sizes. You can specify brick length, height, and thickness in any unit.',
    },
    {
      question: 'How is mortar volume calculated?',
      answer:
        'The calculator computes total wall volume, subtracts the volume occupied by bricks, and adds a waste factor. The dry mortar volume is then split into cement and sand based on your mix ratio (e.g., 1:4, 1:6).',
    },
    {
      question: 'What mortar ratios can I use?',
      answer:
        'Common mix ratios like 1:3, 1:4, 1:5, and 1:6 (cement:sand) are supported. You can also enter a custom ratio for your specific mortar specification.',
    },
  ],
  '/structural/beam': [
    {
      question: 'What load types are supported?',
      answer:
        'The calculator supports uniformly distributed loads (UDL) in kN/m or lb/ft and point loads at midspan. Both can be combined for composite loading analysis.',
    },
    {
      question: 'How is deflection calculated?',
      answer:
        'Maximum elastic deflection is computed using Euler-Bernoulli beam theory: Δ = 5wL⁴/384EI for UDL and Δ = PL³/48EI for point loads. Results are checked against L/240 serviceability limits.',
    },
    {
      question: 'What beam properties are required?',
      answer:
        "You need the beam span length, elastic modulus (E), and moment of inertia (I). For concrete beams, the calculator provides standard E values based on the concrete grade (f'c).",
    },
  ],
  '/structural/column': [
    {
      question: 'What column types are supported?',
      answer:
        'The estimator is limited to short rectangular tied columns under axial compression. It does not replace an interaction, slenderness, seismic or project-specific design check.',
    },
    {
      question: 'How is the steel ratio shown?',
      answer:
        'The tool calculates ρ = Ast/Ag and displays a warning based on its internal assumptions. Verify any acceptance limits against the applicable project requirements.',
    },
    {
      question: 'What safety factors are applied?',
      answer:
        'The displayed result uses the factors built into this educational method. Confirm factor selection and applicability with a qualified professional before relying on it.',
    },
  ],
  '/structural/slab': [
    {
      question: 'What span conditions are supported?',
      answer:
        'The calculator supports four boundary conditions: simply supported (span/20), one end continuous (span/24), both ends continuous (span/28), and cantilever (span/10).',
    },
    {
      question: 'How does steel grade affect the estimate?',
      answer:
        'The estimator applies the displayed modification factor to its assumptions. Confirm whether that method and material grade are suitable for the project before using the result.',
    },
    {
      question: 'Is this for one-way or two-way slabs?',
      answer:
        'This calculator is designed for one-way slabs where the long-span to short-span ratio exceeds 2.0. For two-way slabs, both span directions should be considered.',
    },
  ],
  '/structural/steel-weight': [
    {
      question: 'What steel section shapes are supported?',
      answer:
        'Four standard structural profiles: flat plate/bar, circular solid rod, hollow pipe/tube, and H-beam (wide flange). Each has its own geometric calculation for cross-sectional area.',
    },
    {
      question: 'What density value is used?',
      answer:
        'Standard structural steel density: 7850 kg/m³ (metric) or 490 lb/ft³ (imperial). This is the standard density for A36, A992, and most common structural steel grades.',
    },
    {
      question: 'Can I calculate unit weight per meter?',
      answer:
        'Yes. The calculator shows both total weight for the given length and weight per unit length, which is useful for estimating linear material takeoffs.',
    },
  ],
  '/surveying/hi': [
    {
      question: 'What is the Height of Instrument method?',
      answer:
        'The HI method establishes the elevation of the instrument line of sight by adding the backsight reading to the known benchmark elevation. Reduced levels of unknown points are then computed by subtracting rod readings from the HI.',
    },
    {
      question: 'Can I record multiple survey points?',
      answer:
        'Yes. The calculator supports multiple foresight and intermediate sight readings from a single instrument setup. Each point receives its own reduced level calculation.',
    },
    {
      question: 'How is the elevation difference calculated?',
      answer:
        'The elevation difference between any two points is computed as the difference in their reduced levels. The calculator also tracks the total vertical elevation change across the traverse.',
    },
  ],
  '/surveying/traverse': [
    {
      question: 'How are new coordinates computed?',
      answer:
        'Northing change (latitude) = D × cos(θ) and Easting change (departure) = D × sin(θ), where D is the horizontal distance and θ is the bearing angle from north. New coordinates are added to the starting station.',
    },
    {
      question: 'What bearing format is used?',
      answer:
        'Bearing angles are entered in decimal degrees measured clockwise from north (0° to 360°). The calculator also computes the quadrant bearing for field survey notes.',
    },
    {
      question: 'Can I include elevation changes?',
      answer:
        'Yes. Enter the vertical angle or slope percentage to compute the elevation change and the new station elevation alongside the horizontal coordinates.',
    },
  ],
  '/geotechnical/bearing-capacity': [
    {
      question: "What is Terzaghi's bearing capacity equation?",
      answer:
        'qult = c·Nc·sc + q·Nq + 0.5·γ·B·Nγ·sγ, where c is cohesion, q is overburden pressure, γ is soil unit weight, B is footing width, N factors depend on friction angle, and s factors account for footing shape.',
    },
    {
      question: 'What soil parameters are needed?',
      answer:
        'You need the soil cohesion (c), friction angle (φ), unit weight (γ), footing depth (Df), footing width (B) and length (L), and a safety factor (typically 3.0 for bearing capacity).',
    },
    {
      question: 'How is the allowable bearing pressure determined?',
      answer:
        'The ultimate bearing capacity qult is divided by the safety factor to obtain the allowable bearing pressure qallow. This is the maximum safe loading the soil can support without shear failure.',
    },
  ],
  '/geotechnical/retaining-wall': [
    {
      question: 'What is the Rankine active earth pressure theory?',
      answer:
        'Rankine theory assumes a vertical retaining wall with horizontal backfill. The active earth pressure coefficient Ka = (1-sinφ)/(1+sinφ), where φ is the soil friction angle. The total lateral thrust is Pa = 0.5·Ka·γ·H².',
    },
    {
      question: 'How is overturning moment calculated?',
      answer:
        'The lateral thrust Pa acts at a height of H/3 above the base of the wall for triangular pressure distribution. The overturning moment about the toe is Mo = Pa × (H/3).',
    },
    {
      question: 'Can I specify sloping backfill?',
      answer:
        'Yes. If the backfill surface is sloping at an angle β from horizontal, the calculator adjusts the Ka coefficient using the appropriate Rankine equation for sloping backfill.',
    },
  ],
  '/utilities/unit-converter': [
    {
      question: 'What unit categories are supported?',
      answer:
        'Length (mm/cm/m/km to in/ft/yd/mi), area (m² to ft²), volume (m³ to ft³/yd³), force (kN to kip/lbf), pressure/stress (kPa/MPa to psi/ksi), moment (kN·m to kip·ft), and density (kg/m³ to lb/ft³).',
    },
    {
      question: 'Are conversion factors precise?',
      answer:
        'Yes. All conversion factors follow standard engineering definitions: 1 in = 25.4 mm exactly, 1 kip = 4.44822 kN, 1 psi = 6.89476 kPa, and so on. Results show up to 4 decimal places.',
    },
    {
      question: 'Can I convert between any two units?',
      answer:
        'Yes. Select a category, choose the source unit and target unit, enter a value, and get the conversion instantly. All units within a category are fully convertible both ways.',
    },
  ],
};
