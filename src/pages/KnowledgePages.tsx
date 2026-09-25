import { Link, useParams } from 'react-router-dom';
import { SEO, getRouteSEO, SITE_URL, DEFAULT_IMAGE } from '../utils/seo';
import { FORMULAS, GUIDES, REFERENCE_TABLES } from '../data/knowledgeBase';

const container = 'max-w-4xl mx-auto space-y-6 text-[#161A2C] dark:text-[#E7EAF7]';
const card = 'block backdrop-blur-xl backdrop-saturate-150 bg-[#F7F9FF]/70 dark:bg-[#141826]/70 border border-[#DCE3F5] dark:border-[#2A3350] rounded-2xl p-5 no-underline hover:border-[#4C5FE0] transition-colors shadow-2xs';

function Crumbs({ label }: { label: string }) {
  return (
    <nav aria-label="Breadcrumb" className="text-xs text-[#7C88B8]">
      <Link to="/" className="text-[#4C5FE0] no-underline hover:underline">Home</Link>
      <span aria-hidden="true" className="mx-1.5 text-[#DCE3F5]">/</span>
      <span className="font-semibold text-[#161A2C] dark:text-[#E7EAF7]">{label}</span>
    </nav>
  );
}

export function GuidesPage() {
  const seo = getRouteSEO('/guides');
  return (
    <main className={container}>
      <SEO
        title={seo?.title || 'Civil Engineering Calculation Guides & How-Tos | CivilMath'}
        description={seo?.description || 'Practical step-by-step calculation guides and reference tutorials for concrete volume, rebar weight formulas, brickwork estimating, and traverse surveying.'}
        canonicalUrl={`${SITE_URL}/guides`}
        keywords={seo?.keywords}
        ogImage={DEFAULT_IMAGE}
        type="website"
        breadcrumbs={[{ name: 'Home', url: '/' }, { name: 'Guides', url: '/guides' }]}
      />
      <Crumbs label="Guides" />
      <header>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Civil Engineering Calculation Guides</h1>
        <p className="mt-2">Short, practical explanations for common construction and engineering calculations. Check project drawings and applicable requirements before using any estimate for construction.</p>
      </header>
      <section className="grid gap-4">
        {GUIDES.map(guide => (
          <Link key={guide.slug} to={`/guides/${guide.slug}`} className={card}>
            <h2 className="font-bold text-slate-900 dark:text-white">{guide.title}</h2>
            <p className="mt-1 text-sm">{guide.description}</p>
          </Link>
        ))}
      </section>
    </main>
  );
}

export function GuidePage() {
  const { slug } = useParams();
  const guide = GUIDES.find(item => item.slug === slug);
  if (!guide) return <GuidesPage />;
  const path = `/guides/${guide.slug}`;
  const seo = getRouteSEO(path);

  const guideTitle = seo?.title || `${guide.title} | CivilMath Guide`;
  const guideDesc = seo?.description || guide.description;

  return (
    <main className={container}>
      <SEO
        title={guideTitle}
        description={guideDesc}
        canonicalUrl={`${SITE_URL}${path}`}
        keywords={seo?.keywords}
        ogImage={DEFAULT_IMAGE}
        type="article"
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Guides', url: '/guides' },
          { name: guide.title, url: path },
        ]}
        schema={{
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: guide.title,
          description: guideDesc,
          mainEntityOfPage: `${SITE_URL}${path}`,
        }}
      />
      <Crumbs label={guide.title} />
      <article className="space-y-5">
        <header>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{guide.title}</h1>
          <p className="mt-2">{guide.description}</p>
        </header>
        {guide.formula && (
          <section className={card}>
            <h2 className="font-bold text-slate-900 dark:text-white">Formula</h2>
            <p className="mt-2 font-mono text-lg">{guide.formula}</p>
          </section>
        )}
        <section className={card}>
          <h2 className="font-bold text-slate-900 dark:text-white">Method and assumptions</h2>
          <p className="mt-2 text-sm leading-6">{guide.summary}</p>
        </section>
        <section className={card}>
          <h2 className="font-bold text-slate-900 dark:text-white">Use the related tool</h2>
          <Link to={guide.calculator.url} className="mt-2 inline-block text-blue-600 font-semibold no-underline hover:underline">
            {guide.calculator.label} →
          </Link>
        </section>
        <p className="text-xs leading-5">
          Educational and planning information only. Verify final design, quantities and construction decisions with a qualified professional and the applicable project documents.
        </p>
      </article>
    </main>
  );
}

export function FormulasPage() {
  const seo = getRouteSEO('/formulas');
  return (
    <main className={container}>
      <SEO
        title={seo?.title || 'Civil Engineering Formulas & Calculation Library | CivilMath'}
        description={seo?.description || 'Quick reference library of civil, structural, geotechnical, and surveying engineering equations and mathematical formulas with interactive tools on CivilMath.'}
        canonicalUrl={`${SITE_URL}/formulas`}
        keywords={seo?.keywords}
        ogImage={DEFAULT_IMAGE}
        type="website"
        breadcrumbs={[{ name: 'Home', url: '/' }, { name: 'Formulas', url: '/formulas' }]}
      />
      <Crumbs label="Formulas" />
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Civil Engineering Formulas</h1>
      <p>These formulas explain calculator concepts. Units and applicability must be checked for the project.</p>
      <div className="grid gap-3">
        {FORMULAS.map(item => (
          <section key={item.name} className={card}>
            <h2 className="font-bold text-slate-900 dark:text-white">{item.name}</h2>
            <p className="font-mono mt-2">{item.equation}</p>
            <p className="text-sm mt-2">{item.meaning}</p>
            <Link to={item.calculator} className="text-sm text-blue-600 font-semibold no-underline hover:underline mt-2 inline-block">
              Open related calculator →
            </Link>
          </section>
        ))}
      </div>
    </main>
  );
}

export function TablesPage() {
  const seo = getRouteSEO('/tables');
  return (
    <main className={container}>
      <SEO
        title={seo?.title || 'Civil Engineering Reference Tables & Converters | CivilMath'}
        description={seo?.description || 'Comprehensive engineering reference tables for unit conversion factors, rebar cross-sectional areas, standard hook lengths, and concrete density ratings.'}
        canonicalUrl={`${SITE_URL}/tables`}
        keywords={seo?.keywords}
        ogImage={DEFAULT_IMAGE}
        type="website"
        breadcrumbs={[{ name: 'Home', url: '/' }, { name: 'Reference Tables', url: '/tables' }]}
      />
      <Crumbs label="Reference Tables" />
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Construction Reference Tables</h1>
      <p>Exact mathematical unit conversions for quick reference.</p>
      {REFERENCE_TABLES.map(table => (
        <section key={table.name} className={card}>
          <h2 className="font-bold text-slate-900 dark:text-white">{table.name}</h2>
          <table className="w-full mt-3 text-sm">
            <tbody>
              {table.rows.map(row => (
                <tr key={row[0]} className="border-t border-slate-200 dark:border-slate-800">
                  <th scope="row" className="text-left py-2">{row[0]}</th>
                  <td>{row[1]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </main>
  );
}
