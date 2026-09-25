import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AppProvider } from './context/AppContext';
import { ProjectProvider } from './context/ProjectContext';
import AppLayout from './components/AppLayout';
import CategoryPageTemplate from './components/CategoryPageTemplate';
import PremiumHomePage from './pages/PremiumHomePage';
import CalculatorsDirectoryPage from './pages/CalculatorsDirectoryPage';
import FAQPage from './pages/FAQPage';
import BBSCategoryPage from './pages/BBSCategoryPage';
import DashboardPage from './pages/DashboardPage';
import StaticPage from './pages/StaticPage';
import { FormulasPage, GuidePage, GuidesPage, TablesPage } from './pages/KnowledgePages';
import { trackPageView } from './utils/analytics';
import { SEOHead } from './utils/seo';

// Lazy-loaded calculator pages for code splitting
const ConcreteVolumePage = lazy(() => import('./pages/calculators/ConcreteVolumePage'));
const RebarCalculatorPage = lazy(() => import('./pages/calculators/RebarCalculatorPage'));
const BrickCalculatorPage = lazy(() => import('./pages/calculators/BrickCalculatorPage'));
const BeamAnalysisPage = lazy(() => import('./pages/calculators/BeamAnalysisPage'));
const ColumnDesignPage = lazy(() => import('./pages/calculators/ColumnDesignPage'));
const SlabDeflectionPage = lazy(() => import('./pages/calculators/SlabDeflectionPage'));
const SteelWeightPage = lazy(() => import('./pages/calculators/SteelWeightPage'));
const HeightOfInstrumentPage = lazy(() => import('./pages/calculators/HeightOfInstrumentPage'));
const CoordinateTraversePage = lazy(() => import('./pages/calculators/CoordinateTraversePage'));
const BearingCapacityPage = lazy(() => import('./pages/calculators/BearingCapacityPage'));
const RetainingWallPage = lazy(() => import('./pages/calculators/RetainingWallPage'));
const UnitConverterPage = lazy(() => import('./pages/calculators/UnitConverterPage'));
const BBSCalculatorPage = lazy(() => import('./pages/BBSCalculatorPage'));
const BOQBuilderPage = lazy(() => import('./boq/BOQBuilderPage'));
const ArticlesDirectoryPage = lazy(() => import('./pages/ArticlesDirectoryPage'));
const ArticleDetailPage = lazy(() => import('./pages/ArticleDetailPage'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminArticleEditor = lazy(() => import('./pages/admin/AdminArticleEditor'));

function SuspenseFallback() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center space-y-3">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-[10px] font-mono text-ink-muted dark:text-ink-muted-dark">Loading workspace...</p>
      </div>
    </div>
  );
}

function AnalyticsTracker() {
  const location = useLocation();
  useEffect(() => {
    trackPageView(`civilmath${location.pathname}`);
  }, [location.pathname]);
  return null;
}

