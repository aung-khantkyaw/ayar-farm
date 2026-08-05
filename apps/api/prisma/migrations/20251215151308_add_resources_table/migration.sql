-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('ARTICLE', 'AGROMET_BULLETIN', 'VIDEO', 'APPLICATION');

-- CreateTable
CREATE TABLE "Resources" (
    "id" TEXT NOT NULL,
    "type" "ResourceType" NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "description" TEXT,
    "author" TEXT,
    "resource_url" TEXT,
    "image_url" TEXT,
    "filename" TEXT,
    "size" INTEGER,
    "version" TEXT,
    "platform" TEXT,
    "download_count" INTEGER DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "uploaded_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Resources_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Resources_id_key" ON "Resources"("id");
