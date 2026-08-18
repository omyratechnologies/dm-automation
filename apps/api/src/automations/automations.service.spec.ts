import { AutomationsService } from "./automations.service";

function makeFixture() {
  const tx = {
    post: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
    automation: { update: jest.fn().mockResolvedValue({ id: "auto-1" }) },
  };
  const prisma = {
    automation: { findUnique: jest.fn() },
    $transaction: jest.fn(async (callback: (client: typeof tx) => unknown) =>
      callback(tx),
    ),
  };
  const service = new AutomationsService(prisma as never, {} as never);

  return { service, prisma, tx };
}

describe("AutomationsService", () => {
  it("normalizes Meta carousel media before attaching a post", async () => {
    const f = makeFixture();
    f.prisma.automation.findUnique.mockResolvedValue({ userId: "user-1" });

    await f.service.savePosts("user-1", "auto-1", [
      {
        postid: "ig-post-1",
        media: "https://example.com/post.jpg",
        mediaType: "CAROUSEL_ALBUM",
      },
    ]);

    expect(f.tx.post.deleteMany).toHaveBeenCalledWith({
      where: { automationId: "auto-1" },
    });
    expect(f.tx.automation.update).toHaveBeenCalledWith({
      where: { id: "auto-1" },
      data: {
        posts: {
          createMany: {
            data: [
              {
                postid: "ig-post-1",
                media: "https://example.com/post.jpg",
                mediaType: "CAROSEL_ALBUM",
                requireFollow: false,
              },
            ],
          },
        },
      },
    });
  });
});
