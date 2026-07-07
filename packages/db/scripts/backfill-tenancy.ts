/**
 * One-time backfill: gives every legacy User a personal Organization,
 * a Default workspace with OWNER membership, and migrates their legacy
 * Instagram integration into an envelope-encrypted IgAccount.
 *
 * Usage: TOKEN_MASTER_KEY=<base64 32B> DATABASE_URL=... npx tsx scripts/backfill-tenancy.ts
 */
import { PrismaClient } from "@prisma/client";
import * as crypto from "crypto";

const prisma = new PrismaClient();

function encryptToken(plaintext: string, masterKeyB64: string): string {
  const masterKey = Buffer.from(masterKeyB64, "base64");
  if (masterKey.length !== 32) throw new Error("TOKEN_MASTER_KEY must be 32 bytes base64");
  const dek = crypto.randomBytes(32);
  const dekIv = crypto.randomBytes(12);
  const wrap = crypto.createCipheriv("aes-256-gcm", masterKey, dekIv);
  const dekCt = Buffer.concat([wrap.update(dek), wrap.final()]);
  const encryptedKey = Buffer.concat([dekIv, wrap.getAuthTag(), dekCt]);

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", dek, iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return [
    "v1",
    encryptedKey.toString("base64url"),
    iv.toString("base64url"),
    cipher.getAuthTag().toString("base64url"),
    ct.toString("base64url"),
  ].join(".");
}

async function main() {
  const masterKey = process.env.TOKEN_MASTER_KEY;
  if (!masterKey) throw new Error("TOKEN_MASTER_KEY is required");

  const users = await prisma.user.findMany({
    include: { integrations: true, memberships: true, subscription: true },
  });

  for (const user of users) {
    if (user.memberships.length > 0) continue; // already backfilled

    const org = await prisma.organization.create({
      data: {
        name: user.firstname ? `${user.firstname}'s organization` : user.email,
        ownerId: user.id,
        plan: user.subscription?.plan === "PRO" ? "PRO" : "FREE",
        stripeCustomerId: user.subscription?.customerId ?? undefined,
        workspaces: {
          create: {
            name: "Default",
            memberships: { create: { userId: user.id, role: "OWNER" } },
          },
        },
      },
      include: { workspaces: true },
    });
    const workspace = org.workspaces[0];

    for (const integration of user.integrations) {
      if (!integration.instagramId) continue;
      await prisma.igAccount.upsert({
        where: { igUserId: integration.instagramId },
        create: {
          workspaceId: workspace.id,
          igUserId: integration.instagramId,
          tokenEncrypted: encryptToken(integration.token, masterKey),
          tokenExpiresAt: integration.expiresAt,
          status:
            integration.expiresAt && integration.expiresAt < new Date()
              ? "TOKEN_EXPIRED"
              : "ACTIVE",
        },
        update: {},
      });
    }
    console.log(`backfilled ${user.email} → org ${org.id}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
