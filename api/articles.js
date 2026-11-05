import { setCors } from "./_lib/openrouter.js";
import { requireAdminAuth, verifySessionToken } from "./_lib/auth.js";
import { getSupabase } from "./_lib/supabase.js";
import { rowToArticle, articleToRow } from "./_lib/articleMapper.js";
import { notifySearchEngines } from "./_lib/indexnow.js";
import {
  loadHtmlShell,
  renderArticlePageHtml,
  renderArticleNotFoundHtml,
  renderArticlesDirectoryHtml,
  slimArticleForEmbed,
} from "./_lib/articleSsr.js";

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
      ? decodeURIComponent(lastPart)
      : null;
  const slug = req.query.slug ? String(req.query.slug) : pathSlug;
  const renderMode = req.query.render ? String(req.query.render) : "";

  const supabase = getSupabase();

  if (req.method === "GET") {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
    const isAdmin = Boolean(token && verifySessionToken(token));

    // Dynamic cover image binary endpoint for /article-covers/:slug.webp
    if (renderMode === "cover" && slug) {
      const cleanSlug = slug.replace(/\.(webp|png|jpe?g|svg)$/i, "");
      try {
        const { data, error } = await supabase
          .from("articles")
          .select("slug, image_url, summary")
          .eq("slug", cleanSlug)
          .maybeSingle();

        if (!error && data) {
          const article = rowToArticle(data);
          const rawCover = String(article?.coverImage || "").trim();
          const m = rawCover.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([\s\S]+)$/);
          if (m) {
            const buf = Buffer.from(m[2], "base64");
            res.setHeader("Content-Type", m[1] || "image/webp");
            res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400");
            return res.status(200).send(buf);
          }
          if (rawCover.startsWith("http://") || rawCover.startsWith("https://")) {
            res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=86400");
            return res.redirect(302, rawCover);
          }
        }
      } catch (err) {
        console.warn("Cover endpoint error:", err?.message || err);
      }
      return res.redirect(302, "/og-image.png");
    }

    // Dynamic SSR HTML rendering for /articles (directory)
    if (renderMode === "directory") {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=60, s-maxage=600, stale-while-revalidate=86400");
      const shell = loadHtmlShell();
      try {
        const { data } = await supabase
          .from("articles")
          .select("slug, title, summary, tags, image_url, published, published_at, updated_at")
          .or("published.eq.true,published.is.null")
          .order("published_at", { ascending: false });
        const list = (data || []).map((r) => slimArticleForEmbed(rowToArticle(r)));
        return res.status(200).send(renderArticlesDirectoryHtml(shell, list));
      } catch (err) {
        console.warn("SSR directory Supabase error:", err?.message || err);
        return res.status(200).send(renderArticlesDirectoryHtml(shell, []));
      }
    }

    // Dynamic SSR HTML rendering for /articles/:slug
    if (renderMode === "html" && slug) {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      const shell = loadHtmlShell();
      try {
        const { data, error } = await supabase
          .from("articles")
          .select("*")
          .eq("slug", slug)
          .or("published.eq.true,published.is.null")
          .maybeSingle();

        if (error || !data) {
          res.setHeader("Cache-Control", "public, max-age=30, s-maxage=120");
          return res.status(404).send(renderArticleNotFoundHtml(shell));
        }

        const article = rowToArticle(data);
        if (article.status === "draft") {
          res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
          return res.status(404).send(renderArticleNotFoundHtml(shell));
        }

        const { data: relRows } = await supabase
          .from("articles")
          .select("slug, title, summary, published, published_at")
          .or("published.eq.true,published.is.null")
          .neq("slug", slug)
          .order("published_at", { ascending: false })
          .limit(6);

        const related = (relRows || []).map((r) => rowToArticle(r));
        res.setHeader("Cache-Control", "public, max-age=60, s-maxage=600, stale-while-revalidate=86400");
        return res.status(200).send(renderArticlePageHtml(shell, article, related));
      } catch (err) {
        console.warn("SSR article Supabase error:", err?.message || err);
        res.setHeader("Cache-Control", "no-cache");
        return res.status(500).send(shell);
      }
    }

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
      const article = rowToArticle(data);
      const keepRawCover = isAdmin || req.query.rawCover === "true";
      return res.status(200).json(keepRawCover ? article : slimArticleForEmbed(article));
    }

    // List endpoint: lightweight summaries by default; full rows when ?bulk=true (used by build-time prerender).
    const selectCols = isBulk
      ? "*"
      : "slug, title, summary, tags, published, published_at, updated_at";
    let query = supabase.from("articles").select(selectCols);
    if (!isAdmin) {
      query = query.or("published.eq.true,published.is.null");
    }
    const { data, error } = await query.order("published_at", { ascending: false });

    if (error) {
      console.error("Supabase GET error:", error);
      return res.status(500).json({ error: "Failed to fetch articles." });
    }
    return res.status(200).json(
      (data || []).map((row) => {
        const article = rowToArticle(row);
        return slimArticleForEmbed(article);
      })
    );
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
        .map((item) => articleToRow(item));

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

    const incomingCover = String(article.coverImage || article.coverImageUrl || "").trim();
    if (incomingCover.startsWith("/article-covers/")) {
      try {
        const { data: existing } = await supabase
          .from("articles")
          .select("image_url, summary")
          .eq("slug", article.slug)
          .maybeSingle();
        if (existing) {
          const prev = rowToArticle(existing);
          if (prev?.coverImage && String(prev.coverImage).startsWith("data:")) {
            article.coverImage = prev.coverImage;
            article.coverImageUrl = prev.coverImage;
          }
        }
      } catch {
        // ignore and proceed
      }
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