export default function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <AppProvider>
          <ProjectProvider>
            <AnalyticsTracker />
            <Routes>
              {/* ── Admin Content Management Studio (Dedicated Standalone Layout) ── */}
              <Route path="/admin" element={<Suspense fallback={<SuspenseFallback />}><AdminDashboard /></Suspense>} />
              <Route path="/admin/articles" element={<Suspense fallback={<SuspenseFallback />}><AdminDashboard /></Suspense>} />
              <Route path="/admin/articles/new" element={<Suspense fallback={<SuspenseFallback />}><AdminArticleEditor /></Suspense>} />
              <Route path="/admin/articles/edit/:slug" element={<Suspense fallback={<SuspenseFallback />}><AdminArticleEditor /></Suspense>} />

              {/* ── Unified Architectural Studio AppLayout Shell ── */}
              <Route element={<AppLayout />}>
                <Route path="/" element={<PremiumHomePage />} />

              {/* BBS Category */}
              <Route path="/bbs" element={<BBSCategoryPage />} />

              {/* BBS Structure Pages */}
              <Route path="/bbs/footing" element={<Suspense fallback={<SuspenseFallback />}><BBSCalculatorPage /></Suspense>} />
              <Route path="/bbs/combined-footing" element={<Suspense fallback={<SuspenseFallback />}><BBSCalculatorPage /></Suspense>} />
              <Route path="/bbs/strip-footing" element={<Suspense fallback={<SuspenseFallback />}><BBSCalculatorPage /></Suspense>} />
              <Route path="/bbs/raft-foundation" element={<Suspense fallback={<SuspenseFallback />}><BBSCalculatorPage /></Suspense>} />
              <Route path="/bbs/beam" element={<Suspense fallback={<SuspenseFallback />}><BBSCalculatorPage /></Suspense>} />
              <Route path="/bbs/plinth-beam" element={<Suspense fallback={<SuspenseFallback />}><BBSCalculatorPage /></Suspense>} />
              <Route path="/bbs/tie-beam" element={<Suspense fallback={<SuspenseFallback />}><BBSCalculatorPage /></Suspense>} />
              <Route path="/bbs/lintel-beam" element={<Suspense fallback={<SuspenseFallback />}><BBSCalculatorPage /></Suspense>} />
              <Route path="/bbs/column" element={<Suspense fallback={<SuspenseFallback />}><BBSCalculatorPage /></Suspense>} />
              <Route path="/bbs/pedestal" element={<Suspense fallback={<SuspenseFallback />}><BBSCalculatorPage /></Suspense>} />
              <Route path="/bbs/slab" element={<Suspense fallback={<SuspenseFallback />}><BBSCalculatorPage /></Suspense>} />
              <Route path="/bbs/staircase" element={<Suspense fallback={<SuspenseFallback />}><BBSCalculatorPage /></Suspense>} />
              <Route path="/bbs/retaining-wall" element={<Suspense fallback={<SuspenseFallback />}><BBSCalculatorPage /></Suspense>} />
              <Route path="/bbs/foundation-mesh" element={<Suspense fallback={<SuspenseFallback />}><BBSCalculatorPage /></Suspense>} />
              {/* Fallback BBS route */}
              <Route path="/bbs/:structureType" element={<Suspense fallback={<SuspenseFallback />}><BBSCalculatorPage /></Suspense>} />

              {/* Category Landing Pages */}
              <Route path="/structural" element={<CategoryPageTemplate category="structural" />} />
              <Route path="/concrete" element={<CategoryPageTemplate category="concrete" />} />
              <Route path="/geotechnical" element={<CategoryPageTemplate category="geotech" />} />
              <Route path="/surveying" element={<CategoryPageTemplate category="survey" />} />
              <Route path="/utilities" element={<CategoryPageTemplate category="utility" />} />
              <Route path="/guides" element={<GuidesPage />} />
              <Route path="/guides/:slug" element={<GuidePage />} />
              <Route path="/articles" element={<Suspense fallback={<SuspenseFallback />}><ArticlesDirectoryPage /></Suspense>} />
              <Route path="/articles/:slug" element={<Suspense fallback={<SuspenseFallback />}><ArticleDetailPage /></Suspense>} />
              <Route path="/formulas" element={<FormulasPage />} />
              <Route path="/tables" element={<TablesPage />} />

              {/* Concrete Calculator Pages */}
              <Route path="/concrete/volume" element={<Suspense fallback={<SuspenseFallback />}><ConcreteVolumePage /></Suspense>} />
              <Route path="/concrete/rebar" element={<Suspense fallback={<SuspenseFallback />}><RebarCalculatorPage /></Suspense>} />
              <Route path="/concrete/brick" element={<Suspense fallback={<SuspenseFallback />}><BrickCalculatorPage /></Suspense>} />

              {/* Structural Calculator Pages */}
              <Route path="/structural/beam" element={<Suspense fallback={<SuspenseFallback />}><BeamAnalysisPage /></Suspense>} />
              <Route path="/structural/column" element={<Suspense fallback={<SuspenseFallback />}><ColumnDesignPage /></Suspense>} />
              <Route path="/structural/slab" element={<Suspense fallback={<SuspenseFallback />}><SlabDeflectionPage /></Suspense>} />
              <Route path="/structural/steel-weight" element={<Suspense fallback={<SuspenseFallback />}><SteelWeightPage /></Suspense>} />

              {/* Surveying Calculator Pages */}
              <Route path="/surveying/hi" element={<Suspense fallback={<SuspenseFallback />}><HeightOfInstrumentPage /></Suspense>} />
              <Route path="/surveying/traverse" element={<Suspense fallback={<SuspenseFallback />}><CoordinateTraversePage /></Suspense>} />

              {/* Geotechnical Calculator Pages */}
              <Route path="/geotechnical/bearing-capacity" element={<Suspense fallback={<SuspenseFallback />}><BearingCapacityPage /></Suspense>} />
              <Route path="/geotechnical/retaining-wall" element={<Suspense fallback={<SuspenseFallback />}><RetainingWallPage /></Suspense>} />

              {/* Utility Calculator Pages */}
              <Route path="/utilities/unit-converter" element={<Suspense fallback={<SuspenseFallback />}><UnitConverterPage /></Suspense>} />

              {/* Backward Compatibility Redirects */}
              <Route path="/concrete/mix-ratio" element={<Navigate to="/concrete/volume" replace />} />
              <Route path="/concrete/mix" element={<Navigate to="/concrete/volume" replace />} />
              <Route path="/calculators/concrete-mix" element={<Navigate to="/concrete/volume" replace />} />
              <Route path="/calculators/concrete-mix-ratio" element={<Navigate to="/concrete/volume" replace />} />
              <Route path="/concrete/rebar-calculator" element={<Navigate to="/concrete/rebar" replace />} />
              <Route path="/concrete/brick-calculator" element={<Navigate to="/concrete/brick" replace />} />
              <Route path="/structural/steel-calculator" element={<Navigate to="/structural/steel-weight" replace />} />
              <Route path="/geotechnical/bearing" element={<Navigate to="/geotechnical/bearing-capacity" replace />} />
              <Route path="/geotechnical/retaining" element={<Navigate to="/geotechnical/retaining-wall" replace />} />
              <Route path="/surveying/coordinate" element={<Navigate to="/surveying/traverse" replace />} />
              <Route path="/utilities/convert" element={<Navigate to="/utilities/unit-converter" replace />} />

              {/* Backward Compatibility Redirects */}
              <Route path="/boq-builder" element={<Navigate to="/calculators" replace />} />
              <Route path="/construction" element={<Navigate to="/calculators" replace />} />

              {/* Dashboard */}
              <Route path="/dashboard" element={<DashboardPage />} />

              {/* Static Pages */}
              <Route path="/about" element={<StaticPage page="about" />} />
              <Route path="/contact" element={<StaticPage page="contact" />} />
              <Route path="/privacy" element={<StaticPage page="privacy" />} />
              <Route path="/terms" element={<StaticPage page="terms" />} />
              <Route path="/disclaimer" element={<StaticPage page="disclaimer" />} />
              <Route path="/cookie-policy" element={<StaticPage page="cookie-policy" />} />

              {/* Main Calculator Directory */}
              <Route path="/calculators" element={<CalculatorsDirectoryPage />} />

              {/* FAQ Page */}
              <Route path="/faq" element={<FAQPage />} />

              {/* Category & Convenience Redirects */}
              <Route path="/tools" element={<Navigate to="/calculators" replace />} />
              <Route path="/blog" element={<Navigate to="/articles" replace />} />
              <Route path="/privacy-policy" element={<Navigate to="/privacy" replace />} />
              <Route path="/cookies" element={<Navigate to="/cookie-policy" replace />} />

              {/* /calculators/* Clean Route Aliases */}
              <Route path="/calculators/concrete" element={<Navigate to="/concrete" replace />} />
              <Route path="/calculators/concrete-volume" element={<Navigate to="/concrete/volume" replace />} />
              <Route path="/calculators/rebar" element={<Navigate to="/concrete/rebar" replace />} />
              <Route path="/calculators/brick" element={<Navigate to="/concrete/brick" replace />} />
              <Route path="/calculators/beam" element={<Navigate to="/structural/beam" replace />} />
              <Route path="/calculators/column" element={<Navigate to="/structural/column" replace />} />
              <Route path="/calculators/slab" element={<Navigate to="/structural/slab" replace />} />
              <Route path="/calculators/steel-weight" element={<Navigate to="/structural/steel-weight" replace />} />
              <Route path="/calculators/bbs" element={<Navigate to="/bbs" replace />} />
              <Route path="/calculators/bbs/:structureType" element={<Suspense fallback={<SuspenseFallback />}><BBSCalculatorPage /></Suspense>} />
              <Route path="/calculators/foundation" element={<Navigate to="/bbs/footing" replace />} />
              <Route path="/calculators/staircase" element={<Navigate to="/bbs/staircase" replace />} />
              <Route path="/calculators/bearing-capacity" element={<Navigate to="/geotechnical/bearing-capacity" replace />} />
              <Route path="/calculators/retaining-wall" element={<Navigate to="/geotechnical/retaining-wall" replace />} />
              <Route path="/calculators/hi" element={<Navigate to="/surveying/hi" replace />} />
              <Route path="/calculators/traverse" element={<Navigate to="/surveying/traverse" replace />} />
              <Route path="/calculators/unit-converter" element={<Navigate to="/utilities/unit-converter" replace />} />
              <Route path="/calculators/excavation" element={<Navigate to="/calculators" replace />} />
              <Route path="/calculators/plaster" element={<Navigate to="/concrete/brick" replace />} />
              <Route path="/calculators/tile" element={<Navigate to="/calculators" replace />} />
              <Route path="/calculators/paint" element={<Navigate to="/calculators" replace />} />

              {/* 404 */}
              <Route path="*" element={
                <div className="text-center py-20 px-4 max-w-lg mx-auto">
                  <SEOHead meta={{ title: 'Calculator Not Found | CivilMath', description: 'The requested civil engineering calculator or page was not found.', path: '/404', noindex: true }} />
                  <div className="w-12 h-12 rounded-2xl bg-brand/10 text-brand flex items-center justify-center mx-auto mb-4 text-xl font-bold font-mono">404</div>
                  <h1 className="text-2xl font-bold text-ink dark:text-ink-dark mb-2">Page not found</h1>
                  <p className="text-xs text-ink-muted dark:text-ink-muted-dark leading-relaxed mb-6">
                    The requested civil engineering calculator or page was not found.
                  </p>
                  <div className="flex flex-wrap justify-center gap-3">
                    <a href="/calculators" className="px-5 py-2.5 bg-brand hover:bg-brand-dark text-white rounded-xl text-xs font-semibold cursor-pointer no-underline shadow-2xs transition-all">
                      Browse All Calculators
                    </a>
                    <a href="/" className="px-5 py-2.5 border border-border-subtle text-ink dark:text-ink-dark rounded-xl text-xs font-semibold cursor-pointer no-underline hover:bg-surface-2 dark:hover:bg-surface-3 transition-all">
                      Back to Home
                    </a>
                  </div>
                </div>
              } />
            </Route>
          </Routes>
          </ProjectProvider>
        </AppProvider>
      </BrowserRouter>
    </HelmetProvider>
  );
}
