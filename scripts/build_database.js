#!/usr/bin/env node
/**
 * Build aggregated database.json from individual company files.
 * This file will be consumed by the frontend application.
 */

const fs = require('fs');
const path = require('path');

function buildDatabase() {
  console.log('🔨 Building aggregated database...\n');

  const companiesDir = path.join(__dirname, '../data/companies');
  const outputFile = path.join(__dirname, '../public/database.json');
  const outputDir = path.dirname(outputFile);

  // Create public directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Read all company JSON files
  const files = fs.readdirSync(companiesDir);
  const companies = [];

  for (const file of files) {
    if (!file.endsWith('.json')) continue;

    const filepath = path.join(companiesDir, file);
    const content = fs.readFileSync(filepath, 'utf-8');
    const company = JSON.parse(content);

    // Add default addedDate to resources that don't have it
    // This ensures all existing resources have a baseline date
    if (company.resources) {
      company.resources = company.resources.map(resource => {
        if (!resource.addedDate) {
          return { ...resource, addedDate: '2025-01-01' };
        }
        return resource;
      });
    }

    companies.push(company);
  }

  // Calculate statistics
  const totalResources = companies.reduce((sum, c) => sum + c.resources.length, 0);

  // Get all unique industries
  const industries = [...new Set(companies.map(c => c.industry))].sort();

  // Get all unique topics
  const allTopics = new Set();
  for (const company of companies) {
    for (const resource of company.resources) {
      if (resource.topics) {
        resource.topics.forEach(topic => allTopics.add(topic));
      }
    }
  }
  const uniqueTopics = Array.from(allTopics).sort();

  // Get resource type counts
  const resourceTypes = {};
  for (const company of companies) {
    for (const resource of company.resources) {
      resourceTypes[resource.type] = (resourceTypes[resource.type] || 0) + 1;
    }
  }

  // Build database object
  const database = {
    meta: {
      version: '1.0.0',
      generatedAt: new Date().toISOString(),
      totalCompanies: companies.length,
      totalResources: totalResources,
      industries: industries,
      topics: uniqueTopics,
      resourceTypes: resourceTypes
    },
    companies: companies.sort((a, b) => a.name.localeCompare(b.name))
  };

  // Write output
  fs.writeFileSync(outputFile, JSON.stringify(database, null, 2), 'utf-8');

  console.log('✅ Database built successfully!');
  console.log('='.repeat(60));
  console.log(`📊 Statistics:`);
  console.log(`   Companies: ${database.meta.totalCompanies}`);
  console.log(`   Total Resources: ${database.meta.totalResources}`);
  console.log(`   Industries: ${database.meta.industries.length}`);
  console.log(`   Unique Topics: ${database.meta.topics.length}`);
  console.log(`   Output: ${outputFile}`);
  console.log('='.repeat(60));

  console.log(`\n📁 Industry Breakdown:`);
  const industryCount = {};
  for (const company of companies) {
    industryCount[company.industry] = (industryCount[company.industry] || 0) + 1;
  }
  const sortedIndustries = Object.entries(industryCount)
    .sort((a, b) => b[1] - a[1]);

  for (const [industry, count] of sortedIndustries) {
    console.log(`   ${industry.padEnd(30)} ${count.toString().padStart(3)} companies`);
  }

  console.log(`\n📦 Resource Types:`);
  const sortedTypes = Object.entries(resourceTypes)
    .sort((a, b) => b[1] - a[1]);

  for (const [type, count] of sortedTypes) {
    console.log(`   ${type.padEnd(15)} ${count.toString().padStart(4)}`);
  }

  console.log(`\n🏷️  Top 15 Topics:`);
  const topicCounts = {};
  for (const company of companies) {
    for (const resource of company.resources) {
      if (resource.topics) {
        resource.topics.forEach(topic => {
          topicCounts[topic] = (topicCounts[topic] || 0) + 1;
        });
      }
    }
  }
  const sortedTopics = Object.entries(topicCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);

  for (const [topic, count] of sortedTopics) {
    console.log(`   ${topic.padEnd(35)} ${count.toString().padStart(4)}`);
  }

  // Write a compact version for production
  const compactOutputFile = path.join(outputDir, 'database.min.json');
  fs.writeFileSync(compactOutputFile, JSON.stringify(database), 'utf-8');
  console.log(`\n💾 Compact version: ${compactOutputFile}`);

  // Calculate file sizes
  const prettySize = fs.statSync(outputFile).size;
  const compactSize = fs.statSync(compactOutputFile).size;
  console.log(`\n📏 File sizes:`);
  console.log(`   Pretty: ${(prettySize / 1024).toFixed(2)} KB`);
  console.log(`   Compact: ${(compactSize / 1024).toFixed(2)} KB`);
  console.log(`   Compression: ${((1 - compactSize / prettySize) * 100).toFixed(1)}%`);

  return database;
}

if (require.main === module) {
  try {
    buildDatabase();
  } catch (error) {
    console.error('❌ Error building database:', error.message);
    process.exit(1);
  }
}

module.exports = { buildDatabase };
