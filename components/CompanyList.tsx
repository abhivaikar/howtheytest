import { Company } from '@/types/database';

interface CompanyListProps {
  company: Company;
  onClick: () => void;
}

export default function CompanyList({ company, onClick }: CompanyListProps) {
  const totalResources = company.resources.length;
  const resourceTypes = Array.from(
    new Set(company.resources.map((r) => r.type))
  ).slice(0, 3);

  const allTopics = Array.from(
    new Set(company.resources.flatMap((r) => r.topics))
  ).slice(0, 5);

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white dark:bg-gray-800 hover:shadow-lg transition-shadow border-b border-gray-200 dark:border-gray-700 last:border-b-0"
    >
      <div className="px-6 py-4 grid grid-cols-12 gap-4 items-center">
        {/* Company Name - 3 cols */}
        <div className="col-span-12 md:col-span-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {company.name}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
            {company.industry.replace(/-/g, ' ')}
          </p>
        </div>

        {/* Resources Count - 2 cols */}
        <div className="col-span-6 md:col-span-2 text-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {totalResources}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Resources
          </div>
        </div>

        {/* Resource Types - 3 cols */}
        <div className="col-span-6 md:col-span-3">
          <div className="flex flex-wrap gap-1">
            {resourceTypes.map((type) => (
              <span
                key={type}
                className="inline-block px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
              >
                {type}
              </span>
            ))}
            {resourceTypes.length < Array.from(new Set(company.resources.map((r) => r.type))).length && (
              <span className="inline-block px-2 py-1 text-xs text-gray-500 dark:text-gray-400">
                +{Array.from(new Set(company.resources.map((r) => r.type))).length - resourceTypes.length}
              </span>
            )}
          </div>
        </div>

        {/* Topics - 4 cols */}
        <div className="col-span-12 md:col-span-4">
          <div className="flex flex-wrap gap-1">
            {allTopics.map((topic) => (
              <span
                key={topic}
                className="inline-block px-2 py-1 text-xs rounded-full bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200"
              >
                {topic}
              </span>
            ))}
            {allTopics.length < Array.from(new Set(company.resources.flatMap((r) => r.topics))).length && (
              <span className="inline-block px-2 py-1 text-xs text-gray-500 dark:text-gray-400">
                +{Array.from(new Set(company.resources.flatMap((r) => r.topics))).length - allTopics.length}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
