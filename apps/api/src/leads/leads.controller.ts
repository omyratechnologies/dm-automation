import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { LeadsService } from "./leads.service";
import { CurrentWorkspace } from "../auth/decorators";
import { WorkspaceGuard, WorkspaceContext } from "../auth/workspace.guard";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import {
  createLeadFieldSchema,
  CreateLeadFieldDto,
  updateLeadSchema,
  UpdateLeadDto,
  updateLeadFieldValueSchema,
  UpdateLeadFieldValueDto,
} from "./dto/leads.dto";
import type { LEAD_STATUS } from "@prisma/client";

@Controller("leads")
@UseGuards(WorkspaceGuard)
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Get()
  async getLeads(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @Query("status") status?: LEAD_STATUS,
  ) {
    return this.leadsService.listLeads(workspace.id, status);
  }

  @Patch(":id")
  async updateLead(
    @Param("id") leadId: string,
    @CurrentWorkspace() workspace: WorkspaceContext,
    @Body(new ZodValidationPipe(updateLeadSchema)) dto: UpdateLeadDto,
  ) {
    return this.leadsService.updateLead(leadId, workspace.id, dto);
  }

  @Get("fields")
  async getLeadFields(@CurrentWorkspace() workspace: WorkspaceContext) {
    return this.leadsService.listLeadFields(workspace.id);
  }

  @Post("fields")
  async createLeadField(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @Body(new ZodValidationPipe(createLeadFieldSchema)) dto: CreateLeadFieldDto,
  ) {
    return this.leadsService.createLeadField(workspace.id, dto);
  }

  @Post("values/:contactId")
  async updateFieldValue(
    @Param("contactId") contactId: string,
    @CurrentWorkspace() workspace: WorkspaceContext,
    @Body(new ZodValidationPipe(updateLeadFieldValueSchema)) dto: UpdateLeadFieldValueDto,
  ) {
    return this.leadsService.saveLeadFieldValue(contactId, workspace.id, dto);
  }
}
