import { Body, Controller, Delete, Get, Param, Post } from "@nestjs/common";
import { z } from "zod";
import type { AuthedRequestUser } from "../auth/clerk-auth.guard";
import { CurrentUser, CurrentWorkspace } from "../auth/decorators";
import { Roles } from "../auth/roles.decorator";
import type { WorkspaceContext } from "../auth/workspace.guard";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { IgAccountsService } from "./ig-accounts.service";

const connectSchema = z.object({
  code: z.string().min(1),
  redirectUri: z.string().url().optional(),
});
type ConnectDto = z.infer<typeof connectSchema>;

@Controller("workspaces/:workspaceId/ig-accounts")
export class IgAccountsController {
  constructor(private readonly igAccounts: IgAccountsService) {}

  @Get()
  list(@CurrentWorkspace() workspace: WorkspaceContext) {
    return this.igAccounts.list(workspace.id);
  }

  @Post("connect")
  connect(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @CurrentUser() user: AuthedRequestUser,
    @Body(new ZodValidationPipe(connectSchema)) body: ConnectDto,
  ) {
    return this.igAccounts.connect(workspace, user, body);
  }

  @Get(":id")
  getById(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @Param("id") id: string,
  ) {
    return this.igAccounts.getById(workspace.id, id);
  }

  @Get(":id/media")
  getMedia(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @Param("id") id: string,
  ) {
    return this.igAccounts.getMedia(workspace.id, id);
  }

  @Delete(":id")
  @Roles("ADMIN")
  disconnect(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @CurrentUser() user: AuthedRequestUser,
    @Param("id") id: string,
  ) {
    return this.igAccounts.disconnect(workspace, user, id);
  }
}
