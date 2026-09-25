import { setCors } from "./_lib/openrouter.js";
import {
  getAdminCredentials,
  matchesAdminEmail,
  matchesAdminPassword,
  generateSessionToken,
  verifySessionToken,
} from "./_lib/auth.js";

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  const urlPath = req.url ? req.url.split("?")[0] : "";
  const pathParts = urlPath.split("/").filter(Boolean);
  const pathAction = pathParts.length > 0 ? pathParts[pathParts.length - 1] : "";
  const action = req.query.action || (pathAction !== "admin" ? pathAction : "");

  if (action === "login") {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed", status: "error" });
    }

    const { email, password } = req.body || {};
    const config = getAdminCredentials();

    if (!config.email || !config.password) {
      return res.status(500).json({
        error: "Admin authentication is not configured on this server.",
        status: "unconfigured",
      });
    }

    if (typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({
        error: "Email and password are required.",
        status: "invalid_input",
      });
    }

    const emailValid = matchesAdminEmail(email, config.email);
    const passwordValid = matchesAdminPassword(password, config.password);

    if (!emailValid || !passwordValid) {
      return res.status(401).json({
        error: "Invalid email or password. Please verify your admin credentials.",
        status: "invalid_credentials",
      });
    }

    const token = generateSessionToken(config.email);
    return res.status(200).json({
      status: "success",
      token,
      user: {
        email: config.email,
        role: "admin",
      },
      message: "Admin authentication successful.",
    });
  }

  if (action === "logout") {
    return res.status(200).json({ status: "success", message: "Logged out successfully." });
  }

  if (action === "verify") {
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

  return res.status(400).json({ error: `Unknown admin action: ${action}` });
}
