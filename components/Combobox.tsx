'use client';

import { useState, useRef, useEffect } from 'react';

interface ComboboxProps {
  id: string;
  label: string;
  placeholder: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  formatOption?: (option: string) => string;
  allowAddNew?: boolean;
}

export default function Combobox({
  id,
  label,
  placeholder,
  options,
  value,
  onChange,
  formatOption = (option) => option,
  allowAddNew = false,
}: ComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [displayValue, setDisplayValue] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Update display value when value changes (only when dropdown is closed)
  useEffect(() => {
    if (!isOpen) {
      if (value) {
        setDisplayValue(formatOption(value));
        setSearchTerm(formatOption(value));
      } else {
        setDisplayValue('');
        setSearchTerm('');
      }
    }
  }, [value, formatOption, isOpen]);

  // Filter options based on search term
  const filteredOptions = options.filter((option) =>
    formatOption(option).toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // Reset search term to selected value if user clicks away
        if (value) {
          setSearchTerm(formatOption(value));
        } else {
          setSearchTerm('');
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [value, formatOption]);

  const handleSelect = (option: string) => {
    onChange(option);
    setDisplayValue(formatOption(option));
    setSearchTerm(formatOption(option));
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange('');
    setDisplayValue('');
    setSearchTerm('');
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = e.target.value;
    setSearchTerm(newSearchTerm);
    setIsOpen(true);

    // If search term is empty, clear the selection
    if (!newSearchTerm) {
      onChange('');
    }
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleAddNew = () => {
    if (!searchTerm.trim()) return;
    onChange(searchTerm.trim());
    setDisplayValue(searchTerm.trim());
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredOptions.length > 0) {
        handleSelect(filteredOptions[0]);
      } else if (allowAddNew && searchTerm.trim()) {
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

      <div className="relative">
        <input
          type="text"
          id={id}
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full px-4 py-2 pr-20 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />

        <div className="absolute right-2 top-2 flex items-center gap-1">
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
              aria-label="Clear"
            >
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
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
                    className={`w-full text-left px-4 py-2 hover:bg-blue-50 dark:hover:bg-gray-600 ${
                      value === option
                        ? 'bg-blue-100 dark:bg-gray-600 text-blue-900 dark:text-white'
                        : 'text-gray-900 dark:text-white'
                    }`}
                  >
                    {formatOption(option)}
                  </button>
                </li>
              ))}
            </ul>
          ) : allowAddNew && searchTerm.trim() ? (
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
              {allowAddNew ? 'Type to search or add new' : 'No options found'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
