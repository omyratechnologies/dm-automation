import { SetMetadata } from "@nestjs/common";

export const IS_PUBLIC_KEY = "isPublic";
/** Marks a route as unauthenticated (webhooks, health, OAuth callbacks). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
