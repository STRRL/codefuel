# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Root Level (Monorepo)
```bash
# Install dependencies across all packages
pnpm install

# Build all packages
pnpm build

# Run development mode for all packages
pnpm dev

# Lint all packages
pnpm lint
```

### Collector CLI (apps/collector)
```bash
# Build the CLI
cd apps/collector && pnpm build

# Run in development mode
cd apps/collector && pnpm dev

# Database operations
cd apps/collector && pnpm db:generate    # Generate migrations from schema
cd apps/collector && pnpm db:push       # Push schema to database
cd apps/collector && pnpm db:migrate    # Run migrations
cd apps/collector && pnpm db:studio     # Open Drizzle Studio

# Run CLI commands
cd apps/collector && node dist/index.js usage --help
cd apps/collector && node dist/index.js apps --help
cd apps/collector && node dist/index.js batch-collect --help
cd apps/collector && node dist/index.js stats --help
```

### Web Application (apps/codefuel)
```bash
# Next.js development with Turbopack
cd apps/codefuel && pnpm dev

# Build for production
cd apps/codefuel && pnpm build

# Start production server
cd apps/codefuel && pnpm start

# Lint the application
cd apps/codefuel && pnpm lint
```

## Architecture Overview

### CodeFuel Project Structure
This is a monorepo containing two main applications focused on AI model token consumption analysis:

**apps/collector** - CLI tool for automated data collection from OpenRouter:
- Scrapes usage statistics for AI models used in coding applications
- Collects app metadata and categorizes applications by type
- Stores collected data in PostgreSQL database using Drizzle ORM
- Generates usage reports and statistics

**apps/codefuel** - Next.js web application with three main pages:
- Landing page with engaging AI coding statistics and messaging
- Trending page showing historical token usage data and top apps/models
- How It Works page explaining methodology and limitations

### Key Technologies

**Database & ORM:**
- PostgreSQL database with Drizzle ORM
- Schema located at `apps/collector/db/schema.ts`
- Migrations in `apps/collector/db/migrations/`

**Web Automation:**
- Stagehand (Browserbase) for browser automation with AI-powered actions
- Playwright for web scraping capabilities
- Configuration in `apps/collector/stagehand.config.ts`

**CLI Framework:**
- Yargs for command-line interface
- Commands defined in `apps/collector/commands/`
- Main entry point at `apps/collector/index.ts`

**Web Application:**
- Next.js 15 with App Router for server-side rendering
- Tailwind CSS for responsive styling
- TypeScript for type safety
- Database connection via Drizzle ORM
- Basic analytics tracking

### Stagehand Usage Patterns

When working with the collector's web automation, follow these Stagehand patterns:

```typescript
// Initialize
import { Stagehand } from "@browserbasehq/stagehand";
import StagehandConfig from "./stagehand.config";

const stagehand = new Stagehand(StagehandConfig);
await stagehand.init();
const page = stagehand.page;

// Take actions (click, type, etc.)
await page.act("Click the sign in button");

// Extract data with schema
const data = await page.extract({
  instruction: "extract usage statistics",
  schema: z.object({
    usage: z.array(z.object({
      model: z.string(),
      tokens: z.number(),
    })),
  }),
});

// Cache actions for reliability
const cachedAction = await getCache(instruction);
if (cachedAction) {
  await page.act(cachedAction);
} else {
  const results = await page.observe(instruction);
  await setCache(instruction, results);
  await page.act(results[0]);
}
```

### Database Schema Structure

Key tables in `apps/collector/db/schema.ts`:
- `models` - AI model definitions with metadata
- `apps` - Application information and categorization
- `collectBatches` - Collection batch tracking
- `usageHistory` - Token usage data over time

### Environment Configuration

Required environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `OPENROUTER_API_KEY` - OpenRouter API access
- `BROWSERBASE_API_KEY` - Browserbase automation service
- `BROWSERBASE_PROJECT_ID` - Browserbase project identifier

## Development Workflow

1. **Database Setup**: Run migrations and push schema changes using Drizzle commands
2. **Data Collection**: Use CLI commands to collect usage data from OpenRouter
3. **Web Development**: Work on Next.js frontend for data visualization
4. **Testing**: No test framework currently configured - manual testing required

### Web Application Pages

**Landing Page (`/`)**:
- Displays dynamic statistics from database (total tokens, active apps)
- Engaging messaging about AI coding transformation
- Call-to-action buttons for trending data and methodology
- Responsive design with mobile-first approach

**Trending Page (`/trending`)**:
- Weekly token usage trends with historical data
- Top apps ranked by token consumption
- Top models ranked by usage
- Handles limited data gracefully with appropriate messaging

**How It Works Page (`/how-it-works`)**:
- Transparent methodology explanation
- Technical architecture details
- Clear limitations and data scope
- Future improvement roadmap

## Key Files

**Collector CLI:**
- `apps/collector/index.ts` - Main CLI entry point
- `apps/collector/db/schema.ts` - Database schema definitions
- `apps/collector/stagehand.config.ts` - Browser automation configuration
- `apps/collector/commands/` - CLI command implementations

**Web Application:**
- `apps/codefuel/src/app/page.tsx` - Landing page with statistics
- `apps/codefuel/src/app/trending/page.tsx` - Trending data visualization
- `apps/codefuel/src/app/how-it-works/page.tsx` - Methodology explanation
- `apps/codefuel/src/app/layout.tsx` - Root layout with navigation
- `apps/codefuel/src/components/Navigation.tsx` - Navigation component
- `apps/codefuel/src/components/Analytics.tsx` - Basic page tracking
- `apps/codefuel/src/lib/db.ts` - Database connection and query helpers