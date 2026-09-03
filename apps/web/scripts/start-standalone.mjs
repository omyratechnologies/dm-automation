import { cpSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import nextEnv from "@next/env";

const appRoot = process.cwd();
process.env.NODE_ENV ??= "production";
nextEnv.loadEnvConfig(appRoot, false);
const standaloneRoot = join(appRoot, ".next", "standalone");
const runtimeApp = join(standaloneRoot, "apps", "web");
const serverPath = join(runtimeApp, "server.js");

if (!existsSync(serverPath)) {
  throw new Error("Standalone build not found. Run `npm run build --workspace @repo/web` first.");
}

// Next's standalone trace intentionally omits static/public assets. Docker
// copies them in its runtime stage; this keeps the local production start
// command equivalent and prevents a server with missing CSS or images.
mkdirSync(join(runtimeApp, ".next"), { recursive: true });
cpSync(join(appRoot, ".next", "static"), join(runtimeApp, ".next", "static"), { recursive: true, force: true });
cpSync(join(appRoot, "public"), join(runtimeApp, "public"), { recursive: true, force: true });

process.env.HOSTNAME ??= "0.0.0.0";
process.chdir(standaloneRoot);
await import(pathToFileURL(serverPath).href);
