import { setCors } from "./_lib/openrouter.js";
import { requireAdminAuth, verifySessionToken } from "./_lib/auth.js";
import { getSupabase } from "./_lib/supabase.js";
import { rowToArticle, articleToRow } from "./_lib/articleMapper.js";
import { notifySearchEngines } from "./_lib/indexnow.js";

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  const urlPath = req.url ? req.url.split("?")[0] : "";
  const pathParts = urlPath.split("/").filter(Boolean);
  const lastPart = pathParts.length > 0 ? pathParts[pathParts.length - 1] : "";
  const isBulk = req.query.bulk === "true" || lastPart === "bulk" || Array.isArray(req.body);
  const pathSlug =
    pathParts.length > 2 && lastPart !== "bulk" && lastPart !== "articles"
      ? lastPart
      : null;
  const slug = req.query.slug || pathSlug;

  const supabase = getSupabase();

  if (req.method === "GET") {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
    const isAdmin = Boolean(token && verifySessionToken(token));

    if (!isAdmin) {
      res.setHeader("Cache-Control", "public, max-age=60, s-maxage=600, stale-while-revalidate=86400");
    } else {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    }

    if (slug) {
      if (!isAdmin) {
        res.setHeader("Cache-Control", "public, max-age=120, s-maxage=1800, stale-while-revalidate=86400");
      }
      let query = supabase.from("articles").select("*").eq("slug", slug);
      if (!isAdmin) {
        query = query.or("published.eq.true,published.is.null");
      }
      const { data, error } = await query.maybeSingle();

      if (error || !data) {
        return res.status(404).json({ error: "Article not found", status: "not_found" });
      }
      return res.status(200).json(rowToArticle(data));
    }

    let query = supabase.from("articles").select("*");
    if (!isAdmin) {
      query = query.or("published.eq.true,published.is.null");
    }
    const { data, error } = await query.order("published_at", { ascending: false });

    if (error) {
      console.error("Supabase GET error:", error);
      return res.status(500).json({ error: "Failed to fetch articles." });
    }
    return res.status(200).json((data || []).map(rowToArticle));
  }

  if (req.method === "POST") {
    const session = requireAdminAuth(req, res);
    if (!session) return;

    if (isBulk) {
      const items = Array.isArray(req.body) ? req.body : req.body?.items;
      if (!Array.isArray(items)) {
        return res.status(400).json({ error: "Expected an array of articles." });
      }

      const rows = items
        .filter((item) => item && item.slug && item.title)
        .map(articleToRow);

      if (rows.length === 0) {
        return res.status(400).json({ error: "No valid articles provided." });
      }

      const { data, error } = await supabase
        .from("articles")
        .upsert(rows, { onConflict: "slug" })
        .select();

      if (error) {
        console.error("Supabase bulk error:", error);
        return res.status(500).json({ error: "Failed to save articles." });
      }

      // Asynchronously notify search engines (IndexNow & Google ping) without blocking
      notifySearchEngines(rows.map((r) => r.slug)).catch((err) =>
        console.warn("Auto-index ping error:", err?.message || err)
      );

      return res.status(200).json({
        status: "success",
        total: data.length,
      });
    }

    const article = req.body;
    if (!article || !article.slug || !article.title) {
      return res.status(400).json({ error: "Slug and title are required." });
    }

    const row = articleToRow(article);

    const { data, error } = await supabase
      .from("articles")
      .upsert(row, { onConflict: "slug" })
      .select()
      .single();

    if (error) {
      console.error("Supabase POST error:", error);
      return res.status(500).json({ error: `Failed to save article to Supabase: ${error.message || error}` });
    }

    // Asynchronously notify search engines (IndexNow & Google ping) without blocking
    notifySearchEngines(data.slug || article.slug).catch((err) =>
      console.warn("Auto-index ping error:", err?.message || err)
    );

    return res.status(200).json({ status: "success", article: rowToArticle(data) });
  }

  if (req.method === "DELETE") {
    const session = requireAdminAuth(req, res);
    if (!session) return;

    if (!slug) {
      return res.status(400).json({ error: "Article slug is required." });
    }

    const { error } = await supabase
      .from("articles")
      .delete()
      .eq("slug", slug);

    if (error) {
      console.error("Supabase DELETE error:", error);
      return res.status(500).json({ error: "Failed to delete article." });
    }
    return res.status(200).json({ status: "success", message: `Article ${slug} deleted.` });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
