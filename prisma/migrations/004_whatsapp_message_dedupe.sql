-- Idempotency for Twilio WhatsApp webhook retries
CREATE TABLE IF NOT EXISTS "WhatsappMessageDedupe" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhatsappMessageDedupe_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "WhatsappMessageDedupe_messageId_key"
    ON "WhatsappMessageDedupe"("messageId");

CREATE INDEX IF NOT EXISTS "WhatsappMessageDedupe_createdAt_idx"
    ON "WhatsappMessageDedupe"("createdAt");
