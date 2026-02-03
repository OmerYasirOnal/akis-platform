-- Make enum addition idempotent to avoid "already exists" error on re-runs
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'validate' AND enumtypid = 'audit_phase'::regtype) THEN
        ALTER TYPE audit_phase ADD VALUE 'validate';
    END IF;
END $$;
--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "requires_strict_validation" boolean DEFAULT false NOT NULL;