import { SetMetadata } from "@nestjs/common";
import type { Role } from "@repo/shared";

export const ROLES_KEY = "roles";
/** Minimum role required; e.g. @Roles("ADMIN") allows ADMIN and OWNER. */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
