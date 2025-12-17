#!/usr/bin/env node
/**
 * Validate all company JSON files against the schema.
 */

const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

function validateSchema() {
  console.log('🔍 Validating company JSON files against schema...\n');

  // Load schema
  const schemaPath = path.join(__dirname, '../data/schemas/company.schema.json');
  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));

  // Initialize validator
  const ajv = new Ajv({ allErrors: true });
  addFormats(ajv);
  const validate = ajv.compile(schema);

  // Get all company files
  const companiesDir = path.join(__dirname, '../data/companies');
  const files = fs.readdirSync(companiesDir);

  let validCount = 0;
  let invalidCount = 0;
  const errors = [];

  // Validate each file
  for (const file of files) {
    if (!file.endsWith('.json')) continue;

    const filepath = path.join(companiesDir, file);
    const company = JSON.parse(fs.readFileSync(filepath, 'utf-8'));

    const valid = validate(company);

    if (valid) {
      validCount++;
      console.log(`✓ ${company.name}`);
    } else {
      invalidCount++;
      console.log(`✗ ${company.name}`);
      errors.push({
        file: file,
        company: company.name,
        errors: validate.errors
      });
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Validation Summary:');
  console.log('='.repeat(60));
  console.log(`✅ Valid: ${validCount}`);
  console.log(`❌ Invalid: ${invalidCount}`);
  console.log(`📁 Total: ${validCount + invalidCount}`);

  // Print errors if any
  if (errors.length > 0) {
    console.log('\n' + '='.repeat(60));
    console.log('❌ Validation Errors:');
    console.log('='.repeat(60));

    for (const error of errors) {
      console.log(`\nFile: ${error.file}`);
      console.log(`Company: ${error.company}`);
      console.log('Errors:');
      for (const err of error.errors) {
        console.log(`  - ${err.instancePath || '/'}: ${err.message}`);
        if (err.params) {
          console.log(`    Params: ${JSON.stringify(err.params)}`);
        }
      }
    }

    process.exit(1);
  }

  console.log('\n✅ All files are valid!');
}

if (require.main === module) {
  try {
    validateSchema();
  } catch (error) {
    console.error('❌ Validation error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

module.exports = { validateSchema };
