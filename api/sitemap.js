import { STATIC_ROUTES } from "./_lib/staticRoutes.js";
import { getSupabase } from "./_lib/supabase.js";
import { setCors } from "./_lib/openrouter.js";

const SITE_URL = "https://civilmath.com";

function escapeXml(unsafe) {
  if (!unsafe) return "";
  return String(unsafe).replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<": return "&lt;";
      case ">": return "&gt;";
      case "&": return "&amp;";
      case "'": return "&apos;";
      case '"': return "&quot;";
      default: return c;
    }
  });
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const today = new Date().toISOString().split("T")[0];
  let articleUrls = [];

  try {
    const supabase = getSupabase();
    const { data: articles, error } = await supabase
      .from("articles")
      .select("slug, updated_at, published_at, status")
      .or("status.eq.published,status.is.null")
      .order("published_at", { ascending: false });

    if (!error && Array.isArray(articles)) {
      articleUrls = articles
        .filter((art) => art && art.slug)
        .map((art) => {
          const rawDate = art.updated_at || art.published_at || today;
          const lastmod = String(rawDate).split("T")[0] || today;
          return `  <url>
    <loc>${SITE_URL}/articles/${escapeXml(art.slug)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
        });
    }
  } catch (err) {
    console.warn("Dynamic sitemap Supabase lookup skipped:", err.message);
  }

  const staticUrls = STATIC_ROUTES.map((route) => {
    const loc = route.path === "/" ? `${SITE_URL}/` : `${SITE_URL}${route.path}`;
    return `  <url>
    <loc>${loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${route.changefreq || "weekly"}</changefreq>
    <priority>${Number(route.priority || 0.7).toFixed(1)}</priority>
  </url>`;
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...staticUrls, ...articleUrls].join("\n")}
</urlset>
`;

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=1800, s-maxage=3600, stale-while-revalidate=86400");
  return res.status(200).send(xml);
}
