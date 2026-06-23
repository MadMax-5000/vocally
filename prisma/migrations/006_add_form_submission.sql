-- Custom form submissions (Custom form action)
CREATE TABLE IF NOT EXISTS "FormSubmission" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "sessionId" TEXT,
    "formId" TEXT NOT NULL,
    "values" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FormSubmission_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "FormSubmission_agentId_sessionId_formId_key"
    ON "FormSubmission"("agentId", "sessionId", "formId");

CREATE INDEX IF NOT EXISTS "FormSubmission_orgId_idx"
    ON "FormSubmission"("orgId");

CREATE INDEX IF NOT EXISTS "FormSubmission_agentId_createdAt_idx"
    ON "FormSubmission"("agentId", "createdAt" DESC);

DO $$ BEGIN
    ALTER TABLE "FormSubmission" ADD CONSTRAINT "FormSubmission_orgId_fkey"
        FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "FormSubmission" ADD CONSTRAINT "FormSubmission_agentId_fkey"
        FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "FormSubmission" ADD CONSTRAINT "FormSubmission_sessionId_fkey"
        FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;
