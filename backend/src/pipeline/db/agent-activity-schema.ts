import { pgTable, uuid, varchar, text, integer, jsonb, real, timestamp } from 'drizzle-orm/pg-core';

/**
 * Agent activity log — records every agent execution for auditability.
 * Thesis theme: "Knowledge Integrity & Agent Verification"
 */
export const agentActivities = pgTable('agent_activities', {
  id: uuid('id').primaryKey().defaultRandom(),
  pipelineId: uuid('pipeline_id').notNull(),
  agent: varchar('agent', { length: 10 }).notNull(), // 'scribe' | 'proto' | 'trace'
  action: varchar('action', { length: 100 }).notNull(),
  reasoning: text('reasoning'),

  // Token usage from Claude API
  inputTokens: integer('input_tokens').default(0),
  outputTokens: integer('output_tokens').default(0),

  // Agent-specific metrics
  confidence: real('confidence'),
  filesGenerated: integer('files_generated'),
  testsPassed: integer('tests_passed'),
  testsFailed: integer('tests_failed'),
  specCompliance: real('spec_compliance'),
  assumptions: jsonb('assumptions').$type<string[]>(),

  // Performance
  responseTimeMs: integer('response_time_ms'),
  model: varchar('model', { length: 50 }),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type AgentActivityInsert = typeof agentActivities.$inferInsert;
export type AgentActivitySelect = typeof agentActivities.$inferSelect;
