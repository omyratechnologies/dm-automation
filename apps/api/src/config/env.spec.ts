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
        API_KEY_PEPPER: "ci-api-key-pepper-at-least-32-characters",
        TOKEN_MASTER_KEYS: JSON.stringify({ legacy: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=" }),
      }),
    ).toMatchObject({ NODE_ENV: "production", INSTAGRAM_APP_ID: "app-id" });
  });

  it("fails deployment when Google is enabled without its required configuration", () => {
    expect(() => validateEnv({
      ...baseEnv,
      NODE_ENV: "production",
      INSTAGRAM_APP_ID: "app-id",
      INSTAGRAM_APP_SECRET: "app-secret",
      INSTAGRAM_WEBHOOK_VERIFY_TOKEN: "verify-token",
      INSTAGRAM_OAUTH_REDIRECT_URI: "https://gemai.example/callback/instagram",
      WEB_ORIGIN: "https://gemai.example",
      API_KEY_PEPPER: "ci-api-key-pepper-at-least-32-characters",
      TOKEN_MASTER_KEYS: JSON.stringify({ legacy: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=" }),
      FEATURE_GOOGLE_OAUTH: "true",
      FEATURE_GOOGLE_CALENDAR: "true",
    })).toThrow(/GOOGLE_CLIENT_ID.*Required when Google OAuth is enabled/);
  });

  it("accepts an end-to-end Google deployment configuration", () => {
    expect(validateEnv({
      ...baseEnv,
      NODE_ENV: "production",
      INSTAGRAM_APP_ID: "app-id",
      INSTAGRAM_APP_SECRET: "app-secret",
      INSTAGRAM_WEBHOOK_VERIFY_TOKEN: "verify-token",
      INSTAGRAM_OAUTH_REDIRECT_URI: "https://gemai.example/callback/instagram",
      WEB_ORIGIN: "https://gemai.example",
      API_KEY_PEPPER: "ci-api-key-pepper-at-least-32-characters",
      TOKEN_MASTER_KEYS: JSON.stringify({ legacy: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=" }),
      FEATURE_GOOGLE_OAUTH: "true",
      FEATURE_GOOGLE_CALENDAR: "true",
      FEATURE_GOOGLE_SHEETS: "true",
      GOOGLE_CLIENT_ID: "client-id",
      GOOGLE_CLIENT_SECRET: "client-secret",
      GOOGLE_OAUTH_REDIRECT_URI: "https://api.gemai.example/v1/google/oauth/callback",
      GOOGLE_WEBHOOK_BASE_URL: "https://api.gemai.example",
    })).toMatchObject({ FEATURE_GOOGLE_OAUTH: true, FEATURE_GOOGLE_CALENDAR: true, FEATURE_GOOGLE_SHEETS: true });
  });
});
