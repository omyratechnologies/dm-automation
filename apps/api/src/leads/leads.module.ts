import { Module } from "@nestjs/common";
import { LeadPipelinesController, LeadsController, WorkspaceApiKeysController } from "./leads.controller";
import { LeadsService } from "./leads.service";
import { LeadCommandService } from "./lead-command.service";
import { LeadIngestionsController } from "./lead-ingestions.controller";
import { WorkspaceApiKeyGuard, WorkspaceApiKeyService } from "./workspace-api-key.service";

@Module({
  controllers: [LeadsController, LeadPipelinesController, WorkspaceApiKeysController, LeadIngestionsController],
  providers: [LeadsService, LeadCommandService, WorkspaceApiKeyService, WorkspaceApiKeyGuard],
  exports: [LeadsService, LeadCommandService, WorkspaceApiKeyService],
})
export class LeadsModule {}
