#!/usr/bin/env node

/**
 * Migration script to combine 'blog' and 'article' resource types into 'blog or article'
 *
 * This script:
 * 1. Reads all company JSON files from data/companies/
 * 2. Updates any resources with type 'blog' or 'article' to 'blog or article'
 * 3. Writes the updated files back
 */

const fs = require('fs');
const path = require('path');

const COMPANIES_DIR = path.join(__dirname, '..', 'data', 'companies');

function migrateCompanyFile(filePath) {
  try {
    // Read the file
    const content = fs.readFileSync(filePath, 'utf8');
    const company = JSON.parse(content);

    let updated = false;

    // Update each resource's type if it's 'blog' or 'article'
    company.resources.forEach(resource => {
      if (resource.type === 'blog' || resource.type === 'article') {
        resource.type = 'blog or article';
        updated = true;
      }
    });

    // Only write if we made changes
    if (updated) {
      fs.writeFileSync(filePath, JSON.stringify(company, null, 2) + '\n', 'utf8');
      return { updated: true, file: path.basename(filePath) };
    }

    return { updated: false, file: path.basename(filePath) };
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return { updated: false, file: path.basename(filePath), error: error.message };
  }
}

function main() {
  console.log('🔄 Starting migration: blog/article → blog or article\n');

  // Get all JSON files in the companies directory
  const files = fs.readdirSync(COMPANIES_DIR)
    .filter(file => file.endsWith('.json'))
    .map(file => path.join(COMPANIES_DIR, file));

  console.log(`Found ${files.length} company files\n`);

  const results = {
    total: files.length,
    updated: 0,
    unchanged: 0,
    errors: 0,
    updatedFiles: [],
    errorFiles: [],
  };

  // Process each file
  files.forEach(filePath => {
    const result = migrateCompanyFile(filePath);

    if (result.error) {
      results.errors++;
      results.errorFiles.push(result.file);
      console.error(`❌ ${result.file} - ERROR: ${result.error}`);
    } else if (result.updated) {
      results.updated++;
      results.updatedFiles.push(result.file);
      console.log(`✅ ${result.file} - Updated`);
    } else {
      results.unchanged++;
    }
  });

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('Migration Summary:');
  console.log('='.repeat(60));
  console.log(`Total files:      ${results.total}`);
  console.log(`Updated:          ${results.updated}`);
  console.log(`Unchanged:        ${results.unchanged}`);
  console.log(`Errors:           ${results.errors}`);

  if (results.errors > 0) {
    console.log('\n⚠️  Files with errors:');
    results.errorFiles.forEach(file => console.log(`   - ${file}`));
    process.exit(1);
  } else {
    console.log('\n✨ Migration completed successfully!');
    console.log(`\n📝 ${results.updated} files were updated`);
    if (results.updated > 0) {
      console.log('\nNext steps:');
      console.log('1. Review the changes with: git diff data/companies/');
      console.log('2. Run validation: npm run validate');
      console.log('3. Rebuild database: npm run build:db');
    }
  }
}

// Run the migration
main();
