-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lastPasswordResetAt" TIMESTAMP(3),
ADD COLUMN     "otp" TEXT,
ADD COLUMN     "otpExpires" TIMESTAMP(3);
