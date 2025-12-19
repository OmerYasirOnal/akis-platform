import { pgTable, uuid, varchar, jsonb, timestamp, pgEnum, text, index, boolean, integer, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const jobStateEnum = pgEnum('job_state', ['pending', 'running', 'completed', 'failed']);

export const auditPhaseEnum = pgEnum('audit_phase', ['plan', 'execute', 'reflect', 'validate']);

export const jobs = pgTable('jobs', {
  id: uuid('id').defaultRandom().primaryKey(),
  type: varchar('type', { length: 50 }).notNull(),
  state: jobStateEnum('state').default('pending').notNull(),
  payload: jsonb('payload'),
  result: jsonb('result'),
  error: varchar('error', { length: 1000 }),
  /** Structured error code for classification (e.g., AI_RATE_LIMITED) */
  errorCode: varchar('error_code', { length: 50 }),
  /** User-friendly error message */
  errorMessage: varchar('error_message', { length: 500 }),
  /** Whether this job requires strong-model validation before completion */
  requiresStrictValidation: boolean('requires_strict_validation').default(false).notNull(),
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

/**
 * User status enum - tracks account state
 */
export const userStatusEnum = pgEnum('user_status', [
  'pending_verification',
  'active',
  'disabled',
  'deleted',
]);

/**
 * Users table - stores user accounts for authentication
 */
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  status: userStatusEnum('status').default('pending_verification').notNull(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  dataSharingConsent: boolean('data_sharing_consent'),
  hasSeenBetaWelcome: boolean('has_seen_beta_welcome').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: false }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: false }).defaultNow(),
}, (table) => ({
  emailIdx: index('idx_users_email').on(table.email),
  statusIdx: index('idx_users_status').on(table.status),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

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

/**
 * Email verification tokens - stores verification codes for email confirmation
 */
export const emailVerificationTokens = pgTable('email_verification_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  code: varchar('code', { length: 6 }).notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: false }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: false }),
  createdAt: timestamp('created_at', { withTimezone: false }).defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('idx_email_tokens_user_id').on(table.userId),
  emailIdx: index('idx_email_tokens_email').on(table.email),
  codeIdx: index('idx_email_tokens_code').on(table.code),
}));

export type EmailVerificationToken = typeof emailVerificationTokens.$inferSelect;
export type NewEmailVerificationToken = typeof emailVerificationTokens.$inferInsert;

/**
 * OAuth provider enum - supported OAuth providers
 */
export const oauthProviderEnum = pgEnum('oauth_provider', ['github', 'google']);

/**
 * OAuth accounts - stores linked OAuth provider accounts
 * Links external OAuth identities to internal users
 */
export const oauthAccounts = pgTable('oauth_accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  provider: oauthProviderEnum('provider').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  tokenExpiresAt: timestamp('token_expires_at', { withTimezone: false }),
  createdAt: timestamp('created_at', { withTimezone: false }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: false }).defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('idx_oauth_accounts_user_id').on(table.userId),
  providerAccountIdx: index('idx_oauth_accounts_provider_account').on(table.provider, table.providerAccountId),
}));

export type OAuthAccount = typeof oauthAccounts.$inferSelect;
export type NewOAuthAccount = typeof oauthAccounts.$inferInsert;

// Users relations - includes oauth accounts
export const usersRelations = relations(users, ({ many }) => ({
  oauthAccounts: many(oauthAccounts),
}));

// OAuth accounts relations
export const oauthAccountsRelations = relations(oauthAccounts, ({ one }) => ({
  user: one(users, {
    fields: [oauthAccounts.userId],
    references: [users.id],
  }),
}));

export const emailVerificationTokensRelations = relations(emailVerificationTokens, ({ one }) => ({
  user: one(users, {
    fields: [emailVerificationTokens.userId],
    references: [users.id],
  }),
}));

/**
 * Agent configs - stores per-user, per-agent configuration
 * S0.4.6: Persistent Scribe configuration storage
 */
export const agentConfigs = pgTable('agent_configs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  agentType: varchar('agent_type', { length: 50 }).notNull(), // 'scribe', 'trace', 'proto'
  
  // Status
  enabled: boolean('enabled').notNull().default(false),
  
  // Repository settings
  repositoryOwner: varchar('repository_owner', { length: 255 }),
  repositoryName: varchar('repository_name', { length: 255 }),
  baseBranch: varchar('base_branch', { length: 255 }).default('main'),
  branchPattern: varchar('branch_pattern', { length: 255 }).default('docs/{agent}-{timestamp}'),
  
  // Target settings (JSON for flexibility)
  targetPlatform: varchar('target_platform', { length: 50 }), // 'confluence', 'notion', 'github_wiki'
  targetConfig: jsonb('target_config').notNull().default({}),
  
  // Trigger settings
  triggerMode: varchar('trigger_mode', { length: 50 }).notNull().default('manual'), // 'on_pr_merge', 'scheduled', 'manual'
  scheduleCron: varchar('schedule_cron', { length: 100 }),
  
  // PR behavior
  prTitleTemplate: varchar('pr_title_template', { length: 500 }).default('docs({agent}): {summary}'),
  prBodyTemplate: text('pr_body_template'),
  autoMerge: boolean('auto_merge').notNull().default(false),
  
  // Filters
  includeGlobs: text('include_globs').array(),
  excludeGlobs: text('exclude_globs').array(),
  
  // Advanced
  jobTimeoutSeconds: integer('job_timeout_seconds').default(60),
  maxRetries: integer('max_retries').default(2),
  
  // LLM overrides (optional)
  llmModelOverride: varchar('llm_model_override', { length: 255 }),
  
  // Audit
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  // Unique constraint: one config per user per agent type
  userAgentUnique: uniqueIndex('idx_agent_configs_user_agent').on(table.userId, table.agentType),
  // Index for quick lookup
  userIdIdx: index('idx_agent_configs_user_id').on(table.userId),
}));

export type AgentConfig = typeof agentConfigs.$inferSelect;
export type NewAgentConfig = typeof agentConfigs.$inferInsert;

export const agentConfigsRelations = relations(agentConfigs, ({ one }) => ({
  user: one(users, {
    fields: [agentConfigs.userId],
    references: [users.id],
  }),
}));
