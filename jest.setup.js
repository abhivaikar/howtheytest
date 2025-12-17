// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock environment variables for tests
process.env.NEXT_PUBLIC_API_URL = 'https://test.netlify.app/.netlify/functions/submit-resource'
process.env.GITHUB_APP_ID = 'test-app-id'
process.env.GITHUB_APP_INSTALLATION_ID = 'test-installation-id'
process.env.GITHUB_APP_PRIVATE_KEY = 'test-key'
process.env.REPO_OWNER = 'test-owner'
process.env.REPO_NAME = 'test-repo'
process.env.REVIEWER_USERNAME = 'test-reviewer'
