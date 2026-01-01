/*
  Warnings:

  - You are about to drop the column `paymentPreimage` on the `Payout` table. All the data in the column will be lost.
  - You are about to drop the `ArtistSettings` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[paymentHash]` on the table `Payout` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `Payout` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ArtistSettings" DROP CONSTRAINT "ArtistSettings_pubkey_fkey";

-- AlterTable
ALTER TABLE "Payout" DROP COLUMN "paymentPreimage",
ADD COLUMN     "errorCode" TEXT,
ADD COLUMN     "paymentHash" TEXT,
ADD COLUMN     "preimage" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- DropTable
DROP TABLE "ArtistSettings";

-- CreateTable
CREATE TABLE "ArtistWallet" (
    "pubkey" TEXT NOT NULL,
    "encryptedNwc" TEXT NOT NULL,
    "iv" TEXT NOT NULL,
    "authTag" TEXT NOT NULL,
    "algoVersion" TEXT NOT NULL DEFAULT 'AES-GCM-v1',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArtistWallet_pkey" PRIMARY KEY ("pubkey")
);

-- CreateIndex
CREATE UNIQUE INDEX "Payout_paymentHash_key" ON "Payout"("paymentHash");

-- AddForeignKey
ALTER TABLE "ArtistWallet" ADD CONSTRAINT "ArtistWallet_pubkey_fkey" FOREIGN KEY ("pubkey") REFERENCES "User"("pubkey") ON DELETE RESTRICT ON UPDATE CASCADE;
