export default function HowItWorksPage() {
  return (
    <div className="space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">
          How It Works
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          A transparent look at our data collection methodology and limitations
        </p>
      </div>

      {/* Data Collection Process */}
      <div className="bg-white rounded-2xl p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Data Collection Process
        </h2>
        
        <div className="space-y-6">
          <div className="flex items-start space-x-4">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-blue-600">1</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                OpenRouter API Integration
              </h3>
              <p className="text-gray-600">
                We collect token usage data from OpenRouter, a platform that aggregates 
                AI model usage across multiple providers including OpenAI, Anthropic, 
                Google, and others.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-blue-600">2</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Automated Web Scraping
              </h3>
              <p className="text-gray-600">
                Using Stagehand (Browserbase) and Playwright, we automatically navigate 
                OpenRouter&apos;s interface to collect real-time usage statistics for coding 
                applications and AI models.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-blue-600">3</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Data Processing & Storage
              </h3>
              <p className="text-gray-600">
                Collected data is processed, categorized, and stored in a PostgreSQL 
                database with proper indexing for efficient querying and analysis.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-blue-600">4</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Analytics & Visualization
              </h3>
              <p className="text-gray-600">
                The processed data is transformed into meaningful insights, trends, 
                and visualizations to help understand AI coding tool usage patterns.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Technical Architecture */}
      <div className="bg-white rounded-2xl p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Technical Architecture
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Data Collection (CLI)
            </h3>
            <ul className="space-y-2 text-gray-600">
              <li>• Node.js CLI application</li>
              <li>• Stagehand for AI-powered browser automation</li>
              <li>• Playwright for web scraping</li>
              <li>• Drizzle ORM for database operations</li>
              <li>• PostgreSQL for data storage</li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Web Application
            </h3>
            <ul className="space-y-2 text-gray-600">
              <li>• Next.js 15 with App Router</li>
              <li>• Server-side rendering for performance</li>
              <li>• Tailwind CSS for styling</li>
              <li>• TypeScript for type safety</li>
              <li>• Responsive design for all devices</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Data Sources */}
      <div className="bg-white rounded-2xl p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Data Sources
        </h2>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">🔗</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                OpenRouter Platform
              </h3>
              <p className="text-gray-600">
                Primary data source for AI model usage statistics across coding applications
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">🤖</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Multiple AI Providers
              </h3>
              <p className="text-gray-600">
                Data includes usage from OpenAI, Anthropic, Google, and other AI model providers
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Limitations */}
      <div className="bg-yellow-50 rounded-2xl p-8">
        <h2 className="text-2xl font-bold text-yellow-800 mb-6">
          Limitations & Considerations
        </h2>
        
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="text-yellow-600 text-xl">⚠️</div>
            <div>
              <h3 className="font-semibold text-yellow-800">Data Scope</h3>
              <p className="text-yellow-700">
                Our data only covers applications and usage visible through OpenRouter. 
                This represents a subset of total AI coding tool usage.
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="text-yellow-600 text-xl">⚠️</div>
            <div>
              <h3 className="font-semibold text-yellow-800">Historical Data</h3>
              <p className="text-yellow-700">
                We only have access to data since we started collection. 
                Historical trends may not capture the full picture of AI coding evolution.
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="text-yellow-600 text-xl">⚠️</div>
            <div>
              <h3 className="font-semibold text-yellow-800">Real-time Updates</h3>
              <p className="text-yellow-700">
                Data collection runs on scheduled intervals, so the most recent usage 
                may not be immediately reflected in our statistics.
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="text-yellow-600 text-xl">⚠️</div>
            <div>
              <h3 className="font-semibold text-yellow-800">Application Categorization</h3>
              <p className="text-yellow-700">
                App categories and descriptions are based on available public information 
                and may not reflect the complete feature set of each application.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Future Improvements */}
      <div className="bg-white rounded-2xl p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Future Improvements
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Enhanced Data Collection
            </h3>
            <ul className="space-y-2 text-gray-600">
              <li>• Additional data sources beyond OpenRouter</li>
              <li>• More frequent collection intervals</li>
              <li>• Better application categorization</li>
              <li>• User-submitted app information</li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Better Analytics
            </h3>
            <ul className="space-y-2 text-gray-600">
              <li>• Interactive charts and graphs</li>
              <li>• Predictive trend analysis</li>
              <li>• Cost analysis and projections</li>
              <li>• API access for developers</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className="text-center bg-blue-50 rounded-2xl p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Questions or Feedback?
        </h2>
        <p className="text-gray-600 mb-6">
          We&apos;re committed to transparency and continuous improvement. 
          If you have questions about our methodology or suggestions for improvement, 
          we&apos;d love to hear from you.
        </p>
        <div className="space-y-2">
          <p className="text-sm text-gray-500">
            This project is open source and available on GitHub
          </p>
          <p className="text-sm text-gray-500">
            Data collection follows ethical web scraping practices
          </p>
        </div>
      </div>
    </div>
  );
}