#!/usr/bin/env node

import { chromium } from 'playwright';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');

// Parse command-line arguments
const args = process.argv.slice(2);
const isHeaded = args.includes('--headed');
const limitIndex = args.indexOf('--limit');
const companyLimit = limitIndex !== -1 && args[limitIndex + 1] ? parseInt(args[limitIndex + 1]) : null;

// Configuration
const CONFIG = {
  timeout: 30000, // 30 seconds
  screenshotQuality: 50, // JPEG quality 0-100
  concurrency: 1, // Number of parallel checks
  userAgent: 'Mozilla/5.0 (compatible; HowTheyTest-Validator/1.0)',
  headless: !isHeaded, // Run headless unless --headed flag is passed
  companyLimit, // Limit number of companies (for debugging)
};

// Issue types
const ISSUE_TYPES = {
  HTTP_ERROR: 'http-error',
  TIMEOUT: 'timeout',
  LOGIN_WALL: 'login-wall',
  PAGE_NOT_FOUND: 'page-not-found',
  CONTENT_MISMATCH: 'content-mismatch',
  SSL_ERROR: 'ssl-error',
};

// Load all company data
async function loadCompanyData() {
  const dataDir = join(PROJECT_ROOT, 'data', 'companies');
  const files = await fs.readdir(dataDir);
  const companies = [];

  for (const file of files) {
    if (file.endsWith('.json')) {
      const data = await fs.readFile(join(dataDir, file), 'utf-8');
      companies.push(JSON.parse(data));

      // Apply company limit if specified (for debugging)
      if (CONFIG.companyLimit && companies.length >= CONFIG.companyLimit) {
        break;
      }
    }
  }

  return companies;
}

// Extract all resources from companies
function extractResources(companies) {
  const resources = [];

  for (const company of companies) {
    for (const resource of company.resources) {
      resources.push({
        companyName: company.name,
        companyId: company.id,
        industry: company.industry,
        ...resource,
      });
    }
  }

  return resources;
}

// Detect login walls
function detectLoginWall(page, pageContent) {
  const loginIndicators = [
    // Common login/signin patterns in URL
    /login|signin|sign-in|authenticate|auth/i.test(page.url()),

    // Common login text patterns
    /sign in|log in|login|authenticate|create account|register/i.test(pageContent),

    // Password input fields
    pageContent.includes('type="password"') || pageContent.includes('type=password'),
  ];

  return loginIndicators.filter(Boolean).length >= 2;
}

// Detect 404/error pages
function detectErrorPage(pageContent, title, httpStatus) {
  // If HTTP status is 200 (OK), be very conservative about flagging as error page
  // Only flag if title is VERY clearly an error page
  if (httpStatus === 200) {
    const titleLower = title.toLowerCase();
    // For 200 responses, only flag if title is unmistakably an error page
    const strictTitlePatterns = [
      /^404$/,           // Title is exactly "404"
      /^403$/,           // Title is exactly "403"
      /^500$/,           // Title is exactly "500"
      /^error$/,         // Title is exactly "Error"
      /^page not found$/,  // Title is exactly "Page Not Found"
    ];
    return strictTitlePatterns.some(pattern => pattern.test(titleLower));
  }

  // For non-200 responses, be more aggressive
  const titleLower = title.toLowerCase();
  const titleErrorPatterns = [
    /404/,
    /not found/,
    /page not found/,
    /403/,
    /forbidden/,
    /access denied/,
    /500/,
    /internal server error/,
    /error - /,  // "Error - Site Name" format
    /^error$/,   // Title is exactly "Error"
  ];

  if (titleErrorPatterns.some(pattern => pattern.test(titleLower))) {
    return true;
  }

  // For content, only check for very specific error page patterns
  // Avoid matching legitimate technical content about errors/testing
  const contentLower = pageContent.toLowerCase();
  const strictErrorPatterns = [
    /page not found|page cannot be found/i,
    /the page you.{0,20}looking for.{0,20}(not|does not) exist/i,
    /this page (doesn't|does not) exist/i,
  ];

  return strictErrorPatterns.some(pattern => pattern.test(contentLower));
}

// Extract keywords from resource title and URL
function extractKeywords(resource) {
  const keywords = new Set();

  // From title
  const titleWords = resource.title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3); // Only words longer than 3 chars

  titleWords.forEach(word => keywords.add(word));

  // From URL path
  const urlPath = new URL(resource.url).pathname;
  const urlWords = urlPath
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3);

  urlWords.forEach(word => keywords.add(word));

  return Array.from(keywords);
}

