-- Free plan retired. Move any remaining Free organizations to Starter before
-- the Plan enum drops the FREE value. Safe to run repeatedly: the UPDATE only
-- executes while the enum still contains FREE.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'Plan' AND e.enumlabel = 'FREE'
  ) THEN
    UPDATE "Organization" SET plan = 'STARTER' WHERE plan::text = 'FREE';
  END IF;
END
$$;
