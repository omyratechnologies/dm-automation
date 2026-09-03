import { RequestMethod, type Type } from "@nestjs/common";
import { METHOD_METADATA } from "@nestjs/common/constants";
import { AnalyticsController } from "../analytics/analytics.controller";
import { AuditController } from "../audit/audit.controller";
import { AutomationsController } from "../automations/automations.controller";
import { BroadcastsController } from "../broadcasts/broadcasts.controller";
import { CalendarController } from "../calendar/calendar.controller";
import { ContactsController } from "../contacts/contacts.controller";
import { FlowsController } from "../flows/flows.controller";
import { GoogleController } from "../google/google.controller";
import { IgAccountsController } from "../instagram/ig-accounts.controller";
import { LeadPipelinesController, LeadsController, WorkspaceApiKeysController } from "../leads/leads.controller";
import { ConversationsController } from "../messaging/conversations.controller";
import { SegmentsController } from "../segments/segments.controller";
import { SheetsController } from "../sheets/sheets.controller";
import { IDEMPOTENT_KEY } from "../common/idempotency";
import { CAPABILITIES_KEY, WORKSPACE_SCOPED_KEY } from "./capabilities.decorator";

const workspaceControllers: Type[] = [
  AnalyticsController,
  AuditController,
  AutomationsController,
  BroadcastsController,
  CalendarController,
  ContactsController,
  ConversationsController,
  FlowsController,
  GoogleController,
  IgAccountsController,
  LeadPipelinesController,
  LeadsController,
  SegmentsController,
  SheetsController,
  WorkspaceApiKeysController,
];

describe("enterprise workspace controller contracts", () => {
  it.each(workspaceControllers)("%p requires workspace context, explicit capabilities and idempotent unsafe commands", (controller) => {
    expect(Reflect.getMetadata(WORKSPACE_SCOPED_KEY, controller)).toBe(true);

    for (const name of Object.getOwnPropertyNames(controller.prototype)) {
      if (name === "constructor") continue;
      const handler = controller.prototype[name];
      const method = Reflect.getMetadata(METHOD_METADATA, handler) as RequestMethod | undefined;
      if (method === undefined) continue;

      expect(Reflect.getMetadata(CAPABILITIES_KEY, handler)).toEqual(expect.arrayContaining([expect.any(String)]));
      if (method !== RequestMethod.GET) expect(Reflect.getMetadata(IDEMPOTENT_KEY, handler)).toBe(true);
    }
  });
});
