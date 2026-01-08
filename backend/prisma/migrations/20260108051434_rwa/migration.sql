-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'REALIZED');

-- CreateTable
CREATE TABLE "RealAsset" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "currencyCode" TEXT,
    "totalTokens" INTEGER NOT NULL,
    "status" "AssetStatus" NOT NULL DEFAULT 'DRAFT',
    "currentValuationXrp" DOUBLE PRECISION,
    "issuerAddress" TEXT NOT NULL,
    "treasuryAddress" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RealAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetFile" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "mimeType" TEXT,
    "fileName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssetFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RealAsset_code_key" ON "RealAsset"("code");

-- CreateIndex
CREATE INDEX "AssetFile_assetId_idx" ON "AssetFile"("assetId");

-- AddForeignKey
ALTER TABLE "AssetFile" ADD CONSTRAINT "AssetFile_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "RealAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
