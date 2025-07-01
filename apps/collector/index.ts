import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { handleUsageCommand } from "./commands/usage.js";
import { handleAppsCommand } from "./commands/apps.js";
import { handleBatchCollectCommand } from "./commands/batch-collect.js";
import { handleBatchAppsCommand } from "./commands/batch-apps.js";

async function run() {
  await yargs(hideBin(process.argv))
    .command('usage', 'Collect app usage data from OpenRouter', (yargs) => {
      return yargs
        .option('model', {
          alias: 'm',
          type: 'string',
          description: 'Model to collect usage data for (e.g., anthropic/claude-sonnet-4)',
          default: 'anthropic/claude-sonnet-4'
        })
        .option('output', {
          alias: 'o',
          type: 'string',
          description: 'Output file path for saving the collected data as JSON'
        });
    }, handleUsageCommand)
    .command('apps', 'Collect app details from OpenRouter', (yargs) => {
      return yargs
        .option('url', {
          alias: 'u',
          type: 'string',
          description: 'App URL to get details for (e.g., https://cline.bot/)',
          demandOption: true
        })
        .option('output', {
          alias: 'o',
          type: 'string',
          description: 'Output file path for saving the collected data as JSON'
        });
    }, handleAppsCommand)
    .command('batch-collect', 'Run batch collection for all models and apps', (yargs) => {
      return yargs;
    }, handleBatchCollectCommand)
    .command('batch-apps', 'Update app metadata (categories) for apps missing them', (yargs) => {
      return yargs;
    }, handleBatchAppsCommand)
    .demandCommand(1, 'You must specify a command')
    .help()
    .argv;
}

run();
