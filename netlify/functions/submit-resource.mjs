import { Octokit } from '@octokit/rest';
import { createAppAuth } from '@octokit/auth-app';
import crypto from 'crypto';

// Environment variables required:
// - GITHUB_APP_ID
// - GITHUB_APP_PRIVATE_KEY
// - GITHUB_APP_INSTALLATION_ID
// - REPO_OWNER (e.g., "abhivaikar")
// - REPO_NAME (e.g., "howtheytest")
// - REVIEWER_USERNAME (e.g., "abhivaikar")
// - TURNSTILE_SECRET_KEY (Cloudflare Turnstile secret key)
// - ALLOWED_ORIGINS (comma-separated list of allowed origins)

const REPO_OWNER = process.env.REPO_OWNER || 'abhivaikar';
const REPO_NAME = process.env.REPO_NAME || 'howtheytest';
const REVIEWER_USERNAME = process.env.REVIEWER_USERNAME || 'abhivaikar';
const BASE_BRANCH = 'master';

// Security configuration
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['https://abhivaikar.github.io', 'http://localhost:3000'];

// Helper function to verify Cloudflare Turnstile token
async function verifyTurnstile(token) {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  if (!secretKey) {
    console.warn('TURNSTILE_SECRET_KEY not configured, skipping verification');
    return true; // Allow if not configured (for development)
  }

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: secretKey,
        response: token,
      }),
    });

    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Turnstile verification error:', error);
    return false;
  }
}

// Helper function to create a slug from company name
function createSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Helper function to generate a unique resource ID (matches migration script logic)
function generateResourceId(title, url) {
  const content = `${title}:${url}`;
  const hash = crypto.createHash('md5').update(content).digest('hex').substring(0, 8);
  const slug = title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[-\s]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 40);
  return `${slug}-${hash}`;
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

// Helper function to check for duplicate resources
async function checkDuplicate(octokit, resourceUrl, companySlug) {
  try {
    // Try to get the company file
    const { data: fileData } = await octokit.repos.getContent({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: `data/companies/${companySlug}.json`,
      ref: BASE_BRANCH,
    });

    // Decode the file content
    const content = Buffer.from(fileData.content, 'base64').toString('utf-8');
    const companyData = JSON.parse(content);

    // Check if the URL already exists
    const isDuplicate = companyData.resources.some(
      (resource) => resource.url === resourceUrl
    );

    return { isDuplicate, existingData: companyData, sha: fileData.sha };
  } catch (error) {
    if (error.status === 404) {
      // Company doesn't exist yet
      return { isDuplicate: false, existingData: null, sha: null };
    }
    throw error;
  }
}

// Helper function to create or update company data
function createCompanyData(existingData, formData) {
  const resourceId = generateResourceId(formData.resourceTitle, formData.resourceUrl);
  // Set addedDate to current date in YYYY-MM-DD format
  const addedDate = new Date().toISOString().split('T')[0];

  if (existingData) {
    // Add new resource to existing company
    return {
      ...existingData,
      resources: [
        ...existingData.resources,
        {
          id: resourceId,
          title: formData.resourceTitle,
          url: formData.resourceUrl,
          type: formData.resourceType,
          topics: formData.topics,
          addedDate: addedDate,
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
          id: resourceId,
          title: formData.resourceTitle,
          url: formData.resourceUrl,
          type: formData.resourceType,
          topics: formData.topics,
          addedDate: addedDate,
        },
      ],
    };
  }
}

