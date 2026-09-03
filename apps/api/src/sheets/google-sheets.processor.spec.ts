import { GoogleSheetsProcessor } from "./google-sheets.processor";
import { MANAGED_HEADERS } from "./sheets.service";

describe("GoogleSheetsProcessor inbound reconciliation", () => {
  it("captures a new row with canonical identity separated from custom attributes", async () => {
    const mappings = [
      { columnIndex: 0, columnName: "Email", fieldKey: "email", direction: "TWO_WAY" },
      { columnIndex: 1, columnName: "Name", fieldKey: "name", direction: "TWO_WAY" },
      { columnIndex: 2, columnName: "Budget", fieldKey: "budget", direction: "TWO_WAY" },
      { columnIndex: 3, columnName: "Score", fieldKey: "score", direction: "TWO_WAY" },
    ];
    const headers = [...mappings.map((mapping) => mapping.columnName), ...MANAGED_HEADERS];
    const row = ["lead@example.invalid", "Lead Name", 1200, 75, ...MANAGED_HEADERS.map(() => "")];
    const google = { getSheetValues: jest.fn().mockResolvedValueOnce({ values: [headers] }).mockResolvedValueOnce({ values: [row] }) };
    const prisma = {
      sheetRowProjection: { findMany: jest.fn().mockResolvedValue([]), updateMany: jest.fn() },
      sheetSyncConflict: { create: jest.fn() },
      sheetDestination: { update: jest.fn() },
      lead: { findUnique: jest.fn() },
      $transaction: jest.fn(),
    };
    const leadCommands = {
      capture: jest.fn().mockResolvedValue({ id: "lead-1", version: 1 }),
      applySheetAttributes: jest.fn().mockResolvedValue({}),
    };
    const processor = new GoogleSheetsProcessor(prisma as never, google as never, leadCommands as never, {} as never);
    const destination = {
      id: "destination-1",
      workspaceId: "workspace-1",
      googleBindingId: "binding-1",
      spreadsheetId: "spreadsheet-1",
      sheetTitle: "Leads",
      pipelineId: null,
      maxManagedRows: 100,
      mappings,
    };

    await (processor as unknown as { reconcileDestination(destination: unknown, eventId: string): Promise<void> }).reconcileDestination(destination, "event-1");

    expect(leadCommands.capture).toHaveBeenCalledWith("workspace-1", expect.objectContaining({
      identity: { type: "EMAIL", value: "lead@example.invalid", scopeKey: "" },
      name: "Lead Name",
      attributes: { budget: 1200 },
    }), expect.objectContaining({ actorType: "GOOGLE_SHEET" }));
    expect(leadCommands.applySheetAttributes).toHaveBeenCalledWith("workspace-1", "lead-1", 1, "destination-1", { score: 75 }, expect.any(Object));
  });
});
