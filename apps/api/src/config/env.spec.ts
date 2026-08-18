import { validateEnv } from "./env";

const baseEnv = {
  DATABASE_URL: "postgresql://localhost/gemai",
  REDIS_URL: "redis://localhost:6379",
  CLERK_SECRET_KEY: "clerk-secret",
  TOKEN_MASTER_KEY: "token-master-key",
};

describe("validateEnv Meta production requirements", () => {
  it("rejects a production process without Meta configuration", () => {
    expect(() =>
      validateEnv({ ...baseEnv, NODE_ENV: "production" }),
    ).toThrow(/INSTAGRAM_APP_ID.*Required in production/);
  });

  it("accepts complete production Meta configuration", () => {
    expect(
      validateEnv({
        ...baseEnv,
        NODE_ENV: "production",
        INSTAGRAM_APP_ID: "app-id",
        INSTAGRAM_APP_SECRET: "app-secret",
        INSTAGRAM_WEBHOOK_VERIFY_TOKEN: "verify-token",
        INSTAGRAM_GRAPH_URL: "https://graph.instagram.com/v25.0",
        INSTAGRAM_OAUTH_REDIRECT_URI:
          "https://gemai.example/callback/instagram",
        WEB_ORIGIN: "https://gemai.example",
      }),
    ).toMatchObject({ NODE_ENV: "production", INSTAGRAM_APP_ID: "app-id" });
  });
});
