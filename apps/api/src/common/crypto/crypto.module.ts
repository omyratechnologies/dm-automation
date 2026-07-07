import { Global, Module } from "@nestjs/common";
import { LocalAesKms, TokenCrypto } from "./kms";

@Global()
@Module({
  providers: [LocalAesKms, TokenCrypto],
  exports: [LocalAesKms, TokenCrypto],
})
export class CryptoModule {}
