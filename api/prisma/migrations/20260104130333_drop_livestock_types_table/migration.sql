/*
  Warnings:

  - You are about to drop the column `livestock_type_id` on the `Documents` table. All the data in the column will be lost.
  - You are about to drop the column `livestock_type_id` on the `Livestocks` table. All the data in the column will be lost.
  - You are about to drop the `LivestockTypes` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Documents" DROP CONSTRAINT "Documents_livestock_type_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Livestocks" DROP CONSTRAINT "Livestocks_livestock_type_id_fkey";

-- DropIndex
DROP INDEX "public"."Documents_livestock_type_id_idx";

-- DropIndex
DROP INDEX "public"."Livestocks_livestock_type_id_idx";

-- AlterTable
ALTER TABLE "Documents" DROP COLUMN "livestock_type_id";

-- AlterTable
ALTER TABLE "Livestocks" DROP COLUMN "livestock_type_id";

-- DropTable
DROP TABLE "public"."LivestockTypes";
