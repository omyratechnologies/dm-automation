import { GoogleOAuthCallbackController } from "./google.controller";

describe("GoogleOAuthCallbackController", () => {
  type RedirectResponse = { redirect: jest.Mock };
  const response: RedirectResponse = { redirect: jest.fn() };
  const oauth = {
    callback: jest.fn(),
    cancel: jest.fn(),
    returnPathForState: jest.fn(),
    frontendRedirect: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    oauth.returnPathForState.mockResolvedValue("/dashboard/workspace-1/integrations");
    oauth.frontendRedirect.mockImplementation((path: string, status: string, code?: string) => `https://gemai.example${path}?google=${status}${code ? `&code=${code}` : ""}`);
  });

  it("redirects successful authorization back to the tenant Integrations page", async () => {
    oauth.callback.mockResolvedValue({ workspaceId: "workspace-1", returnPath: "/dashboard/workspace-1/integrations" });
    const controller = new GoogleOAuthCallbackController(oauth as never);

    await (controller.callback as never as (state: string, code: string, error: undefined, response: RedirectResponse) => Promise<void>)("state", "code", undefined, response);

    expect(response.redirect).toHaveBeenCalledWith(303, "https://gemai.example/dashboard/workspace-1/integrations?google=connected");
  });

  it("consumes a denied authorization and redirects with an actionable status", async () => {
    oauth.cancel.mockResolvedValue({ returnPath: "/dashboard/workspace-1/integrations" });
    const controller = new GoogleOAuthCallbackController(oauth as never);

    await (controller.callback as never as (state: string, code: undefined, error: string, response: RedirectResponse) => Promise<void>)("state", undefined, "access_denied", response);

    expect(oauth.cancel).toHaveBeenCalledWith("state");
    expect(response.redirect).toHaveBeenCalledWith(303, "https://gemai.example/dashboard/workspace-1/integrations?google=cancelled&code=GOOGLE_ACCESS_DENIED");
  });
});
