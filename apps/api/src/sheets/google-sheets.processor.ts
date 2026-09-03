import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { QUEUES, type GoogleSheetsJob } from "@repo/shared";
import { createHash } from "crypto";
import { Prisma } from "@prisma/client";
import { GoogleApiClient } from "../google/google-api.client";
import { PrismaService } from "../prisma/prisma.service";
import { MANAGED_HEADERS } from "./sheets.service";
import { LeadCommandService, SHEET_CANONICAL_FIELDS, sheetCustomAttributes } from "../leads/lead-command.service";
import { SpreadsheetLockService } from "./spreadsheet-lock.service";

@Processor(QUEUES.GOOGLE_SHEETS, { concurrency: 3 })
export class GoogleSheetsProcessor extends WorkerHost {
  constructor(private readonly prisma: PrismaService, private readonly google: GoogleApiClient, private readonly leadCommands: LeadCommandService, private readonly locks: SpreadsheetLockService) { super(); }

  async process(job: Job<GoogleSheetsJob>): Promise<void> {
    if (job.data.operation === "DRAIN_CHANGES") return this.locks.run(`drive:${job.data.destinationId}`, () => this.processLocked(job));
    const destination = await this.prisma.sheetDestination.findUnique({ where: { id_workspaceId: { id: job.data.destinationId, workspaceId: job.data.workspaceId } }, select: { spreadsheetId: true } });
    if (!destination) return;
    return this.locks.run(`sheet:${destination.spreadsheetId}`, () => this.processLocked(job));
  }

  private async processLocked(job: Job<GoogleSheetsJob>): Promise<void> {
    if (job.data.operation === "DRAIN_CHANGES") {
      await this.drainChanges(job.data.destinationId, job.data.eventId);
      return;
    }
    if (job.data.operation !== "PROJECT_LEAD" || !job.data.leadId) return;
    const consumer = `google-sheets/${job.data.destinationId}`;
    if (await this.prisma.processedEvent.findUnique({ where: { consumer_eventId: { consumer, eventId: job.data.eventId } } })) return;
    const destination = await this.prisma.sheetDestination.findUnique({ where: { id_workspaceId: { id: job.data.destinationId, workspaceId: job.data.workspaceId } }, include: { mappings: { orderBy: { columnIndex: "asc" } } } });
    if (!destination || destination.status !== "ACTIVE") return;
    const lead = await this.prisma.lead.findUnique({ where: { id_workspaceId: { id: job.data.leadId, workspaceId: job.data.workspaceId } }, include: { contact: { include: { identities: true } }, stage: true, owner: { include: { user: true } }, attributes: { include: { field: true } } } });
    if (!lead) return;
    const operationKey = `${destination.id}:${lead.id}:${lead.version}`;
    const operation = await this.prisma.integrationOperation.upsert({
      where: { operationKey },
      create: { workspaceId: lead.workspaceId, googleBindingId: destination.googleBindingId, type: "SHEET_PROJECT_LEAD", aggregateType: "Lead", aggregateId: lead.id, operationKey, expectedVersion: lead.version, correlationId: job.data.eventId, request: { destinationId: destination.id, leadId: lead.id, leadVersion: lead.version } },
      update: {},
    });
    if (operation.status === "SUCCEEDED") {
      await this.prisma.processedEvent.upsert({ where: { consumer_eventId: { consumer, eventId: job.data.eventId } }, create: { consumer, eventId: job.data.eventId }, update: {} });
      return;
    }
    await this.prisma.integrationOperation.update({ where: { id: operation.id }, data: { status: "RUNNING" } });
    try {
      const maxColumn = Math.max(...destination.mappings.map((mapping) => mapping.columnIndex));
      const systemStart = maxColumn + 1;
      const values = Array.from({ length: systemStart + MANAGED_HEADERS.length }, () => "" as unknown);
      const attributes = new Map(lead.attributes.map((attribute) => [attribute.field.key, attribute.value]));
      const identities = new Map(lead.contact.identities.map((identity) => [identity.type, identity.displayValue ?? identity.normalizedValue]));
      const ownerName = lead.owner ? [lead.owner.user.firstname, lead.owner.user.lastname].filter(Boolean).join(" ") : "";
      const canonical: Record<string, unknown> = {
        name: lead.contact.name ?? "", username: lead.contact.username ?? "", email: identities.get("EMAIL") ?? "", phone: identities.get("PHONE") ?? "",
        score: lead.score, stage: lead.stage.name, owner: ownerName, priority: lead.priority, source: lead.source,
      };
      for (const mapping of destination.mappings) values[mapping.columnIndex] = canonical[mapping.fieldKey] ?? attributes.get(mapping.fieldKey) ?? "";
      const syncHash = createHash("sha256").update(JSON.stringify(values.slice(0, systemStart))).digest("hex");
      values.splice(systemStart, MANAGED_HEADERS.length, lead.id, lead.version, destination.mappingVersion, syncHash, new Date().toISOString(), "SYNCED");
      let projection = await this.prisma.sheetRowProjection.findFirst({ where: { destinationId: destination.id, leadId: lead.id }, orderBy: { leadVersion: "desc" } });
      if (!projection?.rowNumber) {
        const idColumn = this.columnName(systemStart);
        const idValues = await this.google.getSheetValues(lead.workspaceId, destination.googleBindingId, destination.spreadsheetId, `${this.quote(destination.sheetTitle)}!${idColumn}2:${idColumn}${destination.maxManagedRows + 1}`);
        const found = (idValues.values ?? []).findIndex((row) => row[0] === lead.id);
        if (found >= 0) projection = projection ? await this.prisma.sheetRowProjection.update({ where: { id: projection.id }, data: { rowNumber: found + 2 } }) : projection;
      }
      let rowNumber = projection?.rowNumber;
      if (rowNumber) {
        await this.google.updateSheetValues(lead.workspaceId, destination.googleBindingId, destination.spreadsheetId, `${this.quote(destination.sheetTitle)}!A${rowNumber}`, [values]);
      } else {
        const result = await this.google.appendSheetRow(lead.workspaceId, destination.googleBindingId, destination.spreadsheetId, `${this.quote(destination.sheetTitle)}!A:${this.columnName(values.length - 1)}`, values);
        rowNumber = Number(result.updates?.updatedRange?.match(/!A(\d+):/)?.[1] ?? 0) || undefined;
      }
      await this.prisma.$transaction(async (tx) => {
        await tx.sheetRowProjection.upsert({ where: { destinationId_leadId: { destinationId: destination.id, leadId: lead.id } }, create: { workspaceId: lead.workspaceId, destinationId: destination.id, leadId: lead.id, rowNumber, metadataKey: lead.id, leadVersion: lead.version, mappingVersion: destination.mappingVersion, syncHash, status: "SYNCED", lastSyncedAt: new Date() }, update: { rowNumber, leadVersion: lead.version, mappingVersion: destination.mappingVersion, syncHash, status: "SYNCED", lastSyncedAt: new Date() } });
        await tx.integrationOperation.update({ where: { id: operation.id }, data: { status: "SUCCEEDED", response: { rowNumber: rowNumber ?? null } as Prisma.InputJsonValue } });
        await tx.processedEvent.create({ data: { consumer, eventId: job.data.eventId } });
      });
    } catch (error) {
      await this.prisma.integrationOperation.update({ where: { id: operation.id }, data: { status: "FAILED", lastErrorCode: error instanceof Error ? error.name : "UNKNOWN" } });
      throw error;
    }
  }

