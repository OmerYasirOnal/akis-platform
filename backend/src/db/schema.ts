import { pgTable, serial, text, timestamp, varchar } from 'drizzle-orm/pg-core';

// Minimal core tables to support agent job tracking under FSM
export const agentJobs = pgTable('agent_jobs', {
  id: serial('id').primaryKey(),
  agentType: varchar('agent_type', { length: 64 }).notNull(),
  state: varchar('state', { length: 32 }).notNull(), // pending | running | completed | failed
  context: text('context'), // JSON string payload
  result: text('result'), // JSON string payload
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const agents = pgTable('agents', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 64 }).notNull(),
  type: varchar('type', { length: 64 }).notNull(), // scribe | trace | proto | ...
  createdAt: timestamp('created_at').defaultNow().notNull(),
});


