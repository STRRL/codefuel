import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { handleUsageCommand } from "./commands/usage.js";
import { handleAppsCommand } from "./commands/apps.js";

async function run() {
  await yargs(hideBin(process.argv))
    .command('usage', 'Collect app usage data from OpenRouter', (yargs) => {
      return yargs.option('output', {
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
    .demandCommand(1, 'You must specify a command')
    .help()
    .argv;
}

run();
