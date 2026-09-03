import { ForbiddenException } from "@nestjs/common";
import { WorkspaceGuard } from "./workspace.guard";
import { IS_PUBLIC_KEY } from "./public.decorator";
import { ROLES_KEY } from "./roles.decorator";
import { CAPABILITIES_KEY, WORKSPACE_SCOPED_KEY } from "./capabilities.decorator";

function fixture(metadata: Record<string, unknown>, membership: unknown = null) {
  const request: Record<string, any> = { user: { id: "user-1" }, params: {}, headers: {} };
  const prisma = { membership: { findUnique: jest.fn().mockResolvedValue(membership) } };
  const reflector = { getAllAndOverride: jest.fn((key: string) => metadata[key]) };
  const context = { switchToHttp: () => ({ getRequest: () => request }), getHandler: () => ({}), getClass: () => ({}) };
  return { request, prisma, guard: new WorkspaceGuard(prisma as never, reflector as never), context };
}

describe("WorkspaceGuard enterprise tenant boundary", () => {
  it("fails closed when a workspace-scoped command omits workspace context", async () => {
    const f = fixture({ [IS_PUBLIC_KEY]: false, [WORKSPACE_SCOPED_KEY]: true });
    await expect(f.guard.canActivate(f.context as never)).rejects.toBeInstanceOf(ForbiddenException);
    expect(f.prisma.membership.findUnique).not.toHaveBeenCalled();
  });

  it("rejects a soft-removed membership", async () => {
    const f = fixture({ [WORKSPACE_SCOPED_KEY]: true }, { id: "member-1", role: "ADMIN", status: "REMOVED", workspace: { organizationId: "org-1" } });
    f.request.params.workspaceId = "workspace-1";
    await expect(f.guard.canActivate(f.context as never)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("enforces explicit capabilities instead of role rank", async () => {
    const f = fixture({ [WORKSPACE_SCOPED_KEY]: true, [ROLES_KEY]: undefined, [CAPABILITIES_KEY]: ["integrations.manage"] }, { id: "member-1", role: "AGENT", status: "ACTIVE", workspace: { organizationId: "org-1" } });
    f.request.params.workspaceId = "workspace-1";
    await expect(f.guard.canActivate(f.context as never)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("attaches only the verified workspace and membership", async () => {
    const f = fixture({ [WORKSPACE_SCOPED_KEY]: true, [CAPABILITIES_KEY]: ["leads.read"] }, { id: "member-1", role: "AGENT", status: "ACTIVE", workspace: { organizationId: "org-1" } });
    f.request.params.workspaceId = "workspace-1";
    await expect(f.guard.canActivate(f.context as never)).resolves.toBe(true);
    expect(f.request.workspace).toEqual({ id: "workspace-1", organizationId: "org-1", role: "AGENT", membershipId: "member-1" });
  });
});
