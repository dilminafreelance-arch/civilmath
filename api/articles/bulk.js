import { setCors } from "../_lib/openrouter.js";
import { requireAdminAuth } from "../_lib/auth.js";
import { getSupabase } from "../_lib/supabase.js";
import { articleToRow } from "../_lib/articleMapper.js";

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = requireAdminAuth(req, res);
  if (!session) return;

  const items = req.body;
  if (!Array.isArray(items)) {
    return res.status(400).json({ error: "Expected an array of articles." });
  }

  const supabase = getSupabase();
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

  return res.status(200).json({
    status: "success",
    total: data.length,
  });
}
