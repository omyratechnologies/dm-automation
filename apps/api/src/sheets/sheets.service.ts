import { HttpStatus, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { createHash, randomBytes, randomUUID } from "crypto";
import { ConfigService } from "@nestjs/config";
import { GoogleApiClient } from "../google/google-api.client";
import { ProblemException } from "../common/problem-details";
import { PrismaService } from "../prisma/prisma.service";
import type { CreateSheetDestinationDto, ReplaceSheetMappingsDto, ResolveSheetConflictDto } from "./sheets.dto";

export const MANAGED_HEADERS = ["_gemai_lead_id", "_gemai_lead_version", "_gemai_mapping_version", "_gemai_sync_hash", "_gemai_synced_at", "_gemai_status"] as const;

@Injectable()
export class SheetsService {
  constructor(private readonly prisma: PrismaService, private readonly google: GoogleApiClient, private readonly config: ConfigService) {}

  list(workspaceId: string) {
    return this.prisma.sheetDestination.findMany({ where: { workspaceId }, include: { mappings: { orderBy: { columnIndex: "asc" } }, _count: { select: { conflicts: { where: { status: "OPEN" } }, rows: true } } }, orderBy: { createdAt: "desc" } });
  }

  async create(workspaceId: string, input: CreateSheetDestinationDto) {
    const binding = await this.prisma.googleBinding.findUnique({ where: { id_workspaceId: { id: input.googleBindingId, workspaceId } } });
    if (!binding || binding.status !== "ACTIVE" || binding.ownership !== "WORKSPACE" || !binding.capabilities.includes("SHEETS")) throw new ProblemException(HttpStatus.UNPROCESSABLE_ENTITY, "GOOGLE_BINDING_INVALID", "Sheets binding invalid", "Sheets destinations require an active admin-authorized workspace binding");
    if (input.pipelineId) {
      const pipeline = await this.prisma.leadPipeline.findUnique({ where: { id_workspaceId: { id: input.pipelineId, workspaceId } } });
      if (!pipeline) throw new ProblemException(HttpStatus.UNPROCESSABLE_ENTITY, "PIPELINE_NOT_FOUND", "Pipeline not found", "The selected pipeline is outside this workspace");
    }
    return this.prisma.sheetDestination.create({ data: { workspaceId, ...input } });
  }

  async replaceMappings(workspaceId: string, destinationId: string, expectedVersion: number, input: ReplaceSheetMappingsDto) {
    const destination = await this.get(workspaceId, destinationId);
    if (destination.version !== expectedVersion) throw this.versionConflict();
    const duplicateColumns = new Set(input.mappings.map((mapping) => mapping.columnIndex)).size !== input.mappings.length;
    const duplicateFields = new Set(input.mappings.map((mapping) => mapping.fieldKey)).size !== input.mappings.length;
    if (duplicateColumns || duplicateFields) throw new ProblemException(HttpStatus.UNPROCESSABLE_ENTITY, "SHEET_MAPPING_INVALID", "Mapping invalid", "Each column and field may be mapped only once");
    return this.prisma.$transaction(async (tx) => {
      await tx.sheetColumnMapping.deleteMany({ where: { destinationId, workspaceId } });
      await tx.sheetColumnMapping.createMany({ data: input.mappings.map((mapping) => ({ destinationId, workspaceId, ...mapping })) });
      return tx.sheetDestination.update({ where: { id_workspaceId: { id: destinationId, workspaceId } }, data: { mappingVersion: { increment: 1 }, version: { increment: 1 } }, include: { mappings: true } });
    });
  }

  async preview(workspaceId: string, destinationId: string) {
    const destination = await this.get(workspaceId, destinationId);
    const values = await this.google.getSheetValues(workspaceId, destination.googleBindingId, destination.spreadsheetId, `${this.quote(destination.sheetTitle)}!A1:ZZ6`);
    return { headers: values.values?.[0] ?? [], sampleRows: values.values?.slice(1, 6) ?? [], mappings: destination.mappings };
  }

  async activate(workspaceId: string, destinationId: string, expectedVersion: number) {
    const destination = await this.get(workspaceId, destinationId);
    if (destination.version !== expectedVersion) throw this.versionConflict();
    const file = await this.google.getDriveFile(workspaceId, destination.googleBindingId, destination.spreadsheetId);
    if (file.mimeType !== "application/vnd.google-apps.spreadsheet" || !file.capabilities?.canEdit) throw new ProblemException(HttpStatus.FORBIDDEN, "GOOGLE_SCOPE_MISSING", "Spreadsheet is not editable", "The connected account must be able to edit the selected spreadsheet");
    if ((file.permissions ?? []).some((permission) => permission.type === "anyone")) throw new ProblemException(HttpStatus.UNPROCESSABLE_ENTITY, "SHEET_PUBLIC_SHARING_BLOCKED", "Public spreadsheet blocked", "Remove public or anyone-with-link access before activation");
    if (!destination.mappings.length) throw new ProblemException(HttpStatus.UNPROCESSABLE_ENTITY, "SHEET_MAPPING_INVALID", "Mapping required", "Add at least one column mapping before activation");
    const fields = await this.prisma.leadField.findMany({ where: { workspaceId, key: { in: destination.mappings.map((mapping) => mapping.fieldKey) } } });
    const fieldByKey = new Map(fields.map((field) => [field.key, field]));
    for (const mapping of destination.mappings) {
      const field = fieldByKey.get(mapping.fieldKey);
      if (field?.classification === "SENSITIVE" && ["APP_OWNED", "TWO_WAY"].includes(mapping.direction) && (field.sheetExportPolicy === "DENY" || !mapping.sensitiveExportApproved)) throw new ProblemException(HttpStatus.UNPROCESSABLE_ENTITY, "SENSITIVE_EXPORT_DENIED", "Sensitive export denied", `Field ${mapping.fieldKey} is not approved for Sheet export`);
    }
    const header = await this.google.getSheetValues(workspaceId, destination.googleBindingId, destination.spreadsheetId, `${this.quote(destination.sheetTitle)}!1:1`);
    const existing = (header.values?.[0] ?? []).map(String);
    const drift = destination.mappings.filter((mapping) => existing[mapping.columnIndex] && existing[mapping.columnIndex] !== mapping.columnName);
    if (drift.length) throw new ProblemException(HttpStatus.CONFLICT, "SHEET_SCHEMA_DRIFT", "Sheet header drift", "One or more mapped headers changed; review the mapping before activation");
    const maxColumn = Math.max(...destination.mappings.map((mapping) => mapping.columnIndex));
    const headers = Array.from({ length: maxColumn + 1 }, (_, index) => destination.mappings.find((mapping) => mapping.columnIndex === index)?.columnName ?? existing[index] ?? "");
    headers.push(...MANAGED_HEADERS);
    await this.google.updateSheetValues(workspaceId, destination.googleBindingId, destination.spreadsheetId, `${this.quote(destination.sheetTitle)}!A1`, [headers]);
    await this.google.batchUpdateSpreadsheet(workspaceId, destination.googleBindingId, destination.spreadsheetId, [
      { updateDimensionProperties: { range: { sheetId: destination.sheetId, dimension: "COLUMNS", startIndex: maxColumn + 1, endIndex: maxColumn + 1 + MANAGED_HEADERS.length }, properties: { hiddenByUser: true }, fields: "hiddenByUser" } },
      { addProtectedRange: { protectedRange: { range: { sheetId: destination.sheetId, startRowIndex: 0, endRowIndex: 1 }, description: "Gemai managed headers", warningOnly: true } } },
    ]);
    await this.ensureDriveWatch(workspaceId, destination.googleBindingId);
    return this.prisma.sheetDestination.update({ where: { id_workspaceId: { id: destinationId, workspaceId } }, data: { status: "ACTIVE", version: { increment: 1 }, lastErrorCode: null } });
  }

  async resolveConflict(workspaceId: string, conflictId: string, input: ResolveSheetConflictDto, resolvedById: string) {
    const conflict = await this.prisma.sheetSyncConflict.findFirst({ where: { id: conflictId, workspaceId, status: "OPEN" } });
    if (!conflict) throw new ProblemException(HttpStatus.NOT_FOUND, "SHEET_SYNC_CONFLICT", "Conflict not found", "The Sheet conflict is not open in this workspace");
    return this.prisma.sheetSyncConflict.update({ where: { id: conflict.id }, data: { status: input.resolution === "APP" ? "RESOLVED_APP" : input.resolution === "SHEET" ? "RESOLVED_SHEET" : "RESOLVED_MERGE", resolution: { strategy: input.resolution, mergedValue: input.mergedValue ?? null } as Prisma.InputJsonValue, resolvedById, resolvedAt: new Date() } });
  }

  async testRow(workspaceId: string, destinationId: string) {
    const destination = await this.get(workspaceId, destinationId);
    if (!destination.mappings.length) throw new ProblemException(HttpStatus.UNPROCESSABLE_ENTITY, "SHEET_MAPPING_INVALID", "Mapping required", "Add at least one column mapping before writing a test row");
    const maxColumn = Math.max(...destination.mappings.map((mapping) => mapping.columnIndex));
    const values = Array.from({ length: maxColumn + 1 + MANAGED_HEADERS.length }, () => "");
    for (const mapping of destination.mappings) values[mapping.columnIndex] = `[Gemai test] ${mapping.columnName}`;
    values[maxColumn + 1 + MANAGED_HEADERS.indexOf("_gemai_status")] = "TEST_ROW";
    const result = await this.google.appendSheetRow(workspaceId, destination.googleBindingId, destination.spreadsheetId, `${this.quote(destination.sheetTitle)}!A:${this.columnName(values.length - 1)}`, values);
    return { written: true, range: result.updates?.updatedRange ?? null };
  }

  async pause(workspaceId: string, destinationId: string, expectedVersion: number) {
    const updated = await this.prisma.sheetDestination.updateMany({ where: { id: destinationId, workspaceId, version: expectedVersion, status: { in: ["ACTIVE", "MISCONFIGURED"] } }, data: { status: "PAUSED", version: { increment: 1 } } });
    if (updated.count !== 1) throw this.versionConflict();
    return this.get(workspaceId, destinationId);
  }

  async syncRuns(workspaceId: string, destinationId: string, cursor?: string, limit = 50) {
    await this.get(workspaceId, destinationId);
    const take = Math.min(Math.max(limit, 1), 100);
    const items = await this.prisma.integrationOperation.findMany({
      where: { workspaceId, type: { startsWith: "SHEET_" }, request: { path: ["destinationId"], equals: destinationId } },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    return { items: items.slice(0, take), nextCursor: items.length > take ? items[take - 1]?.id ?? null : null };
  }

  async conflicts(workspaceId: string, cursor?: string, limit = 50) {
    const take = Math.min(Math.max(limit, 1), 100);
    const items = await this.prisma.sheetSyncConflict.findMany({ where: { workspaceId }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: take + 1, ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}) });
    return { items: items.slice(0, take), nextCursor: items.length > take ? items[take - 1]?.id ?? null : null };
  }

  private async get(workspaceId: string, destinationId: string) {
    const destination = await this.prisma.sheetDestination.findUnique({ where: { id_workspaceId: { id: destinationId, workspaceId } }, include: { mappings: { orderBy: { columnIndex: "asc" } } } });
    if (!destination) throw new ProblemException(HttpStatus.NOT_FOUND, "SHEET_DESTINATION_NOT_FOUND", "Sheet destination not found", "The Sheet destination does not exist in this workspace");
    return destination;
  }

  async ensureDriveWatch(workspaceId: string, bindingId: string): Promise<void> {
    const binding = await this.prisma.googleBinding.findUniqueOrThrow({ where: { id_workspaceId: { id: bindingId, workspaceId } } });
    const active = await this.prisma.googleWatchChannel.findFirst({ where: { bindingId, workspaceId, type: "DRIVE_CHANGES", status: "ACTIVE", expiresAt: { gt: new Date(Date.now() + 30 * 60 * 60 * 1000) } } });
    if (active) return;
    const webhookBase = this.config.get<string>("GOOGLE_WEBHOOK_BASE_URL");
    if (!webhookBase) throw new ProblemException(HttpStatus.SERVICE_UNAVAILABLE, "GOOGLE_UNAVAILABLE", "Google webhook unavailable", "GOOGLE_WEBHOOK_BASE_URL is required to activate Sheet synchronization");
    const page = await this.google.getDriveStartPageToken(workspaceId, bindingId);
    const channelId = randomUUID();
    const secret = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + 7 * 86_400_000);
    const watched = await this.google.watchDriveChanges(workspaceId, bindingId, page.startPageToken, { id: channelId, token: secret, address: `${webhookBase.replace(/\/$/, "")}/v1/google/webhooks/drive`, expiration: expiresAt.getTime() });
    await this.prisma.googleWatchChannel.create({ data: { bindingId, workspaceId, type: "DRIVE_CHANGES", channelId, resourceId: watched.resourceId, resourceUri: watched.resourceUri, secretHash: createHash("sha256").update(secret).digest("hex"), pageToken: page.startPageToken, expiresAt: watched.expiration ? new Date(Number(watched.expiration)) : expiresAt } });
    void binding;
  }

  private quote(title: string): string { return `'${title.replaceAll("'", "''")}'`; }
  private columnName(index: number): string {
    let value = index + 1;
    let name = "";
    while (value > 0) { value -= 1; name = String.fromCharCode(65 + (value % 26)) + name; value = Math.floor(value / 26); }
    return name;
  }
  private versionConflict(): ProblemException { return new ProblemException(HttpStatus.PRECONDITION_FAILED, "VERSION_CONFLICT", "Version conflict", "The Sheet destination changed after it was loaded"); }
}
