import { pgTable, uuid, text, boolean, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users, jobs } from './schema.js';

export const agentTriggers = pgTable('agent_triggers', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  repoOwner: text('repo_owner').notNull(),
  repoName: text('repo_name').notNull(),
  branch: text('branch').notNull().default('main'),
  eventType: text('event_type').notNull(),
  agentType: text('agent_type').notNull(),
  enabled: boolean('enabled').notNull().default(true),
  lastDeliveryId: text('last_delivery_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('idx_agent_triggers_user_id').on(table.userId),
  repoIdx: index('idx_agent_triggers_repo').on(table.repoOwner, table.repoName),
  eventTypeIdx: index('idx_agent_triggers_event_type').on(table.eventType),
}));

export type AgentTrigger = typeof agentTriggers.$inferSelect;
export type NewAgentTrigger = typeof agentTriggers.$inferInsert;

export const webhookDeliveries = pgTable('webhook_deliveries', {
  id: uuid('id').primaryKey().defaultRandom(),
  deliveryId: text('delivery_id').notNull().unique(),
  eventType: text('event_type').notNull(),
  repoOwner: text('repo_owner').notNull(),
  repoName: text('repo_name').notNull(),
  processedAt: timestamp('processed_at').defaultNow().notNull(),
  jobId: uuid('job_id'),
}, (table) => ({
  deliveryIdIdx: uniqueIndex('idx_webhook_deliveries_delivery_id').on(table.deliveryId),
}));

export type WebhookDelivery = typeof webhookDeliveries.$inferSelect;
export type NewWebhookDelivery = typeof webhookDeliveries.$inferInsert;

export const agentTriggersRelations = relations(agentTriggers, ({ one }) => ({
  user: one(users, {
    fields: [agentTriggers.userId],
    references: [users.id],
  }),
}));
