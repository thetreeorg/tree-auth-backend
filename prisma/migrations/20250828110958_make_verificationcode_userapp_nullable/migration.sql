-- DropForeignKey
ALTER TABLE "VerificationCode" DROP CONSTRAINT "VerificationCode_userApplicationId_fkey";

-- AlterTable
ALTER TABLE "VerificationCode" ALTER COLUMN "userApplicationId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "VerificationCode" ADD CONSTRAINT "VerificationCode_userApplicationId_fkey" FOREIGN KEY ("userApplicationId") REFERENCES "UserApplication"("id") ON DELETE SET NULL ON UPDATE CASCADE;
