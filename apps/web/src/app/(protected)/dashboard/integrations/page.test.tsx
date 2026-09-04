import { cleanup, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import IntegrationsPage from "./page";

const api = vi.fn();
let role: "OWNER" | "ADMIN" | "AGENT" = "AGENT";

vi.mock("@/hooks/use-api", () => ({
  useApi: () => ({
    api,
    workspaceId: "886fec7c-d45e-4657-9e8a-a424cc5c8f30",
    workspace: { id: "886fec7c-d45e-4657-9e8a-a424cc5c8f30", role },
    wsPath: (path: string) => `/workspaces/886fec7c-d45e-4657-9e8a-a424cc5c8f30${path}`,
  }),
}));

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(<QueryClientProvider client={client}><IntegrationsPage /></QueryClientProvider>);
}

describe("IntegrationsPage", () => {
  beforeEach(() => {
    role = "AGENT";
    api.mockReset();
    api.mockImplementation(async (path: string) => {
      if (path.endsWith("/google/readiness")) return {
        oauth: { available: true, status: "AVAILABLE" },
        calendar: { available: true, status: "AVAILABLE" },
        sheets: { available: true, status: "AVAILABLE" },
      };
      if (path.endsWith("/google/bindings")) return [];
      if (path.endsWith("/sheets/destinations")) return [];
      return {};
    });
  });

  afterEach(cleanup);

  it("lets an Agent connect their own Calendar but not workspace-owned Sheets", async () => {
    renderPage();

    expect(await screen.findByRole("button", { name: "Connect Google Calendar" })).toBeEnabled();
    expect(screen.queryByRole("button", { name: "Connect Google Sheets" })).not.toBeInTheDocument();
    expect(screen.getByText(/Owner or Admin connects Sheets for the workspace/)).toBeInTheDocument();
  });

  it("offers a version-guarded disconnect action for an authorized account", async () => {
    role = "OWNER";
    api.mockImplementation(async (path: string) => {
      if (path.endsWith("/google/readiness")) return {
        oauth: { available: true, status: "AVAILABLE" },
        calendar: { available: true, status: "AVAILABLE" },
        sheets: { available: true, status: "AVAILABLE" },
      };
      if (path.endsWith("/google/bindings")) return [{
        id: "binding-1", ownership: "MEMBER", capabilities: ["CALENDAR"], status: "ACTIVE", version: 3,
        lastHealthAt: null, lastErrorCode: null, canDisconnect: true,
        grant: { email: "owner@example.com", scopes: [] },
      }];
      if (path.endsWith("/sheets/destinations")) return [];
      return {};
    });
    renderPage();

    expect(await screen.findByRole("button", { name: "Disconnect owner@example.com from Google Calendar" })).toBeEnabled();
  });
});
