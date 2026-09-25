import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL || 'http://localhost:3000';

const PAGES = [
  '/', '/bbs', '/structural', '/concrete', '/geotechnical', '/surveying', '/utilities',
  '/bbs/footing', '/bbs/combined-footing', '/bbs/strip-footing', '/bbs/raft-foundation',
  '/bbs/beam', '/bbs/plinth-beam', '/bbs/tie-beam', '/bbs/lintel-beam', '/bbs/column', '/bbs/pedestal',
  '/bbs/slab', '/bbs/staircase', '/bbs/retaining-wall', '/bbs/foundation-mesh',
  '/concrete/volume', '/concrete/rebar', '/concrete/brick',
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
      console.log('TEST50: Visiting', path);
      await p.goto(`${BASE}${path}`);
      await expect(p.locator('h1')).toHaveCount(1);
      const title = await p.title();
      expect(title).not.toBe('');
      expect(titles.has(title)).toBeFalsy();
      titles.add(title);
      await expect(p.locator('meta[name="description"]')).toHaveCount(1);
      const canonical = p.locator('link[rel="canonical"]');
      await expect(canonical).toHaveCount(1);
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

  test('articles directory and detail load', async ({ page: p }) => {
    await p.goto(`${BASE}/articles`);
    await expect(p.locator('h1')).toContainText('Civil Engineering Calculation Articles');
    await p.goto(`${BASE}/articles/concrete-volume`);
    await expect(p.locator('h1')).toContainText('Concrete Volume');
  });

});

