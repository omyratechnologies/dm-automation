import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as crypto from "crypto";

/**
 * KMS-style envelope encryption abstraction. Swap LocalAesKms for a cloud
 * KMS implementation (AWS KMS, GCP KMS) by providing another Kms binding.
 */
export interface Kms {
  /** Returns { plaintextKey, encryptedKey } for a fresh data key. */
  generateDataKey(): { plaintextKey: Buffer; encryptedKey: Buffer };
  decryptDataKey(encryptedKey: Buffer): Buffer;
}

export const KMS = Symbol("KMS");

/**
 * Local master-key KMS: wraps data keys with AES-256-GCM under
 * TOKEN_MASTER_KEY (32 bytes, base64).
 */
@Injectable()
export class LocalAesKms implements Kms {
  private readonly masterKey: Buffer;

  constructor(config: ConfigService) {
    const raw = config.getOrThrow<string>("TOKEN_MASTER_KEY");
    this.masterKey = Buffer.from(raw, "base64");
    if (this.masterKey.length !== 32) {
      throw new Error("TOKEN_MASTER_KEY must be 32 bytes, base64-encoded");
    }
  }

  generateDataKey() {
    const plaintextKey = crypto.randomBytes(32);
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", this.masterKey, iv);
    const ct = Buffer.concat([cipher.update(plaintextKey), cipher.final()]);
    const tag = cipher.getAuthTag();
    return {
      plaintextKey,
      encryptedKey: Buffer.concat([iv, tag, ct]),
    };
  }

  decryptDataKey(encryptedKey: Buffer): Buffer {
    const iv = encryptedKey.subarray(0, 12);
    const tag = encryptedKey.subarray(12, 28);
    const ct = encryptedKey.subarray(28);
    const decipher = crypto.createDecipheriv("aes-256-gcm", this.masterKey, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ct), decipher.final()]);
  }
}

/**
 * Encrypts/decrypts secrets (IG access tokens) with a per-secret data key.
 * Serialized format: "v1.<dekCt>.<iv>.<tag>.<ct>" (base64url parts).
 */
@Injectable()
export class TokenCrypto {
  constructor(private readonly kms: LocalAesKms) {}

  encrypt(plaintext: string): string {
    const { plaintextKey, encryptedKey } = this.kms.generateDataKey();
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", plaintextKey, iv);
    const ct = Buffer.concat([
      cipher.update(plaintext, "utf8"),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();
    return [
      "v1",
      encryptedKey.toString("base64url"),
      iv.toString("base64url"),
      tag.toString("base64url"),
      ct.toString("base64url"),
    ].join(".");
  }

  decrypt(serialized: string): string {
    const [version, dekCt, iv, tag, ct] = serialized.split(".");
    if (version !== "v1") throw new Error(`Unknown token format: ${version}`);
    const dek = this.kms.decryptDataKey(Buffer.from(dekCt, "base64url"));
    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      dek,
      Buffer.from(iv, "base64url"),
    );
    decipher.setAuthTag(Buffer.from(tag, "base64url"));
    return Buffer.concat([
      decipher.update(Buffer.from(ct, "base64url")),
      decipher.final(),
    ]).toString("utf8");
  }
}
