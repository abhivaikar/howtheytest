# Contribution Workflow Setup Guide

This guide explains how to set up the automated contribution workflow that allows users to submit resources via the website and automatically create GitHub pull requests.

## Overview

The contribution workflow consists of:
1. **Frontend Form** (`/contribute` page) - Collects resource submissions from users
2. **Netlify Serverless Function** - Validates submissions and creates GitHub PRs
3. **GitHub App** - Authenticates with GitHub to create PRs and manage the repository

## Prerequisites

- A Netlify account (free tier is sufficient)
- Access to the GitHub repository
- Ability to create a GitHub App

## Step 1: Create a GitHub App

1. Go to your GitHub repository settings
2. Navigate to **Settings** > **Developer settings** > **GitHub Apps** > **New GitHub App**

3. Configure the GitHub App with the following settings:

   **GitHub App name:** `howtheytest-contributor` (or any unique name)

   **Homepage URL:** `https://howtheytest.netlify.app` (or your domain)

   **Webhook:** Uncheck "Active" (we don't need webhooks)

   **Repository permissions:**
   - Contents: Read & Write
   - Pull requests: Read & Write
   - Issues: Read & Write (for assigning reviewers and adding labels)

   **Where can this GitHub App be installed:** Only on this account

4. Click **Create GitHub App**

5. After creation, note down the **App ID** (you'll see it at the top of the page)

6. Generate a **Private Key**:
   - Scroll down to the "Private keys" section
   - Click **Generate a private key**
   - A `.pem` file will be downloaded - keep this safe!

7. Install the GitHub App on your repository:
   - Click **Install App** in the left sidebar
   - Select your repository
   - Choose "Only select repositories" and select `howtheytest`
   - Click **Install**

8. Get the **Installation ID**:
   - After installation, look at the URL in your browser
   - It should look like: `https://github.com/settings/installations/XXXXXXXX`
   - The number `XXXXXXXX` is your Installation ID

## Step 2: Configure Netlify Environment Variables

1. Go to your Netlify dashboard
2. Select your site (or deploy it first if you haven't)
3. Navigate to **Site configuration** > **Environment variables**

4. Add the following environment variables:

   | Variable Name | Value | Description |
   |--------------|-------|-------------|
   | `GITHUB_APP_ID` | Your App ID from Step 1.5 | The GitHub App identifier |
   | `GITHUB_APP_PRIVATE_KEY` | Contents of the .pem file | The private key for authentication |
   | `GITHUB_APP_INSTALLATION_ID` | Installation ID from Step 1.8 | Links the app to your repository |
   | `REPO_OWNER` | `abhivaikar` | Your GitHub username |
   | `REPO_NAME` | `howtheytest` | Your repository name |
   | `REVIEWER_USERNAME` | `abhivaikar` | GitHub username to auto-assign PRs |

   **Important for GITHUB_APP_PRIVATE_KEY:**
   - Open the `.pem` file in a text editor
   - Copy the entire contents including `-----BEGIN RSA PRIVATE KEY-----` and `-----END RSA PRIVATE KEY-----`
   - Paste it as the value in Netlify
   - Netlify will automatically handle the newlines

5. Click **Save** for each variable

## Step 3: Deploy to Netlify

### Option A: Connect GitHub Repository

1. In Netlify dashboard, click **Add new site** > **Import an existing project**
2. Choose **GitHub** as your Git provider
3. Select the `howtheytest` repository
4. Configure build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `out`
5. Click **Deploy site**

### Option B: Manual Deploy via CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Initialize Netlify (from project root)
netlify init

# Deploy
netlify deploy --prod
```

## Step 4: Create GitHub Labels

To ensure PRs are properly labeled, create these labels in your repository:

1. Go to your repository on GitHub
2. Navigate to **Issues** > **Labels**
3. Create the following labels:
   - `contribution` (color: #0E8A16) - For all web submissions
   - `resource-addition` (color: #1D76DB) - For adding resources to existing companies
   - `new-company` (color: #FBCA04) - For new company additions

## Step 5: Test the Workflow

1. Visit your deployed site at `https://your-site.netlify.app/contribute`
2. Fill out the contribution form with test data
3. Submit the form
4. You should:
   - See a success message with a PR link
   - Find a new PR in your GitHub repository
   - See yourself assigned as a reviewer
   - See appropriate labels applied

## Troubleshooting

### "Failed to submit resource"

- Check Netlify function logs: **Site** > **Functions** > **submit-resource**
- Verify all environment variables are set correctly
- Ensure the GitHub App has the correct permissions

### "Authentication failed"

- Verify `GITHUB_APP_ID` and `GITHUB_APP_INSTALLATION_ID` are correct
- Check that `GITHUB_APP_PRIVATE_KEY` includes the full key with headers
- Ensure the GitHub App is installed on the repository

### PR creation fails

- Verify the app has "Contents: Read & Write" and "Pull requests: Read & Write" permissions
- Check that `REPO_OWNER` and `REPO_NAME` match your repository exactly

### Duplicate detection not working

- Ensure the company JSON files in `data/companies/` are valid
- Check that resource URLs are exactly the same (including trailing slashes)

## How It Works

1. **User submits form** on `/contribute` page
2. **Client-side validation** checks for required fields and valid formats
3. **Form data sent to** Netlify function at `/api/submit-resource`
4. **Server-side validation** re-checks all data
5. **Duplicate check** searches existing company data for the resource URL
6. **New branch created** with naming pattern `contribution/{company-slug}-{timestamp}`
7. **Company file updated** (or created) with new resource data
8. **Pull request created** with:
   - Descriptive title and body
   - Submitter attribution
   - GitHub username tag (if provided)
   - Auto-assigned reviewer
   - Appropriate labels
9. **Success response** returned with PR URL
10. **User sees confirmation** with link to their PR

## Security Considerations

- All validation happens both client-side and server-side
- URLs are validated for proper format
- GitHub usernames are validated against GitHub's username rules
- Duplicate resources are rejected
- Private key is stored securely in Netlify environment variables
- GitHub App has minimal required permissions

## Future Enhancements

- Email notifications to contributors when PR is merged
- Contributor leaderboard on the website
- Batch submission for multiple resources
- Preview of how the resource will appear before submission
- Integration with GitHub Discussions for community feedback

## Questions or Issues?

If you encounter any problems:
1. Check the Netlify function logs
2. Review the GitHub App permissions
3. Verify all environment variables
4. Create an issue in the repository
