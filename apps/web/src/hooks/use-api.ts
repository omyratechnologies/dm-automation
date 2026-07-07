"use client";

import { apiFetch, type ApiOptions } from "@/lib/api";
import { useWorkspace } from "@/providers/workspace-provider";
import { useAuth } from "@clerk/nextjs";
import { useCallback } from "react";

/**
 * Combines the Clerk session token with the currently selected workspace
 * so callers only pass a path + options.
 *
 * Usage:
 *   const { api, workspaceId, wsPath } = useApi();
 *   api<Page<Conversation>>(wsPath("/conversations?status=OPEN"))
 */
export const useApi = () => {
  const { getToken } = useAuth();
  const { workspace } = useWorkspace();
  const workspaceId = workspace?.id ?? null;

  const api = useCallback(
    async <T>(
      path: string,
      options: Omit<ApiOptions, "token" | "workspaceId"> = {}
    ): Promise<T> => {
      const token = await getToken();
      return apiFetch<T>(path, { ...options, token, workspaceId });
    },
    [getToken, workspaceId]
  );

  const wsPath = useCallback(
    (path: string) => `/workspaces/${workspaceId}${path}`,
    [workspaceId]
  );

  return { api, wsPath, workspaceId, workspace };
};