export const handler = async (event) => {
  // Origin validation
  const origin = event.headers.origin || event.headers.Origin || '';
  const isAllowedOrigin = ALLOWED_ORIGINS.includes(origin);

  // CORS headers - only allow requests from allowed origins
  const headers = {
    'Access-Control-Allow-Origin': isAllowedOrigin ? origin : '',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  // Check origin for actual requests
  if (!isAllowedOrigin) {
    return {
      statusCode: 403,
      headers,
      body: JSON.stringify({ error: 'Origin not allowed' }),
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Parse request body
    const formData = JSON.parse(event.body);

    // Verify Turnstile token
    if (!formData.turnstileToken) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Security verification failed. Please refresh and try again.' }),
      };
    }

    const isTurnstileValid = await verifyTurnstile(formData.turnstileToken);
    if (!isTurnstileValid) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Security verification failed. Please try again.' }),
      };
    }

    // Validate required fields
    const requiredFields = [
      'companyName',
      'resourceUrl',
      'resourceTitle',
      'resourceType',
      'industry',
      'contributorName',
    ];

    for (const field of requiredFields) {
      if (!formData[field] || !formData[field].trim()) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: `${field} is required` }),
        };
      }
    }

    // Validate topics array
    if (!formData.topics || !Array.isArray(formData.topics) || formData.topics.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'At least one topic is required' }),
      };
    }

    // Validate URL format
    if (!isValidUrl(formData.resourceUrl)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid resource URL' }),
      };
    }

    // Validate GitHub username if provided
    if (formData.githubUsername && !isValidGithubUsername(formData.githubUsername)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid GitHub username' }),
      };
    }

    // Initialize Octokit with GitHub App authentication
    // Handle private key format - replace literal \n with actual newlines
    const privateKey = process.env.GITHUB_APP_PRIVATE_KEY.replace(/\\n/g, '\n');

    const octokit = new Octokit({
      authStrategy: createAppAuth,
      auth: {
        appId: process.env.GITHUB_APP_ID,
        privateKey: privateKey,
        installationId: process.env.GITHUB_APP_INSTALLATION_ID,
      },
    });

    // Create company slug
    const companySlug = createSlug(formData.companyName);

    // Check for duplicate resource
    const { isDuplicate, existingData, sha } = await checkDuplicate(
      octokit,
      formData.resourceUrl,
      companySlug
    );

    if (isDuplicate) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'This resource already exists in our database' }),
      };
    }

    // Create or update company data
    const companyData = createCompanyData(existingData, formData);

    // Create a new branch
    const timestamp = Date.now();
    const branchName = `contribution/${companySlug}-${timestamp}`;

    // Get the reference to the base branch
    const { data: ref } = await octokit.git.getRef({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      ref: `heads/${BASE_BRANCH}`,
    });

    // Create a new branch from the base branch
    await octokit.git.createRef({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      ref: `refs/heads/${branchName}`,
      sha: ref.object.sha,
    });

    // Create or update the company file
    const filePath = `data/companies/${companySlug}.json`;
    const fileContent = JSON.stringify(companyData, null, 2);

    // Build commit message with co-author if GitHub username provided
    let commitMessage = existingData
      ? `Add resource to ${formData.companyName}`
      : `Add new company: ${formData.companyName}`;

    // Add co-author trailer if GitHub username is provided
    if (formData.githubUsername) {
      commitMessage += `\n\nCo-authored-by: ${formData.githubUsername} <${formData.githubUsername}@users.noreply.github.com>`;
    }

    await octokit.repos.createOrUpdateFileContents({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: filePath,
      message: commitMessage,
      content: Buffer.from(fileContent).toString('base64'),
      branch: branchName,
      ...(sha && { sha }), // Include sha if updating existing file
    });

    // Create PR title and body
    const prTitle = existingData
      ? `Add resource to ${formData.companyName}`
      : `Add new company: ${formData.companyName}`;

    const submitterInfo = formData.githubUsername
      ? `@${formData.githubUsername}`
      : formData.contributorName;

    const prBody = `## Contribution Details

**Company:** ${formData.companyName}
**Industry:** ${formData.industry}
**Resource Type:** ${formData.resourceType}
**Topics:** ${formData.topics.join(', ')}

### Resource Information
- **Title:** ${formData.resourceTitle}
- **URL:** ${formData.resourceUrl}

### Submitted By
${submitterInfo}

---

This contribution was submitted via the How They Test website.${
      formData.githubUsername ? `\n\ncc ${submitterInfo}` : ''
    }`;

    // Create pull request
    const { data: pr } = await octokit.pulls.create({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      title: prTitle,
      body: prBody,
      head: branchName,
      base: BASE_BRANCH,
    });

    // Assign reviewer
    await octokit.issues.addAssignees({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      issue_number: pr.number,
      assignees: [REVIEWER_USERNAME],
    });

    // Add labels
    const labels = existingData ? ['contribution', 'resource-addition'] : ['contribution', 'new-company'];
    await octokit.issues.addLabels({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      issue_number: pr.number,
      labels,
    });

    // Return success response with PR URL
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        prUrl: pr.html_url,
        prNumber: pr.number,
      }),
    };
  } catch (error) {
    console.error('Error creating PR:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to submit resource. Please try again later.',
        details: error.message,
      }),
    };
  }
};
