import fs from 'fs';
import path from 'path';
import { ALL_ROUTES_SEO, SITE_URL } from '../src/utils/seo';

function generateSitemap() {
  const today = new Date().toISOString().split('T')[0];
  
  const urls = ALL_ROUTES_SEO.map(route => {
    const loc = route.path === '/' ? `${SITE_URL}/` : `${SITE_URL}${route.path}`;
    return `  <url>
    <loc>${loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority.toFixed(1)}</priority>
  </url>`;
  }).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

  // Write to public/sitemap.xml
  const publicDir = path.resolve(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  const publicSitemapPath = path.join(publicDir, 'sitemap.xml');
  fs.writeFileSync(publicSitemapPath, xml, 'utf8');
  console.log(`Updated ${publicSitemapPath} (${ALL_ROUTES_SEO.length} URLs)`);

  // If dist exists, also copy to dist/sitemap.xml
  const distDir = path.resolve(process.cwd(), 'dist');
  if (fs.existsSync(distDir)) {
    const distSitemapPath = path.join(distDir, 'sitemap.xml');
    fs.writeFileSync(distSitemapPath, xml, 'utf8');
    console.log(`Updated ${distSitemapPath}`);
  }

  // Ensure robots.txt is in place and up to date
  const robotsTxt = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /_*
Disallow: /admin/
Disallow: /admin

Sitemap: ${SITE_URL}/sitemap.xml
`;
  const publicRobotsPath = path.join(publicDir, 'robots.txt');
  fs.writeFileSync(publicRobotsPath, robotsTxt, 'utf8');
  console.log(`Updated ${publicRobotsPath}`);

  if (fs.existsSync(distDir)) {
    const distRobotsPath = path.join(distDir, 'robots.txt');
    fs.writeFileSync(distRobotsPath, robotsTxt, 'utf8');
    console.log(`Updated ${distRobotsPath}`);
  }
}

generateSitemap();
