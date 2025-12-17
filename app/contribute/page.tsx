'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { getDatabase } from '@/lib/database';
import Combobox from '@/components/Combobox';
import MultiSelectCombobox from '@/components/MultiSelectCombobox';
import Turnstile from '@/components/Turnstile';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

// Get Turnstile site key from environment variable
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA';

interface FormData {
  companyName: string;
  resourceUrl: string;
  resourceTitle: string;
  topics: string[];
  resourceType: string;
  industry: string;
  contributorName: string;
  githubUsername: string;
}

interface FormErrors {
  companyName?: string;
  resourceUrl?: string;
  resourceTitle?: string;
  topics?: string;
  resourceType?: string;
  industry?: string;
  contributorName?: string;
  githubUsername?: string;
  submit?: string;
}

interface NewValueWarnings {
  company?: string;
  industry?: string;
  topics?: string[];
}

function ContributeForm() {
  const database = getDatabase();
  const { meta, companies } = database;
  const searchParams = useSearchParams();

  const [formData, setFormData] = useState<FormData>({
    companyName: '',
    resourceUrl: '',
    resourceTitle: '',
    topics: [],
    resourceType: '',
    industry: '',
    contributorName: '',
    githubUsername: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [warnings, setWarnings] = useState<NewValueWarnings>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [prUrl, setPrUrl] = useState('');
  const [isExistingCompany, setIsExistingCompany] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  // Bookmarklet ref - must be at top level to avoid hooks order violation
  const bookmarkletRef = useRef<HTMLAnchorElement>(null);

  // Get all unique company names
  const companyNames = companies.map((company) => company.name).sort();

  // Handle URL from query parameter (for bookmarklet)
  useEffect(() => {
    const urlParam = searchParams.get('url');
    if (urlParam) {
      setFormData((prev) => ({ ...prev, resourceUrl: urlParam }));
    }
  }, [searchParams]);

  // Set bookmarklet href after success (bypasses React's javascript: URL blocking)
  useEffect(() => {
    if (submitSuccess && bookmarkletRef.current) {
      const bookmarkletCode = `javascript:(function(){window.open('${typeof window !== 'undefined' ? window.location.origin : 'https://abhivaikar.github.io'}/howtheytest/contribute?url='+encodeURIComponent(window.location.href),'_blank');})();`;
      bookmarkletRef.current.href = bookmarkletCode;
    }
  }, [submitSuccess]);

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const validateGithubUsername = (username: string): boolean => {
    if (!username) return true; // Optional field
    // GitHub username rules: alphanumeric and hyphens, cannot start with hyphen
    const githubUsernameRegex = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;
    return githubUsernameRegex.test(username);
  };

  const checkDuplicateResource = (url: string): boolean => {
    return companies.some((company) =>
      company.resources.some((resource) => resource.url === url)
    );
  };

  const checkNewValue = (value: string, existingValues: string[]): boolean => {
    return !existingValues.some(
      (existing) => existing.toLowerCase() === value.toLowerCase()
    );
  };

  const handleCompanyChange = (value: string) => {
    // Check if this is an existing company
    const existingCompany = companies.find(
      (c) => c.name.toLowerCase() === value.toLowerCase()
    );

    if (existingCompany) {
      // Existing company - auto-fill industry and make it read-only
      setFormData({ ...formData, companyName: value, industry: existingCompany.industry });
      setIsExistingCompany(true);

      // Clear company warning
      const newWarnings = { ...warnings };
      delete newWarnings.company;
      setWarnings(newWarnings);
    } else {
      // New company - allow industry selection
      setFormData({ ...formData, companyName: value });
      setIsExistingCompany(false);

      if (value && checkNewValue(value, companyNames)) {
        setWarnings({ ...warnings, company: value });
      } else {
        const newWarnings = { ...warnings };
        delete newWarnings.company;
        setWarnings(newWarnings);
      }
    }
  };

  const handleIndustryChange = (value: string) => {
    setFormData({ ...formData, industry: value });

    if (value && checkNewValue(value, meta.industries)) {
      setWarnings({ ...warnings, industry: value });
    } else {
      const newWarnings = { ...warnings };
      delete newWarnings.industry;
      setWarnings(newWarnings);
    }
  };

  const handleTopicsChange = (values: string[]) => {
    setFormData({ ...formData, topics: values });

    const newTopics = values.filter(value => checkNewValue(value, meta.topics));
    if (newTopics.length > 0) {
      setWarnings({ ...warnings, topics: newTopics });
    } else {
      const newWarnings = { ...warnings };
      delete newWarnings.topics;
      setWarnings(newWarnings);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Required fields
    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }

    if (!formData.resourceUrl.trim()) {
      newErrors.resourceUrl = 'Resource URL is required';
    } else if (!validateUrl(formData.resourceUrl)) {
      newErrors.resourceUrl = 'Please enter a valid URL';
    } else if (checkDuplicateResource(formData.resourceUrl)) {
      newErrors.resourceUrl = 'This resource already exists in our database';
    }

    if (!formData.resourceTitle.trim()) {
      newErrors.resourceTitle = 'Resource title is required';
    }

    if (formData.topics.length === 0) {
      newErrors.topics = 'At least one topic is required';
    }

    if (!formData.resourceType) {
      newErrors.resourceType = 'Resource type is required';
    }

    if (!formData.industry.trim()) {
      newErrors.industry = 'Industry is required';
    }

    if (!formData.contributorName.trim()) {
      newErrors.contributorName = 'Your name is required';
    }

    if (formData.githubUsername && !validateGithubUsername(formData.githubUsername)) {
      newErrors.githubUsername = 'Please enter a valid GitHub username';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Check Turnstile token
    if (!turnstileToken) {
      setErrors({
        submit: 'Please complete the security verification.',
      });
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      // Use environment variable for API endpoint, fallback to relative URL
      const apiEndpoint = process.env.NEXT_PUBLIC_API_URL || '/api/submit-resource';

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          turnstileToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit resource');
      }

      // Success
      setSubmitSuccess(true);
      setPrUrl(data.prUrl);

      // Reset form
      setFormData({
        companyName: '',
        resourceUrl: '',
        resourceTitle: '',
        topics: [],
        resourceType: '',
        industry: '',
        contributorName: '',
        githubUsername: '',
      });
      setWarnings({});
      setIsExistingCompany(false);
      setTurnstileToken(null);
    } catch (error) {
      setErrors({
        submit: error instanceof Error ? error.message : 'An error occurred. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
            <div className="mb-6">
              <svg
                className="mx-auto h-16 w-16 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>

            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Thank You!
            </h2>

            <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
              Your resource submission has been successfully submitted for review.
            </p>

            {prUrl && (
              <div className="mb-6">
                <a
                  href={prUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-6 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
                >
                  View Pull Request
                  <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            )}

            {/* Bookmarklet Promotion */}
            <div className="mt-8 mb-6 p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-left">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Contribute Faster Next Time!
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                Save time by using our bookmarklet. Drag the button below to your bookmarks bar, then click it on any page you want to contribute!
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <a
                  ref={bookmarkletRef}
                  className="inline-flex items-center px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium hover:from-blue-700 hover:to-purple-700 transition-all cursor-move"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Drag this button to your bookmarks bar to install the bookmarklet!');
                  }}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Contribute to HowTheyTest
                </a>
                <span className="text-xs text-gray-600 dark:text-gray-400">← Drag to bookmarks bar</span>
              </div>
              <details className="mt-4">
                <summary className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer hover:text-gray-900 dark:hover:text-gray-200">
                  How to use the bookmarklet
                </summary>
                <ol className="mt-2 text-sm text-gray-600 dark:text-gray-400 list-decimal list-inside space-y-1">
                  <li>Drag the button above to your bookmarks/favorites bar</li>
                  <li>When you find a testing resource you want to contribute, click the bookmarklet</li>
                  <li>The contribution page will open with the URL pre-filled and auto-analyzed!</li>
                </ol>
              </details>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => {
                  setSubmitSuccess(false);
                  setPrUrl('');
                }}
                className="px-6 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Submit Another Resource
              </button>

              <Link
                href="/"
                className="px-6 py-3 rounded-lg text-white font-medium transition-colors"
                style={{ backgroundColor: '#42b983' }}
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Contribute a Resource
          </h1>
          <p className="text-lg text-gray-700 dark:text-gray-300">
            Help the community by sharing testing resources from companies around the world
          </p>
        </div>

        {/* Contribution Form */}
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">

            {/* Company Name */}
          <div className="mb-6">
            <Combobox
              id="companyName"
              label="Company Name"
              placeholder="Select or enter a company name"
              options={companyNames}
              value={formData.companyName}
              onChange={handleCompanyChange}
              allowAddNew={true}
            />
            {warnings.company && (
              <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>⚠️ New company:</strong> "{warnings.company}" is not in our database. Please verify the name is correct and doesn't already exist with different spelling.
                </p>
              </div>
            )}
            {errors.companyName && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.companyName}</p>
            )}
          </div>

          {/* Resource URL */}
          <div className="mb-6">
            <label htmlFor="resourceUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Resource URL <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              id="resourceUrl"
              value={formData.resourceUrl}
              onChange={(e) => setFormData({ ...formData, resourceUrl: e.target.value })}
              placeholder="https://example.com/blog/testing-at-scale"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.resourceUrl && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.resourceUrl}</p>
            )}
          </div>

          {/* Resource Title */}
          <div className="mb-6">
            <label htmlFor="resourceTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Resource Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="resourceTitle"
              value={formData.resourceTitle}
              onChange={(e) => setFormData({ ...formData, resourceTitle: e.target.value })}
              placeholder="Testing at Scale: Best Practices"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.resourceTitle && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.resourceTitle}</p>
            )}
          </div>

          {/* Topics (Multi-select) */}
          <div className="mb-6">
            <div className="mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Topics <span className="text-red-500">*</span>
              </span>
            </div>
            <MultiSelectCombobox
              id="topics"
              label=""
              placeholder="Select or add topics (you can select multiple)"
              options={meta.topics}
              values={formData.topics}
              onChange={handleTopicsChange}
            />
            {warnings.topics && warnings.topics.length > 0 && (
              <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>⚠️ New topic(s):</strong> {warnings.topics.map(t => `"${t}"`).join(', ')} {warnings.topics.length === 1 ? 'is' : 'are'} not in our database. Please verify {warnings.topics.length === 1 ? 'it doesn\'t' : 'they don\'t'} already exist with different spelling.
                </p>
              </div>
            )}
            {errors.topics && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.topics}</p>
            )}
          </div>

          {/* Resource Type */}
          <div className="mb-6">
            <label htmlFor="resourceType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Resource Type <span className="text-red-500">*</span>
            </label>
            <select
              id="resourceType"
              value={formData.resourceType}
              onChange={(e) => setFormData({ ...formData, resourceType: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a type</option>
              {Object.keys(meta.resourceTypes).map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
            {errors.resourceType && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.resourceType}</p>
            )}
          </div>

          {/* Industry */}
          <div className="mb-6">
            {isExistingCompany ? (
              <>
                <label htmlFor="industry" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Industry <span className="text-gray-500">(from existing company)</span>
                </label>
                <input
                  type="text"
                  id="industry"
                  value={formData.industry}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 cursor-not-allowed"
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Industry is automatically set from the existing company and cannot be changed
                </p>
              </>
            ) : (
              <>
                <Combobox
                  id="industry"
                  label="Industry"
                  placeholder="Select or enter an industry"
                  options={meta.industries}
                  value={formData.industry}
                  onChange={handleIndustryChange}
                  allowAddNew={true}
                />
                {warnings.industry && (
                  <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      <strong>⚠️ New industry:</strong> "{warnings.industry}" is not in our database. Please verify the name is correct and doesn't already exist with different spelling.
                    </p>
                  </div>
                )}
              </>
            )}
            {errors.industry && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.industry}</p>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 dark:border-gray-700 my-8"></div>

          {/* Contributor Name */}
          <div className="mb-6">
            <label htmlFor="contributorName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Your Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="contributorName"
              value={formData.contributorName}
              onChange={(e) => setFormData({ ...formData, contributorName: e.target.value })}
              placeholder="John Doe"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.contributorName && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.contributorName}</p>
            )}
          </div>

          {/* GitHub Username */}
          <div className="mb-6">
            <label htmlFor="githubUsername" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              GitHub Username <span className="text-gray-500">(optional)</span>
            </label>
            <input
              type="text"
              id="githubUsername"
              value={formData.githubUsername}
              onChange={(e) => setFormData({ ...formData, githubUsername: e.target.value })}
              placeholder="johndoe"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Providing your GitHub username allows us to credit you and notify you when your submission is reviewed
            </p>
            {errors.githubUsername && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.githubUsername}</p>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 dark:border-gray-700 my-8"></div>

          {/* Security Verification */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Security Verification <span className="text-red-500">*</span>
            </label>
            <Turnstile
              siteKey={TURNSTILE_SITE_KEY}
              onVerify={(token) => setTurnstileToken(token)}
              onError={() => setTurnstileToken(null)}
              onExpire={() => setTurnstileToken(null)}
            />
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Please verify you are human to submit your contribution
            </p>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{errors.submit}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-end">
            <Link
              href="/"
              className="px-6 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-center"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 rounded-lg text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: isSubmitting ? '#999' : '#42b983' }}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Resource'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ContributePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 py-16 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white"></div>
          <p className="mt-4 text-gray-700 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    }>
      <ContributeForm />
    </Suspense>
  );
}
