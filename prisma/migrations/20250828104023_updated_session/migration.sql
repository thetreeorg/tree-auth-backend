-- DropForeignKey
ALTER TABLE "Session" DROP CONSTRAINT "Session_userApplicationId_fkey";

-- AlterTable
ALTER TABLE "Session" ALTER COLUMN "userApplicationId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userApplicationId_fkey" FOREIGN KEY ("userApplicationId") REFERENCES "UserApplication"("id") ON DELETE SET NULL ON UPDATE CASCADE;
