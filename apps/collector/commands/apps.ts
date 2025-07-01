import { Stagehand, Page } from "@browserbasehq/stagehand";
import StagehandConfig from "../stagehand.config.js";
import chalk from "chalk";
import { z } from "zod";

const AppDetailsSchema = z.object({
  name: z.string(),
  description: z.string(),
});

async function collectAppDetails({
  page,
  appUrl,
  outputFile,
}: {
  page: Page;
  appUrl: string;
  outputFile?: string;
}) {
  // Encode the URL for OpenRouter
  const encodedUrl = encodeURIComponent(appUrl);
  const openRouterUrl = `https://openrouter.ai/apps?url=${encodedUrl}`;
  
  // Navigate to the OpenRouter app details page
  await page.goto(openRouterUrl);
  
  // Wait for the page to load
  await page.waitForTimeout(3000);
  
  // Extract app details
  const result = await page.extract({
    instruction: "Extract the app information from this page. Get the app name and description. The name should be the main title/heading of the app, and the description should be the subtitle or brief description that explains what the app does.",
    schema: AppDetailsSchema,
  });
  
  // Save to file if output option is provided
  if (outputFile) {
    const jsonOutput = JSON.stringify(result, null, 2);
    
    // Write to file using Node.js fs
    const fs = await import('fs/promises');
    await fs.writeFile(outputFile, jsonOutput);
  }
  
  return result;
}

export async function handleAppsCommand(argv: any) {
  const stagehand = new Stagehand({
    ...StagehandConfig,
  });
  await stagehand.init();

  const page = stagehand.page;
  try {
    await collectAppDetails({
      page,
      appUrl: argv.url,
      outputFile: argv.output,
    });
  } catch (error) {
    console.error(chalk.red("❌ Error occurred:"), error);
  } finally {
    await stagehand.close();
  }
}