import { pgTable, text, timestamp, jsonb } from 'drizzle-orm/pg-core';
export const agent_runs = pgTable('agent_runs', {
  id: text('id').primaryKey(),
  agentType: text('agent_type').notNull(),
  status: text('status').notNull(), // 'pending' | 'running' | 'completed' | 'failed'
  input: jsonb('input'),
  output: jsonb('output'),
  error: text('error'),
  startedAt: timestamp('started_at', { withTimezone: true }).defaultNow(),
  finishedAt: timestamp('finished_at', { withTimezone: true }),
});


