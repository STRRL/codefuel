import { Stagehand } from "@browserbasehq/stagehand";
import StagehandConfig from "../stagehand.config.js";
import { z } from "zod";
import { db } from "../db/index.js";
import { models, apps, collectBatch, appUsageHistory } from "../db/schema.js";
import { eq, isNull, or } from "drizzle-orm";
import createDebug from "debug";

const debug = createDebug("collector:batch-collect");
const debugInfo = createDebug("collector:batch-collect:info");
const debugError = createDebug("collector:batch-collect:error");

// Predefined models to ensure they exist in database
const PREDEFINED_MODELS = [
  { displayName: "Anthropic: Claude 3.7 Sonnet", modelName: "anthropic/claude-3.7-sonnet" },
  { displayName: "Anthropic: Claude 3.5 Sonnet", modelName: "anthropic/claude-3.5-sonnet" },
  { displayName: "Anthropic: Claude Sonnet 4", modelName: "anthropic/claude-sonnet-4" },
];

const AppSchema = z.object({
  name: z.string(),
  url: z.string(),
  tokensUsed: z.string(),
});

const AppsArraySchema = z.array(AppSchema);

const AppDetailsSchema = z.object({
  name: z.string(),
  description: z.string(),
});

const CategorySchema = z.object({
  category: z.enum(["Coding", "Marketing", "Personal Assistant", "Roleplay", "Translation", "Others"]),
});

const CATEGORY_INSTRUCTION = `Analyze this website/application and categorize it into EXACTLY ONE of these categories. You MUST choose from these exact options:

1. "Coding" - Code editors, IDEs, development tools, programming assistants, code generation tools
2. "Marketing" - Marketing tools, SEO optimization, content marketing, social media tools, advertising
3. "Personal Assistant" - General AI assistants, productivity helpers, task management, general Q&A bots
4. "Roleplay" - Character chat, roleplay conversations, entertainment chat, fictional characters
5. "Translation" - Language translation tools, localization services
6. "Others" - Anything that doesn't clearly fit the above categories

IMPORTANT: Return ONLY the category name exactly as written above. Do not add explanations or additional text.`;

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

async function collectAppDetails(stagehand: Stagehand, appUrl: string) {
  const encodedUrl = encodeURIComponent(appUrl);
  const openRouterUrl = `https://openrouter.ai/apps?url=${encodedUrl}`;
  
  const [appDetails, categoryResult] = await Promise.all([
    extractAppDetails(stagehand, openRouterUrl),
    extractAppCategory(stagehand, appUrl),
  ]);
  
  return {
    ...appDetails,
    category: categoryResult.category,
  };
}

async function extractAppDetails(stagehand: Stagehand, openRouterUrl: string) {
  const page = await stagehand.context.newPage();
  try {
    await page.goto(openRouterUrl);
    await page.waitForLoadState('load');
    
    return await page.extract({
      instruction: "Extract the app information from this page. Get the app name and description. The name should be the main title/heading of the app, and the description should be the subtitle or brief description that explains what the app does.",
      schema: AppDetailsSchema,
    });
  } finally {
    await page.close();
  }
}

async function extractAppCategory(stagehand: Stagehand, appUrl: string) {
  const page = await stagehand.context.newPage();
  try {
    await page.goto(appUrl);
    await page.waitForLoadState('load');
    
    return await page.extract({
      instruction: CATEGORY_INSTRUCTION,
      schema: CategorySchema,
    });
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
      
      // Step 9: Update app metadata (category) for apps that don't have it
      debug("🔄 Updating app metadata (category)...");
      const appsToUpdate = await db.select().from(apps).where(
        isNull(apps.category)
      );
      
      if (appsToUpdate.length > 0) {
        debug(`📝 Updating metadata for ${appsToUpdate.length} apps...`);
        
        const metadataUpdates = [];
        const concurrencyLimit = 5;
        
        // Process apps in batches of 5
        for (let i = 0; i < appsToUpdate.length; i += concurrencyLimit) {
          const batch = appsToUpdate.slice(i, i + concurrencyLimit);
          const batchResults = await Promise.all(
            batch.map(async (app) => {
              try {
                // Only need to get category, not full details
                const categoryResult = await extractAppCategory(stagehand, app.url);
                return {
                  id: app.id,
                  category: categoryResult.category,
                };
              } catch (error) {
                debugError(`❌ Failed to collect category for ${app.url}:`, error);
                return null;
              }
            })
          );
          metadataUpdates.push(...batchResults);
        }
        
        // Update apps with category
        for (const update of metadataUpdates) {
          if (update) {
            await db.update(apps)
              .set({ 
                category: update.category,
                updatedAt: new Date()
              })
              .where(eq(apps.id, update.id));
          }
        }
        
        const successfulUpdates = metadataUpdates.filter(u => u !== null).length;
        debug(`✅ Updated metadata for ${successfulUpdates} apps`);
      }
      
      const endTime = Date.now();
      const duration = Math.round((endTime - startTime) / 1000);
      
      debugInfo(`🎉 Batch collection completed successfully!`);
      debugInfo(`📊 Summary:`);
      debugInfo(`   - Batch ID: ${batchId}`);
      debugInfo(`   - Models processed: ${allModels.length}`);
      debugInfo(`   - Total apps collected: ${totalAppsCollected}`);
      debugInfo(`   - New apps added: ${newApps.length}`);
      debugInfo(`   - Apps metadata updated: ${appsToUpdate.length}`);
      debugInfo(`   - Duration: ${duration}s`);
      
    } finally {
      await stagehand.close();
    }
    
  } catch (error) {
    debugError("❌ Batch collection failed:", error);
    throw error;
  }
}