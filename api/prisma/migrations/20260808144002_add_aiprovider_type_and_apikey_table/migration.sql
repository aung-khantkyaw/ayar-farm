-- CreateEnum
CREATE TYPE "AIProvider" AS ENUM ('OPENROUTER', 'OPENAI', 'ANTHROPIC', 'GOOGLE', 'CUSTOM');

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL,
    "provider" "AIProvider" NOT NULL,
    "llmModelName" TEXT NOT NULL,
    "embeddingModelName" TEXT NOT NULL,
    "vectorSize" INTEGER NOT NULL,
    "apiKey" TEXT,
    "baseUrl" TEXT,
    "limit" INTEGER NOT NULL DEFAULT 0,
    "used" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ApiKey_provider_idx" ON "ApiKey"("provider");

-- CreateIndex
CREATE INDEX "ApiKey_active_idx" ON "ApiKey"("active");
