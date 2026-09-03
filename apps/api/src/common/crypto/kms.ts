import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as crypto from "crypto";

/**
 * KMS-style envelope encryption abstraction. Swap LocalAesKms for a cloud
 * KMS implementation (AWS KMS, GCP KMS) by providing another Kms binding.
 */
export interface Kms {
  /** Returns { plaintextKey, encryptedKey } for a fresh data key. */
  generateDataKey(): { plaintextKey: Buffer; encryptedKey: Buffer; keyVersion: string };
  decryptDataKey(encryptedKey: Buffer, keyVersion?: string): Buffer;
}

export const KMS = Symbol("KMS");

/**
 * Local master-key KMS: wraps data keys with AES-256-GCM under
 * TOKEN_MASTER_KEY (32 bytes, base64).
 */
@Injectable()
export class LocalAesKms implements Kms {
  private readonly keys = new Map<string, Buffer>();
  private readonly currentVersion: string;

  constructor(config: ConfigService) {
    const raw = config.getOrThrow<string>("TOKEN_MASTER_KEY");
    const legacyKey = Buffer.from(raw, "base64");
    if (legacyKey.length !== 32) {
      throw new Error("TOKEN_MASTER_KEY must be 32 bytes, base64-encoded");
    }
    this.keys.set("legacy", legacyKey);
    const keyring = config.get<string>("TOKEN_MASTER_KEYS") ?? "";
    if (keyring) {
      let parsed: Record<string, string>;
      try { parsed = JSON.parse(keyring) as Record<string, string>; } catch { throw new Error("TOKEN_MASTER_KEYS must be a JSON object of key-version to base64 key"); }
      for (const [version, encoded] of Object.entries(parsed)) {
        const key = Buffer.from(encoded, "base64");
        if (!version || key.length !== 32) throw new Error(`Invalid master key version: ${version || "<empty>"}`);
        this.keys.set(version, key);
      }
    }
    this.currentVersion = config.get<string>("TOKEN_MASTER_KEY_VERSION") ?? "legacy";
    if (!this.keys.has(this.currentVersion)) throw new Error(`TOKEN_MASTER_KEY_VERSION is missing from the configured keyring: ${this.currentVersion}`);
  }

  generateDataKey() {
    const plaintextKey = crypto.randomBytes(32);
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", this.keys.get(this.currentVersion)!, iv);
    const ct = Buffer.concat([cipher.update(plaintextKey), cipher.final()]);
    const tag = cipher.getAuthTag();
    return {
      plaintextKey,
      encryptedKey: Buffer.concat([iv, tag, ct]),
      keyVersion: this.currentVersion,
    };
  }

  decryptDataKey(encryptedKey: Buffer, keyVersion = "legacy"): Buffer {
    const iv = encryptedKey.subarray(0, 12);
    const tag = encryptedKey.subarray(12, 28);
    const ct = encryptedKey.subarray(28);
    const key = this.keys.get(keyVersion);
    if (!key) throw new Error(`Master key version is unavailable: ${keyVersion}`);
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ct), decipher.final()]);
  }
}

/**
 * Encrypts/decrypts secrets (IG access tokens) with a per-secret data key.
 * Serialized format: "v2.<keyVersion>.<dekCt>.<iv>.<tag>.<ct>". Legacy v1
 * ciphertext remains decryptable during controlled key rotation.
 */
@Injectable()
export class TokenCrypto {
  constructor(private readonly kms: LocalAesKms) {}

  encrypt(plaintext: string): string {
    const { plaintextKey, encryptedKey, keyVersion } = this.kms.generateDataKey();
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", plaintextKey, iv);
    const ct = Buffer.concat([
      cipher.update(plaintext, "utf8"),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();
    return [
      "v2",
      keyVersion,
      encryptedKey.toString("base64url"),
      iv.toString("base64url"),
      tag.toString("base64url"),
      ct.toString("base64url"),
    ].join(".");
  }

  decrypt(serialized: string): string {
    const parts = serialized.split(".");
    const version = parts.shift();
    const keyVersion = version === "v2" ? parts.shift() : "legacy";
    if (version !== "v1" && version !== "v2") throw new Error(`Unknown token format: ${version}`);
    const [dekCt, iv, tag, ct] = parts;
    if (!dekCt || !iv || !tag || !ct || !keyVersion) throw new Error("Malformed encrypted token");
    const dek = this.kms.decryptDataKey(Buffer.from(dekCt, "base64url"), keyVersion);
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
