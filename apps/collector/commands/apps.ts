import { Stagehand } from "@browserbasehq/stagehand";
import StagehandConfig from "../stagehand.config.js";
import { z } from "zod";
import createDebug from "debug";

const debugError = createDebug("collector:apps:error");

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

async function collectAppDetails({
  stagehand,
  appUrl,
  outputFile,
}: {
  stagehand: Stagehand;
  appUrl: string;
  outputFile?: string;
}) {
  const encodedUrl = encodeURIComponent(appUrl);
  const openRouterUrl = `https://openrouter.ai/apps?url=${encodedUrl}`;
  
  // Run both tasks in parallel
  const [appDetails, categoryResult] = await Promise.all([
    extractAppDetails(stagehand, openRouterUrl),
    extractAppCategory(stagehand, appUrl),
  ]);
  
  const result = {
    ...appDetails,
    category: categoryResult.category,
  };
  
  if (outputFile) {
    const fs = await import('fs/promises');
    await fs.writeFile(outputFile, JSON.stringify(result, null, 2));
  }
  
  return result;
}

export async function handleAppsCommand(argv: any) {
  const stagehand = new Stagehand({
    ...StagehandConfig,
  });
  await stagehand.init();

  try {
    await collectAppDetails({
      stagehand,
      appUrl: argv.url,
      outputFile: argv.output,
    });
  } catch (error) {
    debugError("❌ Error occurred:", error);
  } finally {
    await stagehand.close();
  }
}
