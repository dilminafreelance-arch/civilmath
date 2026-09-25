import { setCors } from "./_lib/openrouter.js";
import { getSupabase } from "./_lib/supabase.js";
import crypto from "crypto";

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { name, email, category, subject, message } = req.body || {};

  if (!name || typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ error: "Name is required.", status: "invalid_input" });
  }
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return res.status(400).json({ error: "A valid email address is required.", status: "invalid_input" });
  }
  if (!message || typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ error: "Message is required.", status: "invalid_input" });
  }

  const id = `inq_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
  const now = new Date().toISOString();

  const newInquiry = {
    id,
    name: name.trim().slice(0, 100),
    email: email.trim().toLowerCase().slice(0, 150),
    category: typeof category === "string" ? category.trim().slice(0, 50) : "General Question",
    subject: typeof subject === "string" ? subject.trim().slice(0, 200) : "",
    message: message.trim().slice(0, 5000),
    status: "unread",
    createdAt: now,
  };

  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from("inquiries").insert([newInquiry]);
    } catch (err) {
      console.warn("Supabase insert error on contact endpoint:", err);
    }
  }

  return res.status(200).json({
    status: "success",
    message: "Thank you for contacting CivilMath. Your inquiry has been received.",
    inquiryId: id,
  });
}
