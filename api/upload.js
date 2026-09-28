import { setCors } from "./_lib/openrouter.js";
import { requireAdminAuth } from "./_lib/auth.js";
import { getSupabase } from "./_lib/supabase.js";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

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

  try {
    const { image, filename, slug = "article" } = req.body || {};
    if (!image || typeof image !== "string") {
      return res.status(400).json({ error: "Image data is required.", status: "error" });
    }

    const cleanSlug = String(slug).toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/(^-|-$)/g, "") || "article";
    const timestamp = Date.now();
    const filePath = `articles/${cleanSlug}/${timestamp}.webp`;

    const match = image.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
    const buffer = match ? Buffer.from(match[2], "base64") : Buffer.from(image, "base64");

    // Try Supabase Storage upload to 'article-images' bucket
    try {
      const supabase = getSupabase();
      if (supabase && supabase.storage) {
        const { data, error } = await supabase.storage
          .from("article-images")
          .upload(filePath, buffer, {
            contentType: "image/webp",
            upsert: true,
          });

        if (!error && data) {
          const { data: pubData } = supabase.storage
            .from("article-images")
            .getPublicUrl(filePath);

          if (pubData?.publicUrl) {
            return res.status(200).json({
              status: "success",
              url: pubData.publicUrl,
              filename: filePath,
            });
          }
        } else if (error) {
          console.warn("Supabase storage upload notice:", error.message);
        }
      }
    } catch (storageErr) {
      console.warn("Supabase storage unavailable, falling back to data URI:", storageErr?.message);
    }

    // Fallback: return optimized data URI directly
    return res.status(200).json({
      status: "success",
      url: image,
      filename: filename || `${timestamp}.webp`,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Failed to process image.", status: "error" });
  }
}
