/**
 * Search Engine Auto-Indexing & Ping Helper
 * Automatically notifies IndexNow (Bing, Yandex, Seznam, Naver) and Google Sitemap ping
 * whenever an article is published or updated.
 */

const INDEXNOW_KEY = "civilmath2026indexnow";
const HOST = "civilmath.com";
const SITE_URL = `https://${HOST}`;

export async function notifySearchEngines(slugs) {
  const slugList = Array.isArray(slugs) ? slugs : [slugs];
  const validSlugs = slugList.filter(Boolean);

  if (validSlugs.length === 0) return { skipped: true };

  const articleUrls = validSlugs.map((s) => `${SITE_URL}/articles/${s}`);
  const sitemapUrl = `${SITE_URL}/sitemap.xml`;

  const results = {
    indexnow: false,
    googlePing: false,
    bingPing: false,
    timestamp: new Date().toISOString(),
  };

  // 1. Instant IndexNow Submission (Bing, Yandex, etc.)
  try {
    const payload = {
      host: HOST,
      key: INDEXNOW_KEY,
      keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
      urlList: [...articleUrls, sitemapUrl],
    };

    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(payload),
    });

    results.indexnow = res.status === 200 || res.status === 202;
  } catch (err) {
    console.warn("IndexNow ping failed:", err.message);
  }

  // 2. Google Sitemap Ping
  try {
    const gRes = await fetch(
      `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`
    );
    results.googlePing = gRes.ok || gRes.status === 200;
  } catch (err) {
    // Non-blocking
  }

  // 3. Bing Sitemap Ping
  try {
    const bRes = await fetch(
      `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`
    );
    results.bingPing = bRes.ok || bRes.status === 200;
  } catch (err) {
    // Non-blocking
  }

  return results;
}
