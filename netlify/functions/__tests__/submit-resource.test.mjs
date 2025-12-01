import { jest } from '@jest/globals';

// Mock Octokit before importing the handler
const mockOctokit = {
  repos: {
    getContent: jest.fn(),
    createOrUpdateFileContents: jest.fn(),
  },
  git: {
    getRef: jest.fn(),
    createRef: jest.fn(),
  },
  pulls: {
    create: jest.fn(),
  },
  issues: {
    addAssignees: jest.fn(),
    addLabels: jest.fn(),
  },
};

jest.unstable_mockModule('@octokit/rest', () => ({
  Octokit: jest.fn(() => mockOctokit),
}));

jest.unstable_mockModule('@octokit/auth-app', () => ({
  createAppAuth: jest.fn(),
}));

// Import handler after mocking
const { handler } = await import('../submit-resource.mjs');

describe('Submit Resource Serverless Function', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Set up environment variables
    process.env.GITHUB_APP_ID = 'test-app-id';
    process.env.GITHUB_APP_PRIVATE_KEY = 'test-private-key';
    process.env.GITHUB_APP_INSTALLATION_ID = 'test-installation-id';
    process.env.REPO_OWNER = 'test-owner';
    process.env.REPO_NAME = 'test-repo';
    process.env.REVIEWER_USERNAME = 'test-reviewer';
  });

  describe('HTTP Method Validation', () => {
    it('should return 200 for OPTIONS request (CORS preflight)', async () => {
      const event = {
        httpMethod: 'OPTIONS',
        body: '',
      };

      const response = await handler(event);

      expect(response.statusCode).toBe(200);
      expect(response.headers['Access-Control-Allow-Origin']).toBe('*');
      expect(response.headers['Access-Control-Allow-Methods']).toBe('POST, OPTIONS');
    });

    it('should return 405 for non-POST requests', async () => {
      const event = {
        httpMethod: 'GET',
        body: '',
      };

      const response = await handler(event);

      expect(response.statusCode).toBe(405);
      expect(JSON.parse(response.body).error).toBe('Method not allowed');
    });
  });

  describe('Request Validation', () => {
    const validFormData = {
      companyName: 'Test Company',
      resourceUrl: 'https://example.com/resource',
      resourceTitle: 'Test Resource',
      resourceType: 'blog',
      industry: 'Technology',
      contributorName: 'John Doe',
      topics: ['testing', 'qa'],
    };

    it('should return 400 when required field is missing', async () => {
      const event = {
        httpMethod: 'POST',
        body: JSON.stringify({
          ...validFormData,
          companyName: '',
        }),
      };

      const response = await handler(event);

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body).error).toBe('companyName is required');
    });

    it('should return 400 when topics array is empty', async () => {
      const event = {
        httpMethod: 'POST',
        body: JSON.stringify({
          ...validFormData,
          topics: [],
        }),
      };

      const response = await handler(event);

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body).error).toBe('At least one topic is required');
    });

    it('should return 400 when topics is not an array', async () => {
      const event = {
        httpMethod: 'POST',
        body: JSON.stringify({
          ...validFormData,
          topics: 'not-an-array',
        }),
      };

      const response = await handler(event);

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body).error).toBe('At least one topic is required');
    });

    it('should return 400 for invalid resource URL', async () => {
      const event = {
        httpMethod: 'POST',
        body: JSON.stringify({
          ...validFormData,
          resourceUrl: 'not-a-valid-url',
        }),
      };

      const response = await handler(event);

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body).error).toBe('Invalid resource URL');
    });

    it('should return 400 for invalid GitHub username', async () => {
      const event = {
        httpMethod: 'POST',
        body: JSON.stringify({
          ...validFormData,
          githubUsername: 'invalid@username',
        }),
      };

      const response = await handler(event);

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body).error).toBe('Invalid GitHub username');
    });

    it('should accept valid GitHub username', async () => {
      // Mock successful GitHub API responses
      mockOctokit.repos.getContent.mockRejectedValue({ status: 404 });
      mockOctokit.git.getRef.mockResolvedValue({
        data: { object: { sha: 'test-sha' } },
      });
      mockOctokit.git.createRef.mockResolvedValue({});
      mockOctokit.repos.createOrUpdateFileContents.mockResolvedValue({});
      mockOctokit.pulls.create.mockResolvedValue({
        data: { number: 123, html_url: 'https://github.com/test/test/pull/123' },
      });
      mockOctokit.issues.addAssignees.mockResolvedValue({});
      mockOctokit.issues.addLabels.mockResolvedValue({});

      const event = {
        httpMethod: 'POST',
        body: JSON.stringify({
          ...validFormData,
          githubUsername: 'validuser',
        }),
      };

      const response = await handler(event);

      expect(response.statusCode).toBe(200);
    });
  });

  describe('Duplicate Detection', () => {
    const validFormData = {
      companyName: 'Test Company',
      resourceUrl: 'https://example.com/resource',
      resourceTitle: 'Test Resource',
      resourceType: 'blog',
      industry: 'Technology',
      contributorName: 'John Doe',
      topics: ['testing', 'qa'],
    };

    it('should return 400 when resource URL already exists', async () => {
      const existingCompanyData = {
        id: 'test-company',
        name: 'Test Company',
        industry: 'Technology',
        resources: [
          {
            title: 'Existing Resource',
            url: 'https://example.com/resource',
            type: 'blog',
            topics: ['testing'],
          },
        ],
      };

      mockOctokit.repos.getContent.mockResolvedValue({
        data: {
          content: Buffer.from(JSON.stringify(existingCompanyData)).toString('base64'),
          sha: 'test-sha',
        },
      });

      const event = {
        httpMethod: 'POST',
        body: JSON.stringify(validFormData),
      };

      const response = await handler(event);

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body).error).toBe('This resource already exists in our database');
    });

    it('should allow adding different resource to existing company', async () => {
      const existingCompanyData = {
        id: 'test-company',
        name: 'Test Company',
        industry: 'Technology',
        resources: [
          {
            title: 'Existing Resource',
            url: 'https://example.com/different-resource',
            type: 'blog',
            topics: ['testing'],
          },
        ],
      };

      mockOctokit.repos.getContent.mockResolvedValue({
        data: {
          content: Buffer.from(JSON.stringify(existingCompanyData)).toString('base64'),
          sha: 'test-sha',
        },
      });
      mockOctokit.git.getRef.mockResolvedValue({
        data: { object: { sha: 'test-sha' } },
      });
      mockOctokit.git.createRef.mockResolvedValue({});
      mockOctokit.repos.createOrUpdateFileContents.mockResolvedValue({});
      mockOctokit.pulls.create.mockResolvedValue({
        data: { number: 123, html_url: 'https://github.com/test/test/pull/123' },
      });
      mockOctokit.issues.addAssignees.mockResolvedValue({});
      mockOctokit.issues.addLabels.mockResolvedValue({});

      const event = {
        httpMethod: 'POST',
        body: JSON.stringify(validFormData),
      };

      const response = await handler(event);

      expect(response.statusCode).toBe(200);
    });
  });

  describe('Pull Request Creation', () => {
    const validFormData = {
      companyName: 'Test Company',
      resourceUrl: 'https://example.com/resource',
      resourceTitle: 'Test Resource',
      resourceType: 'blog',
      industry: 'Technology',
      contributorName: 'John Doe',
      topics: ['testing', 'qa'],
    };

    beforeEach(() => {
      mockOctokit.repos.getContent.mockRejectedValue({ status: 404 });
      mockOctokit.git.getRef.mockResolvedValue({
        data: { object: { sha: 'test-sha' } },
      });
      mockOctokit.git.createRef.mockResolvedValue({});
      mockOctokit.repos.createOrUpdateFileContents.mockResolvedValue({});
      mockOctokit.pulls.create.mockResolvedValue({
        data: { number: 123, html_url: 'https://github.com/test/test/pull/123' },
      });
      mockOctokit.issues.addAssignees.mockResolvedValue({});
      mockOctokit.issues.addLabels.mockResolvedValue({});
    });

    it('should create PR for new company', async () => {
      const event = {
        httpMethod: 'POST',
        body: JSON.stringify(validFormData),
      };

      const response = await handler(event);

      expect(response.statusCode).toBe(200);
      const responseBody = JSON.parse(response.body);
      expect(responseBody.success).toBe(true);
      expect(responseBody.prUrl).toBe('https://github.com/test/test/pull/123');
      expect(responseBody.prNumber).toBe(123);
    });

    it('should create branch with correct naming', async () => {
      const event = {
        httpMethod: 'POST',
        body: JSON.stringify(validFormData),
      };

      await handler(event);

      expect(mockOctokit.git.createRef).toHaveBeenCalledWith(
        expect.objectContaining({
          owner: 'test-owner',
          repo: 'test-repo',
          ref: expect.stringMatching(/^refs\/heads\/contribution\/test-company-\d+$/),
        })
      );
    });

    it('should assign reviewer to PR', async () => {
      const event = {
        httpMethod: 'POST',
        body: JSON.stringify(validFormData),
      };

      await handler(event);

      expect(mockOctokit.issues.addAssignees).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        issue_number: 123,
        assignees: ['test-reviewer'],
      });
    });

    it('should add "new-company" label for new company', async () => {
      const event = {
        httpMethod: 'POST',
        body: JSON.stringify(validFormData),
      };

      await handler(event);

      expect(mockOctokit.issues.addLabels).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        issue_number: 123,
        labels: ['contribution', 'new-company'],
      });
    });

    it('should add "resource-addition" label for existing company', async () => {
      const existingCompanyData = {
        id: 'test-company',
        name: 'Test Company',
        industry: 'Technology',
        resources: [
          {
            title: 'Existing Resource',
            url: 'https://example.com/different-resource',
            type: 'blog',
            topics: ['testing'],
          },
        ],
      };

      mockOctokit.repos.getContent.mockResolvedValue({
        data: {
          content: Buffer.from(JSON.stringify(existingCompanyData)).toString('base64'),
          sha: 'test-sha',
        },
      });

      const event = {
        httpMethod: 'POST',
        body: JSON.stringify(validFormData),
      };

      await handler(event);

      expect(mockOctokit.issues.addLabels).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        issue_number: 123,
        labels: ['contribution', 'resource-addition'],
      });
    });

    it('should include GitHub username in PR body when provided', async () => {
      const event = {
        httpMethod: 'POST',
        body: JSON.stringify({
          ...validFormData,
          githubUsername: 'testuser',
        }),
      };

      await handler(event);

      const createPullCall = mockOctokit.pulls.create.mock.calls[0][0];
      expect(createPullCall.body).toContain('@testuser');
      expect(createPullCall.body).toContain('cc @testuser');
    });

    it('should use contributor name when GitHub username not provided', async () => {
      const event = {
        httpMethod: 'POST',
        body: JSON.stringify(validFormData),
      };

      await handler(event);

      const createPullCall = mockOctokit.pulls.create.mock.calls[0][0];
      expect(createPullCall.body).toContain('John Doe');
      expect(createPullCall.body).not.toContain('cc ');
    });
  });

  describe('Error Handling', () => {
    const validFormData = {
      companyName: 'Test Company',
      resourceUrl: 'https://example.com/resource',
      resourceTitle: 'Test Resource',
      resourceType: 'blog',
      industry: 'Technology',
      contributorName: 'John Doe',
      topics: ['testing', 'qa'],
    };

    it('should return 500 when GitHub API fails', async () => {
      mockOctokit.repos.getContent.mockRejectedValue(new Error('GitHub API error'));

      const event = {
        httpMethod: 'POST',
        body: JSON.stringify(validFormData),
      };

      const response = await handler(event);

      expect(response.statusCode).toBe(500);
      const responseBody = JSON.parse(response.body);
      expect(responseBody.error).toBe('Failed to submit resource. Please try again later.');
      expect(responseBody.details).toBe('GitHub API error');
    });

    it('should return 500 when request body is invalid JSON', async () => {
      const event = {
        httpMethod: 'POST',
        body: 'invalid json',
      };

      const response = await handler(event);

      expect(response.statusCode).toBe(500);
    });
  });

  describe('CORS Headers', () => {
    it('should include CORS headers in all responses', async () => {
      const event = {
        httpMethod: 'POST',
        body: JSON.stringify({
          companyName: 'Test Company',
          resourceUrl: 'not-a-url',
          resourceTitle: 'Test',
          resourceType: 'blog',
          industry: 'Tech',
          contributorName: 'Test',
          topics: ['test'],
        }),
      };

      const response = await handler(event);

      expect(response.headers['Access-Control-Allow-Origin']).toBe('*');
      expect(response.headers['Access-Control-Allow-Headers']).toBe('Content-Type');
      expect(response.headers['Access-Control-Allow-Methods']).toBe('POST, OPTIONS');
    });
  });
});
