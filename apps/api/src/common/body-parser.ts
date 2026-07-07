import type { NestExpressApplication } from "@nestjs/platform-express";

/**
 * Raise the JSON body limit to 1mb. Must go through Nest's useBodyParser so
 * the rawBody capture hook (NestFactory { rawBody: true }) stays attached —
 * a plain app.use(express.json()) runs first, consumes the stream, and leaves
 * req.rawBody undefined, which breaks webhook signature verification.
 */
export function applyBodyParser(app: NestExpressApplication): void {
  app.useBodyParser("json", { limit: "1mb" });
}
