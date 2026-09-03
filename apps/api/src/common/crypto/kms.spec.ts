import { LocalAesKms, TokenCrypto } from "./kms";

function cryptoFor(current: string) {
  const legacy = Buffer.alloc(32, 1).toString("base64");
  const next = Buffer.alloc(32, 2).toString("base64");
  const values: Record<string, string> = {
    TOKEN_MASTER_KEY: legacy,
    TOKEN_MASTER_KEY_VERSION: current,
    TOKEN_MASTER_KEYS: JSON.stringify({ legacy, next }),
  };
  const config = { get: (key: string) => values[key], getOrThrow: (key: string) => {
    if (!values[key]) throw new Error(`missing ${key}`);
    return values[key];
  } };
  return new TokenCrypto(new LocalAesKms(config as never));
}

describe("versioned token envelope encryption", () => {
  it("decrypts data written before and after a master-key rotation", () => {
    const oldCrypto = cryptoFor("legacy");
    const oldCiphertext = oldCrypto.encrypt("refresh-token-old");
    const rotatedCrypto = cryptoFor("next");
    const newCiphertext = rotatedCrypto.encrypt("refresh-token-new");
    expect(rotatedCrypto.decrypt(oldCiphertext)).toBe("refresh-token-old");
    expect(rotatedCrypto.decrypt(newCiphertext)).toBe("refresh-token-new");
  });

  it("continues to decrypt legacy v1 ciphertext", () => {
    const crypto = cryptoFor("legacy");
    const [, , ...parts] = crypto.encrypt("legacy-token").split(".");
    expect(crypto.decrypt(["v1", ...parts].join("."))).toBe("legacy-token");
  });
});
