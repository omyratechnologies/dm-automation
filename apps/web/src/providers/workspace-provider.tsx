"use client";

import { apiFetch, type Me } from "@/lib/api";
import { useAuth } from "@clerk/nextjs";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Role } from "@repo/shared";

export type CurrentWorkspace = {
  id: string;
  name: string;
  role: Role;
  orgId: string;
  orgName: string;
  plan: string;
};

type WorkspaceContextValue = {
  workspace: CurrentWorkspace | null;
  workspaces: CurrentWorkspace[];
  isLoading: boolean;
  isSwitching: boolean;
  error: string | null;
  switchWorkspace: (id: string) => void;
  refresh: () => Promise<void>;
};

const WorkspaceContext = createContext<WorkspaceContextValue>({
  workspace: null,
  workspaces: [],
  isLoading: true,
  isSwitching: false,
  error: null,
  switchWorkspace: () => {},
  refresh: async () => {},
});

const STORAGE_KEY = "gemai:current-workspace-id";

const toWorkspaces = (me: Me): CurrentWorkspace[] =>
  me.memberships.map((m) => ({
    id: m.workspace.id,
    name: m.workspace.name,
    role: m.role,
    orgId: m.workspace.organization.id,
    orgName: m.workspace.organization.name,
    plan: m.workspace.organization.plan,
  }));

export const WorkspaceProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [workspaces, setWorkspaces] = useState<CurrentWorkspace[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSwitching, setIsSwitching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(false);

  const load = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setIsLoading(true);
    setError(null);
    try {
      const token = await getToken();
      let me = await apiFetch<Me>("/me", { token });

      // First login for this org — bootstrap an organization + default workspace.
      // /me returns null until onBoardUser has provisioned the user row.
      if (!me?.memberships || me.memberships.length === 0) {
        await apiFetch("/orgs", {
          method: "POST",
          body: { name: "My organization" },
          token: await getToken(),
        });
        me = await apiFetch<Me>("/me", { token: await getToken() });
      }

      const list = toWorkspaces(me);
      setWorkspaces(list);

      const stored = (() => {
        try {
          return typeof window !== "undefined"
            ? window.localStorage.getItem(STORAGE_KEY)
            : null;
        } catch {
          return null;
        }
      })();
      const preferred =
        list.find((w) => w.id === stored) ?? list[0] ?? null;
      setCurrentId(preferred?.id ?? null);
      if (preferred) {
        try {
          window.localStorage.setItem(STORAGE_KEY, preferred.id);
        } catch { /* private browsing or quota exceeded */ }
      }
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Failed to load your workspaces"
      );
    } finally {
      loadingRef.current = false;
      setIsLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setIsLoading(false);
      return;
    }
    load();
  }, [isLoaded, isSignedIn, load]);

  const switchWorkspace = useCallback((id: string) => {
    setIsSwitching(true);
    setCurrentId(id);
    try {
      window.localStorage.setItem(STORAGE_KEY, id);
    } catch { /* private browsing or quota exceeded */ }
    requestAnimationFrame(() => setIsSwitching(false));
  }, []);

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      workspace: workspaces.find((w) => w.id === currentId) ?? null,
      workspaces,
      isLoading,
      isSwitching,
      error,
      switchWorkspace,
      refresh: load,
    }),
    [workspaces, currentId, isLoading, isSwitching, error, switchWorkspace, load]
  );

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => useContext(WorkspaceContext);
