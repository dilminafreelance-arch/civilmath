import { setCors, callOpenRouter, stripMarkdownJson } from "../_lib/openrouter.js";
import { requireAdminAuth } from "../_lib/auth.js";

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed", status: "error" });
  }

  const session = requireAdminAuth(req, res);
  if (!session) return;

  const { title, content, category } = req.body || {};
  if (!title) {
    return res.status(400).json({ error: "Title is required.", status: "error" });
  }

  const openrouterKey = process.env.OPENROUTER_API_KEY;
  if (!openrouterKey) {
    return res.status(200).json({
      fallback: true,
      message: "AI key not configured; client-side rules used.",
    });
  }

  try {
    const prompt = `Analyze this civil engineering article and generate optimal SEO metadata:
Title: "${title}"
Category: "${category || 'General Civil Engineering'}"
Content snippet: "${(content || '').substring(0, 1500)}"

Return a strictly valid JSON object matching this schema:
{
  "seoTitle": "Engaging title, 50-60 characters including | CivilMath",
  "metaDescription": "Action-oriented meta description, 145-160 characters",
  "primaryKeyword": "most important focus search keyword (2-3 words)",
  "secondaryKeywords": ["secondary keyword 1", "secondary keyword 2", "secondary keyword 3"],
  "lsiKeywords": ["lsi term 1", "lsi term 2", "lsi term 3", "lsi term 4"],
  "slug": "clean-url-slug-without-stopwords"
}`;

    const raw = await callOpenRouter({
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      jsonObject: true,
      title: "CivilMath SEO Generator",
    });

    const cleaned = stripMarkdownJson(raw);
    const parsed = JSON.parse(cleaned);
    return res.status(200).json({ status: "success", seo: parsed });
  } catch (err) {
    console.warn("Serverless AI SEO error:", err.message);
    return res.status(200).json({ fallback: true });
  }
}
