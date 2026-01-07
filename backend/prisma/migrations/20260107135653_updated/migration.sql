/*
  Warnings:

  - You are about to drop the column `maturityTs` on the `Bond` table. All the data in the column will be lost.
  - You are about to drop the column `payCurrencyHex` on the `Bond` table. All the data in the column will be lost.
  - You are about to drop the column `sukukCurrencyHex` on the `Bond` table. All the data in the column will be lost.
  - You are about to drop the `Order` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TxLog` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_bondId_fkey";

-- DropForeignKey
ALTER TABLE "TxLog" DROP CONSTRAINT "TxLog_orderId_fkey";

-- AlterTable
ALTER TABLE "Bond" DROP COLUMN "maturityTs",
DROP COLUMN "payCurrencyHex",
DROP COLUMN "sukukCurrencyHex",
ADD COLUMN     "code" TEXT NOT NULL DEFAULT 'TEST01';

-- DropTable
DROP TABLE "Order";

-- DropTable
DROP TABLE "TxLog";

-- DropEnum
DROP TYPE "OrderStatus";
