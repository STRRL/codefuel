import { pgTable, text, timestamp, serial, integer } from 'drizzle-orm/pg-core';

export const models = pgTable('models', {
  id: serial('id').primaryKey(),
  displayName: text('display_name').notNull(),
  modelName: text('model_name').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const apps = pgTable('apps', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  url: text('url').notNull().unique(),
  description: text('description'),
  category: text('category'),
  tokensUsed: text('tokens_used'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const collectBatch = pgTable('collect_batch', {
  id: serial('id').primaryKey(),
  collectedAt: timestamp('collected_at').defaultNow().notNull(),
  totalAppsCollected: integer('total_apps_collected').notNull(),
});

export const appUsageHistory = pgTable('app_usage_history', {
  id: serial('id').primaryKey(),
  appId: integer('app_id').notNull(),
  collectBatchId: integer('collect_batch_id').notNull(),
  tokensUsed: text('tokens_used').notNull(),
  recordedAt: timestamp('recorded_at').defaultNow().notNull(),
});

export type Model = typeof models.$inferSelect;
export type NewModel = typeof models.$inferInsert;
export type App = typeof apps.$inferSelect;
export type NewApp = typeof apps.$inferInsert;
export type CollectBatch = typeof collectBatch.$inferSelect;
export type NewCollectBatch = typeof collectBatch.$inferInsert;
export type AppUsageHistory = typeof appUsageHistory.$inferSelect;
export type NewAppUsageHistory = typeof appUsageHistory.$inferInsert;