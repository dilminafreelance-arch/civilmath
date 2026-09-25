import { callOpenRouter, handleOptions, jsonResponse } from "./openrouter.mjs";

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return handleOptions();
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method not allowed", status: "error" });
  }

  try {
    const { messages } = JSON.parse(event.body || "{}");

    if (!messages || !Array.isArray(messages)) {
      return jsonResponse(400, {
        error: "Invalid request. 'messages' array is required.",
        status: "error",
      });
    }

    const systemMessage = {
      role: "system",
      content:
        "You are CivilMath AI, an educational civil-engineering assistant. Provide cautious, formula-grounded explanations. Do not claim code compliance, prescribe final design decisions, or invent standards; state that project requirements and applicable standards must be checked by a qualified professional. Keep responses concise, clear, and well-formatted in markdown. IMPORTANT: You must ONLY answer questions related to mathematics, structural engineering, and civil engineering. If the user asks a question about any other topic (e.g., programming, general knowledge, history, everyday advice), politely decline and state that you can only assist with math and civil engineering.",
    };

    const content = await callOpenRouter({
      messages: [systemMessage, ...messages],
      temperature: 0.7,
      title: "CivilMath AI Assistant Chat",
    });

    return jsonResponse(200, { response: content, status: "success" });
  } catch (error) {
    if (error?.code === "NO_KEY") {
      return jsonResponse(500, {
        error: "OpenRouter API Key not configured.",
        status: "error",
      });
    }
    console.error("AI Chat Error:", error);
    return jsonResponse(500, {
      error: "Unable to process your message. Please try again.",
      status: "error",
    });
  }
};
