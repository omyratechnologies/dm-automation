import { BadRequestException, ForbiddenException } from "@nestjs/common";
import { UserController } from "./user.controller";
import type { AuthedRequestUser } from "../auth/clerk-auth.guard";
import type { UserService } from "./user.service";
import type { BillingService } from "../billing/billing.service";

describe("UserController", () => {
  const authUser: AuthedRequestUser = {
    id: "user-1",
    clerkId: "clerk-1",
    email: "u@example.com",
  };

  let userService: { create: jest.Mock; updateSubscription: jest.Mock };
  let retrieve: jest.Mock;
  let controller: UserController;

  beforeEach(() => {
    userService = {
      create: jest.fn().mockResolvedValue({ id: "user-1" }),
      updateSubscription: jest.fn().mockResolvedValue({ id: "user-1" }),
    };
    retrieve = jest.fn();
    const billing = {
      getStripe: () => ({ checkout: { sessions: { retrieve } } }),
    };
    controller = new UserController(
      userService as unknown as UserService,
      billing as unknown as BillingService,
    );
  });

  describe("POST /me (create)", () => {
    it("rejects a clerkId that does not match the authenticated user", () => {
      expect(() =>
        controller.create(authUser, {
          clerkId: "someone-else",
          firstname: "A",
          lastname: "B",
          email: "a@b.com",
        }),
      ).toThrow(ForbiddenException);
      expect(userService.create).not.toHaveBeenCalled();
    });

    it("creates the user when clerkId matches", () => {
      controller.create(authUser, {
        clerkId: "clerk-1",
        firstname: "A",
        lastname: "B",
        email: "a@b.com",
      });
      expect(userService.create).toHaveBeenCalledWith("clerk-1", "A", "B", "a@b.com");
    });
  });

  describe("POST /me/subscription", () => {
    it("rejects an unpaid checkout session", async () => {
      retrieve.mockResolvedValue({
        payment_status: "unpaid",
        client_reference_id: "clerk-1",
        customer: "cus_1",
      });
      await expect(
        controller.updateSubscription(authUser, { sessionId: "cs_1" }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(userService.updateSubscription).not.toHaveBeenCalled();
    });

    it("rejects a session that belongs to another user", async () => {
      retrieve.mockResolvedValue({
        payment_status: "paid",
        client_reference_id: "clerk-other",
        customer: "cus_1",
      });
      await expect(
        controller.updateSubscription(authUser, { sessionId: "cs_1" }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(userService.updateSubscription).not.toHaveBeenCalled();
    });

    it("rejects a session with no customer", async () => {
      retrieve.mockResolvedValue({
        payment_status: "paid",
        client_reference_id: "clerk-1",
        customer: null,
      });
      await expect(
        controller.updateSubscription(authUser, { sessionId: "cs_1" }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("activates PRO for a paid session bound to this user", async () => {
      retrieve.mockResolvedValue({
        payment_status: "paid",
        client_reference_id: "clerk-1",
        customer: "cus_1",
      });
      await controller.updateSubscription(authUser, { sessionId: "cs_1" });
      expect(userService.updateSubscription).toHaveBeenCalledWith("user-1", {
        customerId: "cus_1",
        plan: "PRO",
      });
    });
  });
});
