import { setCors } from "../_lib/openrouter.js";
import { requireAdminAuth } from "../_lib/auth.js";
import { getSupabase } from "../_lib/supabase.js";
import { rowToArticle, articleToRow } from "../_lib/articleMapper.js";

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  const supabase = getSupabase();

  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("articles")
      .select("*")
      .order("published_at", { ascending: false });

    if (error) {
      console.error("Supabase GET error:", error);
      return res.status(500).json({ error: "Failed to fetch articles." });
    }
    return res.status(200).json((data || []).map(rowToArticle));
  }

  if (req.method === "POST") {
    const session = requireAdminAuth(req, res);
    if (!session) return;

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
      return res.status(500).json({ error: "Failed to save article." });
    }
    return res.status(200).json({ status: "success", article: rowToArticle(data) });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