  private async drainChanges(channelId: string, eventId: string): Promise<void> {
    const channel = await this.prisma.googleWatchChannel.findUnique({ where: { id: channelId } });
    if (!channel?.pageToken || channel.status !== "ACTIVE") return;
    let pageToken: string | undefined = channel.pageToken;
    const changedFiles = new Set<string>();
    for (let page = 0; page < 100 && pageToken; page += 1) {
      const changes = await this.google.listDriveChanges(channel.workspaceId, channel.bindingId, pageToken);
      for (const change of changes.changes ?? []) changedFiles.add(change.fileId);
      if (changes.newStartPageToken) {
        await this.prisma.googleWatchChannel.update({ where: { id: channel.id }, data: { pageToken: changes.newStartPageToken } });
        pageToken = undefined;
      } else {
        pageToken = changes.nextPageToken;
      }
    }
    const destinations = await this.prisma.sheetDestination.findMany({ where: { workspaceId: channel.workspaceId, googleBindingId: channel.bindingId, spreadsheetId: { in: [...changedFiles] }, status: "ACTIVE" }, include: { mappings: { orderBy: { columnIndex: "asc" } } } });
    for (const destination of destinations) await this.locks.run(`sheet:${destination.spreadsheetId}`, () => this.reconcileDestination(destination, eventId));
  }

