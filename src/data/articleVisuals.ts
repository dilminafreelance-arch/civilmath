export interface ArticleCoverImage {
  url: string;
  alt: string;
  caption: string;
}

const TOPIC_IMAGES: Record<string, ArticleCoverImage> = {
  'concrete-volume': {
    url: 'https://images.unsplash.com/photo-1541888946425-d0fbb18615f3?auto=format&fit=crop&w=1200&q=80',
    alt: 'Concrete pouring and slab placement on construction site',
    caption: 'Ready-mix concrete placement and compaction on an elevated building slab.',
  },
  'rebar-calculator': {
    url: 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=1200&q=80',
    alt: 'Reinforcing steel rebar grid and tied lap splices',
    caption: 'Deformed high-yield steel reinforcement grid prepared for foundation concreting.',
  },
  'brick-calculator': {
    url: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=1200&q=80',
    alt: 'Brick masonry wall construction with mortar joints',
    caption: 'Standard modular clay brick laying with consistent 10 mm mortar joints.',
  },
  'structural-beam': {
    url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80',
    alt: 'Structural beam framing and construction skeleton',
    caption: 'Heavy structural beam and girder frame under flexural loading.',
  },
  'structural-column': {
    url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
    alt: 'Reinforced concrete columns with steel cages and formwork',
    caption: 'Tied vertical rebar column cages with confining lateral ties.',
  },
  'structural-slab': {
    url: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1200&q=80',
    alt: 'Floor slab reinforcement mesh and electrical conduits',
    caption: 'Two-way reinforced concrete floor slab detailing ready for inspection.',
  },
  'steel-calculator': {
    url: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=1200&q=80',
    alt: 'Structural steel I-beams and wide flange profiles in warehouse',
    caption: 'Universal structural steel sections, channels, and angles awaiting erection.',
  },
  'survey-hi': {
    url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80',
    alt: 'Surveyor using optical leveling instrument on tripod',
    caption: 'Differential leveling survey establishing height of instrument (HI) benchmark.',
  },
  'survey-coordinate': {
    url: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=1200&q=80',
    alt: 'Total station surveying instrument and prism target on field site',
    caption: 'Closed traverse network measurement using precision total station EDM.',
  },
  'geotech-bearing': {
    url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=1200&q=80',
    alt: 'Excavation pit for foundation bearing capacity testing',
    caption: 'Subsoil geotechnical investigation and plate load bearing evaluation.',
  },
  'geotech-retaining': {
    url: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=1200&q=80',
    alt: 'Cantilever reinforced concrete retaining wall construction and soil backfill',
    caption: 'Earth retention structure designed to resist lateral active soil pressures.',
  },
  'utility-convert': {
    url: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80',
    alt: 'Civil engineering drawings, architectural blueprints and scale ruler',
    caption: 'Engineering drawing dimensional verification and unit conversion reference.',
  },
  'bbs-footing': {
    url: 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=1200&q=80',
    alt: 'Isolated footing rebar mat with 90 degree hook bends',
    caption: 'Isolated pad footing reinforcement cage with column starter dowels.',
  },
  'bbs-combined-footing': {
    url: 'https://images.unsplash.com/photo-1541888946425-d0fbb18615f3?auto=format&fit=crop&w=1200&q=80',
    alt: 'Dual column combined foundation steel cage detailing',
    caption: 'Longitudinal and transverse steel rebar layout for combined footings.',
  },
  'bbs-strip-footing': {
    url: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=1200&q=80',
    alt: 'Continuous strip footing excavation and steel rebar cages',
    caption: 'Continuous wall foundation reinforcement ensuring longitudinal distribution.',
  },
  'bbs-raft-foundation': {
    url: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1200&q=80',
    alt: 'Heavy mat foundation dual rebar grid and chair spacers',
    caption: 'Multi-layer raft foundation rebar cage supported by high-load steel chairs.',
  },
  'bbs-beam': {
    url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80',
    alt: 'Continuous concrete beam rebar cage with vertical stirrups',
    caption: 'Longitudinal main steel and closed shear stirrups in a reinforced concrete beam.',
  },
  'bbs-plinth-beam': {
    url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
    alt: 'Ground plinth beam reinforcement tied above foundation level',
    caption: 'Tie beam reinforcement preventing differential settlement at plinth level.',
  },
  'bbs-tie-beam': {
    url: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=1200&q=80',
    alt: 'Foundation tie beam linking isolated column footings',
    caption: 'Grade tie beams providing lateral restraint between adjacent foundation footings.',
  },
  'bbs-lintel-beam': {
    url: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=1200&q=80',
    alt: 'Lintel beam reinforcement above masonry window opening',
    caption: 'Precast and cast-in-place lintel detailing spanning masonry openings.',
  },
  'bbs-column': {
    url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
    alt: 'Vertical column rebar cage with seismic rectangular tie hoops',
    caption: 'RCC column longitudinal bars with cranked lap splices and seismic links.',
  },
  'bbs-pedestal': {
    url: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=1200&q=80',
    alt: 'Steel column base plate pedestal with anchor bolt cages',
    caption: 'Short pedestal concrete cap with heavy tie reinforcement under anchor bolts.',
  },
  'bbs-slab': {
    url: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1200&q=80',
    alt: 'Floor slab bottom and top rebar mats with bent-up crank bars',
    caption: 'Cranked main rebar and distribution steel laid out across a floor slab panel.',
  },
  'bbs-staircase': {
    url: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80',
    alt: 'Dog-legged reinforced concrete staircase waist slab rebar',
    caption: 'Inclined waist slab reinforcement continuous into landing slabs with correct anchorage.',
  },
  'bbs-retaining-wall': {
    url: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=1200&q=80',
    alt: 'Retaining wall vertical stem reinforcement and foundation dowels',
    caption: 'Cantilever wall vertical tension steel and horizontal temperature reinforcement.',
  },
  'bbs-foundation-mesh': {
    url: 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=1200&q=80',
    alt: 'Welded wire mesh reinforcement for ground slab blinding',
    caption: 'Square welded wire fabric (BRC mesh) laid over moisture barrier for slab-on-grade.',
  },
};

