import { getDatabase } from '@/lib/database';

export default function Home() {
  const database = getDatabase();
  const { meta, companies } = database;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            How They Test
          </h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">
            A curated collection of publicly available resources on how software companies test their software
          </p>
        </div>
      </header>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {meta.totalCompanies}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Companies</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {meta.totalResources}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Resources</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
              {meta.industries.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Industries</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
              {meta.topics.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Topics</div>
          </div>
        </div>
      </div>

      {/* Companies Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Companies ({companies.length})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {companies.slice(0, 12).map((company) => (
            <div
              key={company.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow p-6"
            >
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {company.name}
              </h3>
              <div className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 mb-3">
                {company.industry}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {company.resources.length} resources
              </div>
              {company.resources[0]?.topics.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {company.resources[0].topics.slice(0, 3).map((topic) => (
                    <span
                      key={topic}
                      className="px-2 py-1 rounded text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-gray-600 dark:text-gray-400">
            Made with ❤️ by the community
          </p>
        </div>
      </footer>
    </div>
  );
}
