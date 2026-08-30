/*
  Warnings:

  - You are about to drop the column `embeddingStatus` on the `Documents` table. All the data in the column will be lost.
  - You are about to drop the column `embeddingStatus` on the `KnowledgeBase` table. All the data in the column will be lost.
  - You are about to drop the column `embeddingStatus` on the `Post` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Documents" DROP COLUMN "embeddingStatus";

-- AlterTable
ALTER TABLE "KnowledgeBase" DROP COLUMN "embeddingStatus";

-- AlterTable
ALTER TABLE "Post" DROP COLUMN "embeddingStatus";
