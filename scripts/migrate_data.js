#!/usr/bin/env node
/**
 * Migration script to convert README.md into structured JSON data.
 * Extracts companies and their testing resources.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Convert text to slug format
 */
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[-\s]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Generate a unique ID for a resource based on title and URL
 */
function generateResourceId(title, url) {
  const content = `${title}:${url}`;
  const hash = crypto.createHash('md5').update(content).digest('hex').substring(0, 8);
  const slug = slugify(title).substring(0, 40);
  return `${slug}-${hash}`;
}

/**
 * Load topic keywords from topics.json
 */
function loadTopicKeywords() {
  const topicsPath = path.join(__dirname, '../data/topics.json');
  const data = JSON.parse(fs.readFileSync(topicsPath, 'utf-8'));
  return data.keywords || {};
}

/**
 * Extract topics from text using keyword matching
 */
function extractTopicsFromText(text, keywordsMap) {
  const textLower = text.toLowerCase();
  const matchedTopics = new Set();

  for (const [topic, keywords] of Object.entries(keywordsMap)) {
    for (const keyword of keywords) {
      if (textLower.includes(keyword.toLowerCase())) {
        matchedTopics.add(topic);
        break;
      }
    }
  }

  return Array.from(matchedTopics).sort();
}

/**
 * Determine resource type from section header
 */
function parseResourceType(sectionHeader) {
  const headerLower = sectionHeader.toLowerCase();

  const typeMapping = {
    'blog': 'blog',
    'video': 'video',
    'book': 'book',
    'article': 'article',
    'talk': 'talk',
    'podcast': 'podcast',
    'handbook': 'handbook',
    'git': 'repo',
    'repo': 'repo',
  };

  for (const [key, value] of Object.entries(typeMapping)) {
    if (headerLower.includes(key)) {
      return value;
    }
  }

  // Default to article if can't determine
  return 'article';
}

/**
 * Extract resources from company content
 */
function extractResources(content, keywordsMap) {
  const resources = [];
  let currentType = null;

  const lines = content.split('\n');

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Check for section headers (e.g., #### Blogs, #### Videos)
    if (trimmedLine.startsWith('####')) {
      const sectionHeader = trimmedLine.replace(/^#+\s*/, '').trim();
      currentType = parseResourceType(sectionHeader);
      continue;
    }

    // Extract markdown links: * [Title](URL)
    const linkMatch = trimmedLine.match(/^\*\s*\[(.+?)\]\((.+?)\)/);
    if (linkMatch) {
      const title = linkMatch[1].trim();
      const url = linkMatch[2].trim();

      // Skip if it's a slide link (these are usually supplementary)
      if (title.toLowerCase().includes('slides') && resources.length > 0) {
        continue;
      }

      // Extract topics from title and URL
      const topics = extractTopicsFromText(`${title} ${url}`, keywordsMap);

      const resource = {
        id: generateResourceId(title, url),
        title: title,
        url: url,
        type: currentType || 'article',
        topics: topics
      };

      resources.push(resource);
    }
  }

  return resources;
}

/**
 * Extract all companies from README.md
 */
function extractCompanies(readmeContent, keywordsMap) {
  const companies = [];

  // Pattern to match <details><summary>Company Name</summary>content</details>
  const pattern = /<details>\s*<summary>(.+?)<\/summary>(.*?)<\/details>/gs;
  const matches = readmeContent.matchAll(pattern);

  for (const match of matches) {
    const companyName = match[1].trim();
    const content = match[2].trim();

    // Generate company ID
    const companyId = slugify(companyName);

    // Extract resources
    const resources = extractResources(content, keywordsMap);

    if (resources.length === 0) {
      console.log(`⚠️  Warning: No resources found for ${companyName}`);
      continue;
    }

    const company = {
      id: companyId,
      name: companyName,
      industry: 'other', // Will be manually classified
      resources: resources,
      meta: {
        totalResources: resources.length,
        contributors: ['abhivaikar'] // Original author
      }
    };

    companies.push(company);
    console.log(`✓ Extracted ${companyName}: ${resources.length} resources`);
  }

  return companies;
}

/**
 * Save each company to individual JSON file
 */
function saveCompanies(companies, outputDir) {
  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (const company of companies) {
    const filepath = path.join(outputDir, `${company.id}.json`);
    fs.writeFileSync(filepath, JSON.stringify(company, null, 2), 'utf-8');
    console.log(`💾 Saved ${filepath}`);
  }
}

/**
 * Main migration function
 */
function main() {
  console.log('🚀 Starting migration from README.md to JSON...\n');

  // Paths
  const rootDir = path.join(__dirname, '..');
  const readmePath = path.join(rootDir, 'README.md');
  const outputDir = path.join(rootDir, 'data', 'companies');

  // Load README
  console.log(`📖 Reading ${readmePath}...`);
  const readmeContent = fs.readFileSync(readmePath, 'utf-8');

  // Load topic keywords
  console.log('🏷️  Loading topic keywords...');
  const keywordsMap = loadTopicKeywords();
  console.log(`   Loaded ${Object.keys(keywordsMap).length} topic categories`);

  // Extract companies
  console.log('\n🔍 Extracting companies...\n');
  const companies = extractCompanies(readmeContent, keywordsMap);

  // Save companies
  console.log(`\n💾 Saving ${companies.length} companies to ${outputDir}...\n`);
  saveCompanies(companies, outputDir);

  // Summary
  const totalResources = companies.reduce((sum, c) => sum + c.meta.totalResources, 0);
  console.log('\n' + '='.repeat(60));
  console.log('✅ Migration complete!');
  console.log(`   Companies: ${companies.length}`);
  console.log(`   Total resources: ${totalResources}`);
  console.log(`   Output directory: ${outputDir}`);
  console.log('='.repeat(60));

  // Generate summary report
  console.log('\n📊 Company Summary (Top 20 by resources):');
  console.log(`${'Company'.padEnd(40)} ${'Resources'.padStart(10)}`);
  console.log('-'.repeat(52));

  const sortedCompanies = companies
    .sort((a, b) => b.meta.totalResources - a.meta.totalResources)
    .slice(0, 20);

  for (const company of sortedCompanies) {
    console.log(
      `${company.name.padEnd(40)} ${company.meta.totalResources.toString().padStart(10)}`
    );
  }

  if (companies.length > 20) {
    console.log(`\n   ... and ${companies.length - 20} more companies`);
  }

  console.log('\n⚠️  Note: All companies are currently classified as \'other\' industry.');
  console.log('   Next step: Manually classify industries for all companies.');
  console.log('\n💡 Tip: Review generated JSON files in data/companies/');
}

// Run the migration
if (require.main === module) {
  main();
}

module.exports = { extractCompanies, extractResources, slugify };
