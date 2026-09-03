import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/components/global/automation-list", () => ({
  default: () => <div>Automation list</div>,
}));

vi.mock("@/components/global/create-automation", () => ({
  default: () => <button type="button">Create automation</button>,
}));

vi.mock("./flows/_components/flows-list", () => ({
  default: () => <div>Flow list</div>,
}));

import AutomationsPage from "./automations/page";
import FlowsPage from "./flows/page";

afterEach(cleanup);

describe("automation and flow routes", () => {
  it("renders the legacy automation rules at /automations", () => {
    render(<AutomationsPage />);

    expect(screen.getByRole("heading", { name: "Automations", level: 1 })).toBeInTheDocument();
    expect(screen.getByText("Automation list")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Flows" })).not.toBeInTheDocument();
  });

  it("keeps the flow builder list at /flows", () => {
    render(<FlowsPage />);

    expect(screen.getByRole("heading", { name: "Flows", level: 1 })).toBeInTheDocument();
    expect(screen.getByText("Flow list")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Automations" })).not.toBeInTheDocument();
  });
});
