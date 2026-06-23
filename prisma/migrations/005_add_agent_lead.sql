-- Agent lead capture (Collect leads action)
CREATE TABLE IF NOT EXISTS "AgentLead" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "sessionId" TEXT,
    "name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "company" TEXT,
    "notes" TEXT,
    "source" "Channel" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentLead_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AgentLead_agentId_sessionId_key"
    ON "AgentLead"("agentId", "sessionId");

CREATE INDEX IF NOT EXISTS "AgentLead_orgId_idx"
    ON "AgentLead"("orgId");

CREATE INDEX IF NOT EXISTS "AgentLead_agentId_createdAt_idx"
    ON "AgentLead"("agentId", "createdAt" DESC);

DO $$ BEGIN
    ALTER TABLE "AgentLead" ADD CONSTRAINT "AgentLead_orgId_fkey"
        FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "AgentLead" ADD CONSTRAINT "AgentLead_agentId_fkey"
        FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "AgentLead" ADD CONSTRAINT "AgentLead_sessionId_fkey"
        FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;
