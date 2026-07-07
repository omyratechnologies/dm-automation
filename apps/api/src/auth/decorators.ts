import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { AuthedRequestUser } from "./clerk-auth.guard";
import type { WorkspaceContext } from "./workspace.guard";

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthedRequestUser =>
    ctx.switchToHttp().getRequest().user,
);

export const CurrentWorkspace = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): WorkspaceContext =>
    ctx.switchToHttp().getRequest().workspace,
);
