'use client';

import { useState, useRef, useEffect } from 'react';

interface MultiSelectComboboxProps {
  id: string;
  label: string;
  placeholder: string;
  options: string[];
  values: string[];
  onChange: (values: string[]) => void;
  onNewValueWarning?: (value: string) => void;
}

export default function MultiSelectCombobox({
  id,
  label,
  placeholder,
  options,
  values,
  onChange,
  onNewValueWarning,
}: MultiSelectComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter options based on search term and exclude already selected
  const filteredOptions = options.filter(
    (option) =>
      option.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !values.includes(option)
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option: string) => {
    onChange([...values, option]);
    setSearchTerm('');
  };

  const handleRemove = (option: string) => {
    onChange(values.filter((v) => v !== option));
  };

  const handleAddNew = () => {
    if (!searchTerm.trim()) return;

    // Check if it's a new value (case-insensitive)
    const isNew = !options.some(
      (opt) => opt.toLowerCase() === searchTerm.trim().toLowerCase()
    );

    if (isNew && onNewValueWarning) {
      onNewValueWarning(searchTerm.trim());
    }

    if (!values.includes(searchTerm.trim())) {
      onChange([...values, searchTerm.trim()]);
    }
    setSearchTerm('');
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredOptions.length > 0) {
        handleSelect(filteredOptions[0]);
      } else if (searchTerm.trim()) {
        handleAddNew();
      }
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
      >
        {label}
      </label>

      {/* Selected Values */}
      {values.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {values.map((value) => (
            <span
              key={value}
              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm"
            >
              {value}
              <button
                type="button"
                onClick={() => handleRemove(value)}
                className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
                aria-label={`Remove ${value}`}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="relative">
        <input
          type="text"
          id={id}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-2 top-2 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
          aria-label="Toggle dropdown"
        >
          <svg
            className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-auto">
          {filteredOptions.length > 0 ? (
            <ul className="py-1">
              {filteredOptions.map((option) => (
                <li key={option}>
                  <button
                    type="button"
                    onClick={() => handleSelect(option)}
                    className="w-full text-left px-4 py-2 hover:bg-blue-50 dark:hover:bg-gray-600 text-gray-900 dark:text-white"
                  >
                    {option}
                  </button>
                </li>
              ))}
            </ul>
          ) : searchTerm.trim() ? (
            <div className="py-2">
              <button
                type="button"
                onClick={handleAddNew}
                className="w-full text-left px-4 py-2 hover:bg-blue-50 dark:hover:bg-gray-600 text-gray-900 dark:text-white"
              >
                <span className="text-blue-600 dark:text-blue-400">+ Add new:</span> "{searchTerm.trim()}"
              </button>
            </div>
          ) : (
            <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
              {values.length > 0 ? 'All options selected' : 'No options found'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
