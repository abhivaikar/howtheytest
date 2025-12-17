import { Company } from '@/types/database';

interface CompanyCardProps {
  company: Company;
  onClick: () => void;
}

export default function CompanyCard({ company, onClick }: CompanyCardProps) {
  // Collect all unique topics from all resources
  const allTopics = Array.from(
    new Set(
      company.resources.flatMap((resource) => resource.topics)
    )
  ).sort();

  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-all duration-200 p-6 h-full cursor-pointer border border-transparent hover:border-blue-500 dark:hover:border-blue-400"
    >
        {/* Company Name */}
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          {company.name}
        </h3>

        {/* Industry Badge */}
        <div className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 mb-3">
          {company.industry.replace(/-/g, ' ')}
        </div>

        {/* Resource Count */}
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          {company.resources.length} {company.resources.length === 1 ? 'resource' : 'resources'}
        </div>

        {/* Topics */}
        {allTopics.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {allTopics.slice(0, 6).map((topic) => (
              <span
                key={topic}
                className="px-2 py-1 rounded text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              >
                {topic}
              </span>
            ))}
            {allTopics.length > 6 && (
              <span className="px-2 py-1 rounded text-xs text-gray-500 dark:text-gray-400">
                +{allTopics.length - 6} more
              </span>
            )}
          </div>
        )}
      </div>
  );
}
