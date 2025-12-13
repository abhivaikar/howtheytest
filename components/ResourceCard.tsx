import { Resource } from '@/types/database';

interface ResourceCardProps {
  resource: Resource;
}

const resourceTypeColors: Record<'blog or article' | 'video' | 'book' | 'repo', string> = {
  'blog or article': 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
  video: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
  book: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200',
  repo: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
};

export default function ResourceCard({ resource }: ResourceCardProps) {
  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-all duration-200 p-5 border border-transparent hover:border-blue-500 dark:hover:border-blue-400"
    >
      {/* Resource Type Badge */}
      <div className="flex items-center justify-between mb-3">
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${resourceTypeColors[resource.type]}`}>
          {resource.type}
        </span>
        <svg
          className="w-4 h-4 text-gray-400 dark:text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
          />
        </svg>
      </div>

      {/* Title */}
      <h4 className="text-base font-medium text-gray-900 dark:text-white mb-2 line-clamp-2">
        {resource.title}
      </h4>

      {/* Description */}
      {resource.description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
          {resource.description}
        </p>
      )}

      {/* Topics */}
      {resource.topics.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {resource.topics.slice(0, 4).map((topic) => (
            <span
              key={topic}
              className="px-2 py-1 rounded text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              {topic}
            </span>
          ))}
          {resource.topics.length > 4 && (
            <span className="px-2 py-1 rounded text-xs text-gray-500 dark:text-gray-400">
              +{resource.topics.length - 4}
            </span>
          )}
        </div>
      )}
    </a>
  );
}
