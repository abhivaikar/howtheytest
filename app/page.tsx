'use client';

import { useState, useMemo } from 'react';
import { getDatabase } from '@/lib/database';
import CompanyCard from '@/components/CompanyCard';
import FilterBar, { FilterState } from '@/components/FilterBar';
import ThemeToggle from '@/components/ThemeToggle';

export default function Home() {
  const database = getDatabase();
  const { meta, companies } = database;

  const [filters, setFilters] = useState<FilterState>({
    companyName: '',
    industry: '',
    topic: '',
    resourceType: '',
  });

  // Get all unique company names for the filter
  const companyNames = useMemo(
    () => companies.map((company) => company.name).sort(),
    [companies]
  );

  // Filter companies based on all active filters
  const filteredCompanies = useMemo(() => {
    return companies.filter((company) => {
      // Filter by company name
      if (filters.companyName && company.name !== filters.companyName) {
        return false;
      }

      // Filter by industry
      if (filters.industry && company.industry !== filters.industry) {
        return false;
      }

      // Filter by topic - check if any resource has the topic
      if (filters.topic) {
        const hasTopicInResources = company.resources.some((resource) =>
          resource.topics.includes(filters.topic)
        );
        if (!hasTopicInResources) {
          return false;
        }
      }

      // Filter by resource type - check if any resource has the type
      if (filters.resourceType) {
        const hasResourceType = company.resources.some(
          (resource) => resource.type === filters.resourceType
        );
        if (!hasResourceType) {
          return false;
        }
      }

      return true;
    });
  }, [companies, filters]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                How They Test
              </h1>
              <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">
                A curated collection of publicly available resources on how software companies test their software
              </p>
            </div>
            <ThemeToggle />
          </div>
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

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <FilterBar
          companyNames={companyNames}
          industries={meta.industries}
          topics={meta.topics}
          resourceTypes={Object.keys(meta.resourceTypes)}
          onFilterChange={setFilters}
        />
      </div>

      {/* Companies Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 pb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Companies ({filteredCompanies.length})
        </h2>

        {filteredCompanies.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCompanies.map((company) => (
              <CompanyCard key={company.id} company={company} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
              No companies found
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Try adjusting your filters to find what you're looking for.
            </p>
          </div>
        )}
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
