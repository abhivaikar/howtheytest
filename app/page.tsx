'use client';

import { useState, useMemo, useEffect } from 'react';
import { getDatabase } from '@/lib/database';
import { Company } from '@/types/database';
import CompanyCard from '@/components/CompanyCard';
import CompanyList from '@/components/CompanyList';
import CompanyModal from '@/components/CompanyModal';
import FilterBar, { FilterState } from '@/components/FilterBar';
import ThemeToggle from '@/components/ThemeToggle';
import Hero from '@/components/Hero';
import Intro from '@/components/Intro';
import WhatsNew from '@/components/WhatsNew';
import Footer from '@/components/Footer';
import Link from 'next/link';

export default function Home() {
  const database = getDatabase();
  const { meta, companies } = database;

  const [filters, setFilters] = useState<FilterState>({
    companyName: '',
    industry: '',
    topic: '',
    resourceType: '',
  });

  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Fix edge case: Force grid view on mobile when resizing from desktop to mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768 && viewMode === 'list') {
        setViewMode('grid');
      }
    };

    // Check on mount
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [viewMode]);

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
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Fixed Header with Theme Toggle and Contribute Button */}
      <header className="fixed top-0 right-0 z-50 p-4 flex items-center gap-3">
        <Link
          href="/contribute"
          className="px-4 py-2 rounded-lg text-white font-medium transition-colors shadow-md hover:shadow-lg"
          style={{ backgroundColor: '#42b983' }}
        >
          Contribute
        </Link>
        <ThemeToggle />
      </header>

      {/* Hero Section */}
      <Hero />

      {/* Intro Section */}
      <Intro />

      {/* What's New Section */}
      <WhatsNew companies={companies} />

      {/* Browse Section */}
      <div id="browse" className="bg-gradient-to-br from-blue-50 to-orange-50 dark:from-gray-800 dark:to-gray-900 py-16">
        {/* Stats */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
          <FilterBar
            companyNames={companyNames}
            industries={meta.industries}
            topics={meta.topics}
            resourceTypes={Object.keys(meta.resourceTypes)}
            onFilterChange={setFilters}
          />
        </div>

        {/* Companies Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Companies ({filteredCompanies.length})
            </h2>

            {/* View Toggle - Hidden on mobile, shown on tablet and up */}
            <div className="hidden md:flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg p-1 shadow">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 rounded-md transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                aria-label="Grid view"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 rounded-md transition-colors ${
                  viewMode === 'list'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                aria-label="List view"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>

          {filteredCompanies.length > 0 ? (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCompanies.map((company) => (
                  <CompanyCard
                    key={company.id}
                    company={company}
                    onClick={() => setSelectedCompany(company)}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <div className="col-span-3">Company</div>
                  <div className="col-span-2 text-center">Resources</div>
                  <div className="col-span-3">Types</div>
                  <div className="col-span-4">Topics</div>
                </div>
                {filteredCompanies.map((company) => (
                  <CompanyList
                    key={company.id}
                    company={company}
                    onClick={() => setSelectedCompany(company)}
                  />
                ))}
              </div>
            )
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
      </div>

      {/* Footer */}
      <Footer />

      {/* Company Modal */}
      {selectedCompany && (
        <CompanyModal
          company={selectedCompany}
          onClose={() => setSelectedCompany(null)}
        />
      )}
    </div>
  );
}
