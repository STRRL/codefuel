import Link from "next/link";
import { db, collectBatch, appUsageHistory, apps } from "@/lib/db";
import { desc, eq } from "drizzle-orm";

async function getLatestBatch() {
  const result = await db
    .select()
    .from(collectBatch)
    .orderBy(desc(collectBatch.collectedAt))
    .limit(1);
  
  return result[0];
}

async function getUsageHistoryByBatch(batchId: number) {
  const result = await db
    .select()
    .from(appUsageHistory)
    .where(eq(appUsageHistory.collectBatchId, batchId));
  
  return result;
}


async function getActiveApps() {
  const latestBatch = await getLatestBatch();
  if (!latestBatch) return 0;
  
  const usageHistory = await getUsageHistoryByBatch(latestBatch.id);
  const uniqueApps = new Set(usageHistory.map(entry => entry.appName));
  
  return uniqueApps.size;
}

async function getTotalTokens() {
  const latestBatch = await getLatestBatch();
  if (!latestBatch) return 0;
  
  const allUsageHistory = await getUsageHistoryByBatch(latestBatch.id);
  
  let totalGlobalTokens = 0;
  allUsageHistory.forEach(entry => {
    const tokens = entry.tokensUsed.replace(/,/g, '');
    const numTokens = parseInt(tokens) || 0;
    totalGlobalTokens += numTokens;
  });

  return totalGlobalTokens;
}

async function getCodingTokens() {
  const latestBatch = await getLatestBatch();
  if (!latestBatch) return 0;
  
  const usageHistory = await getUsageHistoryByBatch(latestBatch.id);
  
  // Filter for coding-related apps only
  const codingApps = await db
    .select()
    .from(apps)
    .where(eq(apps.category, 'Coding'));
  
  const codingAppNames = new Set(codingApps.map(app => app.name));
  
  let codingTokens = 0;
  usageHistory.forEach(entry => {
    if (codingAppNames.has(entry.appName)) {
      const tokens = entry.tokensUsed.replace(/,/g, '');
      const numTokens = parseInt(tokens) || 0;
      codingTokens += numTokens;
    }
  });
  
  return codingTokens;
}

function calculatePercentage(codingTokens: number, totalGlobalTokens: number) {
  if (totalGlobalTokens === 0) return 0;
  const percentage = (codingTokens / totalGlobalTokens) * 100;
  return Math.round(percentage * 10) / 10; // Round to 1 decimal place
}

export default async function Home() {
  const codingTokens = await getCodingTokens();
  const activeApps = await getActiveApps();
  const totalTokens = await getTotalTokens();
  const percentage = calculatePercentage(codingTokens, totalTokens);
  
  const formatNumber = (num: number) => {
    if (num >= 1000000000) {
      return (num / 1000000000).toFixed(1) + 'B';
    } else if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <div className="space-y-12">
        <div className="space-y-8">
          <div className="space-y-2">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-gray-900">
              <span className="text-blue-600">{formatNumber(codingTokens)}</span>{" "}
              <span className="text-gray-900">tokens being consumed by AI coding tools</span>
            </h1>
            <p className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold text-gray-700 max-w-5xl leading-tight">
              That&apos;s approximately{" "}
              <span className="text-blue-600">{percentage}%</span>{" "}
              of all AI token consumption globally
            </p>
          </div>
          <div className="pt-8 border-t border-gray-200">
            <p className="text-xl sm:text-2xl md:text-3xl font-medium text-gray-800 max-w-4xl leading-relaxed">
              AI coding is eating software. Tokens are the new gas powering the future of software development.
            </p>
          </div>
        </div>
        
        <div className="bg-gray-100 rounded-2xl p-8 max-w-4xl">
          <p className="text-lg text-gray-700 mb-6">
            Tracking token consumption across hundreds of AI coding applications
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg p-6">
              <div className="text-3xl font-bold text-gray-900">{activeApps}+</div>
              <div className="text-gray-600">AI Apps</div>
            </div>
            <div className="bg-white rounded-lg p-6">
              <div className="text-3xl font-bold text-gray-900">{formatNumber(totalTokens)}</div>
              <div className="text-gray-600">Total Tokens</div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Messages */}
      <div className="bg-white rounded-2xl p-8 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="text-5xl mb-4">🚀</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              AI is Transforming Code
            </h3>
            <p className="text-gray-600">
              Every line of code is increasingly powered by AI assistance, 
              from autocomplete to full application generation.
            </p>
          </div>
          
          <div className="text-center">
            <div className="text-5xl mb-4">⛽</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Tokens Are the New Fuel
            </h3>
            <p className="text-gray-600">
              Just as applications need compute resources, AI-powered development 
              consumes tokens at an unprecedented scale.
            </p>
          </div>
          
          <div className="text-center">
            <div className="text-5xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Data-Driven Insights
            </h3>
            <p className="text-gray-600">
              Analyze token consumption patterns across hundreds of AI coding 
              tools and discover usage trends.
            </p>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="text-center space-y-6">
        <h2 className="text-3xl font-bold text-gray-900">
          Explore the Data
        </h2>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Dive deep into the token consumption patterns that are reshaping 
          software development
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/trending"
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            View Trending Data
          </Link>
          <Link
            href="/how-it-works"
            className="bg-gray-200 text-gray-900 px-8 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
          >
            How It Works
          </Link>
        </div>
      </div>

      {/* Recent Stats Preview */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          The Numbers Don&apos;t Lie
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-4xl font-bold text-blue-600 mb-2">
              {formatNumber(totalTokens)}
            </div>
            <div className="text-gray-600">Total Tokens Tracked</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-purple-600 mb-2">
              {activeApps}+
            </div>
            <div className="text-gray-600">Coding Applications</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-green-600 mb-2">
              Daily
            </div>
            <div className="text-gray-600">Data Updates</div>
          </div>
        </div>
      </div>
    </div>
  );
}
