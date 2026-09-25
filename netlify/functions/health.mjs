import { jsonResponse } from "./openrouter.mjs";

export const handler = async () => {
  return jsonResponse(200, {
    status: "healthy",
    timestamp: new Date().toISOString(),
    platform: "netlify-functions",
  });
};
