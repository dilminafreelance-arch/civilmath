import { ArticleData } from './index';

export function getArticle(): ArticleData {
  return {
    seoTitle: 'Terzaghi Bearing Capacity Calculator | Soil Bearing Pressure | CivilMath',
    metaDescription: 'Free Terzaghi bearing capacity calculator for shallow foundations. Computes ultimate bearing capacity (qult) and allowable soil bearing pressure using Nc, Nq, Nγ factors with shape corrections.',
    slug: 'bearing-capacity',
    primaryKeyword: 'Terzaghi bearing capacity calculator',
    secondaryKeywords: [
      'soil bearing pressure calculation',
      'shallow foundation bearing capacity',
      'Terzaghi bearing capacity factors',
      'ultimate bearing capacity qult',
      'allowable bearing pressure',
      'Nc Nq N gamma factors'
    ],
    lsiKeywords: [
      'general shear failure soil',
      'footing bearing capacity',
      'cohesion friction angle bearing',
      'Terzaghi bearing capacity equation',
      'safety factor foundation design',
      'rectangular footing shape factors'
    ],
    breadcrumb: [
      { label: 'Home', url: '/' },
      { label: 'Geotechnical Calculators', url: '/geotechnical' },
      { label: 'Terzaghi Bearing Capacity Calculator', url: '/geotechnical/bearing-capacity' }
    ],
    h1: 'Terzaghi Bearing Capacity Solver — Complete Geotechnical Engineering Guide',
    introduction: `The bearing capacity of a soil is the maximum average contact pressure between the foundation and the soil that will not produce shear failure in the soil mass. Terzaghi's bearing capacity theory, developed by Karl Terzaghi in 1943, remains the most widely used analytical method for evaluating the ultimate bearing capacity of shallow foundations in geotechnical engineering practice. The theory provides a rational framework for calculating the load-carrying capacity of strip, square, and rectangular footings based on soil strength parameters and foundation geometry.

The Terzaghi Bearing Capacity Solver implements the complete Terzaghi equation for rectangular footings under general shear failure conditions. The calculator determines the three bearing capacity factors Nc, Nq, and Nγ from the soil friction angle, applies shape correction factors for rectangular geometry, and computes the ultimate bearing capacity qult using the superposition of cohesion, surcharge, and soil-weight terms. The allowable bearing capacity is then obtained by dividing qult by a user-specified safety factor.

Accurate determination of bearing capacity is critical for foundation design because an underestimation leads to unnecessarily expensive foundations, while an overestimation risks catastrophic shear failure and structural damage. This calculator serves as a rapid design tool for geotechnical engineers evaluating footing bearing pressures during the preliminary design phase. It also functions as an educational resource for students learning the principles of foundation engineering and soil mechanics.

The calculator is applicable to a wide range of shallow foundation types, including isolated column footings, combined footings, and continuous strip footings. The input parameters are the standard soil strength and geometry values that geotechnical engineers obtain from site investigation reports, laboratory tests (triaxial and direct shear), and in-situ tests (SPT, CPT). This guide explains the theoretical basis of the Terzaghi method, provides detailed descriptions of each input parameter, presents the governing equations, and offers practical guidance for foundation design.`,
    theory: `Terzaghi's bearing capacity theory is based on the concept of a failure mechanism in the soil beneath a loaded footing. When a footing is loaded to failure, a wedge of soil directly beneath the footing moves downward, displacing soil laterally and upward along curved slip surfaces. Terzaghi idealized this failure mechanism as consisting of three zones: an elastic wedge (Zone I) directly beneath the footing that moves as a rigid body with the footing, a radial shear zone (Zone II) where the soil undergoes shearing along logarithmic spiral surfaces, and a passive Rankine zone (Zone III) where the soil is pushed upward and outward. The equilibrium of forces on these zones yields the bearing capacity equation.

The general form of the Terzaghi equation is qult = c × Nc × sc + q × Nq + 0.5 × γ × B × Nγ × sγ, where c is the soil cohesion intercept, q is the surcharge pressure at footing base level (γ × Df), γ is the unit weight of the soil, B is the footing width, Nc, Nq, and Nγ are the bearing capacity factors that depend on the soil friction angle φ, and sc and sγ are shape factors for rectangular footings. The three terms represent the contributions of cohesion, overburden pressure, and soil self-weight respectively to the ultimate bearing capacity.

The bearing capacity factors are derived from the theory of plasticity applied to the assumed failure mechanism. For φ = 0 (undrained clay conditions), Nc = 5.7, Nq = 1.0, and Nγ = 0. For φ > 0, the factors increase rapidly with friction angle. At φ = 30°, approximate values are Nc = 37.2, Nq = 22.5, and Nγ = 19.7. At φ = 40°, these increase to approximately Nc = 95.7, Nq = 81.3, and Nγ = 100.4. The non-linear relationship between φ and the bearing capacity factors means that small changes in friction angle produce significant changes in computed bearing capacity, emphasizing the importance of accurate φ determination.

The shape factors sc and sγ correct the bearing capacity for rectangular footings where the length L is greater than the width B. For a strip footing (B/L = 0), the shape factors are unity. As the footing becomes more square (B/L approaches 1.0), sc increases to 1.3 and sγ decreases to 0.8. These factors are empirical and were derived by Terzaghi based on model tests and theoretical considerations. The calculator does not apply a shape factor to the surcharge term (sq = 1.0), which is consistent with Terzaghi's original formulation.`,
    realWorldApplications: [
      {
        title: 'Isolated Column Footing Design',
        description: 'Determining the required footing dimensions for building columns based on column loads and soil bearing capacity. The Terzaghi equation directly sizes square and rectangular footings for safe load transfer.'
      },
      {
        title: 'Bridge Abutment Foundation',
        description: 'Evaluating bearing capacity beneath bridge abutments that transfer vertical loads from the superstructure and horizontal loads from earth pressure to the foundation soil.'
      },
      {
        title: 'Retaining Wall Base Slab Design',
        description: 'Checking bearing pressures beneath retaining wall base slabs under combined vertical loads and overturning moments. The allowable bearing capacity limits the maximum edge pressure.'
      },
      {
        title: 'Tower Crane Foundation',
        description: 'Designing crane base foundations to safely distribute crane loads, including overturning moments from wind and lifting operations, without exceeding soil bearing capacity.'
      },
      {
        title: 'Storage Tank Ring Foundation',
        description: 'Computing bearing requirements for annular ring foundations supporting large-diameter storage tanks. The Terzaghi method applies for both empty and full tank loading conditions.'
      },
      {
        title: 'Highway Culvert Headwall Foundation',
        description: 'Sizing footings for culvert headwalls and wingwalls that support earth pressures and live loads from vehicular traffic passing over the culvert.'
      },
      {
        title: 'Wind Turbine Gravity Base',
        description: 'Evaluating bearing pressures for onshore wind turbine gravity base foundations that resist large overturning moments from wind loads on the turbine tower.'
      },
      {
        title: 'Silo and Hopper Support Foundations',
        description: 'Designing foundations for industrial silos and hoppers that experience varying load conditions during filling and emptying cycles, requiring bearing capacity checks at each stage.'
      },
      {
        title: 'Machinery Foundation Blocks',
        description: 'Sizing massive concrete block foundations for heavy rotating and reciprocating machinery, where bearing capacity must account for both static weight and dynamic forces.'
      },
      {
        title: 'Temporary Construction Platforms',
        description: 'Evaluating the bearing capacity of temporary working platforms for crawler cranes and heavy construction equipment, often on improved or compacted fill materials.'
      },
      {
        title: 'Sheet Pile Anchor Block',
        description: 'Designing gravity anchor blocks for tied-back sheet pile walls, where the anchor block bearing capacity resists the horizontal anchor pull through passive soil resistance.'
      },
      {
        title: 'Offshore Jacket Structure Mudmats',
        description: 'Sizing temporary mudmat foundations for offshore jacket structures during installation before pile driving, where bearing capacity determines seabed settlement.'
      }
    ],
    inputParameters: [
      {
        name: 'Footing Width (B)',
        purpose: 'The width of the rectangular footing perpendicular to the length direction. The smaller plan dimension of the footing.',
        unit: 'meters (m) or feet (ft) depending on unit system',
        meaning: 'The dimension of the footing that governs the shear failure zone width in the Terzaghi failure mechanism. Directly influences the γBNγ term.',
        range: 'Typically 0.5 m to 6 m for standard building footings. Larger values for specialized foundations.',
        mistakes: 'Confusing width with length or entering the column dimension instead of the footing dimension. The footing width B is always the shorter plan dimension.'
      },
      {
        name: 'Footing Length (L)',
        purpose: 'The length of the rectangular footing. The longer plan dimension of the footing.',
        unit: 'meters (m) or feet (ft)',
        meaning: 'Used to compute the B/L ratio for shape factor corrections. A strip footing is modeled by setting L much larger than B.',
        range: 'Typically 0.5 m to 10 m. For strip footings, L can be any value significantly larger than B (e.g., 10× B or more).',
        mistakes: 'Entering L = B for a strip footing, which incorrectly applies square footing shape factors. For continuous strip footings, use L ≥ 10B to approximate strip conditions.'
      },
      {
        name: 'Foundation Depth (Df)',
        purpose: 'The depth from the ground surface to the base of the footing.',
        unit: 'meters (m) or feet (ft)',
        meaning: 'Determines the overburden surcharge pressure q = γ × Df acting at footing base level. Greater depths increase the surcharge term Nq term.',
        range: 'Typically 0.5 m to 5 m for shallow foundations. Depths greater than B are generally considered deep foundations with different failure mechanisms.',
        mistakes: 'Entering the depth of the excavation instead of the depth to the base of the footing, or using a negative value for depth below ground.'
      },
      {
        name: 'Soil Cohesion (c)',
        purpose: 'The cohesion intercept of the soil from the Mohr-Coulomb failure criterion.',
        unit: 'kPa (metric) or psf (imperial)',
        meaning: 'Represents the shear strength of the soil at zero normal stress. For granular soils (sands), c is typically zero. For cohesive soils (clays), c is the undrained shear strength su.',
        range: '0 kPa for clean sands to over 300 kPa for very stiff clays and soft rocks. Typical soft clays: 10-40 kPa, stiff clays: 50-150 kPa.',
        mistakes: 'Using peak cohesion values from triaxial tests without considering the appropriate failure strain, or entering total stress cohesion when effective stress analysis is required.'
      },
      {
        name: 'Friction Angle (φ)',
        purpose: 'The angle of internal shearing resistance of the soil.',
        unit: 'degrees (°)',
        meaning: 'The slope of the Mohr-Coulomb failure envelope. Determines the bearing capacity factors Nc, Nq, and Nγ through complex exponential functions.',
        range: '0° for saturated undrained clays to 45°+ for dense gravels and rock. Typical sands: 28° to 40° depending on density and angularity.',
        mistakes: 'Using the peak friction angle for drained conditions when undrained analysis is applicable, or neglecting to reduce φ for the critical state condition in loose sands.'
      },
      {
        name: 'Soil Unit Weight (γ)',
        purpose: 'The bulk unit weight of the soil above and below the footing base.',
        unit: 'kN/m³ (metric) or lb/ft³ (imperial)',
        meaning: 'Used for both the surcharge term (γ × Df) and the self-weight term (0.5 × γ × B × Nγ). For soils below the water table, the submerged unit weight γ\' should be used.',
        range: '12-20 kN/m³ for most soils. Dry sands: 14-17 kN/m³, saturated clays: 16-20 kN/m³, gravels: 17-22 kN/m³.',
        mistakes: 'Using the total unit weight without accounting for groundwater buoyancy effects. For submerged conditions, use γ\' = γsat - γw (submerged unit weight).'
      },
      {
        name: 'Safety Factor (FS)',
        purpose: 'The factor of safety applied to the ultimate bearing capacity to obtain the allowable bearing pressure.',
        unit: 'dimensionless',
        meaning: 'Divides qult to obtain qallow. Accounts for uncertainties in soil parameters, loading conditions, and construction quality.',
        range: 'Typically 2.5 to 4.0 for bearing capacity. A factor of 3.0 is most common for general foundation design per geotechnical practice.',
        mistakes: 'Using a safety factor of 1.0 for ultimate limit state design or applying a safety factor that is too low for variable soil conditions.'
      },
      {
        name: 'Bearing Capacity Factor Nc (computed)',
        purpose: 'Cohesion bearing capacity factor derived from the friction angle.',
        unit: 'dimensionless',
        meaning: 'Multiplies the cohesion term. For φ = 0, Nc = 5.7. For φ > 0, Nc = (Nq - 1) / tan(φ). Increases rapidly with friction angle.',
        range: '5.7 (φ = 0°) to over 100 (φ = 40°+).',
        mistakes: 'Using Nc from a different bearing capacity theory (Meyerhof, Hansen, Vesic) without recognizing the different underlying failure assumptions.'
      },
      {
        name: 'Bearing Capacity Factor Nq (computed)',
        purpose: 'Surcharge bearing capacity factor representing the overburden contribution.',
        unit: 'dimensionless',
        meaning: 'Derived from the passive earth pressure coefficient acting on the failure surfaces. Nq = e(0.75π-φ/2)tanφ × tan²(45°+φ/2) / (2cos²(45°+φ/2)).',
        range: '1.0 (φ = 0°) to over 80 (φ = 40°).',
        mistakes: 'Confusing Nq with the Rankine passive pressure coefficient Kp. They are related but numerically different due to the different failure surface geometry.'
      },
      {
        name: 'Bearing Capacity Factor Nγ (computed)',
        purpose: 'Soil self-weight bearing capacity factor accounting for the shear strength of the soil weight.',
        unit: 'dimensionless',
        meaning: 'The most approximate of the three factors. Terzaghi derived Nγ = (Nq - 1) × tan(1.4 × φ). Different researchers propose varying expressions.',
        range: '0 (φ = 0°) to over 100 (φ = 40°+). This factor varies significantly between different bearing capacity theories.',
        mistakes: 'Using Nγ from Hansen or Vesic methods without adjusting for the different inclination and depth factors that accompany those theories.'
      }
    ],
    calculationLogic: `The Terzaghi bearing capacity calculation proceeds in a systematic sequence. First, the friction angle φ in degrees is converted to radians for trigonometric computations. If φ = 0 (undrained clay condition), the bearing capacity factors are set directly: Nc = 5.7, Nq = 1.0, and Nγ = 0. This special case represents the pure cohesive soil condition where the bearing capacity equals 5.7 × su (undrained shear strength) plus the surcharge.

For φ > 0, the calculator computes Nq using the full Terzaghi expression. The formula involves calculating an exponential term a = exp[(0.75π - φ/2) × tan(φ)], then Nq = a² / [2 × cos²(45° + φ/2)]. Nc is then derived from Nq using Nc = (Nq - 1) / tan(φ). Nγ is approximated using the Terzaghi expression Nγ = (Nq - 1) × tan(1.4 × φ). These three factors are the coefficients that translate soil shear strength into bearing resistance.

The shape factors are computed from the footing width B and length L ratio. The cohesion shape factor sc = 1 + 0.3 × (B/L) accounts for the increased confinement at the ends of a rectangular footing. The soil-weight shape factor sγ = 1 - 0.2 × (B/L) reflects the reduced influence of soil weight in square footings. The surcharge shape factor sq is taken as 1.0 following Terzaghi's original formulation. The ultimate bearing capacity is then the sum of three terms: the cohesion term (c × Nc × sc), the surcharge term (γ × Df × Nq), and the soil-weight term (0.5 × γ × B × Nγ × sγ). Finally, the allowable bearing capacity is computed by dividing qult by the user-specified safety factor.`,
    formulas: [
      {
        name: 'Terzaghi Ultimate Bearing Capacity (General Shear)',
        equation: 'qult = c × Nc × sc + q × Nq + 0.5 × γ × B × Nγ × sγ',
        variables: [
          { symbol: 'qult', meaning: 'Ultimate bearing capacity of the soil beneath the footing', unit: 'kPa or psf' },
          { symbol: 'c', meaning: 'Soil cohesion intercept (undrained shear strength for φ = 0)', unit: 'kPa or psf' },
          { symbol: 'q', meaning: 'Surcharge pressure at footing base level = γ × Df', unit: 'kPa or psf' },
          { symbol: 'γ', meaning: 'Unit weight of soil (use submerged weight below water table)', unit: 'kN/m³ or lb/ft³' },
          { symbol: 'B', meaning: 'Width of the footing (shorter plan dimension)', unit: 'm or ft' },
          { symbol: 'Nc, Nq, Nγ', meaning: 'Bearing capacity factors dependent on friction angle φ', unit: 'dimensionless' },
          { symbol: 'sc, sγ', meaning: 'Shape correction factors for rectangular footings', unit: 'dimensionless' }
        ],
        reference: 'Terzaghi, K. (1943). Theoretical Soil Mechanics. John Wiley & Sons.'
      },
      {
        name: 'Bearing Capacity Factor Nq (Terzaghi)',
        equation: 'Nq = e(0.75π - φ/2)tan(φ) / [2 × cos²(45° + φ/2)]',
        variables: [
          { symbol: 'Nq', meaning: 'Surcharge bearing capacity factor', unit: 'dimensionless' },
          { symbol: 'φ', meaning: 'Effective friction angle of the soil', unit: 'degrees' },
          { symbol: 'e', meaning: 'Euler\'s number (base of natural logarithms)', unit: 'dimensionless' }
        ],
        reference: 'Terzaghi, K., Peck, R. B., & Mesri, G. (1996). Soil Mechanics in Engineering Practice. Wiley-Interscience.'
      },
      {
        name: 'Bearing Capacity Factor Nc (Terzaghi)',
        equation: 'Nc = (Nq - 1) / tan(φ)     (for φ > 0)     Nc = 5.7 (for φ = 0)',
        variables: [
          { symbol: 'Nc', meaning: 'Cohesion bearing capacity factor', unit: 'dimensionless' },
          { symbol: 'Nq', meaning: 'Surcharge bearing capacity factor', unit: 'dimensionless' },
          { symbol: 'φ', meaning: 'Effective friction angle of the soil', unit: 'degrees' }
        ],
        reference: 'Das, B. M. (2019). Principles of Foundation Engineering (9th ed.). Cengage Learning.'
      },
      {
        name: 'Bearing Capacity Factor Nγ (Terzaghi Approximation)',
        equation: 'Nγ = (Nq - 1) × tan(1.4 × φ)     (for φ > 0)     Nγ = 0 (for φ = 0)',
        variables: [
          { symbol: 'Nγ', meaning: 'Soil self-weight bearing capacity factor', unit: 'dimensionless' },
          { symbol: 'Nq', meaning: 'Surcharge bearing capacity factor', unit: 'dimensionless' },
          { symbol: 'φ', meaning: 'Effective friction angle of the soil', unit: 'degrees' }
        ],
        reference: 'Coduto, D. P. (2001). Foundation Design: Principles and Practices (2nd ed.). Prentice Hall.'
      },
      {
        name: 'Shape Factors for Rectangular Footings',
        equation: 'sc = 1 + 0.3(B/L)     sγ = 1 - 0.2(B/L)     sq = 1.0',
        variables: [
          { symbol: 'sc', meaning: 'Shape factor for the cohesion term', unit: 'dimensionless' },
          { symbol: 'sγ', meaning: 'Shape factor for the soil-weight term', unit: 'dimensionless' },
          { symbol: 'B', meaning: 'Footing width (shorter dimension)', unit: 'm or ft' },
          { symbol: 'L', meaning: 'Footing length (longer dimension)', unit: 'm or ft' }
        ],
        reference: 'Terzaghi, K. (1943). Theoretical Soil Mechanics. John Wiley & Sons.'
      }
    ],
    stepByStepExample: {
      scenario: 'A 2.0 m wide by 2.5 m long square footing is to be founded at a depth of 1.5 m below ground surface in a soil with cohesion of 15 kPa, friction angle of 32°, and unit weight of 18.5 kN/m³. The geotechnical engineer requires a safety factor of 3.0. Determine the ultimate and allowable bearing capacities.',
      given: {
        'Footing Width (B)': '2.0 m',
        'Footing Length (L)': '2.5 m',
        'Foundation Depth (Df)': '1.5 m',
        'Cohesion (c)': '15 kPa',
        'Friction Angle (φ)': '32°',
        'Unit Weight (γ)': '18.5 kN/m³',
        'Safety Factor (FS)': '3.0'
      },
      steps: [
        {
          title: 'Compute the surcharge pressure at footing base',
          explanation: 'q = γ × Df = 18.5 × 1.5 = 27.75 kPa. This overburden pressure contributes to bearing resistance through the Nq term and represents the confining pressure at footing base level.'
        },
        {
          title: 'Convert friction angle to radians and compute Nq',
          explanation: 'φ = 32° → φ_rad = 0.5585 rad. The exponential term a = exp[(0.75π - 0.5585/2) × tan(0.5585)]. 0.75π = 2.3562, so (2.3562 - 0.2793) = 2.0769. tan(0.5585) = 0.6249. a = exp(2.0769 × 0.6249) = exp(1.2978) = 3.6603. Nq = a² / [2 × cos²(45° + 32°/2)] = 13.398 / [2 × cos²(61°)] = 13.398 / [2 × 0.2351] = 13.398 / 0.4702 = 28.50.'
        },
        {
          title: 'Compute Nc and Nγ from Nq',
          explanation: 'Nc = (Nq - 1) / tan(φ) = (28.50 - 1) / 0.6249 = 27.50 / 0.6249 = 44.01. Nγ = (Nq - 1) × tan(1.4 × φ) = 27.50 × tan(44.8°) = 27.50 × 0.9957 = 27.38.'
        },
        {
          title: 'Compute shape factors',
          explanation: 'B/L = 2.0 / 2.5 = 0.80. sc = 1 + 0.3 × 0.80 = 1.240. sγ = 1 - 0.2 × 0.80 = 0.840. sq = 1.0 (Terzaghi default for surcharge term).'
        },
        {
          title: 'Compute ultimate bearing capacity',
          explanation: 'Cohesion term: 15 × 44.01 × 1.240 = 818.6 kPa. Surcharge term: 27.75 × 28.50 × 1.0 = 790.9 kPa. Soil-weight term: 0.5 × 18.5 × 2.0 × 27.38 × 0.840 = 425.6 kPa. qult = 818.6 + 790.9 + 425.6 = 2035.1 kPa.'
        },
        {
          title: 'Compute allowable bearing capacity',
          explanation: 'qallow = qult / FS = 2035.1 / 3.0 = 678.4 kPa. This is the maximum safe bearing pressure for the footing under the specified factor of safety. The design column load divided by the footing area must not exceed this value.'
        }
      ],
      finalAnswer: 'Ultimate bearing capacity qult = 2035.1 kPa. Allowable bearing capacity qallow = 678.4 kPa at FS = 3.0. The bearing capacity factors are Nc = 44.01, Nq = 28.50, and Nγ = 27.38. Shape factors sc = 1.240, sγ = 0.840. The cohesion term contributes 818.6 kPa (40.2%), surcharge contributes 790.9 kPa (38.9%), and soil-weight contributes 425.6 kPa (20.9%) of the total ultimate capacity.'
    },
    resultExplanation: `The ultimate bearing capacity qult is the theoretical maximum soil pressure that would cause a general shear failure beneath the footing. In the example above, qult = 2035.1 kPa represents the sum of three distinct resistance components. The cohesion term (cNcsc) is the largest contributor at 40.2% of the total, reflecting the significant cohesive strength of the soil. The surcharge term (qNq) at 38.9% demonstrates the important contribution of the overburden pressure at the footing base depth. The soil-weight term (0.5γBNγsγ) accounts for 20.9% of the capacity and would increase if the footing width B were larger.

The allowable bearing capacity qallow = 678.4 kPa is the design value used for footing sizing. When designing the footing, the applied column load plus the self-weight of the footing divided by the footing area must be less than or equal to qallow. For example, a column load of 2500 kN would require a minimum footing area of 2500 / 678.4 = 3.69 m². Since the trial footing area is 2.0 × 2.5 = 5.0 m², the design is acceptable with a bearing pressure of 2500 / 5.0 = 500 kPa, which is well below the allowable value.

The output also includes the individual bearing capacity factors Nc, Nq, and Nγ, which are intermediate values that experienced geotechnical engineers use to verify the reasonableness of the calculation. If these factors deviate significantly from expected ranges for the given friction angle, it indicates a potential error in the input parameters. The shape factors sc and sγ are also reported and confirm that the rectangular footing geometry has been properly accounted for in the calculation.`,
    commonErrors: [
      {
        error: 'Using total unit weight below the water table',
        cause: 'Neglecting to account for groundwater buoyancy when computing effective stress for the surcharge and soil-weight terms.',
        solution: 'Use the submerged unit weight γ\' = γsat - γw for soil below the water table. The water table reduces bearing capacity by decreasing the effective overburden pressure.'
      },
      {
        error: 'Applying shape factors for a strip footing incorrectly',
        cause: 'Setting L equal to B for a continuous strip footing, which applies square footing shape factors and overestimates bearing capacity.',
        solution: 'For strip footings where L >> B, use L = 10B or more to approximate strip conditions. The shape factors approach sc = 1.0 and sγ = 1.0 as B/L approaches zero.'
      },
      {
        error: 'Confusing effective stress with total stress parameters',
        cause: 'Using c\' and φ\' (effective stress parameters) with total unit weight γ, or using cu (undrained shear strength) with drained friction angle.',
        solution: 'For short-term loading in clays, use undrained parameters (cu, φu = 0) with total unit weight. For long-term conditions, use effective stress parameters (c\', φ\') with appropriate unit weights.'
      },
      {
        error: 'Entering the column or pier dimension instead of the footing dimension',
        cause: 'The footing width B is the width of the concrete footing, not the width of the column or pier it supports. Using the smaller column dimension underestimates bearing capacity.',
        solution: 'Verify that the entered B and L values are the footing plan dimensions. The column size is always smaller than the footing size.'
      },
      {
        error: 'Using an inappropriate safety factor',
        cause: 'Applying a safety factor of 2.0 or lower for routine foundation design, which does not provide adequate margin for soil variability and construction tolerances.',
        solution: 'Use FS = 3.0 for general bearing capacity design. Lower factors (2.0-2.5) may be used only with extensive site-specific soil testing and careful construction control.'
      },
      {
        error: 'Ignoring the effect of footing embedment on the failure mechanism',
        cause: 'Treating shallow foundations with Df/B ratios near 1.0 using Terzaghi\'s theory, which assumes Df ≤ B. Deeper footings have different failure mechanisms.',
        solution: 'For Df/B > 1.0, consider using deep foundation analysis methods or bearing capacity theories that account for depth effects (Meyerhof, Hansen methods).'
      },
      {
        error: 'Using peak friction angle for loose sands',
        cause: 'Loose sands may exhibit strain-softening behavior where the peak friction angle is mobilized at large strains that exceed acceptable foundation settlement limits.',
        solution: 'Use the critical state friction angle φcv for loose sands, or apply a reduced friction angle that accounts for the strain level corresponding to tolerable foundation settlement.'
      },
      {
        error: 'Neglecting eccentric loading effects',
        cause: 'The Terzaghi equation assumes concentric vertical loading. Eccentric loads produce non-uniform bearing pressures and reduce the effective bearing area.',
        solution: 'For eccentric loads, compute the effective footing dimensions (B\', L\') using the Meyerhof method and use these reduced dimensions in the bearing capacity equation.'
      },
      {
        error: 'Using the wrong Nγ formula for the selected bearing capacity theory',
        cause: 'Different researchers (Terzaghi, Meyerhof, Hansen, Vesic) propose different Nγ expressions. Mixing Nγ from one theory with Nc, Nq from another gives inconsistent results.',
        solution: 'Use the Nγ formula that is consistent with Terzaghi\'s original theory: Nγ = (Nq - 1) × tan(1.4φ). All three factors Nc, Nq, Nγ must come from the same theory.'
      },
      {
        error: 'Applying the cohesion term for cohesionless soils',
        cause: 'Entering a nonzero cohesion value for clean sands or gravels, which artificially inflates the bearing capacity through the cNc term.',
        solution: 'For granular soils (sands, gravels), set cohesion c = 0 unless the soil has significant cementation or clay binder that provides true cohesion.'
      },
      {
        error: 'Misinterpreting footing depth Df as excavation depth',
        cause: 'The foundation depth Df is measured from the ground surface to the base of the footing, not the depth of the excavation which may include working space or temporary slopes.',
        solution: 'Measure Df vertically from the lowest adjacent ground surface to the footing base elevation. For basements, use the basement floor elevation as the ground surface.'
      },
      {
        error: 'Using the Terzaghi equation for layered soil profiles',
        cause: 'The Terzaghi equation assumes a homogeneous soil profile. Stratified soils with different strength parameters in each layer violate this assumption.',
        solution: 'For layered soils, use a weighted average approach or employ numerical methods that account for failure surfaces passing through multiple soil layers.'
      },
      {
        error: 'Neglecting groundwater effects on the soil-weight term',
        cause: 'When the water table is above the footing base, the submerged unit weight must be used for the γBNγ term, not the total unit weight.',
        solution: 'If the water table is within B below the footing base, use the submerged unit weight for the soil below the water table. The surcharge term should also use the appropriate unit weight above the water table.'
      },
      {
        error: 'Using Terzaghi for foundations on slopes or near excavations',
        cause: 'Terzaghi\'s theory assumes a horizontal ground surface extending infinitely. Foundations near slopes or excavations have reduced bearing capacity due to the lack of confining soil on one side.',
        solution: 'For foundations near slopes, use bearing capacity theories that incorporate slope geometry, or perform a slope stability analysis that accounts for the foundation load.'
      },
      {
        error: 'Forgetting to include the footing self-weight in the applied load',
        cause: 'The bearing pressure check compares the total applied load (column load + footing weight + soil on footing) to the allowable bearing capacity, not just the column load.',
        solution: 'Estimate the footing weight (concrete unit weight × footing volume) and add it to the column load before comparing with qallow. Typically footing weight is 5-10% of the total load.'
      },
      {
        error: 'Applying the Terzaghi equation for very wide footings (B > 6 m)',
        cause: 'Very wide footings may experience the failure of deeper, possibly weaker soil layers that are not represented by the soil parameters entered for the near-surface soil.',
        solution: 'For wide footings, check the bearing capacity of deeper soil layers using the 2:1 stress distribution method to estimate the stress at depth, and verify that the deeper soil can support it.'
      },
      {
        error: 'Using phi = 0 analysis for partially saturated clays',
        cause: 'Partially saturated clays have apparent cohesion from matric suction, but the φ = 0 assumption is technically valid only for fully saturated undrained conditions.',
        solution: 'Use effective stress parameters with appropriate suction-based cohesion for unsaturated conditions, or saturate the sample for standard undrained testing.'
      },
      {
        error: 'Misreading the B/L ratio direction for shape factor application',
        cause: 'Using B as the longer dimension and L as the shorter dimension, which inverts the B/L ratio and produces incorrect shape factors.',
        solution: 'By convention, B is always the shorter plan dimension of the footing and L is the longer dimension. B/L is always less than or equal to 1.0.'
      },
      {
        error: 'Assuming the Terzaghi equation applies to all failure modes',
        cause: 'The Terzaghi equation computes general shear failure capacity. Dense soils may fail in general shear, while loose soils or very wide footings may fail in punching or local shear.',
        solution: 'For loose sands and soft clays where local or punching shear is expected, use the modified Terzaghi equations with reduced strength parameters (c* = 2c/3, φ* = arctan(2tanφ/3)).'
      },
      {
        error: 'Using inconsistent unit systems between parameters',
        cause: 'Entering some parameters in metric units and others in imperial units within the same calculation, producing numerically incorrect results.',
        solution: 'Ensure all input parameters use the same unit system. The calculator provides separate metric and imperial modes. Verify that cohesion, unit weight, and dimensions all match the selected system.'
      }
    ],
    bestPractices: [
      'Obtain soil strength parameters (c, φ) from high-quality laboratory testing on undisturbed samples, supplemented by in-situ SPT or CPT correlations.',
      'Use the submerged unit weight for soil below the water table and check the seasonal high groundwater level when determining bearing capacity.',
      'Apply a minimum safety factor of 3.0 for bearing capacity unless site-specific conditions justify a lower value with rigorous quality control.',
      'Always verify the footing bearing pressure against both the allowable bearing capacity (shear failure) and allowable settlement limits.',
      'Perform sensitivity analysis by varying the friction angle by ±2° to understand the impact on computed bearing capacity for design decision-making.',
      'Document the source of all soil parameters including test type (UU, CU, CD triaxial, direct shear) and the specific laboratory or correlation method used.',
      'Check bearing capacity for both short-term (undrained, φ = 0) and long-term (drained, c\', φ\') conditions and use the lower of the two allowable values.',
      'For foundations on clay, verify that the computed bearing capacity satisfies both the undrained (immediate) and drained (consolidated) loading conditions.',
      'Use the correct unit system consistently — the calculator supports both metric (kN/m³, kPa) and imperial (lb/ft³, psf) units; do not mix systems.',
      'Consider the effect of nearby foundations that may create overlapping stress zones and reduce the bearing capacity of individual footings.',
      'Verify that the footing width B used in the Terzaghi equation does not exceed the effective width after accounting for any load eccentricity.',
      'Include the footing self-weight and any backfill soil weight when comparing applied loads to the allowable bearing capacity.',
      'Consult with a geotechnical engineer for projects involving unusual soil conditions, high groundwater, or foundations near slopes.',
      'Use the computed Nc, Nq, and Nγ factors to verify calculation reasonableness — these should be consistent with published Terzaghi factor tables.',
      'Perform a settlement analysis separately from bearing capacity — a footing may satisfy bearing capacity but experience excessive total or differential settlement.'
    ],
    designCodes: [
      {
        code: 'ACI 318-19',
        description: 'Building Code Requirements for Structural Concrete, Chapter 13 references bearing capacity for footing design and requires that factored base pressures do not exceed the nominal bearing resistance per geotechnical recommendations.'
      },
      {
        code: 'ASCE/SEI 7-22',
        description: 'Minimum Design Loads and Associated Criteria for Buildings, providing load combinations for foundation design that determine the factored loads applied to the bearing capacity calculation.'
      },
      {
        code: 'IBC 2024',
        description: 'International Building Code, Chapter 18 — Soils and Foundations, specifying minimum requirements for geotechnical investigations and allowable bearing pressures for foundation design.'
      },
      {
        code: 'EN 1997-1 (Eurocode 7)',
        description: 'Geotechnical Design — General Rules, providing the limit state design framework for bearing capacity with partial factors applied to soil parameters and loads rather than global safety factors.'
      },
      {
        code: 'IS 6403:1981',
        description: 'Indian Standard Code of Practice for Determination of Bearing Capacity of Shallow Foundations, specifying the use of Terzaghi\'s method with Indian practice modifications.'
      },
      {
        code: 'BS 8004:2015',
        description: 'Code of Practice for Foundations, providing British practice guidance for bearing capacity calculations including partial factor methods consistent with Eurocode 7.'
      }
    ],
    faqs: [
      {
        question: 'What is the difference between ultimate and allowable bearing capacity?',
        answer: 'Ultimate bearing capacity (qult) is the theoretical maximum pressure that causes shear failure in the soil. Allowable bearing capacity (qallow) is qult divided by a safety factor, representing the safe design pressure that prevents failure with adequate margin.'
      },
      {
        question: 'Why does the Terzaghi equation have three separate terms?',
        answer: 'Each term represents a distinct source of shear resistance: the cohesion term (cNcsc) from soil cohesive strength, the surcharge term (qNq) from overburden pressure at footing depth, and the soil-weight term (0.5γBNγsγ) from the self-weight of the failure zone soil.'
      },
      {
        question: 'What is the typical safety factor for bearing capacity calculations?',
        answer: 'A factor of safety of 3.0 is standard for bearing capacity design. This accounts for uncertainties in soil parameters, load estimation, construction quality, and the simplified failure mechanism assumed in the theory.'
      },
      {
        question: 'How does groundwater affect bearing capacity?',
        answer: 'Groundwater reduces bearing capacity because the submerged unit weight (γ\' = γsat - γw) is less than the total unit weight. This reduces both the surcharge term and the soil-weight term. A water table at footing base level can reduce capacity by 20-40%.'
      },
      {
        question: 'What are the shape factors used for?',
        answer: 'Shape factors adjust the bearing capacity for rectangular footings where the length-to-width ratio affects the confinement and failure geometry. The cohesion factor sc increases with B/L, while the soil-weight factor sγ decreases with B/L.'
      },
      {
        question: 'Can I use this calculator for deep foundations (piles, caissons)?',
        answer: 'No. The Terzaghi equation assumes shallow foundation conditions where Df ≤ B. Deep foundations involve different failure mechanisms (end bearing, skin friction) and require different analytical methods.'
      },
      {
        question: 'What is the significance of the friction angle φ in bearing capacity?',
        answer: 'The friction angle is the most influential soil parameter in the Terzaghi equation. Small increases in φ produce large increases in Nc, Nq, and Nγ. A 2° change in φ can alter the computed bearing capacity by 20-40%.'
      },
      {
        question: 'How do I determine the correct soil cohesion value?',
        answer: 'Cohesion is determined from laboratory triaxial tests (UU, CU, or CD tests) or from in-situ tests using empirical correlations. For clays, undrained shear strength su is used as cohesion with φ = 0 for short-term analysis.'
      },
      {
        question: 'What is the difference between Terzaghi, Meyerhof, and Hansen methods?',
        answer: 'They are different bearing capacity theories that use the same general equation form but differ in the Nγ expression, shape factors, depth factors, and inclination factors. Terzaghi is the most conservative for most conditions.'
      },
      {
        question: 'How does footing width B affect bearing capacity?',
        answer: 'Footing width B directly influences the soil-weight term (0.5γBNγsγ). Wider footings have higher bearing capacity from this term but also experience larger stress bulbs that may mobilize weaker deeper soil layers.'
      },
      {
        question: 'Why is Nγ zero when φ = 0?',
        answer: 'When φ = 0 (undrained clay), the soil has no frictional component, and the soil-weight term theoretically contributes nothing to bearing capacity. The cohesion term (c × Nc) dominates, with Nc = 5.7.'
      },
      {
        question: 'What are the limitations of Terzaghi\'s bearing capacity theory?',
        answer: 'The theory assumes homogeneous soil, horizontal ground surface, concentric vertical loading, general shear failure, and a rough footing base. It does not account for soil compressibility, layered soils, inclined loads, or eccentricity.'
      },
      {
        question: 'How do I handle inclined or eccentric loads on footings?',
        answer: 'For inclined loads, reduce the bearing capacity using inclination factors (available in Meyerhof or Hansen methods). For eccentric loads, reduce the effective footing dimensions (B\', L\') using the Meyerhof method.'
      },
      {
        question: 'What is the relationship between SPT N-values and friction angle?',
        answer: 'Empirical correlations exist between SPT N-values and friction angle for sands. Common relationships include φ = 27° + 0.3N (Peck) and φ = (20N)^0.5 + 15° (Kulhawy). These provide preliminary estimates when laboratory data is unavailable.'
      },
      {
        question: 'Can I use this calculator for square footings?',
        answer: 'Yes. For square footings, enter B = L and the shape factors automatically adjust: sc = 1.3 and sγ = 0.8. Square footings have the highest shape factor correction for the cohesion term.'
      },
      {
        question: 'How does foundation depth Df affect bearing capacity?',
        answer: 'Deeper foundations have higher bearing capacity because the surcharge pressure q = γDf increases. However, the Terzaghi equation is only valid for Df ≤ B. Beyond this, deep foundation methods should be used.'
      },
      {
        question: 'What is local shear failure and how does it differ from general shear?',
        answer: 'Local shear failure occurs in loose or soft soils where failure surfaces do not extend to the ground surface. Terzaghi recommended using reduced strength parameters (c* = 2c/3, φ* = tan⁻¹(2tanφ/3)) for local shear conditions.'
      },
      {
        question: 'How do I account for layered soil profiles?',
        answer: 'For layered soils, compute the bearing capacity for each potential failure surface depth or use the weighted average method. Alternatively, use numerical methods like finite element analysis for complex stratigraphy.'
      },
      {
        question: 'What is the minimum footing dimensions for this calculator?',
        answer: 'There is no strict minimum size, but the Terzaghi theory assumes continuum mechanics that may not apply for very small footings (B < 0.3 m). For practical engineering, footings smaller than 0.5 m width are uncommon.'
      },
      {
        question: 'How is settlement related to bearing capacity?',
        answer: 'Bearing capacity addresses shear failure, not settlement. A footing can satisfy bearing capacity requirements but still experience excessive settlement. Always perform a separate settlement analysis using elastic theory or consolidation theory.'
      },
      {
        question: 'What unit weight should I use for soil above the water table?',
        answer: 'Use the total (bulk) unit weight γ for soil above the water table. For soil below the water table, use the submerged unit weight γ\' = γsat - γw = γsat - 9.81 kN/m³. The calculator does not correct for this automatically.'
      }
    ],
    relatedCalculators: [
      { name: 'Cantilever Retaining Wall Lateral Force', url: '/geotechnical/retaining-wall' },
      { name: 'Concrete Volume Estimator', url: '/concrete/volume' },
      { name: 'Short Concrete Column Design', url: '/structural/column' },
      { name: 'Slab Deflection Estimator', url: '/structural/slab' },
      { name: 'Engineering Unit Converter', url: '/utilities/unit-converter' },
      { name: 'Beam Uniform/Point Load Analyst', url: '/structural/beam' },
      { name: 'Steel Section Weight Estimator', url: '/structural/steel-weight' }
    ],
    references: [
      'Terzaghi, K. (1943). Theoretical Soil Mechanics. John Wiley & Sons. ISBN 978-0471853053.',
      'Terzaghi, K., Peck, R. B., & Mesri, G. (1996). Soil Mechanics in Engineering Practice (3rd ed.). Wiley-Interscience. ISBN 978-0471086581.',
      'Das, B. M. (2019). Principles of Foundation Engineering (9th ed.). Cengage Learning. ISBN 978-1337705028.',
      'Coduto, D. P. (2001). Foundation Design: Principles and Practices (2nd ed.). Prentice Hall. ISBN 978-0135897065.',
      'Bowles, J. E. (1996). Foundation Analysis and Design (5th ed.). McGraw-Hill. ISBN 978-0079122470.',
      'Peck, R. B., Hanson, W. E., & Thornburn, T. H. (1974). Foundation Engineering (2nd ed.). John Wiley & Sons. ISBN 978-0471675853.',
      'American Society of Civil Engineers. (2022). ASCE/SEI 7-22 Minimum Design Loads and Associated Criteria for Buildings. ISBN 978-0784415142.'
    ]
  };
}
