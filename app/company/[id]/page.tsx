import { notFound } from 'next/navigation';
import { getDatabase, getCompanyById } from '@/lib/database';
import ResourceCard from '@/components/ResourceCard';
import CompanyHeader from '@/components/CompanyHeader';

interface CompanyPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateStaticParams() {
  const database = getDatabase();
  return database.companies.map((company) => ({
    id: company.id,
  }));
}

export async function generateMetadata({ params }: CompanyPageProps) {
  const { id } = await params;
  const company = getCompanyById(id);

  if (!company) {
    return {
      title: 'Company Not Found',
    };
  }

  return {
    title: `${company.name} - How They Test`,
    description: `Testing resources and practices from ${company.name} in the ${company.industry} industry`,
  };
}

export default async function CompanyPage({ params }: CompanyPageProps) {
  const { id } = await params;
  const company = getCompanyById(id);

  if (!company) {
    notFound();
  }

  // Collect all unique topics from all resources
  const allTopics = Array.from(
    new Set(company.resources.flatMap((resource) => resource.topics))
  ).sort();

  // Sort resources by addedDate (newest first), then group by type
  const sortedResources = [...company.resources].sort((a, b) => {
    const dateA = new Date(a.addedDate || '1970-01-01').getTime();
    const dateB = new Date(b.addedDate || '1970-01-01').getTime();
    return dateB - dateA; // Descending order (newest first)
  });

  const resourcesByType = sortedResources.reduce((acc, resource) => {
    if (!acc[resource.type]) {
      acc[resource.type] = [];
    }
    acc[resource.type].push(resource);
    return acc;
  }, {} as Record<string, typeof company.resources>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 dark:from-gray-900 dark:to-gray-800">
      <CompanyHeader company={company} />

      {/* Topics Overview */}
      {allTopics.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Topics Covered ({allTopics.length})
            </h2>
            <div className="flex flex-wrap gap-2">
              {allTopics.map((topic) => (
                <span
                  key={topic}
                  className="px-3 py-1.5 rounded-md text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Resources */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Resources
        </h2>

        {/* Group by type */}
        {Object.entries(resourcesByType).map(([type, resources]) => (
          <div key={type} className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 capitalize">
              {type}s ({resources.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {resources.map((resource) => (
                <ResourceCard key={resource.id} resource={resource} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-gray-600 dark:text-gray-400">
            Made with ❤️ by the community
          </p>
        </div>
      </footer>
    </div>
  );
}
