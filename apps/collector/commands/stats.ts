import { db } from "../db/index.js";
import { collectBatch, appUsageHistory, apps } from "../db/schema.js";
import { desc, eq } from "drizzle-orm";
import createDebug from "debug";
import Table from "cli-table3";
import chalk from "chalk";

const debug = createDebug("collector:stats");
const debugInfo = createDebug("collector:stats:info");
const debugError = createDebug("collector:stats:error");

interface CategoryStats {
  category: string;
  totalTokens: number;
  appCount: number;
  apps: Set<string>;
}

// Function to parse token strings back to numbers
function parseTokenString(tokenStr: string): number {
  // Remove commas and parse to number
  const cleanStr = tokenStr.replace(/,/g, '');
  const num = parseInt(cleanStr, 10);
  return isNaN(num) ? 0 : num;
}

// Format number with commas
function formatNumber(num: number): string {
  return num.toLocaleString();
}

export async function handleStatsCommand(argv: any) {
  try {
    debugInfo("📊 Generating usage statistics...");
    
    // Step 1: Get the latest batch
    const latestBatch = await db.select()
      .from(collectBatch)
      .orderBy(desc(collectBatch.id))
      .limit(1);
    
    if (latestBatch.length === 0) {
      console.log(chalk.yellow("⚠️  No collection batches found. Run 'batch-collect' first."));
      return;
    }
    
    const batchId = latestBatch[0].id;
    const batchDate = latestBatch[0].collectedAt;
    debug(`Using batch #${batchId} from ${batchDate}`);
    
    // Step 2: Get all usage history for this batch
    const usageHistory = await db.select()
      .from(appUsageHistory)
      .where(eq(appUsageHistory.collectBatchId, batchId));
    
    if (usageHistory.length === 0) {
      console.log(chalk.yellow("⚠️  No usage data found for the latest batch."));
      return;
    }
    
    debug(`Found ${usageHistory.length} usage records`);
    
    // Step 3: Get all apps to map URLs to categories
    const allApps = await db.select().from(apps);
    const urlToCategoryMap = new Map<string, string>();
    
    for (const app of allApps) {
      urlToCategoryMap.set(app.url, app.category || "Others");
    }
    
    // Step 4: Aggregate tokens by category
    const categoryStatsMap = new Map<string, CategoryStats>();
    let totalTokensAllCategories = 0;
    
    for (const usage of usageHistory) {
      const category = urlToCategoryMap.get(usage.appUrl) || "Others";
      const tokens = parseTokenString(usage.tokensUsed);
      totalTokensAllCategories += tokens;
      
      if (!categoryStatsMap.has(category)) {
        categoryStatsMap.set(category, {
          category,
          totalTokens: 0,
          appCount: 0,
          apps: new Set()
        });
      }
      
      const stats = categoryStatsMap.get(category)!;
      stats.totalTokens += tokens;
      stats.apps.add(usage.appUrl);
    }
    
    // Update app counts
    for (const stats of categoryStatsMap.values()) {
      stats.appCount = stats.apps.size;
    }
    
    // Step 5: Sort by total tokens (descending)
    const sortedStats = Array.from(categoryStatsMap.values())
      .sort((a, b) => b.totalTokens - a.totalTokens);
    
    // Step 6: Create and display table
    const table = new Table({
      head: [
        chalk.cyan('Category'),
        chalk.cyan('Total Tokens'),
        chalk.cyan('Percentage'),
        chalk.cyan('App Count')
      ],
      colAligns: ['left', 'right', 'right', 'right'],
      style: {
        head: [],
        border: []
      }
    });
    
    for (const stats of sortedStats) {
      const percentage = totalTokensAllCategories > 0 
        ? ((stats.totalTokens / totalTokensAllCategories) * 100).toFixed(2)
        : '0.00';
      
      table.push([
        stats.category,
        formatNumber(stats.totalTokens),
        `${percentage}%`,
        stats.appCount.toString()
      ]);
    }
    
    // Add total row
    table.push([
      chalk.bold('TOTAL'),
      chalk.bold(formatNumber(totalTokensAllCategories)),
      chalk.bold('100.00%'),
      chalk.bold(sortedStats.reduce((sum, s) => sum + s.appCount, 0).toString())
    ]);
    
    // Display results
    console.log(chalk.blue(`\n📊 Token Usage Statistics - Batch #${batchId}`));
    console.log(chalk.gray(`Collected at: ${batchDate.toLocaleString()}\n`));
    console.log(table.toString());
    
    // Display models included in this batch
    const modelsInBatch = new Set(usageHistory.map(h => h.modelDisplayName));
    console.log(chalk.gray(`\nModels included: ${Array.from(modelsInBatch).join(', ')}`));
    
  } catch (error) {
    debugError("❌ Failed to generate stats:", error);
    console.error(chalk.red("❌ Error generating statistics"), error);
  }
}