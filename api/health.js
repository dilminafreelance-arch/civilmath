import { setCors } from "./_lib/openrouter.js";

export default function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  return res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    platform: "vercel-functions",
  });
}
