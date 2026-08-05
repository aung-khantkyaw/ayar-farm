/*
  Warnings:

  - The `resource_url` column on the `Resources` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `image_url` column on the `Resources` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Resources" DROP COLUMN "resource_url",
ADD COLUMN     "resource_url" TEXT[],
DROP COLUMN "image_url",
ADD COLUMN     "image_url" TEXT[];
