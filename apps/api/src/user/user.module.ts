import { Module } from "@nestjs/common";
import { BillingModule } from "../billing/billing.module";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";

@Module({
  imports: [BillingModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
