const MODELS = [
  "google/gemini-2.5-flash",
  "openai/gpt-4o-mini",
  "meta-llama/llama-3.1-8b-instruct:free",
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const ALLOWED_ORIGIN = process.env.APP_URL || "https://www.civilmath.com";

export function jsonResponse(statusCode, payload) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    },
    body: JSON.stringify(payload),
  };
}

export function handleOptions() {
  return jsonResponse(204, {});
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
            "HTTP-Referer": process.env.APP_URL || "https://civilmath.netlify.app",
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

export function stripMarkdownJson(content) {
  let cleanContent = content.trim();
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
