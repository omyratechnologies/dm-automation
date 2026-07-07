import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Post,
} from "@nestjs/common";
import { z } from "zod";
import type { AuthedRequestUser } from "../auth/clerk-auth.guard";
import { CurrentUser } from "../auth/decorators";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { BillingService } from "../billing/billing.service";
import { UserService } from "./user.service";

const createUserSchema = z.object({
  clerkId: z.string().min(1),
  firstname: z.string().min(1),
  lastname: z.string().min(1),
  email: z.string().email(),
});

const ensureUserSchema = z.object({
  firstname: z.string().optional(),
  lastname: z.string().optional(),
  email: z.string().email().optional(),
});

@Controller()
export class UserController {
  constructor(
    private readonly user: UserService,
    private readonly billing: BillingService,
  ) {}

  @Post("me")
  create(
    @CurrentUser() authUser: AuthedRequestUser,
    @Body(new ZodValidationPipe(createUserSchema)) body: z.infer<typeof createUserSchema>,
  ) {
    if (body.clerkId !== authUser.clerkId) {
      throw new ForbiddenException("clerkId must match the authenticated user");
    }
    return this.user.create(body.clerkId, body.firstname, body.lastname, body.email);
  }

  @Post("me/ensure")
  async ensure(
    @CurrentUser() authUser: AuthedRequestUser,
    @Body(new ZodValidationPipe(ensureUserSchema)) body: z.infer<typeof ensureUserSchema>,
  ) {
    return this.user.ensure(
      authUser.clerkId,
      authUser.id,
      body.firstname ?? "",
      body.lastname ?? "",
      body.email ?? authUser.email,
    );
  }

  /**
   * Activate PRO after Stripe checkout. The session id is client-supplied, so
   * the paid status and the session→user binding (client_reference_id set at
   * checkout creation) are verified against Stripe before upgrading.
   */
  @Post("me/subscription")
  async updateSubscription(
    @CurrentUser() user: AuthedRequestUser,
    @Body(new ZodValidationPipe(z.object({ sessionId: z.string().min(1) })))
    body: { sessionId: string },
  ) {
    const session = await this.billing
      .getStripe()
      .checkout.sessions.retrieve(body.sessionId);

    if (session.payment_status !== "paid") {
      throw new BadRequestException("Checkout session is not paid");
    }
    if (session.client_reference_id !== user.clerkId) {
      throw new ForbiddenException("Checkout session belongs to another user");
    }
    const customerId =
      typeof session.customer === "string"
        ? session.customer
        : (session.customer?.id ?? null);
    if (!customerId) {
      throw new BadRequestException("Checkout session has no customer");
    }

    return this.user.updateSubscription(user.id, { customerId, plan: "PRO" });
  }

  @Get("workspaces/resolve")
  resolveWorkspace(@CurrentUser() user: AuthedRequestUser) {
    return this.user.resolveWorkspace(user.id);
  }
}
