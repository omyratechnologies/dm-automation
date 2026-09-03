import { Module } from "@nestjs/common";
import { GoogleApiClient } from "./google-api.client";
import { GoogleController, GoogleOAuthCallbackController } from "./google.controller";
import { GoogleOAuthService } from "./google-oauth.service";
import { GoogleTokenService } from "./google-token.service";

@Module({
  controllers: [GoogleController, GoogleOAuthCallbackController],
  providers: [GoogleOAuthService, GoogleTokenService, GoogleApiClient],
  exports: [GoogleTokenService, GoogleApiClient],
})
export class GoogleModule {}
