import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1).default("redis://localhost:6379"),

  CLERK_SECRET_KEY: z.string().min(1),
  CLERK_PUBLISHABLE_KEY: z.string().optional(),

  // Meta / Instagram
  INSTAGRAM_APP_ID: z.string().default(""),
  INSTAGRAM_APP_SECRET: z.string().default(""),
  INSTAGRAM_WEBHOOK_VERIFY_TOKEN: z.string().default(""),
  INSTAGRAM_GRAPH_URL: z.string().default("https://graph.instagram.com/v25.0"),
  INSTAGRAM_OAUTH_REDIRECT_URI: z.string().default(""),

  // Stripe
  STRIPE_SECRET_KEY: z.string().default(""),
  STRIPE_WEBHOOK_SECRET: z.string().default(""),
  STRIPE_PRICE_PRO: z.string().default(""),

  // AI — OpenRouter (primary) with OpenAI fallback
  OPENROUTER_API_KEY: z.string().default(""),
  OPENROUTER_BASE_URL: z.string().default("https://openrouter.ai/api/v1"),
  AI_MODEL: z.string().default("gpt-4o-mini"),
  OPENAI_API_KEY: z.string().default(""),

  // 32-byte base64 master key for envelope encryption (LocalAesKms)
  TOKEN_MASTER_KEY: z.string().min(1),

  WEB_ORIGIN: z.string().default("http://localhost:3000"),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new Error(`Invalid environment configuration: ${issues}`);
  }
  return parsed.data;
}
