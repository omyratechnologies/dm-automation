import { Redis } from "ioredis";
import { MetricsService } from "./metrics.service";

jest.mock("ioredis", () => ({ Redis: jest.fn() }));

const ZERO_METRICS = {
  messages_sent: 0,
  messages_failed: 0,
  webhooks_received: 0,
  webhooks_processed: 0,
  broadcasts_sent: 0,
  flow_runs_completed: 0,
  tokens_refreshed: 0,
};

describe("MetricsService", () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    jest.clearAllMocks();
  });

  it("returns a stable zero-valued schema when Redis is unavailable", async () => {
    process.env.NODE_ENV = "test";
    const service = new MetricsService({ get: jest.fn() } as never);

    await expect(service.getAll()).resolves.toEqual(ZERO_METRICS);
  });

  it("uses lazy command-driven Redis connection instead of a one-shot startup connect", () => {
    process.env.NODE_ENV = "production";
    const client = {
      connect: jest.fn().mockResolvedValue(undefined),
      incr: jest.fn(),
      expire: jest.fn(),
      get: jest.fn(),
    };
    (Redis as unknown as jest.Mock).mockImplementation(() => client);

    new MetricsService({ get: jest.fn().mockReturnValue("redis://test") } as never);

    expect(Redis).toHaveBeenCalledWith("redis://test", {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
    });
    expect(client.connect).not.toHaveBeenCalled();
  });
});