export const CATEGORY_DEFAULT_IMAGES: Record<string, ArticleCoverImage> = {
  concrete: {
    url: 'https://images.unsplash.com/photo-1541888946425-d0fbb18615f3?auto=format&fit=crop&w=1200&q=80',
    alt: 'Concrete and materials engineering site work',
    caption: 'Concrete material quality testing and placement on civil works.',
  },
  structural: {
    url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80',
    alt: 'Structural engineering frame under construction',
    caption: 'Structural framing analysis, member sizing, and deflection evaluation.',
  },
  bbs: {
    url: 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=1200&q=80',
    alt: 'Reinforced concrete steel fabrication and bending schedule',
    caption: 'Bar bending schedule estimation and rebar detailing for reinforced concrete.',
  },
  survey: {
    url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80',
    alt: 'Topographic land survey using optical level and total station',
    caption: 'Precision land surveying, differential leveling, and coordinate calculations.',
  },
  geotech: {
    url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=1200&q=80',
    alt: 'Geotechnical soil investigation and retaining wall excavation',
    caption: 'Subsoil bearing capacity evaluation and lateral earth pressure calculations.',
  },
  utility: {
    url: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80',
    alt: 'Civil engineering drawings and unit conversions',
    caption: 'Standard construction conversions and structural material properties.',
  },
  general: {
    url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80',
    alt: 'Civil engineering project infrastructure',
    caption: 'Civil engineering best practices and site calculation methodology.',
  },
};

export function getArticleCoverImage(slug: string, category: string = 'general', customCoverImage?: string): ArticleCoverImage {
  if (customCoverImage && customCoverImage.trim()) {
    return {
      url: customCoverImage.trim(),
      alt: `${slug.replace(/[-_]/g, ' ')} technical engineering illustration`,
      caption: 'Illustration: Article reference visual diagram',
    };
  }
  const normSlug = slug ? slug.toLowerCase().trim() : '';
  if (normSlug && TOPIC_IMAGES[normSlug]) {
    return TOPIC_IMAGES[normSlug];
  }
  const normCat = (category || 'general').toLowerCase().trim();
  return CATEGORY_DEFAULT_IMAGES[normCat] || CATEGORY_DEFAULT_IMAGES.general;
}
