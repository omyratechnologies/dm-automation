import { SetMetadata } from "@nestjs/common";
import type { Capability } from "@repo/shared";

export const CAPABILITIES_KEY = "required_capabilities";
export const WORKSPACE_SCOPED_KEY = "workspace_scoped";

export const RequireCapabilities = (...capabilities: Capability[]) =>
  SetMetadata(CAPABILITIES_KEY, capabilities);

/** Marks a controller/handler as tenant-bound. Missing workspace context is an error. */
export const WorkspaceScoped = () => SetMetadata(WORKSPACE_SCOPED_KEY, true);
