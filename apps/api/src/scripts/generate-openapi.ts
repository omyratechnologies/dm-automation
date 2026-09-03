import { NestFactory } from "@nestjs/core";
import { mkdirSync, writeFileSync } from "fs";
import { resolve } from "path";

async function generate(): Promise<void> {
  // Documentation is a compile-time artifact. It must never start workers or
  // establish provider/database connections merely to inspect controllers.
  process.env.APP_ROLE = "api";
  process.env.NODE_ENV = "test";
  const [{ AppModule }, { buildOpenApiDocuments }] = await Promise.all([
    import("../app.module"),
    import("../docs/openapi"),
  ]);
  const app = await NestFactory.create(AppModule, { logger: false });
  app.setGlobalPrefix("v1", { exclude: ["health", "health/ready"] });
  const documents = buildOpenApiDocuments(app);
  const output = resolve(__dirname, "../../../../docs/contracts/openapi");
  mkdirSync(output, { recursive: true });
  for (const [name, document] of Object.entries(documents)) writeFileSync(resolve(output, `${name}.json`), `${JSON.stringify(document, null, 2)}\n`);
  await app.close();
}

void generate();
