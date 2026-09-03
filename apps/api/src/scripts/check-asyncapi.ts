import { readFileSync } from "fs";
import { resolve } from "path";
import { DiagnosticSeverity, Parser } from "@asyncapi/parser";
import { diff } from "@asyncapi/diff";
import { domainEventTypes } from "@repo/shared";

async function parse(path: string) {
  const source = readFileSync(resolve(path), "utf8");
  const result = await new Parser().parse(source, { source: path });
  const errors = result.diagnostics.filter((diagnostic) => diagnostic.severity === DiagnosticSeverity.Error);
  if (!result.document || errors.length) {
    for (const diagnostic of errors) console.error(`${path}: ${diagnostic.message}`);
    throw new Error(`Invalid AsyncAPI contract: ${path}`);
  }
  return result.document.json();
}

async function main(): Promise<void> {
  const [firstPath, secondPath] = process.argv.slice(2);
  if (!firstPath) throw new Error("Usage: check-asyncapi <current> OR check-asyncapi <baseline> <current>");
  if (!secondPath) {
    const current = await parse(firstPath) as any;
    const documented = current.components?.schemas?.DomainEventEnvelope?.properties?.type?.enum ?? [];
    const missing = domainEventTypes.filter((type) => !documented.includes(type));
    const unknown = documented.filter((type: string) => !domainEventTypes.includes(type as (typeof domainEventTypes)[number]));
    if (missing.length || unknown.length) throw new Error(`AsyncAPI event catalog drift. Missing: ${missing.join(", ") || "none"}; unknown: ${unknown.join(", ") || "none"}`);
    console.log(`AsyncAPI contract is valid: ${firstPath}`);
    return;
  }
  const [baseline, current] = await Promise.all([parse(firstPath), parse(secondPath)]);
  const breaking = diff(baseline, current, { outputType: "json" }).breaking();
  const changes = typeof breaking === "string" ? JSON.parse(breaking) : breaking;
  if (Array.isArray(changes) && changes.length) {
    console.error(JSON.stringify(changes, null, 2));
    throw new Error("Breaking AsyncAPI changes detected");
  }
  console.log("No breaking AsyncAPI changes detected");
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
