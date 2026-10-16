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
};
