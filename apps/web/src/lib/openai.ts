import OpenAi from "openai";

let openaiInstance: OpenAi | null = null;

function buildClient(): OpenAi {
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  const openAiKey = process.env.OPENAI_API_KEY || process.env.OPEN_AI_KEY;

  if (openRouterKey) {
    return new OpenAi({
      apiKey: openRouterKey,
      baseURL: process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "X-OpenRouter-Title": "DM Automation",
        "HTTP-Referer": "https://dmautomation.com",
      },
    });
  }

  if (openAiKey) {
    return new OpenAi({ apiKey: openAiKey });
  }

  console.warn("No AI API key found. AI features will not work.");
  throw new Error(
    "AI API key is not configured. Set OPENROUTER_API_KEY or OPENAI_API_KEY.",
  );
}

export const AI_MODEL = process.env.AI_MODEL || "gpt-4o-mini";

export const openai = new Proxy({} as OpenAi, {
  get: (_target, prop) => {
    if (!openaiInstance) {
      try {
        openaiInstance = buildClient();
      } catch {
        return () => {
          throw new Error(
            "AI API key is not configured. Set OPENROUTER_API_KEY or OPENAI_API_KEY.",
          );
        };
      }
    }
    return Reflect.get(openaiInstance, prop);
  },
});
