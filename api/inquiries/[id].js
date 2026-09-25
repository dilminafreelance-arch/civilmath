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

  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ error: "Inquiry ID is required" });
  }

  const supabase = getSupabase();

  if (req.method === "PATCH") {
    const { status, notes } = req.body || {};
    const updates = { updated_at: new Date().toISOString() };
    if (status) updates.status = status;
    if (notes !== undefined) updates.notes = notes;

    if (supabase) {
      const { data, error } = await supabase
        .from("inquiries")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        return res.status(500).json({ error: error.message });
      }
      return res.status(200).json({ status: "success", inquiry: data });
    }

    return res.status(200).json({ status: "success" });
  }

  if (req.method === "DELETE") {
    if (supabase) {
      const { error } = await supabase
        .from("inquiries")
        .delete()
        .eq("id", id);

      if (error) {
        return res.status(500).json({ error: error.message });
      }
    }
    return res.status(200).json({ status: "success", message: `Inquiry ${id} deleted.` });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
