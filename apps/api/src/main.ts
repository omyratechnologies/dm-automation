import { config as dotenvConfig } from "dotenv";
import { resolve } from "path";
import { existsSync } from "fs";

const possiblePaths = [
  resolve(__dirname, "../../.env"),
  resolve(__dirname, "../../../.env"),
  resolve(".env"),
];
for (const p of possiblePaths) {
  if (existsSync(p)) {
    dotenvConfig({ path: p });
    break;
  }
}

import { NestFactory } from "@nestjs/core";
import { apiReference } from "@scalar/nestjs-api-reference";
import helmet from "helmet";
import { Logger } from "nestjs-pino";
import type { NestExpressApplication } from "@nestjs/platform-express";
import type { Request, Response } from "express";
import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./common/all-exceptions.filter";
import { applyBodyParser } from "./common/body-parser";
import { buildOpenApiDocuments } from "./docs/openapi";
import { CorrelationMiddleware } from "./common/correlation.middleware";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
    rawBody: true, // needed for webhook signature verification
  });
  app.useLogger(app.get(Logger));
  const correlation = new CorrelationMiddleware();
  app.use(correlation.use.bind(correlation));
  app.set("trust proxy", 1);
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        frameAncestors: ["'none'"],
      },
    },
    hsts: { maxAge: 31_536_000, includeSubDomains: true, preload: true },
    referrerPolicy: { policy: "no-referrer" },
  }));
  applyBodyParser(app);
  app.setGlobalPrefix("v1", { exclude: ["health", "health/ready"] });
  app.enableCors({
    origin: (process.env.WEB_ORIGIN ?? "http://localhost:3000").split(","),
    credentials: true,
  });
  app.enableShutdownHooks();
  app.useGlobalFilters(new AllExceptionsFilter());

  const { internal: internalDocument, admin: adminDocument, partner: partnerDocument } = buildOpenApiDocuments(app);
  const express = app.getHttpAdapter().getInstance();
  express.get("/openapi/internal.json", (_req: Request, res: Response) => res.json(internalDocument));
  express.get("/openapi/admin.json", (_req: Request, res: Response) => res.json(adminDocument));
  express.get("/openapi/partner.json", (_req: Request, res: Response) => res.json(partnerDocument));
  const scalarCandidates = [
    resolve(process.cwd(), "node_modules/@scalar/api-reference/dist/browser"),
    resolve(process.cwd(), "../../node_modules/@scalar/api-reference/dist/browser"),
  ];
  const scalarAssets = scalarCandidates.find(existsSync);
  if (!scalarAssets) throw new Error("Self-hosted Scalar browser assets were not found");
  app.useStaticAssets(scalarAssets, { prefix: "/docs-assets/" });
  app.use("/docs", apiReference({
    url: "/openapi/internal.json",
    cdn: "/docs-assets/standalone.js",
    pageTitle: "Gemai API Reference",
    theme: "default",
  }));

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port, "0.0.0.0");
}

void bootstrap();
