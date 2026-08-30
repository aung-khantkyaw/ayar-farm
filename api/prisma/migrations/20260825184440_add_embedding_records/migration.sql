-- CreateEnum
CREATE TYPE "EmbedTargetType" AS ENUM ('POST', 'DOCUMENT', 'KNOWLEDGE_BASE');

-- CreateTable
CREATE TABLE "EmbeddingRecord" (
    "id" TEXT NOT NULL,
    "apiKeyId" TEXT NOT NULL,
    "targetType" "EmbedTargetType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "status" "EmbeddingStatus" NOT NULL DEFAULT 'PENDING',
    "collectionName" TEXT,
    "vectorCount" INTEGER,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmbeddingRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmbeddingRecord_status_idx" ON "EmbeddingRecord"("status");

-- CreateIndex
CREATE INDEX "EmbeddingRecord_targetType_targetId_idx" ON "EmbeddingRecord"("targetType", "targetId");

-- CreateIndex
CREATE UNIQUE INDEX "EmbeddingRecord_apiKeyId_targetType_targetId_key" ON "EmbeddingRecord"("apiKeyId", "targetType", "targetId");

-- AddForeignKey
ALTER TABLE "EmbeddingRecord" ADD CONSTRAINT "EmbeddingRecord_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "ApiKey"("id") ON DELETE CASCADE ON UPDATE CASCADE;
