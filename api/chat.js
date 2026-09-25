import { callOpenRouter, setCors } from "./_lib/openrouter.js";

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
        "You are CivilMath AI, an educational civil-engineering assistant. Provide cautious, formula-grounded explanations. Do not claim code compliance, prescribe final design decisions, or invent standards; state that project requirements and applicable standards must be checked by a qualified professional. Keep responses concise, clear, and well-formatted in markdown. IMPORTANT: You must ONLY answer questions related to mathematics, structural engineering, and civil engineering. If the user asks about another topic, politely decline.",
    };

    const content = await callOpenRouter({
      messages: [systemMessage, ...messages],
      temperature: 0.7,
      title: "CivilMath AI Assistant Chat",
    });

    return res.status(200).json({ response: content, status: "success" });
  } catch (error) {
    if (error?.code === "NO_KEY") {
      return res.status(500).json({
        error: "OpenRouter API Key not configured.",
        status: "error",
      });
    }
    console.error("AI Chat Error:", error);
    return res.status(500).json({
      error: "Unable to process your message. Please try again.",
      status: "error",
    });
  }
}
