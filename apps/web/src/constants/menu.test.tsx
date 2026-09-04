import { describe, expect, it } from "vitest";
import { SIDEBAR_GROUPS, SIDEBAR_MENU } from "./menu";

describe("workspace sidebar navigation", () => {
  it("includes Flows in Automate and one Integrations destination in Manage", () => {
    const automate = SIDEBAR_GROUPS.find((group) => group.id === "automate");
    const manage = SIDEBAR_GROUPS.find((group) => group.id === "manage");

    expect(automate?.items.map((entry) => entry.label)).toEqual([
      "automations",
      "flows",
      "campaigns",
    ]);
    expect(manage?.items.map((entry) => entry.label)).toEqual([
      "integrations",
      "team",
      "settings",
    ]);
  });

  it("keeps the restored entries on canonical dashboard routes", () => {
    expect(SIDEBAR_MENU.find((entry) => entry.label === "flows")?.href).toBe("/dashboard/flows");
    expect(SIDEBAR_MENU.find((entry) => entry.label === "integrations")?.href).toBe("/dashboard/integrations");
    expect(SIDEBAR_MENU.find((entry) => entry.label === "connections")).toBeUndefined();
  });
});
