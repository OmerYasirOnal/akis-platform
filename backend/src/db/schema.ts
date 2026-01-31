import { pgTable, uuid, varchar, jsonb, timestamp, pgEnum, text, index, boolean, integer, uniqueIndex, numeric } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const jobStateEnum = pgEnum('job_state', ['pending', 'running', 'completed', 'failed', 'awaiting_approval']);

export const auditPhaseEnum = pgEnum('audit_phase', ['plan', 'execute', 'reflect', 'validate']);

/**
 * Trace event types for job execution tracking
 * S1.0: Scribe Observability - structured trace timeline
 * S1.1: Explainability UI - tool calls, decisions, reasoning
 */
export const traceEventTypeEnum = pgEnum('trace_event_type', [
  'step_start',    // Agent step started
  'step_complete', // Agent step completed
  'step_failed',   // Agent step failed
  'doc_read',      // Document/file read from source
  'file_created',  // File created/produced
  'file_modified', // File modified
  'mcp_connect',   // MCP gateway connection attempt
  'mcp_call',      // MCP tool call
  'ai_call',       // AI/LLM call
  'ai_parse_error', // AI response parse error (fallback used)
  'error',         // General error event
  'info',          // Informational event
  // S1.1: Explainability types
  'tool_call',     // External tool invocation (Asked)
  'tool_result',   // Tool response (Did)
  'decision',      // Agent decision point (Why)
  'plan_step',     // Plan step execution
  'reasoning',     // Reasoning summary
]);

export const jobs = pgTable('jobs', {
  id: uuid('id').defaultRandom().primaryKey(),
  type: varchar('type', { length: 50 }).notNull(),
  state: jobStateEnum('state').default('pending').notNull(),
  payload: jsonb('payload'),
  result: jsonb('result'),
  error: varchar('error', { length: 1000 }),
  /** Structured error code for classification (e.g., AI_RATE_LIMITED, MCP_UNREACHABLE) */
  errorCode: varchar('error_code', { length: 50 }),
  /** User-friendly error message */
  errorMessage: varchar('error_message', { length: 500 }),
  /** Full structured error payload for debugging (JSON-serialized) */
  rawErrorPayload: text('raw_error_payload'),
  /** MCP Gateway URL used for this job (for diagnostics) */
  mcpGatewayUrl: varchar('mcp_gateway_url', { length: 255 }),
  /** AI provider requested at job submission (e.g., openai) */
  aiProvider: varchar('ai_provider', { length: 50 }),
  /** AI model requested at job submission (e.g., gpt-4o-mini) */
  aiModel: varchar('ai_model', { length: 255 }),
  /** Resolved AI provider actually used at runtime */
  aiProviderResolved: varchar('ai_provider_resolved', { length: 50 }),
  /** Resolved AI model actually used at runtime */
  aiModelResolved: varchar('ai_model_resolved', { length: 255 }),
  /** Key source: 'user' = user's stored key, 'env' = environment/server key */
  aiKeySource: varchar('ai_key_source', { length: 20 }),
  /** Fallback reason if env key used instead of user key (e.g., USER_KEY_MISSING) */
  aiFallbackReason: varchar('ai_fallback_reason', { length: 100 }),
  /** Aggregate AI duration (ms) */
  aiTotalDurationMs: integer('ai_total_duration_ms'),
  /** Aggregate input tokens */
  aiInputTokens: integer('ai_input_tokens'),
  /** Aggregate output tokens */
  aiOutputTokens: integer('ai_output_tokens'),
  /** Aggregate total tokens */
  aiTotalTokens: integer('ai_total_tokens'),
  /** Estimated cost in USD (optional, estimate) */
  aiEstimatedCostUsd: numeric('ai_estimated_cost_usd', { precision: 12, scale: 6 }),
  /** Whether this job requires strong-model validation before completion */
  requiresStrictValidation: boolean('requires_strict_validation').default(false).notNull(),
  // S1.2: Approval system for PLAN_ONLY → EXECUTE workflow
  /** Whether this job requires approval before execution */
  requiresApproval: boolean('requires_approval').default(false).notNull(),
  /** User who approved this job */
  approvedBy: uuid('approved_by').references(() => users.id),
  /** Timestamp when job was approved */
  approvedAt: timestamp('approved_at'),
  /** User who rejected this job */
  rejectedBy: uuid('rejected_by').references(() => users.id),
  /** Timestamp when job was rejected */
  rejectedAt: timestamp('rejected_at'),
  /** Comment on approval/rejection */
  approvalComment: text('approval_comment'),
  // PR-2: Revision chain support
  /** Parent job ID for revision chain (null if original job) */
  parentJobId: uuid('parent_job_id'),
  /** User instruction for revision (what to change) */
  revisionNote: text('revision_note'),
  /** Quality score (0-100) computed from job results */
  qualityScore: integer('quality_score'),
  /** Quality breakdown details (JSON: {label, value, points}[]) */
  qualityBreakdown: jsonb('quality_breakdown'),
  /** Quality algorithm version for future migrations */
  qualityVersion: varchar('quality_version', { length: 20 }),
  /** When quality was computed */
  qualityComputedAt: timestamp('quality_computed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  // Phase 7.D: Index for efficient jobs listing (type, state, createdAt DESC)
  typeStateCreatedIdx: index('idx_jobs_type_state_created').on(table.type, table.state, table.createdAt),
  // S1.2: Index for approval queries
  requiresApprovalIdx: index('idx_jobs_requires_approval').on(table.requiresApproval),
  approvedByIdx: index('idx_jobs_approved_by').on(table.approvedBy),
  // PR-2: Index for revision chain queries
  parentJobIdIdx: index('idx_jobs_parent_job_id').on(table.parentJobId),
}));

