import { callOpenRouter, handleOptions, jsonResponse, stripMarkdownJson } from "./openrouter.mjs";

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return handleOptions();
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method not allowed", status: "error" });
  }

  try {
    const { calculatorId, calculatorName, inputs, outputs, unitSystem, customQuestion } =
      JSON.parse(event.body || "{}");

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

    const content = await callOpenRouter({
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: userMessage },
      ],
      temperature: 0.3,
      jsonObject: true,
      title: "CivilMath AI Assistant",
    });

    const resultJson = JSON.parse(stripMarkdownJson(content));
    if (!resultJson.explanation || !resultJson.recommendations || !resultJson.safetyNotes) {
      throw new Error("JSON structure parsed but lacked expected properties");
    }

    return jsonResponse(200, { ...resultJson, status: "success" });
  } catch (error) {
    if (error?.code === "NO_KEY") {
      return jsonResponse(500, {
        error: "OpenRouter API Key not configured.",
        status: "error",
      });
    }
    console.error("AI API Error:", error);
    return jsonResponse(500, {
      error: "Unable to process your request. Please try again.",
      status: "error",
    });
  }
};
