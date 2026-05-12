-- Migration: Add WhatsappPhoneNumber model
-- Run: psql $DATABASE_URL -f prisma/migrations/003_add_whatsapp_phone_number.sql
-- Or applied automatically via: npx prisma db push

CREATE TABLE IF NOT EXISTS "WhatsappPhoneNumber" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "agentId" TEXT,
    "twilioNumber" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsappPhoneNumber_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "WhatsappPhoneNumber_twilioNumber_key"
    ON "WhatsappPhoneNumber"("twilioNumber");

CREATE INDEX IF NOT EXISTS "WhatsappPhoneNumber_orgId_idx"
    ON "WhatsappPhoneNumber"("orgId");

CREATE INDEX IF NOT EXISTS "WhatsappPhoneNumber_twilioNumber_idx"
    ON "WhatsappPhoneNumber"("twilioNumber");

ALTER TABLE "WhatsappPhoneNumber"
    ADD CONSTRAINT "WhatsappPhoneNumber_orgId_fkey"
    FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WhatsappPhoneNumber"
    ADD CONSTRAINT "WhatsappPhoneNumber_agentId_fkey"
    FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
