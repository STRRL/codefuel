import { Stagehand, Page } from "@browserbasehq/stagehand";
import StagehandConfig from "../stagehand.config.js";
import chalk from "chalk";
import { z } from "zod";

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

async function collectUsage({
  page,
  stagehand,
  outputFile,
  model,
}: {
  page: Page;
  stagehand: Stagehand;
  outputFile?: string;
  model: string;
}) {
  // Navigate to the OpenRouter model apps page
  await page.goto(`https://openrouter.ai/${model}/apps`);
  
  // Wait for the page to load
  await page.waitForTimeout(3000);
  
  // Extract all apps data
  const result = await page.extract({
    instruction: "Extract all apps information. For each app card/item on the page, get: 1) The app name, 2) The full HTTP/HTTPS URL or website link associated with the app (not just numbers or IDs, but actual website URLs like https://openrouter.ai/apps?url=https%3A%2F%2Fcline.bot%2F), 3) The tokens used value. If no full URL is visible, extract any domain name or website reference.",
    schema: z.object({
      apps: AppsArraySchema
    }),
  });
  
  const appsData = result.apps;
  
  // Save to file if output option is provided
  if (outputFile) {
    // Convert token values to numbers before saving
    const processedData = appsData.map(app => ({
      ...app,
      tokensUsed: convertTokensToNumber(app.tokensUsed)
    }));
    
    const jsonOutput = JSON.stringify(processedData, null, 2);
    
    // Write to file using Node.js fs
    const fs = await import('fs/promises');
    await fs.writeFile(outputFile, jsonOutput);
  }
}

export async function handleUsageCommand(argv: any) {
  const stagehand = new Stagehand({
    ...StagehandConfig,
  });
  await stagehand.init();

  const page = stagehand.page;
  try {
    await collectUsage({
      page,
      stagehand,
      outputFile: argv.output,
      model: argv.model,
    });
  } catch (error) {
    console.error(chalk.red("❌ Error occurred:"), error);
  } finally {
    await stagehand.close();
  }
}