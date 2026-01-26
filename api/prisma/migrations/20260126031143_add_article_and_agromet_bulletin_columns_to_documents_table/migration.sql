-- AlterTable
ALTER TABLE "Documents" ADD COLUMN     "agromet_bulletin" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "article" BOOLEAN NOT NULL DEFAULT false;
