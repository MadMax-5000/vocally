-- Hostaway integration (official public API only).
-- Run once with:
--   npx prisma db execute --schema prisma/schema.prisma --file prisma/migrations/005_hostaway_integration.sql

ALTER TYPE "Channel" ADD VALUE IF NOT EXISTS 'HOSTAWAY';
ALTER TYPE "AgentChannelType" ADD VALUE IF NOT EXISTS 'HOSTAWAY';

CREATE TABLE IF NOT EXISTS "HostawayConnection" (
  "id" TEXT NOT NULL,
  "orgId" TEXT NOT NULL,
  "agentId" TEXT NOT NULL,
  "accountId" TEXT NOT NULL,
  "apiKeyEnc" TEXT NOT NULL,
  "accessTokenEnc" TEXT,
  "accessTokenExpiresAt" TIMESTAMP(3),
  "webhookId" TEXT,
  "webhookLogin" TEXT NOT NULL,
  "webhookPasswordEnc" TEXT NOT NULL,
  "webhookRegisteredAt" TIMESTAMP(3),
  "autoReplyEnabled" BOOLEAN NOT NULL DEFAULT true,
  "escalationEmail" TEXT,
  "lastConnectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastError" TEXT,
  "lastErrorAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "HostawayConnection_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "HostawayConnection_agentId_key"
  ON "HostawayConnection"("agentId");
CREATE UNIQUE INDEX IF NOT EXISTS "HostawayConnection_accountId_key"
  ON "HostawayConnection"("accountId");
CREATE INDEX IF NOT EXISTS "HostawayConnection_orgId_idx"
  ON "HostawayConnection"("orgId");

CREATE TABLE IF NOT EXISTS "HostawayConversation" (
  "id" TEXT NOT NULL,
  "connectionId" TEXT NOT NULL,
  "conversationId" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "reservationId" TEXT,
  "listingMapId" TEXT,
  "guestName" TEXT,
  "channelName" TEXT,
  "propertyContext" TEXT,
  "lastInboundAt" TIMESTAMP(3),
  "lastOutboundAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "HostawayConversation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "HostawayConversation_connectionId_conversationId_key"
  ON "HostawayConversation"("connectionId", "conversationId");
CREATE UNIQUE INDEX IF NOT EXISTS "HostawayConversation_sessionId_key"
  ON "HostawayConversation"("sessionId");
CREATE INDEX IF NOT EXISTS "HostawayConversation_sessionId_idx"
  ON "HostawayConversation"("sessionId");

CREATE TABLE IF NOT EXISTS "HostawayMessageDedupe" (
  "id" TEXT NOT NULL,
  "messageKey" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HostawayMessageDedupe_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "HostawayMessageDedupe_messageKey_key"
  ON "HostawayMessageDedupe"("messageKey");
CREATE INDEX IF NOT EXISTS "HostawayMessageDedupe_createdAt_idx"
  ON "HostawayMessageDedupe"("createdAt");

ALTER TABLE "HostawayConnection"
  DROP CONSTRAINT IF EXISTS "HostawayConnection_orgId_fkey",
  ADD CONSTRAINT "HostawayConnection_orgId_fkey"
  FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "HostawayConnection"
  DROP CONSTRAINT IF EXISTS "HostawayConnection_agentId_fkey",
  ADD CONSTRAINT "HostawayConnection_agentId_fkey"
  FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "HostawayConversation"
  DROP CONSTRAINT IF EXISTS "HostawayConversation_connectionId_fkey",
  ADD CONSTRAINT "HostawayConversation_connectionId_fkey"
  FOREIGN KEY ("connectionId") REFERENCES "HostawayConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "HostawayConversation"
  DROP CONSTRAINT IF EXISTS "HostawayConversation_sessionId_fkey",
  ADD CONSTRAINT "HostawayConversation_sessionId_fkey"
  FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;
