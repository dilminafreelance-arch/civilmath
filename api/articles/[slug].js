import { setCors } from "../_lib/openrouter.js";
import { requireAdminAuth } from "../_lib/auth.js";
import { getSupabase } from "../_lib/supabase.js";
import { rowToArticle } from "../_lib/articleMapper.js";

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  const { slug } = req.query;
  const supabase = getSupabase();

  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("articles")
      .select("*")
      .eq("slug", slug)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: "Article not found", status: "not_found" });
    }
    return res.status(200).json(rowToArticle(data));
  }

  if (req.method === "DELETE") {
    const session = requireAdminAuth(req, res);
    if (!session) return;

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
