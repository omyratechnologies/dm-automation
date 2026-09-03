import { CanActivate, ExecutionContext, HttpStatus, Injectable } from "@nestjs/common";
import { createHash, timingSafeEqual } from "crypto";
import type { Request } from "express";
import { ProblemException } from "../common/problem-details";
import { PrismaService } from "../prisma/prisma.service";

export interface BookingRequest extends Request {
  booking: { id: string; workspaceId: string; leadId: string; meetingTypeId: string; meetingId: string | null };
  workspace: { id: string; organizationId: string; role: "AGENT" };
  idempotencyActorId: string;
}

@Injectable()
export class BookingLinkGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<BookingRequest>();
    const publicId = Array.isArray(request.params.publicId) ? request.params.publicId[0] : request.params.publicId;
    const link = await this.prisma.bookingLink.findUnique({ where: { publicId } });
    const authorization = request.header("authorization") ?? "";
    const secret = authorization.match(/^Booking\s+(.+)$/i)?.[1];
    const suppliedHash = createHash("sha256").update(secret ?? "").digest();
    const expectedHash = link ? Buffer.from(link.secretHash, "hex") : Buffer.alloc(32);
    const validSecret = expectedHash.length === suppliedHash.length && timingSafeEqual(expectedHash, suppliedHash);
    const bookedAction = request.path.endsWith("/reschedule") || request.path.endsWith("/cancel");
    const validState = bookedAction ? link?.status === "BOOKED" && Boolean(link.meetingId) : link?.status === "ACTIVE";
    if (!link || !validSecret || !validState || link.expiresAt <= new Date()) {
      throw new ProblemException(HttpStatus.UNAUTHORIZED, "BOOKING_TOKEN_EXPIRED", "Booking link unavailable", "The booking link is invalid, expired or revoked");
    }
    const workspace = await this.prisma.workspace.findUniqueOrThrow({ where: { id: link.workspaceId }, select: { organizationId: true } });
    request.booking = { id: link.id, workspaceId: link.workspaceId, leadId: link.leadId, meetingTypeId: link.meetingTypeId, meetingId: link.meetingId };
    request.workspace = { id: link.workspaceId, organizationId: workspace.organizationId, role: "AGENT" };
    request.idempotencyActorId = link.id;
    return true;
  }
}
