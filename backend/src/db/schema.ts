import {
  pgTable,
  uuid,
  varchar,
  jsonb,
  timestamp,
  pgEnum,
  text,
  index,
  uniqueIndex,
  integer,
  numeric,
  boolean,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    email: varchar('email', { length: 255 }).notNull(),
    username: varchar('username', { length: 120 }),
    passwordHash: varchar('password_hash', { length: 255 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    emailUniqueIdx: uniqueIndex('idx_users_email_unique').on(table.email),
  }),
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    jwtId: varchar('jwt_id', { length: 128 }).notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('idx_sessions_user_id').on(table.userId),
    jwtIdIdx: index('idx_sessions_jwt_id').on(table.jwtId),
  }),
);

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

export const oauthAccounts = pgTable(
  'oauth_accounts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    provider: varchar('provider', { length: 32 }).notNull(),
    providerUserId: varchar('provider_user_id', { length: 128 }).notNull(),
    installationId: varchar('installation_id', { length: 64 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    providerUserUniqueIdx: uniqueIndex('idx_oauth_accounts_provider_user').on(
      table.provider,
      table.providerUserId,
    ),
    userInstallationIdx: index('idx_oauth_accounts_user_installation').on(
      table.userId,
      table.installationId,
    ),
  }),
);

export type OAuthAccount = typeof oauthAccounts.$inferSelect;
export type NewOAuthAccount = typeof oauthAccounts.$inferInsert;

export const jobStateEnum = pgEnum('job_state', ['pending', 'running', 'completed', 'failed']);

export const auditPhaseEnum = pgEnum('audit_phase', ['plan', 'execute', 'reflect']);

export const jobs = pgTable('jobs', {
  id: uuid('id').defaultRandom().primaryKey(),
  type: varchar('type', { length: 50 }).notNull(),
  state: jobStateEnum('state').default('pending').notNull(),
  payload: jsonb('payload'),
  result: jsonb('result'),
  error: varchar('error', { length: 1000 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  // Phase 7.D: Index for efficient jobs listing (type, state, createdAt DESC)
  typeStateCreatedIdx: index('idx_jobs_type_state_created').on(table.type, table.state, table.createdAt),
}));

export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;

/**
 * Job plans - stores planning phase output
 * Phase 5.E: Plan storage for complex agents
 */
export const jobPlans = pgTable('job_plans', {
  id: uuid('id').defaultRandom().primaryKey(),
  jobId: uuid('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  steps: jsonb('steps').notNull(), // Array<{id: string; title: string; detail?: string}>
  rationale: text('rationale'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type JobPlan = typeof jobPlans.$inferSelect;
export type NewJobPlan = typeof jobPlans.$inferInsert;

/**
 * Job audits - stores audit trail for plan/execute/reflect phases
 * Phase 5.E: Audit trail for governance and debugging
 */
export const jobAudits = pgTable('job_audits', {
  id: uuid('id').defaultRandom().primaryKey(),
  jobId: uuid('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  phase: auditPhaseEnum('phase').notNull(), // 'plan' | 'execute' | 'reflect'
  payload: jsonb('payload').notNull(), // Critique, plan, or execution artifact
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type JobAudit = typeof jobAudits.$inferSelect;
export type NewJobAudit = typeof jobAudits.$inferInsert;

export const agentRunStatusEnum = pgEnum('agent_run_status', ['queued', 'running', 'completed', 'failed']);

export const agentRuns = pgTable(
  'agent_runs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    jobId: uuid('job_id').references(() => jobs.id, { onDelete: 'set null' }),
    agentType: varchar('agent_type', { length: 32 }).notNull(),
    repoFullName: varchar('repo_full_name', { length: 255 }).notNull(),
    branch: varchar('branch', { length: 120 }).notNull(),
    modelId: varchar('model_id', { length: 120 }).notNull(),
    plan: varchar('plan', { length: 16 }).default('free').notNull(),
    status: agentRunStatusEnum('status').default('queued').notNull(),
    inputTokens: integer('input_tokens').default(0),
    outputTokens: integer('output_tokens').default(0),
    costUsd: numeric('cost_usd', { precision: 12, scale: 6 }).default('0'),
    error: text('error'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    premiumConsent: boolean('premium_consent').default(false).notNull(),
    premiumConsentAt: timestamp('premium_consent_at'),
    contextTokens: integer('context_tokens').default(0),
    notes: jsonb('notes').default(sql`'[]'::jsonb`).notNull(),
  },
  (table) => ({
    userCreatedIdx: index('idx_agent_runs_user_created').on(table.userId, table.createdAt),
    modelIdx: index('idx_agent_runs_model').on(table.modelId),
  }),
);

export type AgentRun = typeof agentRuns.$inferSelect;
export type NewAgentRun = typeof agentRuns.$inferInsert;

// Relations (optional, for query convenience)
export const jobsRelations = relations(jobs, ({ many }) => ({
  plans: many(jobPlans),
  audits: many(jobAudits),
}));

export const jobPlansRelations = relations(jobPlans, ({ one }) => ({
  job: one(jobs, {
    fields: [jobPlans.jobId],
    references: [jobs.id],
  }),
}));

export const jobAuditsRelations = relations(jobAudits, ({ one }) => ({
  job: one(jobs, {
    fields: [jobAudits.jobId],
    references: [jobs.id],
  }),
}));

export const agentRunsRelations = relations(agentRuns, ({ one }) => ({
  job: one(jobs, {
    fields: [agentRuns.jobId],
    references: [jobs.id],
  }),
  user: one(users, {
    fields: [agentRuns.userId],
    references: [users.id],
  }),
}));