export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;

/**
 * Job plans - stores planning phase output (contract-first)
 * Phase 5.E: Plan storage for complex agents
 * PR-1: Extended with plan_markdown and plan_json for contract-first workflow
 */
export const jobPlans = pgTable('job_plans', {
  id: uuid('id').defaultRandom().primaryKey(),
  jobId: uuid('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  /** Legacy: Array of plan steps (backward compat) */
  steps: jsonb('steps'), // Array<{id: string; title: string; detail?: string}>
  /** Legacy: Plan rationale (backward compat) */
  rationale: text('rationale'),
  /** 
   * PR-1: Contract-first plan document (Markdown)
   * Contains: Objective, Scope, Plan, Validation, Rollback, Docs, AI Disclosure, Evidence
   */
  planMarkdown: text('plan_markdown'),
  /**
   * PR-1: Structured plan data (JSON)
   * For programmatic access to plan sections
   */
  planJson: jsonb('plan_json'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  jobIdIdx: index('idx_job_plans_job_id').on(table.jobId),
}));

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
 * Job comments - stores user feedback on jobs
 * PR-2: Feedback loop - users can leave comments for revision
 */
export const jobComments = pgTable('job_comments', {
  id: uuid('id').defaultRandom().primaryKey(),
  jobId: uuid('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id),
  commentText: text('comment_text').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  jobIdIdx: index('idx_job_comments_job_id').on(table.jobId),
  createdAtIdx: index('idx_job_comments_created_at').on(table.createdAt),
}));

export type JobComment = typeof jobComments.$inferSelect;
export type NewJobComment = typeof jobComments.$inferInsert;

/**
 * Job traces - stores execution timeline events
 * S1.0: Scribe Observability - structured trace timeline
 * S1.1: Explainability UI - reasoning summaries, Asked/Did/Why
 */
export const jobTraces = pgTable('job_traces', {
  id: uuid('id').defaultRandom().primaryKey(),
  jobId: uuid('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  eventType: traceEventTypeEnum('event_type').notNull(),
  /** Step ID if this trace is associated with a plan step */
  stepId: varchar('step_id', { length: 100 }),
  /** Event title/summary */
  title: varchar('title', { length: 500 }).notNull(),
  /** Event details (JSON for flexibility) - raw, server-side only */
  detail: jsonb('detail'),
  /** Duration in milliseconds (for timed events) */
  durationMs: integer('duration_ms'),
  /** Status: success, failed, warning, info */
  status: varchar('status', { length: 20 }).default('info'),
  /** Correlation ID for MCP/external calls */
  correlationId: varchar('correlation_id', { length: 100 }),
  /** Gateway URL for MCP events */
  gatewayUrl: varchar('gateway_url', { length: 500 }),
  /** Error code if failed */
  errorCode: varchar('error_code', { length: 50 }),
  /** Timestamp of the event */
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  // S1.1: Explainability fields
  /** Tool name for tool_call/tool_result events */
  toolName: varchar('tool_name', { length: 100 }),
  /** Summary of input/arguments (redacted, user-facing) */
  inputSummary: text('input_summary'),
  /** Summary of output/result (redacted, user-facing) */
  outputSummary: text('output_summary'),
  /** User-facing reasoning summary (2-4 sentences, never raw chain-of-thought) */
  reasoningSummary: varchar('reasoning_summary', { length: 1000 }),
  /** "Asked" - What did the agent ask the tool to do? */
  askedWhat: text('asked_what'),
  /** "Did" - What action was taken? */
  didWhat: text('did_what'),
  /** "Why" - Why was this action taken? (user-facing reason) */
  whyReason: text('why_reason'),
}, (table) => ({
  jobIdIdx: index('idx_job_traces_job_id').on(table.jobId),
  eventTypeIdx: index('idx_job_traces_event_type').on(table.eventType),
  toolNameIdx: index('idx_job_traces_tool_name').on(table.toolName),
}));

export type JobTrace = typeof jobTraces.$inferSelect;
export type NewJobTrace = typeof jobTraces.$inferInsert;

/**
 * Job AI calls - stores per-call AI metrics for detailed breakdown
 * Enables: total tokens/cost, per-call breakdown, model usage analytics
 */
export const jobAiCalls = pgTable('job_ai_calls', {
  id: uuid('id').defaultRandom().primaryKey(),
  jobId: uuid('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  /** Call index within the job (0-based, for ordering) */
  callIndex: integer('call_index').notNull(),
  /** AI provider used for this call */
  provider: varchar('provider', { length: 50 }).notNull(),
  /** AI model used for this call */
  model: varchar('model', { length: 255 }).notNull(),
  /** Purpose/description of the AI call */
  purpose: varchar('purpose', { length: 255 }),
  /** Input tokens for this call */
  inputTokens: integer('input_tokens'),
  /** Output tokens for this call */
  outputTokens: integer('output_tokens'),
  /** Total tokens for this call */
  totalTokens: integer('total_tokens'),
  /** Duration in milliseconds */
  durationMs: integer('duration_ms'),
  /** Estimated cost in USD for this call */
  estimatedCostUsd: numeric('estimated_cost_usd', { precision: 12, scale: 6 }),
  /** Whether the call succeeded */
  success: boolean('success').default(true).notNull(),
  /** Error code if failed */
  errorCode: varchar('error_code', { length: 50 }),
  /** Timestamp of the call */
  timestamp: timestamp('timestamp').defaultNow().notNull(),
}, (table) => ({
  jobIdIdx: index('idx_job_ai_calls_job_id').on(table.jobId),
  jobIdCallIndexIdx: index('idx_job_ai_calls_job_id_call_index').on(table.jobId, table.callIndex),
}));

export type JobAiCall = typeof jobAiCalls.$inferSelect;
export type NewJobAiCall = typeof jobAiCalls.$inferInsert;

/**
 * Job artifacts - stores files/documents produced by jobs
 * S1.0: Scribe Observability - artifacts tracking
 * S1.1: Explainability UI - diff previews for changed files
 */
export const jobArtifacts = pgTable('job_artifacts', {
  id: uuid('id').defaultRandom().primaryKey(),
  jobId: uuid('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  /** Artifact type: doc_read, file_created, file_modified */
  artifactType: varchar('artifact_type', { length: 50 }).notNull(),
  /** File path or document identifier */
  path: varchar('path', { length: 1000 }).notNull(),
  /** Operation performed: read, create, modify, delete */
  operation: varchar('operation', { length: 20 }).notNull(),
  /** Size in bytes (if applicable) */
  sizeBytes: integer('size_bytes'),
  /** Content hash (SHA-256, for deduplication/verification) */
  contentHash: varchar('content_hash', { length: 64 }),
  /** Preview/excerpt (truncated, max 1KB) */
  preview: text('preview'),
  /** Additional metadata (JSON) */
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  // S1.1: Diff preview fields
  /** Unified diff preview for modified files (truncated) */
  diffPreview: text('diff_preview'),
  /** Number of lines added */
  linesAdded: integer('lines_added'),
  /** Number of lines removed */
  linesRemoved: integer('lines_removed'),
}, (table) => ({
  jobIdIdx: index('idx_job_artifacts_job_id').on(table.jobId),
  artifactTypeIdx: index('idx_job_artifacts_type').on(table.artifactType),
}));

export type JobArtifact = typeof jobArtifacts.$inferSelect;
export type NewJobArtifact = typeof jobArtifacts.$inferInsert;

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
 * AI Provider enum for user settings
 */
export const aiProviderEnum = pgEnum('ai_provider', ['openai', 'openrouter']);
export const userRoleEnum = pgEnum('user_role', ['admin', 'member']);

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
  /** User's active AI provider for Scribe and other AI features */
  activeAiProvider: aiProviderEnum('active_ai_provider').default('openrouter'),
  /** User role for access control */
  role: userRoleEnum('role').notNull().default('member'),
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
  traces: many(jobTraces),
  artifacts: many(jobArtifacts),
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

export const jobTracesRelations = relations(jobTraces, ({ one }) => ({
  job: one(jobs, {
    fields: [jobTraces.jobId],
    references: [jobs.id],
  }),
}));

export const jobArtifactsRelations = relations(jobArtifacts, ({ one }) => ({
  job: one(jobs, {
    fields: [jobArtifacts.jobId],
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
 * - github: GitHub OAuth for repository access
 * - google: Google OAuth for user login
 * - atlassian: Atlassian OAuth 2.0 (3LO) for Jira + Confluence
 */
export const oauthProviderEnum = pgEnum('oauth_provider', ['github', 'google', 'atlassian']);

/**
 * OAuth accounts - stores linked OAuth provider accounts
 * Links external OAuth identities to internal users
 * 
 * For Atlassian OAuth 2.0 (3LO):
 * - cloudId: Atlassian Cloud ID for API calls
 * - siteUrl: Atlassian site URL (e.g., https://your-domain.atlassian.net)
 * - scopes: Granted OAuth scopes (space-separated)
 * - refreshTokenRotatedAt: Timestamp of last refresh token rotation
 */
export const oauthAccounts = pgTable('oauth_accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  provider: oauthProviderEnum('provider').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  tokenExpiresAt: timestamp('token_expires_at', { withTimezone: false }),
  // Atlassian-specific fields (nullable for other providers)
  cloudId: varchar('cloud_id', { length: 255 }),
  siteUrl: varchar('site_url', { length: 500 }),
  scopes: text('scopes'),
  refreshTokenRotatedAt: timestamp('refresh_token_rotated_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: false }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: false }).defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('idx_oauth_accounts_user_id').on(table.userId),
  providerAccountIdx: index('idx_oauth_accounts_provider_account').on(table.provider, table.providerAccountId),
}));

export type OAuthAccount = typeof oauthAccounts.$inferSelect;
export type NewOAuthAccount = typeof oauthAccounts.$inferInsert;

export const userAiKeys = pgTable('user_ai_keys', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  provider: varchar('provider', { length: 50 }).notNull(),
  encryptedKey: text('encrypted_key').notNull(),
  keyIv: varchar('key_iv', { length: 64 }).notNull(),
  keyTag: varchar('key_tag', { length: 64 }).notNull(),
  keyVersion: varchar('key_version', { length: 20 }).notNull(),
  last4: varchar('last4', { length: 4 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userProviderUnique: uniqueIndex('idx_user_ai_keys_user_provider').on(table.userId, table.provider),
  userIdIdx: index('idx_user_ai_keys_user_id').on(table.userId),
}));

export type UserAiKey = typeof userAiKeys.$inferSelect;
export type NewUserAiKey = typeof userAiKeys.$inferInsert;

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
 * Integration provider enum for Jira/Confluence credentials
 */
export const integrationProviderEnum = pgEnum('integration_provider', ['jira', 'confluence']);

/**
 * Integration credentials - stores encrypted API tokens for Jira/Confluence
 * Uses same encryption pattern as user_ai_keys (AES-256-GCM)
 */
export const integrationCredentials = pgTable('integration_credentials', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  provider: integrationProviderEnum('provider').notNull(),
  /** Site URL (e.g., https://your-domain.atlassian.net) */
  siteUrl: varchar('site_url', { length: 500 }).notNull(),
  /** User email for Atlassian */
  userEmail: varchar('user_email', { length: 255 }).notNull(),
  /** Encrypted API token (AES-256-GCM) */
  encryptedToken: text('encrypted_token').notNull(),
  /** IV for encryption */
  tokenIv: varchar('token_iv', { length: 64 }).notNull(),
  /** Auth tag for encryption */
  tokenTag: varchar('token_tag', { length: 64 }).notNull(),
  /** Encryption key version */
  keyVersion: varchar('key_version', { length: 20 }).notNull(),
  /** Last 4 characters of the token (for display) */
  tokenLast4: varchar('token_last4', { length: 4 }).notNull(),
  /** Last successful validation timestamp */
  lastValidatedAt: timestamp('last_validated_at', { withTimezone: true }),
  /** Whether the connection is currently valid */
  isValid: boolean('is_valid').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userProviderUnique: uniqueIndex('idx_integration_creds_user_provider').on(table.userId, table.provider),
  userIdIdx: index('idx_integration_creds_user_id').on(table.userId),
}));

export type IntegrationCredential = typeof integrationCredentials.$inferSelect;
export type NewIntegrationCredential = typeof integrationCredentials.$inferInsert;

export const integrationCredentialsRelations = relations(integrationCredentials, ({ one }) => ({
  user: one(users, {
    fields: [integrationCredentials.userId],
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
  targetPlatform: varchar('target_platform', { length: 50 }), // 'confluence', 'notion', 'github_wiki', 'github_repo'
  targetConfig: jsonb('target_config').notNull().default({}),
  
  // Trigger settings
  triggerMode: varchar('trigger_mode', { length: 50 }).notNull().default('manual'), // 'on_pr_merge', 'scheduled', 'manual'
  scheduleCron: varchar('schedule_cron', { length: 100 }),
  
  // PR behavior
  prTitleTemplate: varchar('pr_title_template', { length: 500 }).default('docs(scribe): update {path}'),
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

// ============================================================================
// Billing: Plans, Subscriptions, Usage Counters
// ============================================================================

export const planTierEnum = pgEnum('plan_tier', ['free', 'pro', 'pro_plus', 'team', 'enterprise']);
export const subscriptionStatusEnum = pgEnum('subscription_status', ['active', 'past_due', 'canceled', 'trialing', 'incomplete']);

/**
 * Plans table - defines available subscription tiers and their limits
 */
export const plans = pgTable('plans', {
  id: varchar('id', { length: 50 }).primaryKey(),  // e.g. 'free', 'pro', 'pro_plus'
  tier: planTierEnum('tier').notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),

  // Limits
  jobsPerDay: integer('jobs_per_day').notNull().default(5),
  maxTokenBudget: integer('max_token_budget').notNull().default(50000),
  maxAgents: integer('max_agents').notNull().default(2),
  depthModesAllowed: text('depth_modes_allowed').array().notNull(),  // ['lite','standard'] or ['lite','standard','deep']
  maxOutputTokensPerJob: integer('max_output_tokens_per_job').notNull().default(16000),
  passesAllowed: integer('passes_allowed').notNull().default(1),     // 1 or 2
  priorityQueue: boolean('priority_queue').notNull().default(false),
  backgroundJobHistory: integer('background_job_history_days').notNull().default(7),

  // Pricing (cents USD, 0 = free)
  priceMonthly: integer('price_monthly').notNull().default(0),
  priceYearly: integer('price_yearly').notNull().default(0),

  // Stripe mapping
  stripePriceMonthly: varchar('stripe_price_monthly', { length: 255 }),
  stripePriceYearly: varchar('stripe_price_yearly', { length: 255 }),

  // Metadata
  isActive: boolean('is_active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Plan = typeof plans.$inferSelect;

/**
 * Subscriptions table - tracks user subscription state
 */
export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id),
  planId: varchar('plan_id', { length: 50 }).notNull().references(() => plans.id),
  status: subscriptionStatusEnum('status').notNull().default('active'),

  // Stripe
  stripeCustomerId: varchar('stripe_customer_id', { length: 255 }),
  stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }),

  // Billing period
  currentPeriodStart: timestamp('current_period_start', { withTimezone: true }),
  currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').notNull().default(false),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('idx_subscriptions_user_id').on(table.userId),
  stripeCustomerIdx: index('idx_subscriptions_stripe_customer').on(table.stripeCustomerId),
  stripeSubIdx: index('idx_subscriptions_stripe_sub').on(table.stripeSubscriptionId),
}));

export type Subscription = typeof subscriptions.$inferSelect;

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, { fields: [subscriptions.userId], references: [users.id] }),
  plan: one(plans, { fields: [subscriptions.planId], references: [plans.id] }),
}));

/**
 * Usage counters table - tracks per-user resource consumption per billing cycle
 */
export const usageCounters = pgTable('usage_counters', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id),

  // Period (YYYY-MM format for monthly, or YYYY-MM-DD for daily)
  periodKey: varchar('period_key', { length: 10 }).notNull(),  // '2025-01' or '2025-01-30'
  periodType: varchar('period_type', { length: 10 }).notNull().default('daily'),  // 'daily' | 'monthly'

  // Counters
  jobsUsed: integer('jobs_used').notNull().default(0),
  tokensUsed: integer('tokens_used').notNull().default(0),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userPeriodUnique: uniqueIndex('idx_usage_user_period').on(table.userId, table.periodKey, table.periodType),
  userIdIdx: index('idx_usage_counters_user_id').on(table.userId),
}));

