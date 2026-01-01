-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "lastClientTs" BIGINT NOT NULL DEFAULT 0,
ADD COLUMN     "lastPositionMs" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'ACTIVE';

-- CreateTable
CREATE TABLE "PoEEvent" (
    "id" TEXT NOT NULL,
    "nostrEventId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PoEEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PoEEvent_nostrEventId_key" ON "PoEEvent"("nostrEventId");

-- CreateIndex
CREATE INDEX "PoEEvent_sessionId_idx" ON "PoEEvent"("sessionId");

-- CreateIndex
CREATE INDEX "Session_trackId_idx" ON "Session"("trackId");

-- CreateIndex
CREATE INDEX "Session_listenerPubkey_idx" ON "Session"("listenerPubkey");

-- AddForeignKey
ALTER TABLE "PoEEvent" ADD CONSTRAINT "PoEEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
