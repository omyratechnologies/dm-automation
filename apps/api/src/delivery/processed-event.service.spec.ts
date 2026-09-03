import { ProcessedEventService } from "./processed-event.service";

describe("ProcessedEventService", () => {
  it("applies a consumer mutation only after claiming its event key", async () => {
    const mutation = jest.fn().mockResolvedValue("ok");
    const tx = { processedEvent: { create: jest.fn().mockResolvedValue({}) } };
    await expect(new ProcessedEventService().runOnce(tx as never, "consumer-a", "event-1", mutation)).resolves.toEqual({ applied: true, value: "ok" });
    expect(mutation).toHaveBeenCalledTimes(1);
  });

  it("skips duplicate delivery without invoking the mutation", async () => {
    const mutation = jest.fn();
    const tx = { processedEvent: { create: jest.fn().mockRejectedValue({ code: "P2002" }) } };
    await expect(new ProcessedEventService().runOnce(tx as never, "consumer-a", "event-1", mutation)).resolves.toEqual({ applied: false });
    expect(mutation).not.toHaveBeenCalled();
  });
});
