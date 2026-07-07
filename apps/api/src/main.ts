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
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { Logger } from "nestjs-pino";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./common/all-exceptions.filter";
import { applyBodyParser } from "./common/body-parser";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
    rawBody: true, // needed for webhook signature verification
  });
  app.useLogger(app.get(Logger));
  applyBodyParser(app);
  app.setGlobalPrefix("v1", { exclude: ["health", "health/ready"] });
  app.enableCors({
    origin: (process.env.WEB_ORIGIN ?? "http://localhost:3000").split(","),
    credentials: true,
  });
  app.enableShutdownHooks();
  app.useGlobalFilters(new AllExceptionsFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle("DM Automation API")
    .setDescription("Instagram DM automation SaaS backend")
    .setVersion("1.0")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("docs", app, document, {
    jsonDocumentUrl: "openapi.json",
  });

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port, "0.0.0.0");
}

void bootstrap();
