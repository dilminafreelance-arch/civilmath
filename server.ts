import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { createServer as createViteServer } from "vite";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { rowToArticle, articleToRow } from "./api/_lib/articleMapper.js";

// Load environment variables (.env.local overrides .env when present)
dotenv.config();
dotenv.config({ path: ".env.local", override: true });

// Initialize Express
const app = express();
const PORT = 3000;

// Security middleware — relaxed CSP for Vite dev mode
app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(express.json({ limit: '10mb' }));

// Rate limiters
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: "Too many requests, please try again later.", status: "error" },
  standardHeaders: true,
  legacyHeaders: false,
});

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { error: "Too many requests, please try again later.", status: "error" },
  standardHeaders: true,
  legacyHeaders: false,
});

function validateString(val: unknown, maxLen = 5000): string {
  if (typeof val !== 'string' || val.length > maxLen) return '';
  return val;
}

function validateObject(val: unknown): Record<string, unknown> {
  if (typeof val !== 'object' || val === null || Array.isArray(val)) return {};
  return val as Record<string, unknown>;
}

// Health Check API
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// ─────────────────────────────────────────────────────────────
// Admin Authentication (Server-Side Only - Node Crypto & Env)
// ─────────────────────────────────────────────────────────────
function getAdminCredentials() {
  const emailRaw = process.env.ADMIN_EMAIL || process.env.ADMIN_USER || process.env.ADMIN_USERNAME || "";
  const passRaw = process.env.ADMIN_PASSWORD || process.env.ADMIN_PASS || "";
  return {
    email: emailRaw.trim().toLowerCase().replace(/^["']|["']$/g, ""),
    password: passRaw.trim().replace(/^["']|["']$/g, ""),
  };
}

function getSessionSecret(): string {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    process.env.ADMIN_PASSWORD ||
    "civilmath-session-fallback-secret-2026"
  );
}

// Constant-time string comparison to prevent timing side-channel attacks
function timingSafeCompare(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a, "utf-8");
    const bufB = Buffer.from(b, "utf-8");
    if (bufA.length !== bufB.length) {
      crypto.timingSafeEqual(bufA, bufA);
      return false;
    }
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

function matchesAdminPassword(provided: string, expected: string): boolean {
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

function matchesAdminEmail(provided: string, expected: string): boolean {
  if (!provided || !expected) return false;
  const cleanProvided = provided.trim().toLowerCase().replace(/^["']|["']$/g, '');
  const cleanExpected = expected.trim().toLowerCase().replace(/^["']|["']$/g, '');
  return timingSafeCompare(cleanProvided, cleanExpected);
}

interface AdminSessionPayload {
  email: string;
  exp: number;
  role: "admin";
}

function generateSessionToken(email: string): string {
  const payload: AdminSessionPayload = {
    email,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days expiration
    role: "admin",
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", getSessionSecret())
    .update(payloadB64)
    .digest("base64url");
  return `${payloadB64}.${signature}`;
}

function verifySessionToken(token: string): AdminSessionPayload | null {
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
    ) as AdminSessionPayload;
    if (!payload || payload.role !== "admin" || !payload.exp) return null;
    if (Date.now() > payload.exp) return null; // expired
    return payload;
  } catch {
    return null;
  }
}

// Middleware: Require Admin Authentication
function requireAdminAuth(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : null;

  if (!token) {
    return res
      .status(401)
      .json({ error: "Authentication required for admin access.", status: "unauthorized" });
  }

  const session = verifySessionToken(token);
  if (!session) {
    return res
      .status(401)
      .json({ error: "Invalid or expired admin session. Please log in again.", status: "unauthorized" });
  }

  (req as any).adminSession = session;
  next();
}

// Dedicated login rate limiter: 10 attempts per 15 minutes
const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    error: "Too many login attempts. Please wait 15 minutes before trying again.",
    status: "rate_limited",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Admin Login
app.post("/api/admin/login", adminLoginLimiter, (req, res) => {
  const { email, password } = req.body || {};
  const config = getAdminCredentials();

  if (!config.email || !config.password) {
    console.error("ADMIN_EMAIL or ADMIN_PASSWORD is missing in server environment variables!");
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
  return res.json({
    status: "success",
    token,
    user: {
      email: config.email,
      role: "admin",
    },
    message: "Admin authentication successful.",
  });
});

// Admin Verify Session
app.get("/api/admin/verify", (req, res) => {
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

  return res.json({
    authenticated: true,
    user: {
      email: session.email,
      role: session.role,
    },
  });
});

// Admin Logout
app.post("/api/admin/logout", (req, res) => {
  return res.json({ status: "success", message: "Logged out successfully." });
});

// Articles storage helpers
const ARTICLES_FILE = path.join(process.cwd(), "data", "customArticles.json");

let supabaseServerClient: SupabaseClient | null = null;
function getSupabaseServer(): SupabaseClient | null {
  if (supabaseServerClient) return supabaseServerClient;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  try {
    supabaseServerClient = createClient(url, key, {
      auth: { persistSession: false },
    });
    return supabaseServerClient;
  } catch (err) {
    console.warn("Failed to initialize Supabase client on server:", err);
    return null;
  }
}

function readStoredArticles(): any[] {
  try {
    if (!fs.existsSync(ARTICLES_FILE)) return [];
    const content = fs.readFileSync(ARTICLES_FILE, "utf-8");
    return JSON.parse(content) || [];
  } catch (err) {
    console.error("Error reading custom articles:", err);
    return [];
  }
}

function writeStoredArticles(articles: any[]) {
  try {
    const dir = path.dirname(ARTICLES_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(ARTICLES_FILE, JSON.stringify(articles, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing custom articles:", err);
  }
}

// Articles API - Get all custom articles
app.get("/api/articles", async (req, res) => {
  const supabase = getSupabaseServer();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .order("published_at", { ascending: false });

      if (!error && Array.isArray(data)) {
        const mapped = data.map(rowToArticle);
        return res.json(mapped);
      }
      if (error) {
        console.warn("Supabase fetch error in server.ts:", error.message);
      }
    } catch (err) {
      console.warn("Supabase fetch exception in server.ts, falling back to local file:", err);
    }
  }
  const articles = readStoredArticles();
  res.json(articles);
});

// Articles API - Get single article
app.get("/api/articles/:slug", async (req, res) => {
  const { slug } = req.params;
  const supabase = getSupabaseServer();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (!error && data) {
        return res.json(rowToArticle(data));
      }
      if (error) {
        console.warn("Supabase single fetch error in server.ts:", error.message);
      }
    } catch (err) {
      console.warn("Supabase single fetch exception, checking local file:", err);
    }
  }
  const articles = readStoredArticles();
  const article = articles.find((a: any) => a.slug?.toLowerCase() === slug.toLowerCase());
  if (!article) {
    return res.status(404).json({ error: "Article not found", status: "not_found" });
  }
  res.json(article);
});

// Articles API - Save / Update an article
app.post("/api/articles", requireAdminAuth, async (req, res) => {
  const article = req.body;
  if (!article || !article.slug || !article.title) {
    return res.status(400).json({ error: "Slug and title are required." });
  }

  // Also sync to local file for backup/offline
  const articles = readStoredArticles();
  const idx = articles.findIndex((a: any) => a.slug?.toLowerCase() === article.slug?.toLowerCase());
  const now = new Date().toISOString();

  if (idx >= 0) {
    articles[idx] = { ...article, updatedAt: now };
  } else {
    articles.unshift({ ...article, publishedAt: article.publishedAt || now, updatedAt: now });
  }
  writeStoredArticles(articles);

  const supabase = getSupabaseServer();
  if (supabase) {
    try {
      const row = articleToRow(article);
      const { data, error } = await supabase
        .from("articles")
        .upsert(row, { onConflict: "slug" })
        .select()
        .single();
      if (error) {
        console.error("Supabase upsert error in server.ts:", error);
      } else if (data) {
        return res.json({ status: "success", article: rowToArticle(data) });
      }
    } catch (err) {
      console.error("Supabase upsert exception in server.ts:", err);
    }
  }

  res.json({ status: "success", article });
});

// Articles API - Bulk upload articles
app.post("/api/articles/bulk", requireAdminAuth, async (req, res) => {
  const items = req.body;
  if (!Array.isArray(items)) {
    return res.status(400).json({ error: "Expected an array of articles." });
  }

  const articles = readStoredArticles();
  let added = 0;
  let updated = 0;
  const now = new Date().toISOString();

  for (const item of items) {
    if (!item || !item.slug || !item.title) continue;
    const idx = articles.findIndex((a: any) => a.slug?.toLowerCase() === item.slug?.toLowerCase());
    if (idx >= 0) {
      articles[idx] = { ...item, updatedAt: now };
      updated++;
    } else {
      articles.unshift({ ...item, publishedAt: item.publishedAt || now, updatedAt: now });
      added++;
    }
  }
  writeStoredArticles(articles);

  const supabase = getSupabaseServer();
  if (supabase) {
    try {
      const rows = items
        .filter((item: any) => item && item.slug && item.title)
        .map(articleToRow);
      if (rows.length > 0) {
        const { error } = await supabase
          .from("articles")
          .upsert(rows, { onConflict: "slug" });
        if (error) {
          console.error("Supabase bulk upsert error in server.ts:", error);
        }
      }
    } catch (err) {
      console.error("Supabase bulk upsert exception in server.ts:", err);
    }
  }

  res.json({ status: "success", added, updated, total: articles.length });
});

// Articles API - Delete article
app.delete("/api/articles/:slug", requireAdminAuth, async (req, res) => {
  const { slug } = req.params;
  const articles = readStoredArticles();
  const filtered = articles.filter((a: any) => a.slug?.toLowerCase() !== slug.toLowerCase());
  writeStoredArticles(filtered);

  const supabase = getSupabaseServer();
  if (supabase) {
    try {
      const { error } = await supabase
        .from("articles")
        .delete()
        .eq("slug", slug);
      if (error) {
        console.error("Supabase delete error in server.ts:", error);
      }
    } catch (err) {
      console.error("Supabase delete exception in server.ts:", err);
    }
  }

  res.json({ status: "success", message: `Article ${slug} deleted.` });
});

// Image Upload API (Article Cover & Inline Visuals)
app.post("/api/upload", requireAdminAuth, (req, res) => {
  try {
    const { image, filename } = req.body || {};
    if (!image || typeof image !== "string") {
      return res.status(400).json({ error: "Image data is required.", status: "error" });
    }

    const match = image.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
    let ext = "png";
    let buffer: Buffer;

    if (match) {
      ext = match[1].toLowerCase().replace("jpeg", "jpg").replace("svg+xml", "svg");
      buffer = Buffer.from(match[2], "base64");
    } else {
      buffer = Buffer.from(image, "base64");
    }

    if (buffer.length > 10 * 1024 * 1024) {
      return res.status(400).json({ error: "Image file exceeds 10MB maximum limit.", status: "error" });
    }

    const baseName = (filename || "article-image")
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9_-]/g, "-")
      .substring(0, 40)
      .toLowerCase();
    const finalFilename = `${Date.now()}-${baseName || "img"}.${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "articles");

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const targetPath = path.join(uploadDir, finalFilename);
    fs.writeFileSync(targetPath, buffer);

    const publicUrl = `/uploads/articles/${finalFilename}`;
    return res.json({
      status: "success",
      url: publicUrl,
      filename: finalFilename,
      size: buffer.length,
    });
  } catch (err: any) {
    console.error("Image upload error:", err);
    return res.status(500).json({ error: err.message || "Failed to process image upload.", status: "error" });
  }
});

// Auto SEO API endpoint (AI-enhanced if key available)
app.post("/api/seo/generate", requireAdminAuth, async (req, res) => {
  const { title, content, category } = req.body;
  if (!title) {
    return res.status(400).json({ error: "Title is required." });
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

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openrouterKey}`,
        "HTTP-Referer": process.env.APP_URL || "https://civilmath.com",
        "X-Title": "CivilMath SEO Generator",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3
      })
    });

    if (response.ok) {
      const data = await response.json();
      const rawText = data?.choices?.[0]?.message?.content?.trim();
      const cleaned = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
      const parsed = JSON.parse(cleaned);
      return res.json({ status: "success", seo: parsed });
    }
  } catch (err: any) {
    console.warn("AI SEO generation error:", err.message);
  }

  res.json({ fallback: true });
});

// AI Explanation endpoint
app.post("/api/explain", apiLimiter, async (req, res) => {
  const calculatorId = validateString(req.body?.calculatorId, 100);
  const calculatorName = validateString(req.body?.calculatorName, 200);
  const inputs = validateObject(req.body?.inputs);
  const outputs = validateObject(req.body?.outputs);
  const unitSystem = validateString(req.body?.unitSystem, 50);
  const customQuestion = validateString(req.body?.customQuestion, 2000);

  if (!calculatorId || !calculatorName) {
    return res.status(400).json({ error: "Missing required fields.", status: "error" });
  }

  try {
    const openrouterKey = process.env.OPENROUTER_API_KEY;

    if (!openrouterKey) {
      return res.status(500).json({
        error: "AI service not configured.",
        status: "error"
      });
    }

    // Format the calculator state into a text block for prompt grounding
    const dataSummary = `
Calculator: ${calculatorName} (${calculatorId})
Unit System: ${unitSystem}
Inputs: ${JSON.stringify(inputs, null, 2)}
Computed Results: ${JSON.stringify(outputs, null, 2)}
User Query: ${customQuestion || "Requesting general engineering analysis, safety warnings, and structural optimizations for this calculation result."}
`;

    const systemInstruction = `You are an educational civil-engineering assistant. Provide cautious, safety-focused and formula-grounded explanations in a strict JSON schema structure. Do not claim code compliance, invent standards or prescribe final design decisions; advise verification against the project requirements and applicable standards by a qualified professional.
IMPORTANT: You MUST return a single valid JSON object. Do not wrap it in markdown code blocks like \`\`\`json. Return only the raw JSON.
The JSON object must match this schema structure:
{
  "explanation": "A detailed, clear scientific and engineering review/explanation of the calculation parameters and the physical meaning of results.",
  "recommendations": [
    "highly actionable design recommendation 1",
    "highly actionable design recommendation 2",
    "highly actionable design recommendation 3"
  ],
  "safetyNotes": "Critical safety warnings and a reminder to verify applicable project requirements with a qualified professional."
}`;

    const userMessage = `Analyze the following civil engineering computation data and user query:

${dataSummary}

Provide an educational engineering review with explanation, recommendations, and safetyNotes in the requested JSON structure.`;

    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    let resultJson: any = null;
    const models = ["google/gemini-2.5-flash", "openai/gpt-4o-mini", "google/gemma-3-27b-it"];

    for (let i = 0; i < models.length; i++) {
      const currentModel = models[i];
      let success = false;
      
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          console.log(`Sending of request to OpenRouter. Model: ${currentModel}, Attempt: ${attempt}`);
          
          const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${openrouterKey}`,
              "HTTP-Referer": process.env.APP_URL || "https://ai.studio/build",
              "X-Title": "CivilMath AI Assistant",
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              model: currentModel,
              messages: [
                { role: "system", content: systemInstruction },
                { role: "user", content: userMessage }
              ],
              response_format: { type: "json_object" },
              temperature: 0.3
            })
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`OpenRouter HTTP ${response.status}: ${errorText}`);
          }

          const data = await response.json();
          const content = data?.choices?.[0]?.message?.content?.trim();
          
          if (!content) {
            throw new Error(`OpenRouter returned empty content on model ${currentModel}`);
          }

          // Strip potential markdown wrappers
          let cleanContent = content;
          if (cleanContent.startsWith("```json")) {
            cleanContent = cleanContent.slice(7);
          } else if (cleanContent.startsWith("```")) {
            cleanContent = cleanContent.slice(3);
          }
          if (cleanContent.endsWith("```")) {
            cleanContent = cleanContent.slice(0, -3);
          }
          cleanContent = cleanContent.trim();

          try {
            resultJson = JSON.parse(cleanContent);
            if (resultJson.explanation && resultJson.recommendations && resultJson.safetyNotes) {
              success = true;
              break;
            } else {
              throw new Error("JSON structure parsed but lacked expected properties ('explanation', 'recommendations', or 'safetyNotes')");
            }
          } catch (jsonErr: any) {
            console.warn("Raw response was not valid JSON or lacked schema:", cleanContent);
            throw jsonErr;
          }

        } catch (err: any) {
          console.warn(`Attempt ${attempt} on model ${currentModel} failed:`, err.message || err);
          if (attempt < 2) {
            await sleep(1000);
          }
        }
      }

      if (success && resultJson) {
        break;
      }
    }

    if (!resultJson) {
      throw new Error("Unable to get valid structured review from OpenRouter after trying multiple models.");
    }

    return res.json({ ...resultJson, status: "success" });

  } catch (error: any) {
    console.error("AI API Error:", error);
    return res.status(500).json({
      error: "Unable to process your request. Please try again.",
      status: "error"
    });
  }
});

