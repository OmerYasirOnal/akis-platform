ALTER TYPE "audit_phase" ADD VALUE 'validate';--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "requires_strict_validation" boolean DEFAULT false NOT NULL;