'use client';

import { useState } from 'react';
import Combobox from './Combobox';

interface FilterBarProps {
  companyNames: string[];
  industries: string[];
  topics: string[];
  resourceTypes: string[];
  onFilterChange: (filters: FilterState) => void;
}

export interface FilterState {
  companyName: string;
  industry: string;
  topic: string;
  resourceType: string;
}

export default function FilterBar({
  companyNames,
  industries,
  topics,
  resourceTypes,
  onFilterChange,
}: FilterBarProps) {
  const [filters, setFilters] = useState<FilterState>({
    companyName: '',
    industry: '',
    topic: '',
    resourceType: '',
  });

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const emptyFilters = { companyName: '', industry: '', topic: '', resourceType: '' };
    setFilters(emptyFilters);
    onFilterChange(emptyFilters);
  };

  const hasActiveFilters = filters.companyName || filters.industry || filters.topic || filters.resourceType;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Search & Filter Companies
        </h3>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
          >
            Clear All Filters
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Company Name Filter */}
        <Combobox
          id="companyName"
          label="Company Name"
          placeholder="Search companies..."
          options={companyNames}
          value={filters.companyName}
          onChange={(value) => handleFilterChange('companyName', value)}
        />

        {/* Industry Filter */}
        <Combobox
          id="industry"
          label="Industry"
          placeholder="Select industry..."
          options={industries}
          value={filters.industry}
          onChange={(value) => handleFilterChange('industry', value)}
          formatOption={(option) => option.replace(/-/g, ' ')}
        />

        {/* Topic Filter */}
        <Combobox
          id="topic"
          label="Topic"
          placeholder="Select topic..."
          options={topics}
          value={filters.topic}
          onChange={(value) => handleFilterChange('topic', value)}
        />

        {/* Resource Type Filter */}
        <Combobox
          id="resourceType"
          label="Resource Type"
          placeholder="Select type..."
          options={resourceTypes}
          value={filters.resourceType}
          onChange={(value) => handleFilterChange('resourceType', value)}
          formatOption={(option) => option.charAt(0).toUpperCase() + option.slice(1)}
        />
      </div>
    </div>
  );
}
