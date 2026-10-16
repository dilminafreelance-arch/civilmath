import { setCors } from "./_lib/openrouter.js";
import { getSupabase } from "./_lib/supabase.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, source } = req.body || {};
  const clean = String(email || "").trim().toLowerCase();

  if (!EMAIL_RE.test(clean) || clean.length > 254) {
    return res.status(400).json({ error: "Please enter a valid email address." });
  }

  let supabase;
  try {
    supabase = getSupabase();
  } catch (err) {
    console.warn("Supabase not configured:", err.message);
    return res.status(503).json({ error: "Signup temporarily unavailable. Please try again later." });
  }

  const { error } = await supabase
    .from("newsletter_subscribers")
    .upsert(
      { email: clean, source: String(source || "website").slice(0, 50) },
      { onConflict: "email", ignoreDuplicates: true }
    );

  if (error) {
    console.warn("Newsletter signup failed:", error.message);
    return res.status(500).json({ error: "Signup failed. Please try again later." });
  }

  return res.status(200).json({ ok: true });
}
