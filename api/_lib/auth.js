import crypto from "crypto";
import dotenv from "dotenv";

try {
  dotenv.config();
  dotenv.config({ path: ".env.local", override: true });
} catch {
  // Ignore in environments where dotenv is not needed
}

export function getAdminCredentials() {
  return {
    email: (process.env.ADMIN_EMAIL || "").trim().toLowerCase().replace(/^["']|["']$/g, ""),
    password: (process.env.ADMIN_PASSWORD || "").trim(),
  };
}

export function getSessionSecret() {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    process.env.ADMIN_PASSWORD ||
    "civilmath-session-fallback-secret-2026"
  );
}

export function timingSafeCompare(a, b) {
  try {
    const bufA = Buffer.from(a || "", "utf-8");
    const bufB = Buffer.from(b || "", "utf-8");
    if (bufA.length !== bufB.length) {
      crypto.timingSafeEqual(bufA, bufA);
      return false;
    }
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

export function matchesAdminPassword(provided, expected) {
  if (!provided || !expected) return false;
  if (timingSafeCompare(provided, expected)) return true;

  const cleanExpected = expected.replace(/^<([\s\S]*)>$/, '$1').replace(/^["']|["']$/g, '');
  const cleanProvided = provided.replace(/^<([\s\S]*)>$/, '$1').replace(/^["']|["']$/g, '');

  if (timingSafeCompare(provided, cleanExpected)) return true;
  if (timingSafeCompare(cleanProvided, expected)) return true;
  if (timingSafeCompare(cleanProvided, cleanExpected)) return true;

  if (cleanProvided.endsWith('#') && timingSafeCompare(cleanProvided.slice(0, -1), cleanExpected)) {
    return true;
  }
  if (cleanExpected.endsWith('#') && timingSafeCompare(cleanProvided, cleanExpected.slice(0, -1))) {
    return true;
  }

  return false;
}

export function matchesAdminEmail(provided, expected) {
  if (!provided || !expected) return false;
  const cleanProvided = provided.trim().toLowerCase().replace(/^["']|["']$/g, '');
  const cleanExpected = expected.trim().toLowerCase().replace(/^["']|["']$/g, '');
  return timingSafeCompare(cleanProvided, cleanExpected);
}

export function generateSessionToken(email) {
  const payload = {
    email,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
    role: "admin",
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", getSessionSecret())
    .update(payloadB64)
    .digest("base64url");
  return `${payloadB64}.${signature}`;
}

export function verifySessionToken(token) {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [payloadB64, signature] = parts;
  const expectedSig = crypto
    .createHmac("sha256", getSessionSecret())
    .update(payloadB64)
    .digest("base64url");

  if (!timingSafeCompare(signature, expectedSig)) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(payloadB64, "base64url").toString("utf-8")
    );
    if (!payload || payload.role !== "admin" || !payload.exp) return null;
    if (Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export function requireAdminAuth(req, res) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : null;

  if (!token) {
    res.status(401).json({ error: "Authentication required for admin access.", status: "unauthorized" });
    return null;
  }

  const session = verifySessionToken(token);
  if (!session) {
    res.status(401).json({ error: "Invalid or expired admin session. Please log in again.", status: "unauthorized" });
    return null;
  }

  return session;
}
