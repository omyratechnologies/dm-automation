import type { INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule, type OpenAPIObject } from "@nestjs/swagger";

export function buildOpenApiDocuments(app: INestApplication): { internal: OpenAPIObject; admin: OpenAPIObject; partner: OpenAPIObject } {
  const config = new DocumentBuilder()
    .setTitle("Gemai Enterprise API")
    .setDescription("Workspace-scoped lead CRM, automation, Calendar and Sheets API")
    .setVersion("1.0")
    .addServer("/", "Current Gemai deployment")
    .addBearerAuth()
    .addApiKey({ type: "apiKey", in: "header", name: "x-api-key" }, "workspaceApiKey")
    .build();
  const document = SwaggerModule.createDocument(app, config);
  document.components ??= {};
  document.components.schemas ??= {};
  document.components.schemas.ProblemDetails = {
    type: "object",
    required: ["type", "title", "status", "code", "detail", "correlationId"],
    properties: {
      type: { type: "string", example: "https://docs.gemai.app/problems/version-conflict" },
      title: { type: "string", example: "Version conflict" },
      status: { type: "integer", example: 412 },
      code: { type: "string", example: "VERSION_CONFLICT" },
      detail: { type: "string", example: "The resource changed after it was loaded" },
      correlationId: { type: "string", format: "uuid" },
    },
  };
  for (const [path, pathItem] of Object.entries(document.paths)) {
    for (const [method, operation] of Object.entries(pathItem ?? {})) {
      if (!["get", "post", "patch", "put", "delete"].includes(method) || !operation || typeof operation !== "object") continue;
      const mutable = method !== "get";
      const operationRecord = operation as Record<string, unknown>;
      const operationId = String(operationRecord.operationId ?? `${method}-${path}`);
      operationRecord.summary ??= operationId
        .replace(/Controller_/g, "")
        .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
        .replaceAll("_", " ")
        .replace(/^./, (character) => character.toUpperCase());
      operationRecord.description ??= `${operationRecord.summary} in the selected workspace. Errors use stable application/problem+json codes.`;
      const publicOperation = path === "/health" || path === "/health/ready" || path.includes("/webhook") || path.includes("/public/") || path.includes("lead-ingestions");
      const permission = publicOperation ? "public"
        : path.includes("/audit") ? "audit.read"
          : path.includes("/leads") || path.includes("/contacts") || path.includes("/conversations") ? (mutable ? "leads.write" : "leads.read")
            : path.includes("/automations") || path.includes("/flows") || path.includes("/segments") || path.includes("/broadcasts") ? (mutable ? "automations.manage" : "automations.read")
              : path.includes("meeting-invitations") || path.includes("meeting-invitation-options") ? "leads.write,calendar.read"
                : path.includes("/calendar") || path.includes("booking-links") ? (mutable ? "calendar.manage" : "calendar.read")
          : path.includes("/sheets") ? (mutable ? "sheets.manage" : "sheets.read")
                : path.includes("/google") || path.includes("/ig-accounts") ? (mutable ? "integrations.manage" : "integrations.read")
                  : "workspace.access";
      operationRecord["x-required-permission"] = permission;
      const parameters = ((operationRecord.parameters ??= []) as Array<Record<string, unknown>>);
      const requiredQueries = path.endsWith("/google/oauth/callback")
        ? new Set(["state", "code"])
        : path.endsWith("/webhooks/instagram") && method === "get"
          ? new Set(["hub.mode", "hub.verify_token", "hub.challenge"])
          : new Set<string>();
      for (const parameter of parameters) {
        if (parameter.in === "query") parameter.required = parameter.required === true || requiredQueries.has(String(parameter.name));
      }
      for (const name of Array.from(path.matchAll(/\{([^}]+)\}/g), (match) => match[1])) {
        if (!parameters.some((parameter) => parameter.in === "path" && parameter.name === name)) {
          parameters.push({ name, in: "path", required: true, schema: { type: "string", format: "uuid" } });
        }
      }
      const idempotencyExempt = path.includes("/webhooks/") || path.endsWith("/oauth/callback");
      if (mutable && !idempotencyExempt && !parameters.some((parameter) => parameter.in === "header" && String(parameter.name).toLowerCase() === "idempotency-key")) {
        parameters.push({ name: "Idempotency-Key", in: "header", required: true, description: "Unique retry key for this command (maximum 200 characters).", schema: { type: "string", maxLength: 200 }, example: "01J8Y3Q9M3F6X7R2K4P8N1C5VA" });
      }
      const requestBody = operationRecord.requestBody as { content?: Record<string, { example?: unknown }> } | undefined;
      for (const media of Object.values(requestBody?.content ?? {})) media.example ??= { example: "See the request schema for accepted fields" };
      const responses = (operationRecord.responses ??= {}) as Record<string, unknown>;
      for (const status of ["400", "403", "409", "412", "428", "429", "500"]) {
        responses[status] ??= { description: "Stable problem response", content: { "application/problem+json": { schema: { $ref: "#/components/schemas/ProblemDetails" }, example: { type: "https://docs.gemai.app/problems/request-failed", title: "Request failed", status: Number(status), code: status === "412" ? "VERSION_CONFLICT" : status === "428" ? "PRECONDITION_REQUIRED" : "REQUEST_FAILED", detail: "The command could not be completed", correlationId: "4f42da11-0f92-4f24-896e-f25cb6df2bca" } } } };
      }
      for (const [status, response] of Object.entries(responses)) {
        if (!response || typeof response !== "object") continue;
        const responseRecord = response as Record<string, unknown>;
        if (!String(responseRecord.description ?? "").trim()) {
          responseRecord.description = Number(status) >= 400 ? "Stable problem response" : "Successful response";
        }
        if (Number(status) >= 400) {
          responseRecord.content = {
            "application/problem+json": {
              schema: { $ref: "#/components/schemas/ProblemDetails" },
              example: { type: "https://docs.gemai.app/problems/request-failed", title: "Request failed", status: Number(status), code: status === "412" ? "VERSION_CONFLICT" : status === "428" ? "PRECONDITION_REQUIRED" : "REQUEST_FAILED", detail: "The command could not be completed", correlationId: "4f42da11-0f92-4f24-896e-f25cb6df2bca" },
            },
          };
        } else {
          const content = (responseRecord.content ??= { "application/json": {} }) as Record<string, Record<string, unknown>>;
          const media = content["application/json"] ??= {};
          media.example ??= { status: "success" };
        }
      }
    }
  }
  const select = (predicate: (path: string) => boolean): OpenAPIObject => ({ ...document, paths: Object.fromEntries(Object.entries(document.paths).filter(([path]) => predicate(path))) });
  return {
    internal: select((path) => !path.startsWith("/v1/admin")),
    admin: select((path) => path.startsWith("/v1/admin") || path.includes("/audit")),
    partner: select((path) => path.includes("lead-ingestions") || path.includes("/public/booking-links")),
  };
}