// AI Chatbot endpoint
app.post("/api/chat", chatLimiter, async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "Invalid request. 'messages' array is required." });
  }

  // Validate message structure
  for (const msg of messages) {
    if (typeof msg !== 'object' || typeof msg.role !== 'string' || typeof msg.content !== 'string') {
      return res.status(400).json({ error: "Invalid message format." });
    }
    if (msg.content.length > 4000) {
      return res.status(400).json({ error: "Message too long." });
    }
  }

  try {
    const openrouterKey = process.env.OPENROUTER_API_KEY;

    if (!openrouterKey) {
      return res.status(500).json({
        error: "OpenRouter API Key not configured.",
        status: "error"
      });
    }

    const systemMessage = {
      role: "system",
      content: "You are CivilMath AI, an educational civil-engineering assistant. Provide cautious, formula-grounded explanations. Do not claim code compliance, prescribe final design decisions, or invent standards; state that project requirements and applicable standards must be checked by a qualified professional. Keep responses concise, clear, and well-formatted in markdown. You can answer general civil engineering questions or analyze calculations if context is provided."
    };

    const apiMessages = [systemMessage, ...messages];

    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    let resultText = "";
    const models = ["google/gemini-2.5-flash", "openai/gpt-4o-mini", "google/gemma-3-27b-it"];

    for (let i = 0; i < models.length; i++) {
      const currentModel = models[i];
      let success = false;

      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          console.log(`Sending chat request to OpenRouter. Model: ${currentModel}, Attempt: ${attempt}`);

          const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${openrouterKey}`,
              "HTTP-Referer": process.env.APP_URL || "https://ai.studio/build",
              "X-Title": "CivilMath AI Assistant Chat",
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              model: currentModel,
              messages: apiMessages,
              temperature: 0.7
            })
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`OpenRouter HTTP ${response.status}: ${errorText}`);
          }

          const data = await response.json();
          const content = data?.choices?.[0]?.message?.content?.trim();

          if (content) {
            resultText = content;
            success = true;
            break;
          } else {
            throw new Error(`OpenRouter returned empty content on model ${currentModel}`);
          }

        } catch (err: any) {
          console.warn(`Chat attempt ${attempt} on model ${currentModel} failed:`, err.message || err);
          if (attempt < 2) {
            await sleep(1000);
          }
        }
      }

      if (success && resultText) {
        break;
      }
    }

    if (!resultText) {
      throw new Error("Unable to get valid chat response from OpenRouter after trying multiple models.");
    }

    return res.json({ response: resultText, status: "success" });

  } catch (error: any) {
    console.error("AI Chat Error:", error);
    return res.status(500).json({
      error: "Unable to process your message. Please try again.",
      status: "error"
    });
  }
});

// Explicit 404 for unmatched /api/* routes so they never fall through to Vite HTML middlewares
app.all("/api/*", (req, res) => {
  res.status(404).json({
    error: `API route ${req.method} ${req.path} not found.`,
    status: "not_found",
  });
});

// Setup Vite & Static Assets Handlers
async function startServer() {
  const isProduction = process.env.NODE_ENV === "production" || Boolean(process.argv[1]?.includes("dist"));

  if (!isProduction) {
    // Vite Middlewares in development mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production mode
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "127.0.0.1", () => {
    console.log(`CivilMath Full-Stack server booted at http://localhost:${PORT}`);
  });
}

startServer();
