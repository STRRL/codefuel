import { Stagehand } from "@browserbasehq/stagehand";
import StagehandConfig from "../stagehand.config.js";
import { z } from "zod";
import { db } from "../db/index.js";
import { models, apps, collectBatch, appUsageHistory } from "../db/schema.js";
import { eq } from "drizzle-orm";
import createDebug from "debug";
import { PREDEFINED_MODELS } from "../config/predefined-models.js";

const debug = createDebug("collector:batch-collect");
const debugInfo = createDebug("collector:batch-collect:info");
const debugError = createDebug("collector:batch-collect:error");

const AppSchema = z.object({
  name: z.string(),
  url: z.string(),
  tokensUsed: z.string(),
});

const AppsArraySchema = z.array(AppSchema);


// Function to convert token abbreviations to numeric values
function convertTokensToNumber(tokenStr: string): string {
  const match = tokenStr.match(/^(\d+(?:\.\d+)?)\s*([BMK]?)$/i);
  if (!match) return tokenStr;
  
  const [, numStr, unit] = match;
  const num = parseFloat(numStr);
  
  let multiplier = 1;
  switch (unit.toUpperCase()) {
    case 'B':
      multiplier = 1_000_000_000;
      break;
    case 'M':
      multiplier = 1_000_000;
      break;
    case 'K':
      multiplier = 1_000;
      break;
  }
  
  const result = Math.round(num * multiplier);
  return result.toLocaleString();
}

async function seedModels() {
  debug("🌱 Seeding predefined models...");
  
  for (const model of PREDEFINED_MODELS) {
    const existing = await db.select().from(models).where(eq(models.modelName, model.modelName));
    
    if (existing.length === 0) {
      await db.insert(models).values(model);
      debug(`✅ Added model: ${model.displayName}`);
    } else {
      debug(`⏭️  Model already exists: ${model.displayName}`);
    }
  }
}

async function collectUsageForModel(stagehand: Stagehand, modelName: string) {
  const page = await stagehand.context.newPage();
  try {
    debug(`📊 Collecting usage data for ${modelName}...`);
    
    await page.goto(`https://openrouter.ai/${modelName}/apps`);
    await page.waitForLoadState('load');
    
    const result = await page.extract({
      instruction: "Extract all apps information. For each app card/item on the page, get: 1) The app name, 2) The full HTTP/HTTPS URL or website link associated with the app (not just numbers or IDs, but actual website URLs like https://openrouter.ai/apps?url=https%3A%2F%2Fcline.bot%2F), 3) The tokens used value. If no full URL is visible, extract any domain name or website reference.",
      schema: z.object({
        apps: AppsArraySchema
      }),
    });
    
    return result.apps.map(app => ({
      ...app,
      tokensUsed: convertTokensToNumber(app.tokensUsed)
    }));
  } finally {
    await page.close();
  }
}


export async function handleBatchCollectCommand(argv: any) {
  const startTime = Date.now();
  debugInfo("🚀 Starting batch collection process...");
  
  try {
    // Step 1: Seed predefined models
    await seedModels();
    
    // Step 2: Get all models from database
    const allModels = await db.select().from(models);
    debugInfo(`📋 Found ${allModels.length} models to process`);
    
    // Step 3: Create collect batch record
    const batchResult = await db.insert(collectBatch).values({}).returning();
    const batchId = batchResult[0].id;
    debugInfo(`📦 Created collect batch #${batchId}`);
    
    // Step 4: Initialize Stagehand
    const stagehand = new Stagehand({
      ...StagehandConfig,
    });
    await stagehand.init();
    
    try {
      let totalAppsCollected = 0;
      const allCollectedApps = new Map<string, any>(); // url -> app data
      
      // Step 5: Collect usage data for all models with concurrency limit
      debug("📊 Collecting usage data from all models...");
      const usageResults = [];
      const concurrencyLimit = 5;
      
      // Process models in batches of 5
      for (let i = 0; i < allModels.length; i += concurrencyLimit) {
        const batch = allModels.slice(i, i + concurrencyLimit);
        const batchResults = await Promise.all(
          batch.map(async (model) => {
            try {
              const apps = await collectUsageForModel(stagehand, model.modelName);
              return { modelId: model.id, modelName: model.modelName, apps };
            } catch (error) {
              debugError(`❌ Failed to collect usage for ${model.modelName}:`, error);
              return { modelId: model.id, modelName: model.modelName, apps: [] };
            }
          })
        );
        usageResults.push(...batchResults);
      }
      
      // Step 6: Collect unique apps for metadata collection
      debug("📝 Processing collected apps...");
      for (const result of usageResults) {
        if (result.apps.length > 0) {
          // Collect unique apps for metadata collection
          result.apps.forEach(app => {
            if (app.url && !allCollectedApps.has(app.url)) {
              allCollectedApps.set(app.url, {
                name: app.name,
                url: app.url,
                tokensUsed: app.tokensUsed,
              });
            }
          });
          
          totalAppsCollected += result.apps.length;
          debug(`✅ Collected ${result.apps.length} apps from ${result.modelName}`);
        }
      }
      
      // Step 7: Save basic app info first (without description and category)
      debug("🔍 Saving basic app information...");
      const existingApps = await db.select().from(apps);
      const existingUrls = new Set(existingApps.map(app => app.url));
      
      const newApps = Array.from(allCollectedApps.values()).filter(app => !existingUrls.has(app.url));
      
      if (newApps.length > 0) {
        debug(`📝 Adding ${newApps.length} new apps with basic info...`);
        
        const basicAppData = newApps.map(app => ({
          name: app.name,
          url: app.url,
          description: null, // Will update later
          category: null,    // Will update later
          tokensUsed: app.tokensUsed,
        }));
        
        // Insert new apps with basic info
        await db.insert(apps).values(basicAppData);
        debug(`✅ Added ${basicAppData.length} new apps to database`);
      }
      
      // Step 8: Save usage history to database
      debug("💾 Saving usage history to database...");
      
      for (const result of usageResults) {
        if (result.apps.length > 0) {
          // Find the model info for this result
          const modelInfo = allModels.find(m => m.modelName === result.modelName);
          if (!modelInfo) {
            debugError(`Model not found: ${result.modelName}`);
            continue;
          }
          
          const usageHistoryData = result.apps.map(app => ({
            appName: app.name,
            appUrl: app.url,
            modelDisplayName: modelInfo.displayName,
            modelName: modelInfo.modelName,
            collectBatchId: batchId,
            tokensUsed: app.tokensUsed,
          }));
          
          if (usageHistoryData.length > 0) {
            await db.insert(appUsageHistory).values(usageHistoryData);
            debug(`✅ Saved ${usageHistoryData.length} usage records for ${result.modelName}`);
          }
        }
      }
      
      
      const endTime = Date.now();
      const duration = Math.round((endTime - startTime) / 1000);
      
      debugInfo(`🎉 Batch collection completed successfully!`);
      debugInfo(`📊 Summary:`);
      debugInfo(`   - Batch ID: ${batchId}`);
      debugInfo(`   - Models processed: ${allModels.length}`);
      debugInfo(`   - Total apps collected: ${totalAppsCollected}`);
      debugInfo(`   - New apps added: ${newApps.length}`);
      debugInfo(`   - Duration: ${duration}s`);
      
    } finally {
      await stagehand.close();
    }
    
  } catch (error) {
    debugError("❌ Batch collection failed:", error);
    throw error;
  }
}