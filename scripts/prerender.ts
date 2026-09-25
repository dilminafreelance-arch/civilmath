import http from 'http';
import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';
import { ALL_ROUTES_SEO } from '../src/utils/seo';

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function createStaticServer(distDir: string, spaFallbackHtml: string): Promise<{ server: http.Server; port: number }> {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const urlPath = (req.url || '/').split('?')[0];
      const safePath = path.normalize(decodeURIComponent(urlPath)).replace(/^(\.\.[/\\])+/, '');
      let filePath = path.join(distDir, safePath);

      if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
        filePath = path.join(filePath, 'index.html');
      }

      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
        fs.createReadStream(filePath).pipe(res);
      } else {
        // SPA Fallback for client routes
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(spaFallbackHtml);
      }
    });

    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (address && typeof address === 'object') {
        resolve({ server, port: address.port });
      } else {
        reject(new Error('Failed to obtain server address'));
      }
    });

    server.on('error', reject);
  });
}

async function prerenderRoutes() {
  const distDir = path.resolve(process.cwd(), 'dist');
  const indexHtmlPath = path.join(distDir, 'index.html');

  if (!fs.existsSync(indexHtmlPath)) {
    console.error(`Dist index.html not found at ${indexHtmlPath}. Run 'vite build' first.`);
    process.exit(1);
  }

  const spaFallbackHtml = fs.readFileSync(indexHtmlPath, 'utf8');
  const { server, port } = await createStaticServer(distDir, spaFallbackHtml);
  console.log(`[Prerender] Static server listening at http://127.0.0.1:${port}`);

  let browser;
  try {
    browser = await chromium.launch();
  } catch {
    try {
      browser = await chromium.launch({ channel: 'msedge' });
    } catch {
      try {
        browser = await chromium.launch({ channel: 'chrome' });
      } catch {
        console.warn('[Prerender] Browser not available in this build environment (e.g. Vercel CI). SPA fallback index.html will serve routes.');
        server.close();
        return;
      }
    }
  }

  if (!browser) {
    console.warn('[Prerender] Browser not initialized; skipping route snapshotting.');
    server.close();
    return;
  }

  const routes = ALL_ROUTES_SEO.map(r => r.path);
  console.log(`[Prerender] Snapshotting ${routes.length} routes...`);

  const concurrency = 3;
  let completed = 0;

  async function processRoute(route: string) {
    const page = await browser.newPage();
    const url = `http://127.0.0.1:${port}${route}`;

    try {
      // Abort external analytics/tracking pings during prerender
      await page.route('**/*', (route) => {
        const reqUrl = route.request().url();
        if (reqUrl.includes('googletagmanager.com') || reqUrl.includes('google-analytics.com') || reqUrl.includes('/_vercel/insights')) {
          return route.abort();
        }
        return route.continue();
      });

      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      // Ensure H1 or main heading is rendered
      await page.waitForSelector('h1', { timeout: 12000 }).catch(() => {});
      // Small pause to allow react-helmet-async to commit head tags
      await page.waitForTimeout(250);

      // Clean and deduplicate tags in head so prerendered HTML is clean and accurate
      await page.evaluate(() => {
        // 1. Deduplicate <title>: keep the title matching document.title
        const titles = Array.from(document.querySelectorAll('head > title'));
        if (titles.length > 1) {
          const activeTitle = document.title;
          let kept = false;
          for (const t of titles) {
            if (!kept && t.textContent === activeTitle) {
              kept = true;
            } else {
              t.remove();
            }
          }
        }

        // 2. Deduplicate meta tags by name or property (keep the last one, which was set by Helmet)
        const metaTags = Array.from(document.querySelectorAll('head > meta'));
        const seenKeys = new Set<string>();
        for (let i = metaTags.length - 1; i >= 0; i--) {
          const tag = metaTags[i];
          const key = tag.getAttribute('name') || tag.getAttribute('property');
          if (key) {
            const lowerKey = key.toLowerCase();
            if (
              lowerKey === 'description' ||
              lowerKey === 'keywords' ||
              lowerKey === 'robots' ||
              lowerKey.startsWith('og:') ||
              lowerKey.startsWith('twitter:')
            ) {
              if (seenKeys.has(lowerKey)) {
                tag.remove();
              } else {
                seenKeys.add(lowerKey);
              }
            }
          }
        }

        // 3. Deduplicate canonical links (keep the last one)
        const canonicals = Array.from(document.querySelectorAll('head > link[rel="canonical"]'));
        if (canonicals.length > 1) {
          for (let i = 0; i < canonicals.length - 1; i++) {
            canonicals[i].remove();
          }
        }

        // 4. Remove splash loader from prerendered HTML so search engines & static previews have clear markup
        const splash = document.getElementById('cm-splash');
        if (splash) splash.remove();
      });


      const html = await page.content();

      let targetFile: string;
      if (route === '/') {
        targetFile = path.join(distDir, 'index.html');
      } else {
        const subDir = path.join(distDir, route.replace(/^\//, ''));
        if (!fs.existsSync(subDir)) {
          fs.mkdirSync(subDir, { recursive: true });
        }
        targetFile = path.join(subDir, 'index.html');
      }

      fs.writeFileSync(targetFile, html, 'utf8');
      completed++;
      console.log(`[Prerender] (${completed}/${routes.length}) OK: ${route} -> ${path.relative(process.cwd(), targetFile)}`);
    } catch (err: any) {
      console.error(`[Prerender] Error rendering route ${route}:`, err.message);
    } finally {
      await page.close();
    }
  }

  // Run in chunks with concurrency
  for (let i = 0; i < routes.length; i += concurrency) {
    const chunk = routes.slice(i, i + concurrency);
    await Promise.all(chunk.map(r => processRoute(r)));
  }

  await browser.close();
  server.close();
  console.log(`[Prerender] Successfully prerendered ${completed} routes to static HTML.`);
}

prerenderRoutes().catch(err => {
  console.error('[Prerender] Fatal error:', err);
  process.exit(1);
});
