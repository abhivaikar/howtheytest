'use client';

import { useEffect, useState } from 'react';
import { Company } from '@/types/database';
import ResourceCard from './ResourceCard';

interface CompanyModalProps {
  company: Company;
  onClose: () => void;
}

export default function CompanyModal({ company, onClose }: CompanyModalProps) {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Sort resources by addedDate (newest first)
  const sortedResources = [...company.resources].sort((a, b) => {
    const dateA = new Date(a.addedDate || '1970-01-01').getTime();
    const dateB = new Date(b.addedDate || '1970-01-01').getTime();
    return dateB - dateA; // Descending order (newest first)
  });

  // Filter by selected topic if one is selected
  const filteredResources = selectedTopic
    ? sortedResources.filter((resource) => resource.topics.includes(selectedTopic))
    : sortedResources;

  // Group by type
  const resourcesByType = filteredResources.reduce((acc, resource) => {
    if (!acc[resource.type]) {
      acc[resource.type] = [];
    }
    acc[resource.type].push(resource);
    return acc;
  }, {} as Record<string, typeof company.resources>);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 dark:bg-black/70 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div
          className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Close modal"
          >
            <svg
              className="w-6 h-6 text-gray-600 dark:text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* Content */}
          <div className="p-8">
            {/* Company Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                {company.name}
              </h1>
              <div className="flex flex-wrap gap-3 items-center">
                <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full text-sm font-medium">
                  {company.industry}
                </span>
                <span className="text-gray-600 dark:text-gray-400">
                  {company.resources.length} resource{company.resources.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Topics Overview */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Topics Covered
                </h2>
                {selectedTopic && (
                  <button
                    onClick={() => setSelectedTopic(null)}
                    className="px-3 py-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Clear filter
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {Array.from(
                  new Set(company.resources.flatMap((resource) => resource.topics))
                )
                  .sort()
                  .map((topic) => (
                    <button
                      key={topic}
                      onClick={() => setSelectedTopic(topic === selectedTopic ? null : topic)}
                      className={`px-3 py-1 rounded-full text-sm transition-colors cursor-pointer flex items-center gap-1 ${
                        topic === selectedTopic
                          ? 'bg-blue-600 dark:bg-blue-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900 hover:text-blue-700 dark:hover:text-blue-300'
                      }`}
                      title={topic === selectedTopic ? 'Clear filter' : `Filter by ${topic}`}
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                      </svg>
                      {topic}
                    </button>
                  ))}
              </div>
              {selectedTopic && (
                <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                  Showing {filteredResources.length} of {company.resources.length} resources filtered by &quot;{selectedTopic}&quot;
                </p>
              )}
            </div>

            {/* Resources grouped by type */}
            <div className="space-y-8">
              {Object.entries(resourcesByType)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([type, resources]) => (
                  <div key={type}>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 capitalize">
                      {type}s ({resources.length})
                    </h2>
                    <div className="space-y-4">
                      {resources.map((resource, index) => (
                        <ResourceCard key={index} resource={resource} />
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
