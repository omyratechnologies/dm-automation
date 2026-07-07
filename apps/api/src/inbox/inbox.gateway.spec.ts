import { InboxGateway } from "./inbox.gateway";
import { WS_EVENTS } from "@repo/shared";
import { verifyToken } from "@clerk/backend";

jest.mock("@clerk/backend");

function makeFixture() {
  const config = {
    getOrThrow: jest.fn((key: string) => {
      if (key === "CLERK_SECRET_KEY") return "sk-test";
      throw new Error(`Missing: ${key}`);
    }),
    get: jest.fn(),
  };
  const prisma = {
    user: { findUnique: jest.fn() },
    membership: { findUnique: jest.fn() },
  };
  const gateway = new InboxGateway(config as never, prisma as never);
  gateway.server = {
    to: jest.fn().mockReturnValue({ emit: jest.fn() }),
  } as never;
  return { gateway, config, prisma };
}

describe("InboxGateway", () => {
  describe("handleConnection", () => {
    it("rejects socket without auth token", async () => {
      const { gateway } = makeFixture();
      const disconnect = jest.fn();
      const socket = { handshake: { auth: {} }, disconnect, data: {} };

      await gateway.handleConnection(socket as never);

      expect(disconnect).toHaveBeenCalledWith(true);
    });

    it("rejects socket with invalid token", async () => {
      const { gateway } = makeFixture();
      (verifyToken as jest.Mock).mockRejectedValue(new Error("bad token"));
      const disconnect = jest.fn();
      const socket = {
        handshake: { auth: { token: "jwt" } },
        disconnect,
        data: {},
      };

      await gateway.handleConnection(socket as never);

      expect(disconnect).toHaveBeenCalledWith(true);
    });

    it("rejects socket when user not onboarded", async () => {
      const { gateway, prisma } = makeFixture();
      (verifyToken as jest.Mock).mockResolvedValue({ sub: "clerk-1" });
      prisma.user.findUnique.mockResolvedValue(null);
      const disconnect = jest.fn();
      const socket = {
        handshake: { auth: { token: "jwt" } },
        disconnect,
        data: {},
      };

      await gateway.handleConnection(socket as never);

      expect(disconnect).toHaveBeenCalledWith(true);
    });

    it("accepts socket with valid token and onboarded user", async () => {
      const { gateway, prisma } = makeFixture();
      (verifyToken as jest.Mock).mockResolvedValue({ sub: "clerk-1" });
      prisma.user.findUnique.mockResolvedValue({ id: "user-1" });
      const socket: { handshake: { auth: { token: string } }; disconnect: jest.Mock; data: Record<string, unknown> } = {
        handshake: { auth: { token: "jwt" } },
        disconnect: jest.fn(),
        data: {},
      };

      await gateway.handleConnection(socket as never);

      expect(socket.data.userId).toBe("user-1");
      expect(socket.disconnect).not.toHaveBeenCalled();
    });
  });

  describe("joinWorkspace", () => {
    it("joins workspace room when membership exists", async () => {
      const { gateway, prisma } = makeFixture();
      prisma.membership.findUnique.mockResolvedValue({ id: "mem-1" });
      const join = jest.fn();
      const socket = { data: { userId: "user-1" }, join };

      const result = await gateway.joinWorkspace(
        socket as never,
        { workspaceId: "ws-1" },
      );

      expect(result).toEqual({ ok: true });
      expect(join).toHaveBeenCalledWith("workspace:ws-1");
    });

    it("returns ok: false when no membership", async () => {
      const { gateway, prisma } = makeFixture();
      prisma.membership.findUnique.mockResolvedValue(null);
      const socket = { data: { userId: "user-1" }, join: jest.fn() };

      const result = await gateway.joinWorkspace(
        socket as never,
        { workspaceId: "ws-1" },
      );

      expect(result).toEqual({ ok: false });
    });

    it("returns ok: false when userId not set", async () => {
      const { gateway } = makeFixture();
      const result = await gateway.joinWorkspace(
        { data: {} } as never,
        { workspaceId: "ws-1" },
      );

      expect(result).toEqual({ ok: false });
    });
  });

  describe("emitToWorkspace", () => {
    it("emits event to all sockets in workspace room", async () => {
      const { gateway } = makeFixture();
      const emit = jest.fn();
      gateway.server!.to = jest.fn().mockReturnValue({ emit });

      gateway.emitToWorkspace("ws-1", WS_EVENTS.MESSAGE_CREATED, { id: "msg-1" });

      expect(gateway.server!.to).toHaveBeenCalledWith("workspace:ws-1");
      expect(emit).toHaveBeenCalledWith(WS_EVENTS.MESSAGE_CREATED, { id: "msg-1" });
    });
  });
});
