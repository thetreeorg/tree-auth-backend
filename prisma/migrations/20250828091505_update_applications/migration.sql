/*
  Warnings:

  - You are about to drop the column `apiSecret` on the `Application` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Application_apiSecret_key";

-- AlterTable
ALTER TABLE "Application" DROP COLUMN "apiSecret";
