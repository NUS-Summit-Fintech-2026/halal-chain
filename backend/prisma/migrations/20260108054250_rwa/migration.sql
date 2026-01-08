/*
  Warnings:

  - Added the required column `profitRate` to the `RealAsset` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "RealAsset" ADD COLUMN     "profitRate" DOUBLE PRECISION NOT NULL;
