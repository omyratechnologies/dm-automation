import axios from "axios";
import { GoogleApiClient, GOOGLE_SCOPES } from "./google-api.client";

jest.mock("axios");

describe("GoogleApiClient", () => {
  const tokens = { forBinding: jest.fn() };
  const request = axios.request as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    tokens.forBinding.mockResolvedValue("google-access-token");
  });

  it("lists only app-authorized Google spreadsheets when testing a Sheets binding", async () => {
    request.mockResolvedValue({ data: { files: [{ id: "sheet-1", name: "Leads", mimeType: "application/vnd.google-apps.spreadsheet" }] } });
    const client = new GoogleApiClient(tokens as never);

    const result = await client.listDriveSpreadsheets("workspace-1", "binding-1");

    expect(result.files).toHaveLength(1);
    expect(tokens.forBinding).toHaveBeenCalledWith("workspace-1", "binding-1", GOOGLE_SCOPES.DRIVE_FILE);
    expect(request).toHaveBeenCalledWith(expect.objectContaining({
      method: "GET",
      url: "https://www.googleapis.com/drive/v3/files",
      timeout: 15_000,
      headers: expect.objectContaining({ authorization: "Bearer google-access-token" }),
      params: expect.objectContaining({
        q: "mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false",
        pageSize: 100,
      }),
    }));
  });
});
