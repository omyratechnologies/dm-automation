import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { z } from "zod";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { CurrentUser } from "../auth/decorators";
import type { AuthedRequestUser } from "../auth/clerk-auth.guard";
import { BillingService } from "./billing.service";

const checkoutSchema = z.object({
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

const portalSchema = z.object({
  returnUrl: z.string().url(),
});

@ApiTags("billing")
@ApiBearerAuth()
@Controller("orgs/:orgId/billing")
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  /** Plan, current usage and limits. Any member of the org may view. */
  @Get()
  overview(
    @CurrentUser() user: AuthedRequestUser,
    @Param("orgId") orgId: string,
  ) {
    return this.billing.overview(user, orgId);
  }

  /** Start a Stripe Checkout session for the PRO plan. Org owner only. */
  @Post("checkout")
  checkout(
    @CurrentUser() user: AuthedRequestUser,
    @Param("orgId") orgId: string,
    @Body(new ZodValidationPipe(checkoutSchema))
    body: z.infer<typeof checkoutSchema>,
  ) {
    return this.billing.createCheckout(user, orgId, body);
  }

  /** Open the Stripe billing portal. Org owner only. */
  @Post("portal")
  portal(
    @CurrentUser() user: AuthedRequestUser,
    @Param("orgId") orgId: string,
    @Body(new ZodValidationPipe(portalSchema))
    body: z.infer<typeof portalSchema>,
  ) {
    return this.billing.createPortal(user, orgId, body);
  }
}
