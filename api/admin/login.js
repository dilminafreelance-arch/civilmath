import { setCors } from "../_lib/openrouter.js";
import { getAdminCredentials, matchesAdminEmail, matchesAdminPassword, generateSessionToken } from "../_lib/auth.js";

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }
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
