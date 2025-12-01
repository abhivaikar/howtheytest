# Deployment Options for How They Test

This document explains the different ways to deploy your site and contribution workflow.

## Architecture Overview

The site consists of two parts:
1. **Static Site** - Next.js pages, components, and assets (no server required)
2. **Serverless Function** - Handles contribution form submissions (requires server)

## Option 1: GitHub Pages (Static) + Netlify (Function) ✨ RECOMMENDED

Perfect if you want to keep your static site on GitHub Pages but need serverless functions.

### Setup Steps:

#### 1. Deploy Static Site to GitHub Pages

```bash
# Build the static site
npm run build

# The static files are in the 'out' directory
```

Configure GitHub Pages:
- Go to repository Settings → Pages
- Source: Deploy from branch
- Branch: `master` (or main)
- Folder: `/out` or `/root` (configure via GitHub Actions if needed)

#### 2. Deploy Serverless Function to Netlify

Create a **separate** Netlify site just for the API:

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Create new site
netlify init

# Deploy
netlify deploy --prod
```

You'll get a URL like: `https://howtheytest-api.netlify.app`

#### 3. Configure Environment Variables

**On Netlify** (for the function):
- Go to Site Settings → Environment Variables
- Add all variables from `.env.example` except `NEXT_PUBLIC_API_URL`

**For your build** (GitHub Pages):
Create `.env.production` in your repo:
```bash
NEXT_PUBLIC_API_URL=https://howtheytest-api.netlify.app/.netlify/functions/submit-resource
```

Rebuild and redeploy:
```bash
npm run build
# Commit the new build or configure GitHub Actions
```

### Pros:
✅ Free hosting on GitHub Pages
✅ Serverless function on Netlify
✅ No vendor lock-in
✅ Separate scaling for static vs dynamic

### Cons:
❌ Requires managing two deployments
❌ Need to set up CORS (already configured)

---

## Option 2: Full Netlify Deployment

Host everything on Netlify - both static site and function.

### Setup Steps:

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login and init
netlify login
netlify init

# Deploy
netlify deploy --prod
```

Configure environment variables in Netlify:
- All variables from `.env.example`
- **DO NOT** set `NEXT_PUBLIC_API_URL` (function is on same domain)

### Pros:
✅ Single deployment
✅ No CORS issues
✅ Automatic builds on git push
✅ Preview deployments for PRs
✅ Built-in form detection

### Cons:
❌ Not using GitHub Pages
❌ Slightly more complex initial setup

---

## Option 3: GitHub Pages Only (No Contribution Form)

If you don't need the contribution workflow.

### Setup Steps:

```bash
npm run build
```

Configure GitHub Pages to serve from `/out` directory.

Remove or hide the contribution form:
- Delete `/app/contribute/page.tsx`
- Remove "Contribute" button from homepage

### Pros:
✅ Simplest setup
✅ Free hosting
✅ Fast CDN delivery

### Cons:
❌ No contribution form
❌ Manual PR creation only

---

## Option 4: Vercel Deployment

Alternative to Netlify with similar features.

### Setup Steps:

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

You'll need to convert `netlify/functions/submit-resource.js` to Vercel's format:
- Move to `/api/submit-resource.js`
- Adjust function signature for Vercel

### Pros:
✅ Excellent Next.js integration
✅ Automatic deployments
✅ Edge functions

### Cons:
❌ Need to modify serverless function
❌ Different configuration format

---

## Comparison Table

| Feature | GitHub Pages + Netlify | Full Netlify | GitHub Pages Only | Vercel |
|---------|------------------------|--------------|-------------------|--------|
| **Cost** | Free | Free | Free | Free |
| **Static Site** | ✅ GitHub | ✅ Netlify | ✅ GitHub | ✅ Vercel |
| **Serverless** | ✅ Netlify | ✅ Netlify | ❌ None | ✅ Vercel |
| **CORS Setup** | Required | Not needed | N/A | Not needed |
| **Complexity** | Medium | Low | Very Low | Medium |
| **Auto Deploy** | Partial | Yes | Yes | Yes |

---

## Current Configuration

Your repository is already configured for **Option 1** (GitHub Pages + Netlify):

- ✅ `NEXT_PUBLIC_API_URL` support in form
- ✅ CORS headers in Netlify function
- ✅ `output: 'export'` for static build
- ✅ `netlify.toml` configured

Just need to:
1. Deploy function to Netlify
2. Set `NEXT_PUBLIC_API_URL` environment variable
3. Rebuild static site

---

## Testing Your Deployment

After deployment, test the contribution form:

1. Visit `/contribute` on your site
2. Fill out the form
3. Submit
4. Verify:
   - No CORS errors in console
   - PR created in GitHub
   - Success message with PR link

---

## Need Help?

- Netlify Functions: https://docs.netlify.com/functions/overview/
- GitHub Pages: https://docs.github.com/en/pages
- CORS Issues: Check browser console for errors
- Environment Variables: See `.env.example`
