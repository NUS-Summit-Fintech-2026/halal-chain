/*
  Warnings:

  - You are about to drop the column `bondCode` on the `Bond` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Bond` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[code]` on the table `Bond` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `Bond` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "WalletRole" AS ENUM ('ISSUER', 'TREASURY');

-- DropIndex
DROP INDEX "Bond_bondCode_key";

-- AlterTable
ALTER TABLE "Bond" DROP COLUMN "bondCode",
DROP COLUMN "updatedAt",
ADD COLUMN     "code" TEXT NOT NULL,
ALTER COLUMN "totalTokens" DROP DEFAULT;

-- CreateTable
CREATE TABLE "Wallet" (
    "id" TEXT NOT NULL,
    "role" "WalletRole" NOT NULL,
    "address" TEXT NOT NULL,
    "seed" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_role_key" ON "Wallet"("role");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_address_key" ON "Wallet"("address");

-- CreateIndex
CREATE UNIQUE INDEX "Bond_code_key" ON "Bond"("code");
