import { setCors } from "./_lib/openrouter.js";
import { requireAdminAuth } from "./_lib/auth.js";

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
    const { image, filename } = req.body || {};
    if (!image || typeof image !== "string") {
      return res.status(400).json({ error: "Image data is required.", status: "error" });
    }

    // In serverless environments with immutable ephemeral filesystems,
    // the base64 data URI is already directly embeddable as image src.
    return res.status(200).json({
      status: "success",
      url: image, // Returns direct data URI for immediate rendering and storage
      filename: filename || "article-image",
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Failed to process image.", status: "error" });
  }
}
