import { streamOpenRouter, setCors } from "./_lib/openrouter.js";

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed", status: "error" });
  }

  try {
    const { messages } = req.body || {};

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        error: "Invalid request. 'messages' array is required.",
        status: "error",
      });
    }

    const systemMessage = {
      role: "system",
      content:
        "You are CivilMath AI, a helpful assistant for the construction and built environment. Answer questions across all related fields — civil engineering, architecture, structural design, MEP (mechanical, electrical, plumbing), construction management, surveying, geotechnical, materials, and building codes. Provide cautious, formula-grounded explanations where relevant. Do not claim code compliance, prescribe final design decisions, or invent standards; state that project requirements and applicable standards must be checked by a qualified professional. Keep responses concise, clear, and well-formatted in markdown. LANGUAGE: detect the language of the user's latest message and always reply in that same language (for example English, Sinhala, Tamil, Spanish, French, German, Portuguese, or Hindi). If the message mixes languages, use the dominant one.",
    };

    // Stream tokens to the client as they arrive (much faster perceived
    // response than waiting for the full completion).
    const upstream = await streamOpenRouter({
      messages: [systemMessage, ...messages],
      temperature: 0.7,
      maxTokens: 800,
      title: "CivilMath AI Assistant Chat",
    });

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    });
    for await (const chunk of upstream.body) {
      res.write(chunk);
    }
    res.end();
  } catch (error) {
    if (error?.code === "NO_KEY") {
      return res.status(500).json({
        error: "OpenRouter API Key not configured.",
        status: "error",
      });
    }
    console.error("AI Chat Error:", error);
    // If we already started streaming, just end the stream; otherwise JSON error.
    if (res.headersSent) {
      try { res.end(); } catch { /* noop */ }
      return;
    }
    return res.status(500).json({
      error: "Unable to process your message. Please try again.",
      status: "error",
    });
  }
}
