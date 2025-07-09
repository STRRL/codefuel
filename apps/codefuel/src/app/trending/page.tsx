import { getUsageHistory, type AppUsageHistory, db, apps } from "@/lib/db";
import { eq } from "drizzle-orm";

async function getWeeklyTrends() {
  const usageHistory = await getUsageHistory(1000);
  
  const weeklyData = usageHistory.reduce((acc, entry) => {
    const date = new Date(entry.recordedAt);
    const week = getWeekKey(date);
    
    if (!acc[week]) {
      acc[week] = {
        week,
        totalTokens: 0,
        apps: new Set(),
        models: new Set(),
        entries: []
      };
    }
    
    const tokens = parseInt(entry.tokensUsed.replace(/,/g, '')) || 0;
    acc[week].totalTokens += tokens;
    acc[week].apps.add(entry.appName);
    acc[week].models.add(entry.modelName);
    acc[week].entries.push(entry);
    
    return acc;
  }, {} as Record<string, {
    week: string;
    totalTokens: number;
    apps: Set<string>;
    models: Set<string>;
    entries: AppUsageHistory[];
  }>);
  
  return Object.values(weeklyData).sort((a, b) => b.week.localeCompare(a.week));
}

function getWeekKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function getTopAppsByTokens() {
  const usageHistory = await getUsageHistory(1000);
  
  const appTokens = usageHistory.reduce((acc, entry) => {
    const tokens = parseInt(entry.tokensUsed.replace(/,/g, '')) || 0;
    acc[entry.appName] = (acc[entry.appName] || 0) + tokens;
    return acc;
  }, {} as Record<string, number>);
  
  const topApps = Object.entries(appTokens)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([app, tokens]) => ({ app, tokens }));

  // Get category and URL information for each app
  const appsWithCategories = await Promise.all(
    topApps.map(async (appData) => {
      const appInfo = await db.select().from(apps).where(eq(apps.name, appData.app)).limit(1);
      return {
        ...appData,
        category: appInfo[0]?.category || 'Unknown',
        url: appInfo[0]?.url || null
      };
    })
  );

  return appsWithCategories;
}

async function getTopModelsByTokens() {
  const usageHistory = await getUsageHistory(1000);
  
  const modelData = usageHistory.reduce((acc, entry) => {
    const tokens = parseInt(entry.tokensUsed.replace(/,/g, '')) || 0;
    const displayName = entry.modelDisplayName;
    const modelName = entry.modelName;
    
    if (!acc[displayName]) {
      acc[displayName] = {
        tokens: 0,
        modelName: modelName
      };
    }
    acc[displayName].tokens += tokens;
    
    return acc;
  }, {} as Record<string, { tokens: number; modelName: string }>);
  
  return Object.entries(modelData)
    .sort(([, a], [, b]) => b.tokens - a.tokens)
    .slice(0, 10)
    .map(([displayName, data]) => ({ 
      model: displayName, 
      tokens: data.tokens,
      modelName: data.modelName
    }));
}

function getCategoryColor(category: string) {
  const colors = {
    'Coding': 'bg-blue-100 text-blue-800',
    'Marketing': 'bg-green-100 text-green-800',
    'Personal Assistant': 'bg-purple-100 text-purple-800',
    'Roleplay': 'bg-pink-100 text-pink-800',
    'Translation': 'bg-indigo-100 text-indigo-800',
    'Others': 'bg-yellow-100 text-yellow-800',
    'Unknown': 'bg-gray-100 text-gray-800'
  };
  return colors[category as keyof typeof colors] || colors.Unknown;
}

function getOpenRouterUrl(modelName: string) {
  return `https://openrouter.ai/${modelName}/activity`;
}