export type UsageCounter = typeof usageCounters.$inferSelect;

// ============================================================================
// Billing Admin
// ============================================================================

/**
 * Workspace-level billing settings (singleton — one row)
 */
export const workspaceBillingSettings = pgTable('workspace_billing_settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  monthlyBudgetUsd: numeric('monthly_budget_usd', { precision: 10, scale: 2 }),
  softThresholdPct: numeric('soft_threshold_pct', { precision: 3, scale: 2 }).notNull().default('0.80'),
  hardStopEnabled: boolean('hard_stop_enabled').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type WorkspaceBillingSettings = typeof workspaceBillingSettings.$inferSelect;

/**
 * Per-user billing overrides (admin can set per-user budgets or unlimited)
 */
export const userBillingOverrides = pgTable('user_billing_overrides', {
  userId: uuid('user_id').primaryKey().references(() => users.id),
  monthlyBudgetUsd: numeric('monthly_budget_usd', { precision: 10, scale: 2 }),
  isUnlimited: boolean('is_unlimited').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type UserBillingOverride = typeof userBillingOverrides.$inferSelect;

/**
 * Billing notifications (threshold warnings, limit reached, etc.)
 */
export const billingNotifications = pgTable('billing_notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id),
  type: varchar('type', { length: 50 }).notNull(),
  payload: jsonb('payload').notNull().default({}),
  readAt: timestamp('read_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdx: index('idx_billing_notifications_user').on(table.userId),
  typeDateIdx: index('idx_billing_notifications_type_date').on(table.type, table.createdAt),
}));

export type BillingNotification = typeof billingNotifications.$inferSelect;
