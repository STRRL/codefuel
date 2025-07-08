import Link from "next/link";
import { getTopApps, getUsageHistory } from "@/lib/db";

async function getTotalTokens() {
  const usageHistory = await getUsageHistory(1000);
  
  let totalTokens = 0;
  usageHistory.forEach(entry => {
    const tokens = entry.tokensUsed.replace(/,/g, '');
    const numTokens = parseInt(tokens) || 0;
    totalTokens += numTokens;
  });
  
  return totalTokens;
}

async function getActiveApps() {
  const apps = await getTopApps(100);
  return apps.length;
}

export default async function Home() {
  const totalTokens = await getTotalTokens();
  const activeApps = await getActiveApps();
  
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
      <div className="text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight">
            AI Coding is Eating Software
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto">
            Tokens are the new gas powering the future of software development
          </p>
        </div>
        
        <div className="bg-blue-50 rounded-2xl p-8 max-w-4xl mx-auto">
          <p className="text-lg text-gray-700 mb-6">
            Currently, there are{" "}
            <span className="text-4xl font-bold text-blue-600">
              {formatNumber(totalTokens)}
            </span>{" "}
            tokens being consumed by AI coding tools
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg p-6">
              <div className="text-3xl font-bold text-gray-900">{activeApps}+</div>
              <div className="text-gray-600">Active Coding Apps</div>
            </div>
            <div className="bg-white rounded-lg p-6">
              <div className="text-3xl font-bold text-gray-900">24/7</div>
              <div className="text-gray-600">Continuous Tracking</div>
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
              Track the Revolution
            </h3>
            <p className="text-gray-600">
              Monitor real-time token consumption across hundreds of AI coding 
              tools and understand usage patterns.
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
              Live
            </div>
            <div className="text-gray-600">Real-time Tracking</div>
          </div>
        </div>
      </div>
    </div>
  );
}
