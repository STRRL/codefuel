# CodeFuel

AI is like the new fuel for software development.

How much token consumption on AI coding?

## Structure

- **apps/collector** - CLI tool for collecting and analyzing app usage data from OpenRouter
- **apps/codefuel** - Next.js web application

## Projects

### Collector

A specialized CLI tool for automated data collection from AI model platforms:
- Batch collection of app usage statistics
- Database management with PostgreSQL and Drizzle ORM
- Token usage analysis and reporting
- Browser automation with Stagehand/Playwright

### CodeFuel App

A Next.js web application for the CodeFuel platform.

## Development

This project uses pnpm workspaces for monorepo management. Each app has its own dependencies and scripts that can be run individually or collectively from the root.
