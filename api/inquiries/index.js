import { setCors } from "../_lib/openrouter.js";
import { requireAdminAuth } from "../_lib/auth.js";
import { getSupabase } from "../_lib/supabase.js";

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  const session = requireAdminAuth(req, res);
  if (!session) return;

  const supabase = getSupabase();

  if (req.method === "GET") {
    if (supabase) {
      const { data, error } = await supabase
        .from("inquiries")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && Array.isArray(data)) {
        return res.status(200).json(data);
      }
    }
    return res.status(200).json([]);
  }

  return res.status(405).json({ error: "Method not allowed" });
}
