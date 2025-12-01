#!/usr/bin/env node
/**
 * Analyze topic coverage across all resources
 */

const fs = require('fs');
const path = require('path');

function analyzeTopics() {
  const companiesDir = path.join(__dirname, '../data/companies');
  const files = fs.readdirSync(companiesDir);

  let totalResources = 0;
  let resourcesWithNoTopics = 0;
  let resourcesWithTopics = 0;
  const topicCounts = {};
  const noTopicExamples = [];

  for (const file of files) {
    if (!file.endsWith('.json')) continue;

    const filepath = path.join(companiesDir, file);
    const company = JSON.parse(fs.readFileSync(filepath, 'utf-8'));

    for (const resource of company.resources) {
      totalResources++;

      if (!resource.topics || resource.topics.length === 0) {
        resourcesWithNoTopics++;
        if (noTopicExamples.length < 10) {
          noTopicExamples.push({
            company: company.name,
            title: resource.title,
            type: resource.type
          });
        }
      } else {
        resourcesWithTopics++;

        // Count topics
        for (const topic of resource.topics) {
          topicCounts[topic] = (topicCounts[topic] || 0) + 1;
        }
      }
    }
  }

  console.log('📊 Topic Coverage Analysis:');
  console.log('='.repeat(60));
  console.log(`Total resources: ${totalResources}`);
  console.log(`With topics: ${resourcesWithTopics} (${Math.round(resourcesWithTopics/totalResources*100)}%)`);
  console.log(`Without topics: ${resourcesWithNoTopics} (${Math.round(resourcesWithNoTopics/totalResources*100)}%)`);

  console.log('\n📈 Top 20 Most Common Topics:');
  console.log('='.repeat(60));
  const sortedTopics = Object.entries(topicCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20);

  for (const [topic, count] of sortedTopics) {
    console.log(`${topic.padEnd(35)} ${count.toString().padStart(5)}`);
  }

  if (noTopicExamples.length > 0) {
    console.log('\n⚠️  Examples of resources without topics:');
    console.log('='.repeat(60));
    for (const example of noTopicExamples) {
      console.log(`Company: ${example.company}`);
      console.log(`Title: ${example.title}`);
      console.log(`Type: ${example.type}`);
      console.log('-'.repeat(60));
    }
  }

  console.log(`\n💡 ${resourcesWithNoTopics} resources need topic tagging`);
}

if (require.main === module) {
  analyzeTopics();
}

module.exports = { analyzeTopics };
