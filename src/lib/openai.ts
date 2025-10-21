import OpenAi from "openai";

// Lazy initialization to avoid build-time errors
let openaiInstance: OpenAi | null = null;

export const openai = new Proxy({} as OpenAi, {
  get: (target, prop) => {
    if (!openaiInstance) {
      const apiKey = process.env.OPENAI_API_KEY || process.env.OPEN_AI_KEY;
      
      if (!apiKey) {
        console.warn('OpenAI API key not found. AI features will not work.');
        // Return a mock that throws helpful errors
        return () => {
          throw new Error('OpenAI API key is not configured. Please set OPENAI_API_KEY environment variable.');
        };
      }
      
      openaiInstance = new OpenAi({
        apiKey: apiKey,
      });
    }
    
    return (openaiInstance as any)[prop];
  }
});
