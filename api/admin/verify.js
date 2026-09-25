import { setCors } from "../_lib/openrouter.js";
import { verifySessionToken } from "../_lib/auth.js";

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed", status: "error" });
  }

  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : null;

  if (!token) {
    return res.status(401).json({ authenticated: false, error: "No token provided." });
  }

  const session = verifySessionToken(token);
  if (!session) {
    return res.status(401).json({ authenticated: false, error: "Session expired or invalid." });
  }

  return res.status(200).json({
    authenticated: true,
    user: {
      email: session.email,
      role: session.role,
    },
  });
}
