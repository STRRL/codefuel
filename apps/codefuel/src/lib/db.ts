import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { pgTable, text, timestamp, serial, integer, index } from 'drizzle-orm/pg-core';

// Database schema - mirror from collector
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

// Types
export type Model = typeof models.$inferSelect;
export type NewModel = typeof models.$inferInsert;
export type App = typeof apps.$inferSelect;
export type NewApp = typeof apps.$inferInsert;
export type CollectBatch = typeof collectBatch.$inferSelect;
export type NewCollectBatch = typeof collectBatch.$inferInsert;
export type AppUsageHistory = typeof appUsageHistory.$inferSelect;
export type NewAppUsageHistory = typeof appUsageHistory.$inferInsert;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, {
  schema: {
    models,
    apps,
    collectBatch,
    appUsageHistory,
  },
});

// Helper functions for data fetching
export async function getTopApps(limit: number = 10) {
  const result = await db.select().from(apps).limit(limit);
  return result;
}

export async function getUsageHistory(limit: number = 100) {
  const result = await db.select().from(appUsageHistory).limit(limit);
  return result;
}

export async function getModels() {
  const result = await db.select().from(models);
  return result;
}

export async function getWeeklyUsageStats() {
  // Get usage history grouped by week
  const result = await db
    .select()
    .from(appUsageHistory)
    .orderBy(appUsageHistory.recordedAt);
  
  return result;
}