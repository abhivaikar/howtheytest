// Helper function to create a slug from company name
function createSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Helper function to validate URL
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

// Helper function to validate GitHub username
function isValidGithubUsername(username) {
  if (!username) return true; // Optional field
  const githubUsernameRegex = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;
  return githubUsernameRegex.test(username);
}

// Helper function to create or update company data
function createCompanyData(existingData, formData) {
  if (existingData) {
    // Add new resource to existing company
    return {
      ...existingData,
      resources: [
        ...existingData.resources,
        {
          title: formData.resourceTitle,
          url: formData.resourceUrl,
          type: formData.resourceType,
          topics: formData.topics,
        },
      ],
    };
  } else {
    // Create new company
    const companyId = createSlug(formData.companyName);
    return {
      id: companyId,
      name: formData.companyName,
      industry: formData.industry,
      resources: [
        {
          title: formData.resourceTitle,
          url: formData.resourceUrl,
          type: formData.resourceType,
          topics: formData.topics,
        },
      ],
    };
  }
}

describe('Helper Functions', () => {
  describe('createSlug', () => {
    it('should convert company name to lowercase slug', () => {
      expect(createSlug('Google')).toBe('google');
      expect(createSlug('MICROSOFT')).toBe('microsoft');
    });

    it('should replace spaces with hyphens', () => {
      expect(createSlug('Meta Platforms')).toBe('meta-platforms');
      expect(createSlug('J.P. Morgan')).toBe('j-p-morgan');
    });

    it('should remove special characters', () => {
      expect(createSlug('AT&T')).toBe('at-t');
      expect(createSlug('Procter & Gamble')).toBe('procter-gamble');
    });

    it('should remove leading and trailing hyphens', () => {
      expect(createSlug('-Leading')).toBe('leading');
      expect(createSlug('Trailing-')).toBe('trailing');
      expect(createSlug('-Both-')).toBe('both');
    });

    it('should handle multiple consecutive special characters', () => {
      expect(createSlug('Company!!!Name')).toBe('company-name');
      expect(createSlug('Test###Company')).toBe('test-company');
    });

    it('should handle mixed special characters', () => {
      expect(createSlug('Company@#$%Name')).toBe('company-name');
    });
  });

  describe('isValidUrl', () => {
    it('should return true for valid HTTP URLs', () => {
      expect(isValidUrl('http://example.com')).toBe(true);
      expect(isValidUrl('http://www.example.com')).toBe(true);
    });

    it('should return true for valid HTTPS URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('https://www.example.com')).toBe(true);
    });

    it('should return true for URLs with paths', () => {
      expect(isValidUrl('https://example.com/path')).toBe(true);
      expect(isValidUrl('https://example.com/path/to/resource')).toBe(true);
    });

    it('should return true for URLs with query parameters', () => {
      expect(isValidUrl('https://example.com?param=value')).toBe(true);
      expect(isValidUrl('https://example.com/path?param1=value1&param2=value2')).toBe(true);
    });

    it('should return false for invalid URLs', () => {
      expect(isValidUrl('not a url')).toBe(false);
      expect(isValidUrl('example.com')).toBe(false);
      expect(isValidUrl('')).toBe(false);
    });

    it('should return false for malformed URLs', () => {
      expect(isValidUrl('http://')).toBe(false);
      expect(isValidUrl('https://')).toBe(false);
    });
  });

  describe('isValidGithubUsername', () => {
    it('should return true for valid GitHub usernames', () => {
      expect(isValidGithubUsername('octocat')).toBe(true);
      expect(isValidGithubUsername('github-user')).toBe(true);
      expect(isValidGithubUsername('user123')).toBe(true);
    });

    it('should return true for empty/null username (optional field)', () => {
      expect(isValidGithubUsername('')).toBe(true);
      expect(isValidGithubUsername(null)).toBe(true);
      expect(isValidGithubUsername(undefined)).toBe(true);
    });

    it('should return false for usernames starting with hyphen', () => {
      expect(isValidGithubUsername('-invalid')).toBe(false);
    });

    it('should return false for usernames ending with hyphen', () => {
      expect(isValidGithubUsername('invalid-')).toBe(false);
    });

    it('should return false for usernames with consecutive hyphens', () => {
      expect(isValidGithubUsername('invalid--username')).toBe(false);
    });

    it('should return false for usernames with special characters', () => {
      expect(isValidGithubUsername('user@name')).toBe(false);
      expect(isValidGithubUsername('user.name')).toBe(false);
      expect(isValidGithubUsername('user_name')).toBe(false);
    });

    it('should return false for usernames longer than 39 characters', () => {
      expect(isValidGithubUsername('a'.repeat(40))).toBe(false);
    });

    it('should return true for usernames with exactly 39 characters', () => {
      expect(isValidGithubUsername('a'.repeat(39))).toBe(true);
    });
  });

  describe('createCompanyData', () => {
    const mockFormData = {
      companyName: 'Test Company',
      resourceTitle: 'Test Resource',
      resourceUrl: 'https://example.com',
      resourceType: 'blog',
      topics: ['testing', 'qa'],
      industry: 'Technology',
    };

    it('should create new company data when existingData is null', () => {
      const result = createCompanyData(null, mockFormData);

      expect(result).toEqual({
        id: 'test-company',
        name: 'Test Company',
        industry: 'Technology',
        resources: [
          {
            title: 'Test Resource',
            url: 'https://example.com',
            type: 'blog',
            topics: ['testing', 'qa'],
          },
        ],
      });
    });

    it('should add resource to existing company data', () => {
      const existingData = {
        id: 'test-company',
        name: 'Test Company',
        industry: 'Technology',
        resources: [
          {
            title: 'Existing Resource',
            url: 'https://existing.com',
            type: 'blog',
            topics: ['existing'],
          },
        ],
      };

      const result = createCompanyData(existingData, mockFormData);

      expect(result.resources).toHaveLength(2);
      expect(result.resources[0]).toEqual({
        title: 'Existing Resource',
        url: 'https://existing.com',
        type: 'blog',
        topics: ['existing'],
      });
      expect(result.resources[1]).toEqual({
        title: 'Test Resource',
        url: 'https://example.com',
        type: 'blog',
        topics: ['testing', 'qa'],
      });
    });

    it('should preserve existing company properties when adding resource', () => {
      const existingData = {
        id: 'test-company',
        name: 'Test Company',
        industry: 'Technology',
        resources: [],
      };

      const result = createCompanyData(existingData, mockFormData);

      expect(result.id).toBe('test-company');
      expect(result.name).toBe('Test Company');
      expect(result.industry).toBe('Technology');
    });

    it('should handle multiple topics', () => {
      const formDataWithMultipleTopics = {
        ...mockFormData,
        topics: ['testing', 'qa', 'automation', 'ci-cd'],
      };

      const result = createCompanyData(null, formDataWithMultipleTopics);

      expect(result.resources[0].topics).toEqual(['testing', 'qa', 'automation', 'ci-cd']);
    });
  });
});
