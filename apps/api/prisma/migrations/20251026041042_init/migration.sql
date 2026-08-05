-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('ADMIN', 'FARMER', 'AGRICULTURAL_SPECIALIST', 'AGRICULTURAL_EQUIPMENT_SHOP', 'TRADER_VENDOR', 'LIVESTOCK_BREEDER', 'LIVESTOCK_SPECIALIST', 'OTHERS');

-- CreateEnum
CREATE TYPE "Category" AS ENUM ('CROPS_AND_PULSES', 'LIVESTOCK_INDUSTRY', 'FISHERY', 'AGRI_INDUSTRY');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateTable
CREATE TABLE "Users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "email" TEXT,
    "password" TEXT NOT NULL,
    "gender" "Gender" NOT NULL DEFAULT 'OTHER',
    "user_type" "UserType" NOT NULL DEFAULT 'OTHERS',
    "profile_picture" TEXT,
    "location" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationToken" TEXT,
    "verificationTokenExpiresAt" TIMESTAMP(3),
    "last_login" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Users_id_key" ON "Users"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Users_phone_number_key" ON "Users"("phone_number");

-- CreateIndex
CREATE UNIQUE INDEX "Users_email_key" ON "Users"("email");
