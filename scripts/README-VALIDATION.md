# Resource Validation

This directory contains scripts for validating resource URLs in the How They Test database.

## Overview

The validation system checks all resource URLs to ensure they:
- Return valid HTTP responses (not 404, 403, 500)
- Are not behind login walls
- Contain content matching the resource title/topic
- Load successfully without timeouts or SSL errors

## Running Validation

### Locally

1. Install dependencies:
```bash
npm install
npx playwright install chromium
```

2. Run the validation:
```bash
# Full validation (headless)
npm run validate:resources

# With visible browser (headed mode)
npm run validate:resources:headed

# Debug mode (headed, first 5 companies only)
npm run validate:resources:debug

# Custom limit
node scripts/validate-resources.mjs --limit 10
```

3. Open the generated report:
```bash
open validation-report/index.html
```

The validation generates:
- `validation-report/index.html` - Interactive HTML report with screenshots
- `validation-report/failures.json` - JSON export of failures and warnings

### Via GitHub Actions

1. Go to the repository's Actions tab
2. Select "Validate Resources" workflow
3. Click "Run workflow"
4. Wait for completion (may take 10-30 minutes depending on resource count)
5. Download the validation report from the workflow artifacts

## How It Works

### Validation Process

1. **Browser Launch**: Single Chromium browser instance is launched once
2. **For Each Resource**:
   - **Page Load**: Open new browser tab and load the page with Playwright
     - Waits for page 'load' event (all resources like images, stylesheets loaded)
     - Additional 3-second wait for JavaScript-heavy content to render (React, Vue, etc.)
   - **Content Analysis**:
     - Detect login walls (password fields, signin text)
     - Detect error pages (404, 403, 500 patterns)
     - Extract keywords from resource title and URL
     - Match page content against keywords
   - **Screenshot**: Capture compressed JPEG screenshot
   - **Close Tab**: Close the page/tab (browser stays open)
3. **Report**: Generate HTML report with all findings
4. **Browser Close**: Close the browser after all validations complete

**Note**: The browser instance remains open throughout all validations. Only individual pages (tabs) are opened and closed for each resource. This is more efficient than launching a new browser for each resource. All validation is done using Playwright's browser automation - no separate HTTP checks are performed.

### Issue Types

- **http-error**: HTTP status >= 400 (404, 403, 500, etc.)
- **timeout**: Page failed to load within 30 seconds
- **login-wall**: Page appears to require authentication
- **page-not-found**: Page contains 404/error text
- **content-mismatch**: Page content doesn't match resource title/URL keywords
- **ssl-error**: SSL/certificate errors

### Validation Rules

**Failures** (require action):
- HTTP errors (404, 403, 500)
- Login walls
- Page not found
- Timeouts
- SSL errors

**Warnings** (review recommended):
- Content mismatch (< 30% keyword match)

**Valid**:
- Everything else
- Redirects are allowed as long as the final page loads successfully and contains expected content

## Configuration

### Command-Line Options

```bash
# Run with visible browser
--headed

# Limit number of companies (for debugging)
--limit <number>
```

Example:
```bash
node scripts/validate-resources.mjs --headed --limit 5
```

### Script Configuration

Edit `scripts/validate-resources.mjs` to customize:

```javascript
const CONFIG = {
  timeout: 30000,           // Page load timeout (ms)
  screenshotQuality: 50,    // JPEG quality 0-100
  concurrency: 1,           // Parallel checks (set to 1 to avoid rate limiting)
  userAgent: '...',         // User agent string
};
```

## Report Format

### HTML Report (`validation-report/index.html`)

The interactive HTML report includes:
- Summary statistics (total, valid, warnings, failures)
- Clickable filter cards to show/hide resources by status
- Company grouping with expand/collapse functionality
- Issues grouped by type
- For each resource:
  - Company name and resource details
  - Original URL and final URL (after redirects)
  - Page title
  - Screenshot thumbnail (click to enlarge)
  - Issue description

### JSON Export (`validation-report/failures.json`)

The JSON export includes all failures and warnings for programmatic processing:

```json
{
  "generatedAt": "2025-12-03T10:30:00.000Z",
  "summary": {
    "total": 150,
    "valid": 120,
    "warnings": 20,
    "failures": 10
  },
  "failures": [
    {
      "company": "Company Name",
      "title": "Resource Title",
      "url": "https://example.com/resource",
      "type": "blog",
      "status": "failure",
      "httpStatus": 404,
      "finalUrl": "https://example.com/404",
      "pageTitle": "Page Not Found",
      "issues": [
        {
          "type": "page-not-found",
          "message": "Page appears to be an error page (404/403/500)"
        }
      ]
    }
  ]
}
```

Use this JSON export to:
- Automate issue tracking (create GitHub issues, Jira tickets, etc.)
- Track validation trends over time
- Generate custom reports
- Feed into CI/CD pipelines

## Troubleshooting

### Playwright not installed
```bash
npx playwright install chromium
```

### Out of memory errors
Reduce `concurrency` in CONFIG to 3 or fewer.

### Many false positives for content-mismatch
- Check if resource titles are too generic
- Adjust keyword matching threshold (currently 30%)
- Consider paywalls showing preview text

### Script timing out
- Increase `timeout` in CONFIG
- Check your internet connection
- Some sites may be slow or blocking automation

## Best Practices

1. **Run periodically**: URLs can break over time
2. **Review warnings**: Content mismatches may indicate moved/changed content
3. **Manual verification**: Screenshots help verify automated decisions
4. **Update database**: Remove or fix invalid resources

## Future Improvements

Potential enhancements:
- [ ] Store historical validation results
- [ ] Email notifications for failures
- [ ] Retry logic for transient failures
- [ ] Per-domain rate limiting
- [ ] Custom validation rules per resource type
- [ ] Diff detection (compare content over time)