  private async reconcileDestination(destination: Prisma.SheetDestinationGetPayload<{ include: { mappings: true } }>, eventId: string): Promise<void> {
    const headerData = await this.google.getSheetValues(destination.workspaceId, destination.googleBindingId, destination.spreadsheetId, `${this.quote(destination.sheetTitle)}!1:1`);
    const headers = (headerData.values?.[0] ?? []).map(String);
    const drift = destination.mappings.some((mapping) => headers[mapping.columnIndex] !== mapping.columnName);
    const systemIndexes = Object.fromEntries(MANAGED_HEADERS.map((header) => [header, headers.indexOf(header)]));
    if (drift || Object.values(systemIndexes).some((index) => index < 0)) {
      await this.prisma.$transaction([
        this.prisma.sheetDestination.update({ where: { id: destination.id }, data: { status: "MISCONFIGURED", lastErrorCode: "SHEET_SCHEMA_DRIFT" } }),
        this.prisma.sheetSyncConflict.create({ data: { workspaceId: destination.workspaceId, destinationId: destination.id, status: "OPEN", fieldKey: "__headers__", appValue: destination.mappings.map((mapping) => mapping.columnName), sheetValue: headers } }),
      ]);
      return;
    }
    const seen = new Set<string>();
    for (let start = 2; start <= destination.maxManagedRows + 1; start += 1000) {
      const end = Math.min(destination.maxManagedRows + 1, start + 999);
      const page = await this.google.getSheetValues(destination.workspaceId, destination.googleBindingId, destination.spreadsheetId, `${this.quote(destination.sheetTitle)}!A${start}:ZZ${end}`);
      const rows = page.values ?? [];
      for (let offset = 0; offset < rows.length; offset += 1) {
        const row = rows[offset] ?? [];
        if (!row.some((value) => value !== "" && value !== null && value !== undefined)) continue;
        const leadId = String(row[systemIndexes._gemai_lead_id] ?? "");
        const rowVersion = Number(row[systemIndexes._gemai_lead_version] ?? 0);
        const storedHash = String(row[systemIndexes._gemai_sync_hash] ?? "");
        const inboundMappings = destination.mappings.filter((mapping) => mapping.direction !== "APP_OWNED");
        const values = Object.fromEntries(inboundMappings.map((mapping) => [mapping.fieldKey, row[mapping.columnIndex]]).filter(([, value]) => value !== undefined && value !== ""));
        if (!leadId) {
          const identityValue = typeof values.email === "string" && values.email.includes("@") ? values.email : typeof values.phone === "string" && values.phone.trim() ? values.phone : null;
          if (!identityValue) continue;
          const actor = { actorType: "GOOGLE_SHEET" as const, correlationId: eventId, causationId: `${destination.id}:${start + offset}` };
          const captured = await this.leadCommands.capture(destination.workspaceId, { pipelineId: destination.pipelineId ?? undefined, identity: { type: identityValue === values.email ? "EMAIL" : "PHONE", value: identityValue, scopeKey: "" }, name: typeof values.name === "string" ? values.name : undefined, username: typeof values.username === "string" ? values.username : undefined, source: "GOOGLE_SHEET", attributes: sheetCustomAttributes(values) }, actor);
          const postCaptureValues = Object.fromEntries(Object.entries(values).filter(([key]) => SHEET_CANONICAL_FIELDS.has(key) && !["name", "username", "email", "phone"].includes(key)));
          if (Object.keys(postCaptureValues).length) await this.leadCommands.applySheetAttributes(destination.workspaceId, captured.id, captured.version, destination.id, postCaptureValues, actor);
          continue;
        }
        seen.add(leadId);
        const calculatedHash = createHash("sha256").update(JSON.stringify(destination.mappings.map((mapping) => row[mapping.columnIndex] ?? ""))).digest("hex");
        if (calculatedHash === storedHash) continue;
        const lead = await this.prisma.lead.findUnique({ where: { id_workspaceId: { id: leadId, workspaceId: destination.workspaceId } } });
        if (!lead || rowVersion !== lead.version) {
          await this.prisma.sheetSyncConflict.create({ data: { workspaceId: destination.workspaceId, destinationId: destination.id, leadId: lead?.id, fieldKey: "__row__", appVersion: lead?.version, sheetVersion: rowVersion || null, sheetValue: values as Prisma.InputJsonValue } });
          continue;
        }
        await this.leadCommands.applySheetAttributes(destination.workspaceId, lead.id, lead.version, destination.id, values, { actorType: "GOOGLE_SHEET", correlationId: eventId, causationId: `${destination.id}:${start + offset}` });
      }
      if (rows.length < 1000) break;
    }
    const projections = await this.prisma.sheetRowProjection.findMany({ where: { destinationId: destination.id, status: "SYNCED" }, select: { id: true, leadId: true } });
    const missing = projections.filter((projection) => !seen.has(projection.leadId));
    if (missing.length) await this.prisma.sheetRowProjection.updateMany({ where: { id: { in: missing.map((projection) => projection.id) } }, data: { status: "ROW_MISSING" } });
  }

  private columnName(index: number): string {
    let value = index + 1;
    let name = "";
    while (value > 0) { value -= 1; name = String.fromCharCode(65 + (value % 26)) + name; value = Math.floor(value / 26); }
    return name;
  }
  private quote(title: string): string { return `'${title.replaceAll("'", "''")}'`; }
}