// Validate page content matches resource
function validateContent(pageContent, title, resource) {
  const keywords = extractKeywords(resource);
  const content = `${title} ${pageContent}`.toLowerCase();

  // Count how many keywords are found
  const matchedKeywords = keywords.filter(keyword => content.includes(keyword));
  const matchRate = keywords.length > 0 ? matchedKeywords.length / keywords.length : 0;

  // Consider valid if at least 30% of keywords match
  return {
    isValid: matchRate >= 0.3,
    matchRate,
    keywords,
    matchedKeywords,
  };
}

// Validate a single resource with Playwright
async function validateResource(browser, resource) {
  const result = {
    resource,
    status: 'valid',
    issues: [],
    httpStatus: null,
    finalUrl: null,
    pageTitle: null,
    screenshot: null,
    timestamp: new Date().toISOString(),
  };

  console.log(`\n🔍 Validating company: ${resource.companyName}, resource: ${resource.url}, resource type: ${resource.type}`);

  let page;

  try {
    // Load page with Playwright browser
    page = await browser.newPage({
      userAgent: CONFIG.userAgent,
    });

    const response = await page.goto(resource.url, {
      timeout: CONFIG.timeout,
      waitUntil: 'load', // Wait for page load event (less strict than networkidle)
    });

    // Additional wait for JavaScript-heavy sites to render dynamic content
    // This ensures React/Vue/etc. have time to hydrate and render
    await page.waitForTimeout(3000);

    // Capture HTTP status from the response
    result.httpStatus = response ? response.status() : null;

    // Get final URL after redirects
    result.finalUrl = page.url();

    // Get page title
    result.pageTitle = await page.title();

    // Get page content
    const pageContent = await page.content();

    // Check for login walls
    if (detectLoginWall(page, pageContent)) {
      result.status = 'failure';
      result.issues.push({
        type: ISSUE_TYPES.LOGIN_WALL,
        message: 'Page appears to be behind a login wall',
      });
    }

    // Check for error pages
    if (detectErrorPage(pageContent, result.pageTitle, result.httpStatus)) {
      result.status = 'failure';
      result.issues.push({
        type: ISSUE_TYPES.PAGE_NOT_FOUND,
        message: 'Page appears to be an error page (404/403/500)',
      });
    }

    // Validate content matches resource
    const contentValidation = validateContent(pageContent, result.pageTitle, resource);
    if (!contentValidation.isValid) {
      result.status = 'warning';
      result.issues.push({
        type: ISSUE_TYPES.CONTENT_MISMATCH,
        message: `Content match rate: ${Math.round(contentValidation.matchRate * 100)}% (${contentValidation.matchedKeywords.length}/${contentValidation.keywords.length} keywords)`,
        details: {
          keywords: contentValidation.keywords,
          matched: contentValidation.matchedKeywords,
        },
      });
    }

    // Note: We don't flag redirects as suspicious anymore
    // If the page loads successfully and content matches, the redirect is fine

    // Take compressed screenshot
    const screenshotBuffer = await page.screenshot({
      fullPage: false,
      type: 'jpeg',
      quality: CONFIG.screenshotQuality,
    });
    result.screenshot = screenshotBuffer.toString('base64');

  } catch (error) {
    result.status = 'failure';

    if (error.message.includes('Timeout')) {
      result.issues.push({
        type: ISSUE_TYPES.TIMEOUT,
        message: `Page failed to load within ${CONFIG.timeout}ms`,
      });
    } else if (error.message.includes('SSL') || error.message.includes('certificate')) {
      result.issues.push({
        type: ISSUE_TYPES.SSL_ERROR,
        message: 'SSL/Certificate error',
      });
    } else {
      result.issues.push({
        type: 'unknown',
        message: error.message,
      });
    }
  } finally {
    if (page) {
      await page.close();
    }
  }

  // Log outcome
  if (result.status === 'valid') {
    console.log(`✅ Outcome: PASS`);
  } else if (result.status === 'warning') {
    console.log(`⚠️  Outcome: WARNING`);
    result.issues.forEach(issue => {
      console.log(`   Reason: ${issue.message}`);
    });
  } else {
    console.log(`❌ Outcome: FAIL`);
    result.issues.forEach(issue => {
      console.log(`   Reason: ${issue.message}`);
    });
  }

  return result;
}

