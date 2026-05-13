-- Add ESCALATED and CLAIMED to SessionStatus enum
ALTER TYPE "SessionStatus" ADD VALUE IF NOT EXISTS 'ESCALATED';
ALTER TYPE "SessionStatus" ADD VALUE IF NOT EXISTS 'CLAIMED';

-- Add escalation metadata columns to Session table
ALTER TABLE "Session" ADD COLUMN IF NOT EXISTS "escalatedAt" TIMESTAMP(3);
ALTER TABLE "Session" ADD COLUMN IF NOT EXISTS "escalatedReason" TEXT;
ALTER TABLE "Session" ADD COLUMN IF NOT EXISTS "claimedAt" TIMESTAMP(3);
ALTER TABLE "Session" ADD COLUMN IF NOT EXISTS "claimedById" TEXT;
