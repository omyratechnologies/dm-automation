import "reflect-metadata";
import { WebhooksModule } from "./webhooks.module";
import { WebhooksController } from "./webhooks.controller";

describe("WebhooksModule", () => {
  it("registers the Instagram webhooks controller", () => {
    // Regression: the controller was imported but missing from `controllers`,
    // so /v1/webhooks/instagram returned 404 and Meta could never verify or
    // deliver webhooks.
    const controllers: unknown[] =
      Reflect.getMetadata("controllers", WebhooksModule) ?? [];
    expect(controllers).toContain(WebhooksController);
  });
});
