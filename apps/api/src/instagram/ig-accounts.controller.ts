import { Body, Controller, Delete, Get, Param, Post } from "@nestjs/common";
import { z } from "zod";
import type { AuthedRequestUser } from "../auth/clerk-auth.guard";
import { CurrentUser, CurrentWorkspace } from "../auth/decorators";
import { Roles } from "../auth/roles.decorator";
import type { WorkspaceContext } from "../auth/workspace.guard";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { IgAccountsService } from "./ig-accounts.service";
import { RequireCapabilities, WorkspaceScoped } from "../auth/capabilities.decorator";
import { IdempotentCommand } from "../common/idempotency";

const connectSchema = z.object({
  code: z.string().min(1),
});
type ConnectDto = z.infer<typeof connectSchema>;

@Controller("workspaces/:workspaceId/ig-accounts")
@WorkspaceScoped()
export class IgAccountsController {
  constructor(private readonly igAccounts: IgAccountsService) {}

  @Get()
  @RequireCapabilities("integrations.read")
  list(@CurrentWorkspace() workspace: WorkspaceContext) {
    return this.igAccounts.list(workspace.id);
  }

  @Post("connect")
  @RequireCapabilities("integrations.manage")
  @IdempotentCommand()
  connect(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @CurrentUser() user: AuthedRequestUser,
    @Body(new ZodValidationPipe(connectSchema)) body: ConnectDto,
  ) {
    return this.igAccounts.connect(workspace, user, body);
  }

  @Get(":id")
  @RequireCapabilities("integrations.read")
  getById(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @Param("id") id: string,
  ) {
    return this.igAccounts.getById(workspace.id, id);
  }

  @Get(":id/media")
  @RequireCapabilities("integrations.read")
  getMedia(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @Param("id") id: string,
  ) {
    return this.igAccounts.getMedia(workspace.id, id);
  }

  @Delete(":id")
  @Roles("ADMIN")
  @RequireCapabilities("integrations.manage")
  @IdempotentCommand()
  disconnect(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @CurrentUser() user: AuthedRequestUser,
    @Param("id") id: string,
  ) {
    return this.igAccounts.disconnect(workspace, user, id);
  }
}
