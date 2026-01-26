/*
  Warnings:

  - The values [ARTICLE] on the enum `ResourceType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `article` on the `Documents` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ResourceType_new" AS ENUM ('LOAN', 'AGROMET_BULLETIN', 'VIDEO', 'APPLICATION');
ALTER TABLE "Resources" ALTER COLUMN "type" TYPE "ResourceType_new" USING ("type"::text::"ResourceType_new");
ALTER TYPE "ResourceType" RENAME TO "ResourceType_old";
ALTER TYPE "ResourceType_new" RENAME TO "ResourceType";
DROP TYPE "public"."ResourceType_old";
COMMIT;

-- AlterTable
ALTER TABLE "Documents" DROP COLUMN "article",
ADD COLUMN     "loan" BOOLEAN NOT NULL DEFAULT false;
