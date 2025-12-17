'use client';

import Link from 'next/link';
import ThemeToggle from './ThemeToggle';
import { Company } from '@/types/database';

interface CompanyHeaderProps {
  company: Company;
}

export default function CompanyHeader({ company }: CompanyHeaderProps) {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-4">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
          >
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Companies
          </Link>
          <ThemeToggle />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
              {company.name}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="px-4 py-2 rounded-full text-sm font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                {company.industry.replace(/-/g, ' ')}
              </span>
              <span className="text-gray-600 dark:text-gray-400">
                {company.resources.length} {company.resources.length === 1 ? 'resource' : 'resources'}
              </span>
            </div>
          </div>

          {company.website && (
            <a
              href={company.website}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap self-start"
            >
              Visit Website
            </a>
          )}
        </div>

        {company.description && (
          <p className="mt-4 text-gray-600 dark:text-gray-300 max-w-3xl">
            {company.description}
          </p>
        )}
      </div>
    </header>
  );
}
