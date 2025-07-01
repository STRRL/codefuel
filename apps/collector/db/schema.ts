import { pgTable, text, timestamp, serial, integer, index } from 'drizzle-orm/pg-core';

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
}, (table) => ({
  categoryIdx: index('apps_category_idx').on(table.category),
}));

export const collectBatch = pgTable('collect_batch', {
  id: serial('id').primaryKey(),
  collectedAt: timestamp('collected_at').defaultNow().notNull(),
});

export const appUsageHistory = pgTable('app_usage_history', {
  id: serial('id').primaryKey(),
  appName: text('app_name').notNull(),
  appUrl: text('app_url').notNull(),
  modelDisplayName: text('model_display_name').notNull(),
  modelName: text('model_name').notNull(),
  collectBatchId: integer('collect_batch_id').notNull(),
  tokensUsed: text('tokens_used').notNull(),
  recordedAt: timestamp('recorded_at').defaultNow().notNull(),
}, (table) => ({
  collectBatchIdIdx: index('app_usage_history_collect_batch_id_idx').on(table.collectBatchId),
  modelNameIdx: index('app_usage_history_model_name_idx').on(table.modelName),
  appNameIdx: index('app_usage_history_app_name_idx').on(table.appName),
}));

export type Model = typeof models.$inferSelect;
export type NewModel = typeof models.$inferInsert;
export type App = typeof apps.$inferSelect;
export type NewApp = typeof apps.$inferInsert;
export type CollectBatch = typeof collectBatch.$inferSelect;
export type NewCollectBatch = typeof collectBatch.$inferInsert;
export type AppUsageHistory = typeof appUsageHistory.$inferSelect;
export type NewAppUsageHistory = typeof appUsageHistory.$inferInsert;