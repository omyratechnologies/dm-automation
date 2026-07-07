-- AlterTable: Add follow detection fields
ALTER TABLE "Contact" ADD COLUMN "isFollow" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Post" ADD COLUMN "requireFollow" BOOLEAN NOT NULL DEFAULT false;
