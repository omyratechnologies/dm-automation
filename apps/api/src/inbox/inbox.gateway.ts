import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { verifyToken } from "@clerk/backend";
import type { Server, Socket } from "socket.io";
import { WS_EVENTS } from "@repo/shared";
import { PrismaService } from "../prisma/prisma.service";

/**
 * Realtime inbox gateway. Clients authenticate with a Clerk JWT in
 * handshake.auth.token, then join per-workspace rooms after a membership
 * check. Server-side services push events via emitToWorkspace().
 */
@WebSocketGateway({
  namespace: "/inbox",
  cors: {
    origin: (process.env.WEB_ORIGIN ?? "http://localhost:3000").split(","),
    credentials: true,
  },
})
export class InboxGateway implements OnGatewayConnection {
  @WebSocketServer()
  server?: Server;

  private readonly logger = new Logger(InboxGateway.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(socket: Socket): Promise<void> {
    try {
      const token: unknown = socket.handshake?.auth?.token;
      if (typeof token !== "string" || token.length === 0) {
        throw new Error("Missing auth token");
      }
      const claims = await Promise.race([
        verifyToken(token, {
          secretKey: this.config.getOrThrow<string>("CLERK_SECRET_KEY"),
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("verifyToken timeout")), 10_000),
        ),
      ]);
      const user = await this.prisma.user.findUnique({
        where: { clerkId: claims.sub },
        select: { id: true },
      });
      if (!user) throw new Error("User not onboarded");
      socket.data.userId = user.id;
    } catch (err) {
      this.logger.warn(
        `inbox socket rejected: ${err instanceof Error ? err.message : String(err)}`,
      );
      socket.disconnect(true);
    }
  }

  @SubscribeMessage(WS_EVENTS.JOIN_WORKSPACE)
  async joinWorkspace(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: unknown,
  ): Promise<{ ok: boolean }> {
    const userId: unknown = socket.data?.userId;
    const workspaceId = (body as { workspaceId?: unknown } | null)?.workspaceId;
    if (
      typeof userId !== "string" ||
      typeof workspaceId !== "string" ||
      workspaceId.length === 0
    ) {
      return { ok: false };
    }
    const membership = await this.prisma.membership.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } },
      select: { id: true },
    });
    if (!membership) return { ok: false };
    await socket.join(`workspace:${workspaceId}`);
    return { ok: true };
  }

  /** Broadcast an event to every socket joined to a workspace room. */
  emitToWorkspace(workspaceId: string, event: string, payload: unknown): void {
    this.server?.to(`workspace:${workspaceId}`).emit(event, payload);
  }
}
