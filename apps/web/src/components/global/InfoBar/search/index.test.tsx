import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Search from ".";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  useParams: () => ({ workspaceId: "workspace-1" }),
}));

describe("workspace lead search", () => {
  beforeEach(() => push.mockReset());

  it("has an accessible label and routes a submitted query to the workspace lead API view", () => {
    const syncedSearches: string[] = [];
    const onSearch = (event: Event) => syncedSearches.push((event as CustomEvent<string>).detail);
    window.addEventListener("gemai:lead-search", onSearch);
    render(<Search />);
    const input = screen.getByRole("searchbox", { name: "Search workspace leads" });
    expect(input).toHaveClass("h-11");
    fireEvent.change(input, { target: { value: "  Ada Lovelace  " } });
    fireEvent.submit(input.closest("form")!);
    expect(push).toHaveBeenCalledWith("/dashboard/workspace-1/leads?search=Ada%20Lovelace");
    expect(syncedSearches).toEqual(["Ada Lovelace"]);
    window.removeEventListener("gemai:lead-search", onSearch);
  });
});
