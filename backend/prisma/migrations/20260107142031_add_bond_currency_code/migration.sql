/*
  Warnings:

  - You are about to drop the column `code` on the `Bond` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[bondCode]` on the table `Bond` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `bondCode` to the `Bond` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Bond_code_key";

-- AlterTable
ALTER TABLE "Bond" DROP COLUMN "code",
ADD COLUMN     "bondCode" TEXT NOT NULL,
ADD COLUMN     "currencyCode" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Bond_bondCode_key" ON "Bond"("bondCode");
