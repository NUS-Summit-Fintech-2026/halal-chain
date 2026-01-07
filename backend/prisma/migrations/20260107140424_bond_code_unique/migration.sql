/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `Bond` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Bond" ALTER COLUMN "code" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "Bond_code_key" ON "Bond"("code");
