import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { z } from "zod";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { CurrentUser, CurrentWorkspace } from "../auth/decorators";
import { Roles } from "../auth/roles.decorator";
import type { AuthedRequestUser } from "../auth/clerk-auth.guard";
import type { WorkspaceContext } from "../auth/workspace.guard";
import { TenancyService } from "./tenancy.service";

const createOrgSchema = z.object({ name: z.string().min(1).max(100) });
const createWorkspaceSchema = z.object({ name: z.string().min(1).max(100) });
const addMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(["ADMIN", "AGENT"]),
});
const updateRoleSchema = z.object({ role: z.enum(["ADMIN", "AGENT"]) });
const updateProfileSchema = z.object({
  firstname: z.string().min(1).max(100).optional(),
  lastname: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
});

@ApiTags("tenancy")
@ApiBearerAuth()
@Controller()
export class TenancyController {
  constructor(private readonly tenancy: TenancyService) {}

  @Get("me")
  me(@CurrentUser() user: AuthedRequestUser) {
    return this.tenancy.me(user.id);
  }

  @Patch("me")
  updateProfile(
    @CurrentUser() user: AuthedRequestUser,
    @Body(new ZodValidationPipe(updateProfileSchema))
    body: z.infer<typeof updateProfileSchema>,
  ) {
    return this.tenancy.updateProfile(user.id, body);
  }

  @Delete("me")
  deleteAccount(@CurrentUser() user: AuthedRequestUser) {
    return this.tenancy.deleteAccount(user.id);
  }

  @Post("orgs")
  createOrg(
    @CurrentUser() user: AuthedRequestUser,
    @Body(new ZodValidationPipe(createOrgSchema))
    body: z.infer<typeof createOrgSchema>,
  ) {
    return this.tenancy.createOrganization(user.id, body.name);
  }

  @Post("orgs/:orgId/workspaces")
  createWorkspace(
    @CurrentUser() user: AuthedRequestUser,
    @Param("orgId") orgId: string,
    @Body(new ZodValidationPipe(createWorkspaceSchema))
    body: z.infer<typeof createWorkspaceSchema>,
  ) {
    return this.tenancy.createWorkspace(user.id, orgId, body.name);
  }

  @Get("workspaces/:workspaceId/members")
  listMembers(@CurrentWorkspace() ws: WorkspaceContext) {
    return this.tenancy.listMembers(ws.id);
  }

  @Post("workspaces/:workspaceId/members")
  @Roles("ADMIN")
  addMember(
    @CurrentUser() user: AuthedRequestUser,
    @CurrentWorkspace() ws: WorkspaceContext,
    @Body(new ZodValidationPipe(addMemberSchema))
    body: z.infer<typeof addMemberSchema>,
  ) {
    return this.tenancy.addMember(
      user.id,
      ws.organizationId,
      ws.id,
      body.email,
      body.role,
    );
  }

  @Patch("workspaces/:workspaceId/members/:membershipId")
  @Roles("ADMIN")
  updateRole(
    @CurrentUser() user: AuthedRequestUser,
    @CurrentWorkspace() ws: WorkspaceContext,
    @Param("membershipId") membershipId: string,
    @Body(new ZodValidationPipe(updateRoleSchema))
    body: z.infer<typeof updateRoleSchema>,
  ) {
    return this.tenancy.updateMemberRole(
      user.id,
      ws.organizationId,
      ws.id,
      membershipId,
      body.role,
    );
  }

  @Delete("workspaces/:workspaceId/members/:membershipId")
  @Roles("ADMIN")
  removeMember(
    @CurrentUser() user: AuthedRequestUser,
    @CurrentWorkspace() ws: WorkspaceContext,
    @Param("membershipId") membershipId: string,
  ) {
    return this.tenancy.removeMember(
      user.id,
      ws.organizationId,
      ws.id,
      membershipId,
    );
  }
}
