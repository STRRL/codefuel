import { Stagehand } from "@browserbasehq/stagehand";
import StagehandConfig from "../stagehand.config.js";
import { z } from "zod";
import { db } from "../db/index.js";
import { apps } from "../db/schema.js";
import { eq, isNull, or } from "drizzle-orm";
import createDebug from "debug";

const debug = createDebug("collector:batch-apps");
const debugInfo = createDebug("collector:batch-apps:info");
const debugError = createDebug("collector:batch-apps:error");

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

async function extractAppDescription(stagehand: Stagehand, appUrl: string) {
  const page = await stagehand.context.newPage();
  try {
    const encodedUrl = encodeURIComponent(appUrl);
    const openRouterUrl = `https://openrouter.ai/apps?url=${encodedUrl}`;
    
    debug(`🔍 Extracting description from OpenRouter for: ${appUrl}`);
    await page.goto(openRouterUrl);
    await page.waitForLoadState('load');
    
    const result = await page.extract({
      instruction: "Extract the app information from this page. Get the app name and description. The name should be the main title/heading of the app, and the description should be the subtitle or brief description that explains what the app does.",
      schema: AppDetailsSchema,
    });
    
    debug(`✅ Got description for ${appUrl}`);
    return result;
  } catch (error) {
    debugError(`❌ Failed to extract description for ${appUrl}:`, error);
    throw error;
  } finally {
    await page.close();
  }
}

async function extractAppCategory(stagehand: Stagehand, appUrl: string) {
  const page = await stagehand.context.newPage();
  try {
    debug(`🔍 Extracting category for: ${appUrl}`);
    await page.goto(appUrl);
    await page.waitForLoadState('load');
    
    const result = await page.extract({
      instruction: CATEGORY_INSTRUCTION,
      schema: CategorySchema,
    });
    
    debug(`✅ Got category for ${appUrl}: ${result.category}`);
    return result;
  } catch (error) {
    debugError(`❌ Failed to extract category for ${appUrl}:`, error);
    throw error;
  } finally {
    await page.close();
  }
}

export async function handleBatchAppsCommand(argv: any) {
  const startTime = Date.now();
  debugInfo("🚀 Starting batch apps metadata update process...");
  
  try {
    // Get all apps that need category or description
    const appsToUpdate = await db.select().from(apps).where(
      or(
        isNull(apps.category),
        isNull(apps.description)
      )
    );
    
    if (appsToUpdate.length === 0) {
      debugInfo("✅ All apps already have complete metadata. Nothing to update.");
      return;
    }
    
    debugInfo(`📋 Found ${appsToUpdate.length} apps missing description or category`);
    
    // Initialize Stagehand
    const stagehand = new Stagehand({
      ...StagehandConfig,
    });
    await stagehand.init();
    
    try {
      debug("🔄 Updating app metadata (category)...");
      
      const metadataUpdates = [];
      const concurrencyLimit = 5;
      let successCount = 0;
      let failCount = 0;
      
      // Process apps in batches of 5
      for (let i = 0; i < appsToUpdate.length; i += concurrencyLimit) {
        const batch = appsToUpdate.slice(i, i + concurrencyLimit);
        debug(`Processing batch ${Math.floor(i / concurrencyLimit) + 1} of ${Math.ceil(appsToUpdate.length / concurrencyLimit)}`);
        
        const batchResults = await Promise.all(
          batch.map(async (app) => {
            try {
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
          try {
            await db.update(apps)
              .set({ 
                category: update.category,
                updatedAt: new Date()
              })
              .where(eq(apps.id, update.id));
            successCount++;
          } catch (error) {
            debugError(`❌ Failed to update database for app id ${update.id}:`, error);
            failCount++;
          }
        } else {
          failCount++;
        }
      }
      
      const endTime = Date.now();
      const duration = Math.round((endTime - startTime) / 1000);
      
      debugInfo(`🎉 Batch apps metadata update completed!`);
      debugInfo(`📊 Summary:`);
      debugInfo(`   - Total apps processed: ${appsToUpdate.length}`);
      debugInfo(`   - Successfully updated: ${successCount}`);
      debugInfo(`   - Failed: ${failCount}`);
      debugInfo(`   - Duration: ${duration}s`);
      
    } finally {
      await stagehand.close();
    }
    
  } catch (error) {
    debugError("❌ Batch apps metadata update failed:", error);
    throw error;
  }
}