#!/usr/bin/env node
/**
 * Helper script to classify companies by industry.
 * Generates a mapping file that can be manually edited and then applied.
 */

const fs = require('fs');
const path = require('path');

// Industry categories matching our schema
const INDUSTRIES = [
  'ecommerce',
  'fintech',
  'social-media',
  'cloud-services',
  'travel-hospitality',
  'media-streaming',
  'food-delivery',
  'ride-hailing',
  'productivity-tools',
  'developer-tools',
  'gaming',
  'education',
  'healthcare',
  'government',
  'telecommunications',
  'other'
];

// Manual classification based on known companies
const INDUSTRY_MAPPING = {
  // E-commerce
  'amazon': 'ecommerce',
  'ebay': 'ecommerce',
  'etsy': 'ecommerce',
  'flipkart': 'ecommerce',
  'shopify': 'ecommerce',
  'carousell': 'ecommerce',
  'mercari': 'ecommerce',
  'zalando': 'ecommerce',
  'trendyol': 'ecommerce',
  'la-redoute': 'ecommerce',
  'manomano': 'ecommerce',
  'trivago': 'travel-hospitality',
  'instacart': 'ecommerce',
  'picnic': 'ecommerce',
  'zoopla': 'ecommerce',
  'loveholidays': 'travel-hospitality',
  'walmartlabs': 'ecommerce',

  // Fintech
  'stripe': 'fintech',
  'paypal': 'fintech',
  'razorpay': 'fintech',
  'nubank': 'fintech',
  'monzo': 'fintech',
  'monese': 'fintech',
  'capitalone': 'fintech',
  'zerodha': 'fintech',

  // Social Media
  'facebook': 'social-media',
  'twitter': 'social-media',
  'reddit': 'social-media',
  'linkedin': 'social-media',
  'tiktok': 'social-media',
  'bumble': 'social-media',

  // Cloud Services / Tech Infrastructure
  'amazon': 'cloud-services',
  'google': 'cloud-services',
  'microsoft': 'cloud-services',
  'dropbox': 'cloud-services',
  'box': 'cloud-services',

  // Travel & Hospitality
  'airbnb': 'travel-hospitality',
  'expedia': 'travel-hospitality',
  'trivago': 'travel-hospitality',
  'loveholidays': 'travel-hospitality',

  // Media & Streaming
  'netflix': 'media-streaming',
  'spotify': 'media-streaming',
  'soundcloud': 'media-streaming',
  'disney-hotstar': 'media-streaming',
  'shazam': 'media-streaming',
  'bbc': 'media-streaming',
  'the-guardian': 'media-streaming',

  // Food Delivery
  'doordash': 'food-delivery',
  'swiggy': 'food-delivery',

  // Ride Hailing / Mobility
  'uber': 'ride-hailing',
  'gojek': 'ride-hailing',
  'grab': 'ride-hailing',
  'ninjavan': 'ride-hailing',
  'keeptruckin': 'ride-hailing',

  // Productivity Tools
  'slack': 'productivity-tools',
  'atlassian': 'productivity-tools',
  'miro': 'productivity-tools',
  'mattermost': 'productivity-tools',
  'wrike': 'productivity-tools',
  'basecamp': 'productivity-tools',
  'mailchimp': 'productivity-tools',
  'squarespace': 'productivity-tools',
  'automattic-wordpress': 'productivity-tools',
  'canva': 'productivity-tools',
  'figma': 'productivity-tools',
  'notion': 'productivity-tools',

  // Developer Tools
  'github': 'developer-tools',
  'gitlab': 'developer-tools',
  'stackoverflow': 'developer-tools',
  'mozilla': 'developer-tools',
  'appian': 'developer-tools',
  'outsystems': 'developer-tools',
  'veracode': 'developer-tools',
  'tarantool': 'developer-tools',

  // Gaming
  'dream11': 'gaming',
  'duolingo': 'education',

  // Education
  'duolingo': 'education',

  // Healthcare
  'meesho-tech': 'ecommerce',

  // Government
  'govtech-singapore-gdsdcube': 'government',
  'nasa': 'government',

  // Telecommunications
  'twilio': 'telecommunications',
  'expressvpn': 'telecommunications',

  // Other / Multiple Categories
  'apple': 'other',
  'intel': 'other',
  'salesforce': 'cloud-services',
  'godaddy': 'cloud-services',
  'wikimedia': 'media-streaming',
  'asos': 'ecommerce',
  'cazoo': 'ecommerce',
  'deliveroo': 'food-delivery',
  'dollar-shave-club': 'ecommerce',
  'elsevier': 'media-streaming',
  'everon': 'other',
  'goibibo': 'travel-hospitality',
  'helpshift': 'productivity-tools',
  'hhru': 'productivity-tools',
  'komoot': 'travel-hospitality',
  'mcdonalds': 'food-delivery',
  'acv-auctions': 'ecommerce',
  'adore-me': 'ecommerce',
  'slalom-build': 'other',
  'stuart-engineering': 'food-delivery',
  'the-signal-group': 'telecommunications',
  'visma': 'productivity-tools',
  'wingify': 'productivity-tools',
  'wix': 'productivity-tools',
};

function classifyCompanies() {
  const companiesDir = path.join(__dirname, '../data/companies');
  const files = fs.readdirSync(companiesDir);

  let classified = 0;
  let unclassified = 0;
  const unclassifiedList = [];

  for (const file of files) {
    if (!file.endsWith('.json')) continue;

    const filepath = path.join(companiesDir, file);
    const company = JSON.parse(fs.readFileSync(filepath, 'utf-8'));

    const industry = INDUSTRY_MAPPING[company.id];

    if (industry) {
      company.industry = industry;
      fs.writeFileSync(filepath, JSON.stringify(company, null, 2), 'utf-8');
      console.log(`✓ ${company.name.padEnd(40)} → ${industry}`);
      classified++;
    } else {
      unclassifiedList.push(company.name);
      unclassified++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Classified: ${classified} companies`);
  console.log(`⚠️  Unclassified: ${unclassified} companies`);
  console.log('='.repeat(60));

  if (unclassifiedList.length > 0) {
    console.log('\n📋 Unclassified companies:');
    unclassifiedList.forEach(name => console.log(`   - ${name}`));
    console.log('\n💡 These companies will remain as "other" industry.');
    console.log('   Update INDUSTRY_MAPPING in this script to classify them.');
  }
}

if (require.main === module) {
  console.log('🏷️  Classifying companies by industry...\n');
  classifyCompanies();
}

module.exports = { INDUSTRY_MAPPING, INDUSTRIES };
