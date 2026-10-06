const MODELS = [
  "google/gemini-2.5-flash",
  "openai/gpt-4o-mini",
  "google/gemma-3-27b-it",
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function setCors(reqOrRes, res) {
  let actualReq = null;
  let actualRes = reqOrRes;
  if (res) {
    actualReq = reqOrRes;
    actualRes = res;
  }
  const reqOrigin = actualReq?.headers?.origin || actualReq?.headers?.Origin || "";
  const allowed = [
    "https://civilmath.com",
    "https://www.civilmath.com",
    "https://civilmath-civil.vercel.app",
    "http://localhost:3000",
    "http://localhost:5173",
  ];
  const isVercel = typeof reqOrigin === "string" && reqOrigin.endsWith(".vercel.app");
  const origin = (allowed.includes(reqOrigin) || isVercel)
    ? reqOrigin
    : (process.env.APP_URL || "*");

  actualRes.setHeader("Access-Control-Allow-Origin", origin);
  actualRes.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  actualRes.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, DELETE");
}

export async function callOpenRouter({
  messages,
  temperature = 0.7,
  jsonObject = false,
  title = "CivilMath AI Assistant",
}) {
  const openrouterKey = process.env.OPENROUTER_API_KEY;
  if (!openrouterKey) {
    const err = new Error("OpenRouter API Key not configured.");
    err.code = "NO_KEY";
    throw err;
  }

  let lastError = null;

  for (const currentModel of MODELS) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const body = {
          model: currentModel,
          messages,
          temperature,
        };
        if (jsonObject) {
          body.response_format = { type: "json_object" };
        }

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${openrouterKey}`,
            "HTTP-Referer": process.env.APP_URL || "https://civilmath.vercel.app",
            "X-Title": title,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
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

        return content;
      } catch (err) {
        lastError = err;
        if (attempt < 2) await sleep(1000);
      }
    }
  }

  throw lastError || new Error("Unable to get a valid response from OpenRouter.");
}

/**
 * Streaming variant of callOpenRouter: returns the upstream fetch Response
 * whose body is an SSE event stream (requires `stream: true` passthrough).
 * Fails fast across the model fallback list — no retry sleeps, so the first
 * token arrives as quickly as possible. The caller pipes response.body to the
 * client. Other callers of callOpenRouter are unaffected.
 */
export async function streamOpenRouter({
  messages,
  temperature = 0.7,
  maxTokens = 800,
  title = "CivilMath AI Assistant",
}) {
  const openrouterKey = process.env.OPENROUTER_API_KEY;
  if (!openrouterKey) {
    const err = new Error("OpenRouter API Key not configured.");
    err.code = "NO_KEY";
    throw err;
  }

  let lastError = null;

  for (const currentModel of MODELS) {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openrouterKey}`,
          "HTTP-Referer": process.env.APP_URL || "https://civilmath.com",
          "X-Title": title,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: currentModel,
          messages,
          temperature,
          max_tokens: maxTokens,
          stream: true,
        }),
      });

      if (!response.ok || !response.body) {
        const errorText = await response.text().catch(() => "");
        throw new Error(`OpenRouter HTTP ${response.status}: ${errorText}`);
      }

      return response;
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error("Unable to get a valid response from OpenRouter.");
}

export function stripMarkdownJson(content) {  let cleanContent = content.trim();
  if (cleanContent.startsWith("```json")) {
    cleanContent = cleanContent.slice(7);
  } else if (cleanContent.startsWith("```")) {
    cleanContent = cleanContent.slice(3);
  }
  if (cleanContent.endsWith("```")) {
    cleanContent = cleanContent.slice(0, -3);
  }
  return cleanContent.trim();
}
