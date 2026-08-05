-- AlterTable
ALTER TABLE "Users" ADD COLUMN     "resetPasswordExpiresAt" TIMESTAMP(3),
ADD COLUMN     "resetPasswordToken" TEXT;
