import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL || 'http://localhost:3000';

const PAGES = [
  '/', '/bbs', '/structural', '/concrete', '/geotechnical', '/surveying', '/utilities',
  '/bbs/footing', '/bbs/combined-footing', '/bbs/strip-footing', '/bbs/raft-foundation',
  '/bbs/beam', '/bbs/plinth-beam', '/bbs/tie-beam', '/bbs/lintel-beam', '/bbs/column', '/bbs/pedestal',
  '/bbs/slab', '/bbs/staircase', '/bbs/retaining-wall', '/bbs/foundation-mesh',
  '/concrete/volume', '/concrete/rebar', '/concrete/brick',
  '/concrete/cost', '/concrete/steps', '/rebar/weight-cost',
  '/structural/beam', '/structural/column', '/structural/slab', '/structural/steel-weight',
  '/surveying/hi', '/surveying/traverse',
  '/geotechnical/bearing-capacity', '/geotechnical/retaining-wall',
  '/utilities/unit-converter',
  '/about', '/contact', '/privacy', '/terms', '/disclaimer', '/cookie-policy', '/guides',
  '/guides/concrete-volume-calculation', '/guides/rebar-weight-formula',
  '/articles',
  '/formulas', '/tables', '/construction', '/boq-builder', '/dashboard',
  '/calculators', '/faq',
];

test.describe('Smoke tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/*', (route) => {
      const reqUrl = route.request().url();
      if (
        reqUrl.includes('googletagmanager.com') ||
        reqUrl.includes('google-analytics.com') ||
        reqUrl.includes('googlesyndication.com') ||
        reqUrl.includes('doubleclick.net') ||
        reqUrl.includes('fonts.googleapis.com') ||
        reqUrl.includes('fonts.gstatic.com') ||
        reqUrl.includes('images.unsplash.com')
      ) {
        return route.abort();
      }
      return route.continue();
    });
  });

  for (const page of PAGES) {
    test(`${page} loads successfully`, async ({ page: p }) => {
      const response = await p.goto(`${BASE}${page}`);
      expect(response?.status()).toBe(200);
      await expect(p.locator('body')).not.toBeEmpty();
    });
  }

  test('404 page', async ({ page: p }) => {
    const response = await p.goto(`${BASE}/nonexistent`);
      expect(response?.status()).toBe(200);
      await expect(p.locator('body')).toContainText('Page not found');
  });

  test('sitemap.xml', async ({ page: p }) => {
    const response = await p.goto(`${BASE}/sitemap.xml`);
    expect(response?.status()).toBe(200);
    const text = await p.locator('body').innerText();
    expect(text).toContain('civilmath.com');
  });

  test('robots.txt', async ({ page: p }) => {
    const response = await p.goto(`${BASE}/robots.txt`);
    expect(response?.status()).toBe(200);
    const text = await p.locator('body').innerText();
    expect(text).toContain('Sitemap');
  });

  test('indexable routes have one H1 and canonical SEO metadata', async ({ page: p }) => {
    test.setTimeout(300000);
    const nonIndexable = ['/dashboard', '/construction', '/boq-builder'];
    const indexablePages = PAGES.filter(path => !nonIndexable.includes(path));
    const titles = new Set<string>();
    for (const path of indexablePages) {
      await p.goto(`${BASE}${path}`);
      await expect(p.locator('h1')).toHaveCount(1);
      const title = await p.title();
      expect(title).not.toBe('');
      expect(titles.has(title)).toBeFalsy();
      const desc = p.locator('meta[name="description"]').first();
      await expect(desc).toBeAttached();
      await expect(desc).toHaveAttribute('content', /.+/);
      const canonical = p.locator('link[rel="canonical"]').first();
      await expect(canonical).toBeAttached();
      await expect(canonical).toHaveAttribute('href', `https://civilmath.com${path}`);
    }
  });

  test('dashboard is not indexable', async ({ page: p }) => {
    await p.goto(`${BASE}/dashboard`);
    await expect(p.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
  });

  test('admin page is not indexable', async ({ page: p }) => {
    await p.goto(`${BASE}/admin`);
    await expect(p.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
    await expect(p.locator('body')).toContainText('Articles & Content Administration');
  });

  test('articles directory, detail load, SEO metadata, and browser back navigation', async ({ page: p }) => {
    await p.goto(`${BASE}/articles`);
    await expect(p.locator('h1')).toContainText('Civil Engineering Calculation Articles');
    const firstArticleLink = p.locator('a[href^="/articles/"]').first();
    await expect(firstArticleLink).toBeVisible();
    const linkCount = await p.locator('a[href^="/articles/"]').count();
    expect(linkCount).toBeGreaterThan(1);

    // Ensure article cards in directory display distinct article-specific cover images
    const firstImgSrc = await p.locator('a[href^="/articles/"] img').nth(0).getAttribute('src');
    const secondImgSrc = await p.locator('a[href^="/articles/"] img').nth(1).getAttribute('src');
    expect(firstImgSrc).toBeTruthy();
    expect(secondImgSrc).toBeTruthy();
    expect(firstImgSrc).not.toBe(secondImgSrc);

    const href = await firstArticleLink.getAttribute('href');
    expect(href).toBeTruthy();
    await firstArticleLink.click();
    await expect(p.locator('h1')).toBeVisible();
    await expect(p.locator('h1')).not.toHaveText('Civil Engineering Calculation Articles');

    const canonical = p.locator('link[rel="canonical"]').first();
    await expect(canonical).toHaveAttribute('href', `https://civilmath.com${href}`);

    // Test browser back navigation restores directory
    await p.goBack();
    await expect(p.locator('h1')).toContainText('Civil Engineering Calculation Articles');
  });
});
