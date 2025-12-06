'use client';

import { useMemo, useRef, useState, useEffect } from 'react';
import { Company, Resource } from '@/types/database';

interface ResourceWithCompany extends Resource {
  companyName: string;
  companyId: string;
}

interface WhatsNewProps {
  companies: Company[];
}

export default function WhatsNew({ companies }: WhatsNewProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Get all resources with company info and sort by addedDate
  const recentResources = useMemo(() => {
    const allResources: ResourceWithCompany[] = [];
    const today = new Date();
    const threeMonthsAgo = new Date(today.getTime() - (90 * 24 * 60 * 60 * 1000)); // 90 days ago

    companies.forEach(company => {
      company.resources.forEach(resource => {
        // Only include resources from the last 3 months
        const resourceDate = new Date(resource.addedDate || '1970-01-01');
        if (resourceDate >= threeMonthsAgo) {
          allResources.push({
            ...resource,
            companyName: company.name,
            companyId: company.id,
          });
        }
      });
    });

    // Sort by addedDate (newest first) and take top 15
    return allResources
      .sort((a, b) => {
        const dateA = new Date(a.addedDate || '1970-01-01').getTime();
        const dateB = new Date(b.addedDate || '1970-01-01').getTime();
        return dateB - dateA;
      })
      .slice(0, 15);
  }, [companies]);

  // Check if we can scroll left or right
  const checkScrollability = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1); // -1 for rounding
    }
  };

  // Check scrollability on mount and when content changes
  useEffect(() => {
    checkScrollability();
    window.addEventListener('resize', checkScrollability);
    return () => window.removeEventListener('resize', checkScrollability);
  }, [recentResources]);

  // Scroll functions
  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 350; // Width of card + gap
      const newScrollLeft = scrollContainerRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
      scrollContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  // Calculate days ago
  const getDaysAgo = (dateString?: string) => {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
    return `${Math.floor(diffDays / 365)} year${Math.floor(diffDays / 365) > 1 ? 's' : ''} ago`;
  };

  // Get resource type badge color
  const getTypeBadgeColor = (type: string) => {
    const colors: Record<string, string> = {
      blog: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
      video: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
      article: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
      book: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200',
      talk: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
      podcast: 'bg-pink-100 dark:bg-pink-900 text-pink-800 dark:text-pink-200',
      handbook: 'bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200',
      repo: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
    };
    return colors[type] || colors.blog;
  };

  // Don't render the section if there are no recent resources
  if (recentResources.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            What's New
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Testing resources added in the last 3 months from companies around the world
          </p>
        </div>

        {/* Horizontal scrollable container */}
        <div className="relative">
          {/* Left scroll button */}
          {canScrollLeft && (
            <button
              onClick={() => scroll('left')}
              className="hidden md:block absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-800 p-3 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Scroll left"
            >
              <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Right scroll button */}
          {canScrollRight && (
            <button
              onClick={() => scroll('right')}
              className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-800 p-3 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Scroll right"
            >
              <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          <div
            ref={scrollContainerRef}
            onScroll={checkScrollability}
            className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide"
          >
            {recentResources.map((resource, index) => (
              <a
                key={`${resource.companyId}-${resource.id}-${index}`}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-none w-80 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-shadow cursor-pointer snap-start"
              >
                <div className="p-6">
                  {/* Header with type badge and date */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeBadgeColor(resource.type)}`}>
                      {resource.type}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {getDaysAgo(resource.addedDate)}
                    </span>
                  </div>

                  {/* Resource title */}
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 min-h-[3.5rem]">
                    {resource.title}
                  </h3>

                  {/* Company name */}
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    {resource.companyName}
                  </p>

                  {/* Topics (max 3) */}
                  {resource.topics.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {resource.topics.slice(0, 3).map(topic => (
                        <span
                          key={topic}
                          className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs"
                        >
                          {topic}
                        </span>
                      ))}
                      {resource.topics.length > 3 && (
                        <span className="px-2 py-1 text-gray-500 dark:text-gray-400 text-xs">
                          +{resource.topics.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </a>
            ))}
          </div>

          {/* Scroll indicators */}
          <div className="flex justify-center mt-4 gap-2">
            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
              </svg>
              Scroll to see more
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