export default async function TrendingPage() {
  const weeklyTrends = await getWeeklyTrends();
  const topApps = await getTopAppsByTokens();
  const topModels = await getTopModelsByTokens();
  
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

  // Calculate max tokens for percentage bars
  const maxAppTokens = topApps.length > 0 ? Math.max(...topApps.map(app => app.tokens)) : 0;
  const maxModelTokens = topModels.length > 0 ? Math.max(...topModels.map(model => model.tokens)) : 0;

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">
          Trending Token Usage
        </h1>
        <p className="text-xl text-gray-600">
          Historical data showing AI coding tool token consumption patterns
        </p>
      </div>

      {/* Weekly Trends */}
      <div className="bg-white rounded-2xl p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Weekly Token Consumption
        </h2>
        
        {weeklyTrends.length > 0 ? (
          <div className="space-y-4">
            {weeklyTrends.slice(0, 8).map((week) => (
              <div key={week.week} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="text-sm font-medium text-gray-500">
                    Week of {week.week}
                  </div>
                  <div className="text-sm text-gray-600">
                    {week.apps.size} apps • {week.models.size} models
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">
                    {formatNumber(week.totalTokens)}
                  </div>
                  <div className="text-sm text-gray-500">tokens</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No historical data available yet.</p>
            <p className="text-sm text-gray-400 mt-2">
              Data collection is ongoing. Check back later for trends.
            </p>
          </div>
        )}
      </div>

      {/* Top Apps */}
      <div className="bg-white rounded-2xl p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Top Apps
        </h2>
        
        {topApps.length > 0 ? (
          <div className="space-y-3">
            {topApps.map((app, index) => {
              const percentage = maxAppTokens > 0 ? (app.tokens / maxAppTokens) * 100 : 0;
              return (
                <div key={app.app} className="relative overflow-hidden rounded-lg">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg relative">
                    {/* Progress bar background */}
                    <div 
                      className="absolute inset-0 bg-gray-900 opacity-10 transition-all duration-300 rounded-lg"
                      style={{ width: `${percentage}%` }}
                    />
                    <div className="flex items-center space-x-4 relative z-10">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-gray-700">
                          {index + 1}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        {app.url ? (
                          <a 
                            href={app.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="font-semibold text-gray-900 hover:text-gray-700 transition-colors"
                          >
                            {app.app}
                          </a>
                        ) : (
                          <div className="font-semibold text-gray-900">{app.app}</div>
                        )}
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-200 text-gray-700">
                          {app.category}
                        </span>
                      </div>
                    </div>
                    <div className="text-right relative z-10">
                      <div className="text-xl font-bold text-gray-900">
                        {formatNumber(app.tokens)}
                      </div>
                      <div className="text-sm text-gray-500">tokens</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No app data available yet.</p>
          </div>
        )}
      </div>

      {/* Top Models */}
      <div className="bg-white rounded-2xl p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Top Models
        </h2>
        
        {topModels.length > 0 ? (
          <div className="space-y-3">
            {topModels.map((model, index) => {
              const percentage = maxModelTokens > 0 ? (model.tokens / maxModelTokens) * 100 : 0;
              return (
                <div key={model.model} className="relative overflow-hidden rounded-lg">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg relative">
                    {/* Progress bar background */}
                    <div 
                      className="absolute inset-0 bg-gray-800 opacity-15 transition-all duration-300 rounded-lg"
                      style={{ width: `${percentage}%` }}
                    />
                    <div className="flex items-center space-x-4 relative z-10">
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-gray-700">
                          {index + 1}
                        </span>
                      </div>
                      <div>
                        <a 
                          href={getOpenRouterUrl(model.modelName)} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="font-semibold text-gray-900 hover:text-gray-700 transition-colors"
                        >
                          {model.model}
                        </a>
                      </div>
                    </div>
                    <div className="text-right relative z-10">
                      <div className="text-xl font-bold text-gray-900">
                        {formatNumber(model.tokens)}
                      </div>
                      <div className="text-sm text-gray-500">tokens</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No model data available yet.</p>
          </div>
        )}
      </div>

      {/* Data Status */}
      <div className="bg-yellow-50 rounded-2xl p-6">
        <div className="flex items-center space-x-3">
          <div className="text-2xl">⚠️</div>
          <div>
            <h3 className="font-semibold text-yellow-800">Limited Data Available</h3>
            <p className="text-yellow-700">
              This is an early preview with limited historical data. 
              More comprehensive trends will be available as our data collection continues.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