// Process resources in batches
async function processResourcesBatch(browser, resources, batchSize) {
  const results = [];

  for (let i = 0; i < resources.length; i += batchSize) {
    const batch = resources.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(resources.length / batchSize);

    console.log(`\n${'='.repeat(80)}`);
    console.log(`📦 Processing batch ${batchNum}/${totalBatches} (${batch.length} resources)`);
    console.log(`${'='.repeat(80)}`);

    const batchResults = await Promise.all(
      batch.map(resource => validateResource(browser, resource))
    );

    results.push(...batchResults);

    // Progress update
    const valid = results.filter(r => r.status === 'valid').length;
    const failures = results.filter(r => r.status === 'failure').length;
    const warnings = results.filter(r => r.status === 'warning').length;

    console.log(`\n${'─'.repeat(80)}`);
    console.log(`📊 Progress: ${results.length}/${resources.length} validated`);
    console.log(`   ✅ Valid: ${valid} | ⚠️  Warnings: ${warnings} | ❌ Failures: ${failures}`);
    console.log(`${'─'.repeat(80)}`);
  }

  return results;
}

// Generate HTML report and JSON exports
async function generateReport(results, outputDir) {
  const total = results.length;
  const valid = results.filter(r => r.status === 'valid').length;
  const warnings = results.filter(r => r.status === 'warning').length;
  const failures = results.filter(r => r.status === 'failure').length;

  // Create output directory
  await fs.mkdir(outputDir, { recursive: true });

  // Group results by company
  const byCompany = {};
  results.forEach(result => {
    const company = result.resource.companyName;
    if (!byCompany[company]) {
      byCompany[company] = {
        name: company,
        resources: [],
        valid: 0,
        warnings: 0,
        failures: 0,
      };
    }
    byCompany[company].resources.push(result);
    if (result.status === 'valid') byCompany[company].valid++;
    else if (result.status === 'warning') byCompany[company].warnings++;
    else if (result.status === 'failure') byCompany[company].failures++;
  });

  // Sort companies by total issues (failures + warnings) descending
  const sortedCompanies = Object.values(byCompany).sort((a, b) =>
    (b.failures + b.warnings) - (a.failures + a.warnings)
  );

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Resource Validation Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; background: #f5f5f5; }
    .container { max-width: 1400px; margin: 0 auto; }
    h1 { color: #333; margin-bottom: 10px; }
    .timestamp { color: #666; font-size: 14px; margin-bottom: 30px; }
    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
    .stat-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; }
    .stat-card:hover { transform: translateY(-2px); box-shadow: 0 4px 8px rgba(0,0,0,0.15); }
    .stat-card.active { border: 2px solid #3b82f6; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3); }
    .stat-value { font-size: 36px; font-weight: bold; margin-bottom: 5px; }
    .stat-label { color: #666; font-size: 14px; }
    .valid { color: #22c55e; }
    .warning { color: #f59e0b; }
    .failure { color: #ef4444; }
    .section { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 20px; }
    .section h2 { margin-bottom: 15px; color: #333; cursor: pointer; user-select: none; display: flex; align-items: center; gap: 10px; }
    .section h2:hover { color: #3b82f6; }
    .company-resources { max-height: 10000px; overflow: hidden; transition: max-height 0.3s ease-out; }
    .company-resources.collapsed { max-height: 0; }
    .expand-icon { display: inline-block; transition: transform 0.3s ease; font-size: 20px; }
    .expand-icon.collapsed { transform: rotate(-90deg); }
    .resource-item { border: 1px solid #e5e5e5; border-radius: 4px; padding: 15px; margin-bottom: 15px; }
    .resource-header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px; }
    .resource-title { font-weight: 600; color: #333; }
    .resource-company { color: #666; font-size: 14px; margin-top: 4px; }
    .resource-url { color: #3b82f6; font-size: 14px; margin-bottom: 10px; word-break: break-all; }
    .resource-url a { color: #3b82f6; text-decoration: none; }
    .resource-url a:hover { text-decoration: underline; }
    .issue-badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; margin-bottom: 10px; }
    .issue-http-error { background: #fee2e2; color: #991b1b; }
    .issue-timeout { background: #fef3c7; color: #92400e; }
    .issue-login-wall { background: #fee2e2; color: #991b1b; }
    .issue-page-not-found { background: #fee2e2; color: #991b1b; }
    .issue-content-mismatch { background: #fef3c7; color: #92400e; }
    .issue-ssl-error { background: #fee2e2; color: #991b1b; }
    .screenshot { max-width: 300px; border: 1px solid #e5e5e5; border-radius: 4px; margin-top: 10px; cursor: pointer; }
    .screenshot:hover { opacity: 0.8; }
    .modal { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 1000; }
    .modal.active { display: flex; align-items: center; justify-content: center; }
    .modal img { max-width: 90%; max-height: 90%; }
    .modal-close { position: absolute; top: 20px; right: 40px; color: white; font-size: 40px; cursor: pointer; }
    .details { background: #f9fafb; padding: 10px; border-radius: 4px; margin-top: 10px; font-size: 14px; }
    .details strong { color: #333; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Resource Validation Report</h1>
    <p class="timestamp">Generated: ${new Date().toLocaleString()}</p>

    <div class="summary">
      <div class="stat-card" onclick="filterResults('all')" data-filter="all">
        <div class="stat-value">${total}</div>
        <div class="stat-label">Total Resources</div>
      </div>
      <div class="stat-card" onclick="filterResults('valid')" data-filter="valid">
        <div class="stat-value valid">${valid}</div>
        <div class="stat-label">Valid</div>
      </div>
      <div class="stat-card" onclick="filterResults('warning')" data-filter="warning">
        <div class="stat-value warning">${warnings}</div>
        <div class="stat-label">Warnings</div>
      </div>
      <div class="stat-card" onclick="filterResults('failure')" data-filter="failure">
        <div class="stat-value failure">${failures}</div>
        <div class="stat-label">Failures</div>
      </div>
    </div>

    ${sortedCompanies.map(company => `
      <div class="section company-section" data-company="${company.name}">
        <h2 onclick="toggleCompany(this)">
          <span class="expand-icon">▼</span>
          <span style="flex: 1;">
            ${company.name}
            <span style="color: #666; font-size: 16px; font-weight: normal;">
              (${company.resources.length} resources:
              <span class="valid">${company.valid} valid</span>,
              <span class="warning">${company.warnings} warnings</span>,
              <span class="failure">${company.failures} failures</span>)
            </span>
          </span>
        </h2>
        <div class="company-resources">
          ${company.resources.map(item => `
            <div class="resource-item" data-status="${item.status}">
              <div class="resource-header">
                <div>
                  <div class="resource-title">${item.resource.title}</div>
                  <div class="resource-company">${item.resource.type}</div>
                </div>
                <div style="text-align: right;">
                  ${item.status === 'valid' ? '<span style="color: #22c55e; font-weight: 600;">✓ Valid</span>' : ''}
                  ${item.status === 'warning' ? '<span style="color: #f59e0b; font-weight: 600;">⚠ Warning</span>' : ''}
                  ${item.status === 'failure' ? '<span style="color: #ef4444; font-weight: 600;">✗ Failure</span>' : ''}
                </div>
              </div>
              <div class="resource-url"><a href="${item.resource.url}" target="_blank">${item.resource.url}</a></div>
              ${item.issues.length > 0 ? item.issues.map(issue => `<span class="issue-badge issue-${issue.type}">${issue.message}</span>`).join(' ') : ''}
              ${item.finalUrl && item.finalUrl !== item.resource.url ? `<div class="details"><strong>Final URL:</strong> ${item.finalUrl}</div>` : ''}
              ${item.pageTitle ? `<div class="details"><strong>Page Title:</strong> ${item.pageTitle}</div>` : ''}
              ${item.httpStatus ? `<div class="details"><strong>HTTP Status:</strong> ${item.httpStatus}</div>` : ''}
              ${item.screenshot ? `<img src="data:image/jpeg;base64,${item.screenshot}" class="screenshot" alt="Screenshot" onclick="openModal(this.src)">` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `).join('')}
  </div>

  <div class="modal" id="modal" onclick="closeModal()">
    <span class="modal-close">&times;</span>
    <img id="modal-img" src="" alt="Screenshot">
  </div>

  <script>
    function openModal(src) {
      document.getElementById('modal').classList.add('active');
      document.getElementById('modal-img').src = src;
    }
    function closeModal() {
      document.getElementById('modal').classList.remove('active');
    }

    function toggleCompany(header) {
      const icon = header.querySelector('.expand-icon');
      const resourcesContainer = header.nextElementSibling;

      icon.classList.toggle('collapsed');
      resourcesContainer.classList.toggle('collapsed');
    }

    function filterResults(filter) {
      // Update active state on stat cards
      document.querySelectorAll('.stat-card').forEach(card => {
        if (card.getAttribute('data-filter') === filter) {
          card.classList.add('active');
        } else {
          card.classList.remove('active');
        }
      });

      // Filter resource items
      const companySections = document.querySelectorAll('.company-section');
      companySections.forEach(section => {
        const items = section.querySelectorAll('.resource-item');
        let visibleCount = 0;

        items.forEach(item => {
          const status = item.getAttribute('data-status');
          if (filter === 'all' || status === filter) {
            item.style.display = '';
            visibleCount++;
          } else {
            item.style.display = 'none';
          }
        });

        // Hide company section if no visible items
        if (visibleCount === 0) {
          section.style.display = 'none';
        } else {
          section.style.display = '';
        }
      });
    }

    // Set 'all' as active by default
    document.addEventListener('DOMContentLoaded', () => {
      document.querySelector('[data-filter="all"]').classList.add('active');
    });
  </script>
</body>
</html>
  `;

  // Write HTML report
  const htmlPath = join(outputDir, 'index.html');
  await fs.writeFile(htmlPath, html);

  // Generate JSON export of failures and warnings
  const failingResults = results.filter(r => r.status === 'failure' || r.status === 'warning');
  const jsonExport = {
    generatedAt: new Date().toISOString(),
    summary: {
      total,
      valid,
      warnings,
      failures,
    },
    failures: failingResults.map(r => ({
      company: r.resource.companyName,
      title: r.resource.title,
      url: r.resource.url,
      type: r.resource.type,
      status: r.status,
      httpStatus: r.httpStatus,
      finalUrl: r.finalUrl,
      pageTitle: r.pageTitle,
      issues: r.issues.map(i => ({
        type: i.type,
        message: i.message,
      })),
    })),
  };

  const jsonPath = join(outputDir, 'failures.json');
  await fs.writeFile(jsonPath, JSON.stringify(jsonExport, null, 2));

  return { htmlPath, jsonPath };
}

// Main function
async function main() {
  console.log('\n' + '═'.repeat(80));
  console.log('🚀 RESOURCE VALIDATION TOOL');
  console.log('═'.repeat(80) + '\n');

  // Load data
  console.log('📂 Loading company data...');
  const companies = await loadCompanyData();
  const resources = extractResources(companies);
  if (CONFIG.companyLimit) {
    console.log(`⚠️  DEBUG MODE: Limited to first ${companies.length} companies`);
  }
  console.log(`✓ Found ${resources.length} resources across ${companies.length} companies\n`);

  // Launch browser (once for all validations)
  console.log('🌐 Launching Chromium browser...');

  // Set custom temp directory for Playwright artifacts
  const tempDir = join(PROJECT_ROOT, '.playwright-temp');
  await fs.mkdir(tempDir, { recursive: true });
  process.env.TMPDIR = tempDir;

  const browser = await chromium.launch({
    headless: CONFIG.headless,
    args: [
      '--disable-dev-shm-usage', // Overcome limited resource problems
      '--no-sandbox', // Disable sandboxing to avoid permission issues
    ],
  });
  console.log('✓ Browser launched successfully');
  console.log('   Browser will remain open throughout validation of all resources\n');

  try {
    // Validate resources
    console.log(`🔍 Starting validation of ${resources.length} resources...`);
    console.log(`   Browser mode: ${CONFIG.headless ? 'Headless' : 'Headed'}`);
    console.log(`   Concurrency: ${CONFIG.concurrency} parallel checks`);
    console.log(`   Timeout: ${CONFIG.timeout}ms per resource\n`);

    const results = await processResourcesBatch(browser, resources, CONFIG.concurrency);

    // Generate reports
    const reportDir = join(PROJECT_ROOT, 'validation-report');
    console.log(`\n📊 Generating reports...`);
    const { htmlPath, jsonPath } = await generateReport(results, reportDir);
    console.log(`✓ HTML report: ${htmlPath}`);
    console.log(`✓ JSON export: ${jsonPath}\n`);

    // Summary
    const valid = results.filter(r => r.status === 'valid').length;
    const warnings = results.filter(r => r.status === 'warning').length;
    const failures = results.filter(r => r.status === 'failure').length;

    console.log('═'.repeat(80));
    console.log('✨ VALIDATION COMPLETE');
    console.log('═'.repeat(80));
    console.log(`\n📈 Final Summary:`);
    console.log(`   Total Resources:    ${results.length}`);
    console.log(`   ✅ Valid:           ${valid} (${Math.round(valid / results.length * 100)}%)`);
    console.log(`   ⚠️  Warnings:        ${warnings} (${Math.round(warnings / results.length * 100)}%)`);
    console.log(`   ❌ Failures:        ${failures} (${Math.round(failures / results.length * 100)}%)`);
    console.log(`\n📂 Reports Location: ${reportDir}/`);
    console.log(`   - HTML Report: ${reportDir}/index.html`);
    console.log(`   - JSON Export: ${reportDir}/failures.json`);
    console.log(`\n💡 Open the HTML report in your browser to view detailed results.\n`);

  } finally {
    console.log('🔒 Closing browser...');
    await browser.close();
    console.log('✓ Browser closed\n');
  }
}

main().catch(console.error);
