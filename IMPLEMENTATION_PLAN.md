# How They Test - Redesign & Modernization Plan

## Executive Summary

This plan outlines the transformation of How They Test from a simple docsify-based markdown site into a modern, filterable, and contributor-friendly platform. The redesign will introduce structured data, advanced filtering capabilities, and an automated contribution workflow.

## Current State Analysis

### Existing Architecture
- **Static Site Generator**: Docsify (client-side markdown rendering)
- **Data Storage**: Single `README.md` file (1,617 lines)
- **Organization**: 102 companies using HTML `<details>` tags for collapsible sections
- **Content Types**: Blogs, Videos, Books, Articles (unstructured)
- **No build process**: Everything served statically from GitHub Pages
- **No filtering or search**: Linear browsing only

### Data Patterns Identified
- 102 companies across various industries (e-commerce, fintech, social media, cloud, etc.)
- Each company has:
  - Company name
  - Optional sections: Blogs & Articles, Videos, Books, Handbook, Git repos
  - Each resource is a markdown link: `[Title](URL)`
- Resource titles often contain implicit metadata:
  - Topics: "mobile testing", "automation", "CI/CD", "security testing", "performance"
  - Platforms: "Android", "iOS", "React", "Kubernetes"
  - Testing types: "E2E", "unit testing", "integration testing", "visual regression"

---

## Phase 1: Data Model & Structured Storage

### Proposed Data Model

```json
{
  "companies": [
    {
      "id": "carousell",
      "name": "Carousell",
      "industry": "ecommerce",
      "headquarters": "Singapore",
      "description": "Online marketplace platform",
      "resources": [
        {
          "id": "resource-uuid",
          "title": "Building our in-house virtual device lab 'caroufarm'",
          "url": "https://medium.com/carousell-insider/building-our-in-house-virtual-device-lab-caroufarm-e72911e4593b",
          "type": "blog",
          "author": "Prabhagharan DK",
          "topics": ["mobile-testing", "device-lab", "automation", "infrastructure"],
          "date": "2019-06-15",
          "platforms": ["android", "ios"]
        }
      ]
    }
  ]
}
```

### Metadata Fields

**Company Level:**
- `id`: Unique slug (e.g., "carousell")
- `name`: Display name
- `industry`: Category (e-commerce, fintech, social-media, cloud-services, travel, media, etc.)
- `headquarters`: Location (optional)
- `description`: Brief description (optional)
- `resources`: Array of resource objects

**Resource Level:**
- `id`: Unique identifier (UUID or slug)
- `title`: Resource title
- `url`: Resource URL
- `type`: Resource type (blog, video, book, article, talk, podcast, handbook, repo)
- `author`: Author name (optional)
- `topics`: Array of topic tags (mobile-testing, automation, ci-cd, security-testing, performance, chaos-engineering, etc.)
- `date`: Publication date (optional, ISO format)
- `platforms`: Array of platforms mentioned (android, ios, web, backend, mobile, etc.)

### Topic Taxonomy

Proposed topic categories (can be expanded):
- **Test Types**: unit-testing, integration-testing, e2e-testing, visual-regression, api-testing, security-testing, performance-testing, load-testing
- **Practices**: tdd, bdd, continuous-testing, shift-left, testing-in-production, chaos-engineering, contract-testing
- **Automation**: test-automation, ci-cd, continuous-integration, continuous-deployment, build-pipeline
- **Platforms**: mobile-testing, android, ios, web-testing, backend-testing
- **Tools & Tech**: selenium, appium, cypress, playwright, jest, pytest, kubernetes, docker
- **Quality Culture**: quality-engineering, qa-culture, quality-processes, whole-team-quality
- **Observability**: monitoring, observability, alerting, incident-management, sre

### Industry Categories

- ecommerce
- fintech
- social-media
- cloud-services
- travel-hospitality
- media-streaming
- food-delivery
- ride-hailing
- productivity-tools
- developer-tools
- gaming
- education
- healthcare
- government
- other

### Storage Format Options

**Option A: JSON Files (Recommended)**
- Store data in `/data/companies/` directory
- One JSON file per company: `/data/companies/carousell.json`
- Benefits:
  - Easy to read/write programmatically
  - Version control friendly
  - Can be validated with JSON schema
  - Easy to generate from migration script
- Drawbacks:
  - Need build process to aggregate for UI

**Option B: Single JSON Database**
- Store all data in `/data/database.json`
- Benefits:
  - Single source of truth
  - Easy to load in frontend
- Drawbacks:
  - Large file (may impact git performance)
  - Merge conflicts when multiple contributors

**Option C: Hybrid Approach (Best)**
- Individual JSON files per company in `/data/companies/`
- Build script generates `/dist/database.json` for frontend consumption
- Keep `README.md` synchronized via script for backward compatibility

**Recommendation: Option C (Hybrid)**

---

## Phase 2: Frontend Architecture & UI/UX

### Technology Stack Decision

#### Option A: Keep Docsify + Add Custom Plugin
**Pros:**
- Minimal migration effort
- Keep existing simplicity
- No build process initially

**Cons:**
- Docsify not designed for structured data
- Limited filtering/search capabilities
- Hard to implement card/grid layout
- Plugin ecosystem limited

**Verdict:** ❌ Not suitable for requirements

#### Option B: Next.js + React (Recommended)
**Pros:**
- Full control over UI/UX
- Excellent performance with Static Site Generation (SSG)
- Rich ecosystem (filtering, search, animations)
- SEO-friendly
- Can add API routes for contribution form
- Modern developer experience

**Cons:**
- Requires build process
- More complex setup
- Larger bundle size

**Verdict:** ✅ **Recommended**

#### Option C: Vue.js + Vite
**Pros:**
- Simpler than React for basic use cases
- Fast build times
- Good ecosystem

**Cons:**
- Smaller ecosystem than React
- Less familiar for most contributors

**Verdict:** ⚠️ Acceptable alternative

#### Option D: Astro + React/Vue Components
**Pros:**
- Perfect for content-heavy sites
- Zero JS by default (ship only what's needed)
- Can use React/Vue for interactive components
- Excellent performance
- Built-in static site generation

**Cons:**
- Newer framework (smaller community)
- Less flexibility for complex interactions

**Verdict:** ✅ **Strong alternative**

**Final Recommendation: Next.js** (industry standard, excellent for this use case)

### UI/UX Design

#### Homepage Design
```
┌─────────────────────────────────────────────────────┐
│  Header: Logo, Search, Theme Toggle                │
├─────────────────────────────────────────────────────┤
│  Hero Section: Title, Description, Stats           │
│  "102 Companies • 500+ Resources • 15 Industries"  │
├─────────────────────────────────────────────────────┤
│  Filter Bar:                                        │
│  [Industry ▼] [Topics ▼] [Type ▼] [Search...]     │
├─────────────────────────────────────────────────────┤
│  Results (Grid or List View Toggle)                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ Company  │ │ Company  │ │ Company  │           │
│  │   Card   │ │   Card   │ │   Card   │           │
│  │          │ │          │ │          │           │
│  └──────────┘ └──────────┘ └──────────┘           │
└─────────────────────────────────────────────────────┘
```

#### Company Card Design
```
┌────────────────────────────────────┐
│ [Company Logo]  Company Name       │
│ Industry Badge                     │
│                                    │
│ X resources • Topics: mobile, ci   │
│                                    │
│ [View Resources →]                 │
└────────────────────────────────────┘
```

#### Company Detail Page/Modal
```
┌─────────────────────────────────────────────┐
│ ← Back                                      │
│                                             │
│ [Logo] Company Name                         │
│ Industry: E-commerce • HQ: Singapore        │
│                                             │
│ Filter: [All Types ▼] [All Topics ▼]       │
│                                             │
│ Resources (15)                              │
│ ┌─────────────────────────────────────┐    │
│ │ 📝 Building virtual device lab       │    │
│ │ by Prabhagharan DK                  │    │
│ │ Topics: mobile-testing, automation  │    │
│ │ [Read Article →]                    │    │
│ └─────────────────────────────────────┘    │
│ ┌─────────────────────────────────────┐    │
│ │ 🎥 E2E tests at Carousell           │    │
│ │ by Abhijeet Vaikar                  │    │
│ │ Topics: e2e-testing, quality        │    │
│ │ [Watch Video →]                     │    │
│ └─────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

#### Features
1. **Multi-filter capability**
   - Filter by industry (dropdown with checkboxes)
   - Filter by topics (multi-select tag input)
   - Filter by resource type (blog, video, etc.)

2. **Search**
   - Full-text search across company names, resource titles
   - Fuzzy search support (Fuse.js)

3. **View Modes**
   - Grid view (cards)
   - List view (compact)

4. **Sorting**
   - Alphabetical (A-Z, Z-A)
   - Most resources
   - Recently added

5. **Responsive Design**
   - Mobile-friendly
   - Touch-optimized filters

6. **Accessibility**
   - Keyboard navigation
   - Screen reader support
   - ARIA labels

---

## Phase 3: Automated Contribution Workflow

### Requirement Analysis

Users should be able to:
1. Submit new resources without touching GitHub
2. Have their contributions automatically acknowledged
3. Allow maintainers to review before merging

### Architecture Options

#### Option A: GitHub Issues as Submission Form
**Flow:**
1. User fills GitHub Issue template
2. GitHub Action parses issue
3. Creates PR automatically
4. Maintainer reviews & merges

**Pros:**
- No backend needed
- GitHub-native
- Issue templates are easy to create

**Cons:**
- Still requires GitHub account
- Not as user-friendly
- Manual parsing needed

#### Option B: Web Form + Netlify/Vercel Functions + GitHub API (Recommended)
**Flow:**
1. User fills web form on site
2. Form submits to serverless function
3. Function validates data
4. Creates new branch via GitHub API
5. Adds JSON file with resource data
6. Opens PR with contributor info
7. GitHub Action validates PR
8. Maintainer reviews & merges

**Pros:**
- Best UX (no GitHub needed)
- Automatic attribution
- Data validation before submission
- Preview of contribution

**Cons:**
- Requires serverless functions
- Need GitHub token management
- More complex setup

#### Option C: Airtable/Google Forms + Zapier/Make + GitHub
**Flow:**
1. User fills Airtable/Google Form
2. Zapier/Make automation triggered
3. Creates PR via GitHub API

**Pros:**
- No code for form
- Easy to set up

**Cons:**
- Dependency on third-party services
- Cost for automation
- Less control

**Recommendation: Option B (Web Form + Serverless)**

### Implementation Details for Option B

#### Frontend Form Component
```
┌──────────────────────────────────────────┐
│  Contribute a Resource                   │
│                                          │
│  Company *                               │
│  [Select existing ▼] or [Add new...]    │
│                                          │
│  Resource Details:                       │
│  Title: [________________]              │
│  URL: [________________]                │
│  Type: [Blog ▼]                         │
│  Author: [________________]             │
│  Topics: [mobile-testing +] [automation +] │
│  Date: [YYYY-MM-DD]                     │
│                                          │
│  Your Info (for attribution):            │
│  Name: [________________]               │
│  GitHub: [________________] (optional)   │
│  Twitter: [________________] (optional)  │
│                                          │
│  [Preview] [Submit]                     │
└──────────────────────────────────────────┘
```

#### API Endpoint (Serverless Function)
```
POST /api/contribute

Request Body:
{
  "company": {
    "id": "carousell",
    "name": "Carousell",
    "industry": "ecommerce",
    "isNew": false
  },
  "resource": {
    "title": "...",
    "url": "...",
    "type": "blog",
    "topics": ["mobile-testing"],
    ...
  },
  "contributor": {
    "name": "John Doe",
    "github": "johndoe",
    "twitter": "johndoe"
  }
}

Response:
{
  "success": true,
  "prUrl": "https://github.com/abhivaikar/howtheytest/pull/123",
  "message": "Thank you! Your contribution has been submitted."
}
```

#### GitHub Actions Workflow
```yaml
name: Validate Contribution PR

on:
  pull_request:
    paths:
      - 'data/companies/**'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Validate JSON Schema
        run: npm run validate:schema

      - name: Check for duplicate URLs
        run: npm run validate:duplicates

      - name: Verify URL accessibility
        run: npm run validate:urls

      - name: Build site preview
        run: npm run build

      - name: Comment PR with preview link
        uses: actions/github-script@v6
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '✅ Validation passed! Preview: [link]'
            })
```

#### Serverless Function (Next.js API Route)
```javascript
// pages/api/contribute.js
import { Octokit } from '@octokit/rest';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1. Validate input
    const { company, resource, contributor } = req.body;

    // 2. Initialize GitHub client
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

    // 3. Create branch
    const branchName = `contrib/${Date.now()}-${company.id}`;

    // 4. Load existing company data or create new
    let companyData = { ...company, resources: [] };
    if (!company.isNew) {
      // Fetch existing data
      const { data } = await octokit.repos.getContent({
        owner: 'abhivaikar',
        repo: 'howtheytest',
        path: `data/companies/${company.id}.json`
      });
      companyData = JSON.parse(Buffer.from(data.content, 'base64').toString());
    }

    // 5. Add new resource
    companyData.resources.push(resource);

    // 6. Create/update file in new branch
    await octokit.repos.createOrUpdateFileContents({
      owner: 'abhivaikar',
      repo: 'howtheytest',
      path: `data/companies/${company.id}.json`,
      message: `Add resource: ${resource.title}`,
      content: Buffer.from(JSON.stringify(companyData, null, 2)).toString('base64'),
      branch: branchName
    });

    // 7. Create pull request
    const { data: pr } = await octokit.pulls.create({
      owner: 'abhivaikar',
      repo: 'howtheytest',
      title: `[Contribution] ${resource.title}`,
      head: branchName,
      base: 'master',
      body: `
## New Resource Contribution

**Company:** ${company.name}
**Resource:** ${resource.title}
**URL:** ${resource.url}
**Type:** ${resource.type}
**Topics:** ${resource.topics.join(', ')}

**Contributed by:** ${contributor.name}
${contributor.github ? `GitHub: @${contributor.github}` : ''}

---
This PR was automatically generated via the contribution form.
      `
    });

    return res.status(200).json({
      success: true,
      prUrl: pr.html_url,
      prNumber: pr.number
    });

  } catch (error) {
    console.error('Contribution error:', error);
    return res.status(500).json({ error: 'Failed to submit contribution' });
  }
}
```

### Contributor Attribution

#### Contributors Page
- Automatically track all contributors
- Display on `/contributors` page
- Use GitHub API to fetch contributor stats
- Show total contributions per person

#### Contributors Data
Store in `/data/contributors.json`:
```json
{
  "contributors": [
    {
      "name": "John Doe",
      "github": "johndoe",
      "twitter": "johndoe",
      "contributions": 5,
      "firstContribution": "2024-01-15"
    }
  ]
}
```

---

## Phase 4: Migration Strategy

### Step 1: Extract Structured Data from README.md

Create a Python/Node.js script to parse existing README.md:

```python
# scripts/migrate_data.py

import re
import json
from pathlib import Path

def extract_companies(readme_content):
    companies = []

    # Split by <details> blocks
    pattern = r'<details>\s*<summary>(.*?)</summary>(.*?)</details>'
    matches = re.finditer(pattern, readme_content, re.DOTALL)

    for match in matches:
        company_name = match.group(1).strip()
        content = match.group(2)

        company = {
            'id': slugify(company_name),
            'name': company_name,
            'industry': classify_industry(company_name),  # ML or manual mapping
            'resources': extract_resources(content)
        }

        companies.append(company)

    return companies

def extract_resources(content):
    resources = []

    # Extract all markdown links
    link_pattern = r'\* \[(.*?)\]\((.*?)\)'
    current_type = None

    for line in content.split('\n'):
        # Detect section headers
        if '#### Blogs' in line:
            current_type = 'blog'
        elif '#### Videos' in line:
            current_type = 'video'
        elif '#### Books' in line:
            current_type = 'book'

        # Extract links
        match = re.search(link_pattern, line)
        if match:
            title = match.group(1)
            url = match.group(2)

            resource = {
                'id': generate_id(),
                'title': title,
                'url': url,
                'type': current_type or 'article',
                'topics': extract_topics(title),  # ML/NLP or manual
                'platforms': extract_platforms(title)
            }

            resources.append(resource)

    return resources

def extract_topics(title):
    # Simple keyword matching (can be enhanced with NLP)
    topic_keywords = {
        'mobile-testing': ['mobile', 'android', 'ios', 'app'],
        'automation': ['automation', 'automated'],
        'ci-cd': ['ci/cd', 'continuous integration', 'continuous deployment'],
        'e2e-testing': ['e2e', 'end-to-end'],
        'performance': ['performance', 'load', 'stress'],
        # ... more mappings
    }

    topics = []
    title_lower = title.lower()

    for topic, keywords in topic_keywords.items():
        if any(kw in title_lower for kw in keywords):
            topics.append(topic)

    return topics

# Run migration
if __name__ == '__main__':
    with open('README.md', 'r') as f:
        content = f.read()

    companies = extract_companies(content)

    # Save individual company files
    Path('data/companies').mkdir(parents=True, exist_ok=True)

    for company in companies:
        filepath = f"data/companies/{company['id']}.json"
        with open(filepath, 'w') as f:
            json.dump(company, f, indent=2)

    print(f"Migrated {len(companies)} companies!")
```

### Step 2: Manual Review & Enhancement

After automated extraction:
1. Review auto-classified industries
2. Manually add missing topics
3. Validate URLs
4. Add descriptions where possible
5. Extract author names from titles/links

### Step 3: Build Aggregation Script

```javascript
// scripts/build-database.js

const fs = require('fs');
const path = require('path');

const companiesDir = './data/companies';
const outputFile = './public/database.json';

function buildDatabase() {
  const companies = [];

  // Read all company JSON files
  const files = fs.readdirSync(companiesDir);

  for (const file of files) {
    if (file.endsWith('.json')) {
      const content = fs.readFileSync(
        path.join(companiesDir, file),
        'utf-8'
      );
      companies.push(JSON.parse(content));
    }
  }

  // Generate metadata
  const database = {
    meta: {
      version: '1.0.0',
      generatedAt: new Date().toISOString(),
      totalCompanies: companies.length,
      totalResources: companies.reduce((sum, c) => sum + c.resources.length, 0)
    },
    companies
  };

  // Write output
  fs.writeFileSync(outputFile, JSON.stringify(database, null, 2));

  console.log(`✅ Built database: ${database.meta.totalCompanies} companies, ${database.meta.totalResources} resources`);
}

buildDatabase();
```

### Step 4: Keep README.md in Sync

Generate README.md from JSON data for backward compatibility:

```javascript
// scripts/generate-readme.js

function generateReadme(database) {
  let markdown = `# How They Test\n\n`;
  markdown += `> A curated collection...\n\n`;

  // Add foreword, kind of topics, etc.

  markdown += `## Companies & how they test their software\n\n`;

  for (const company of database.companies) {
    markdown += `<details>\n`;
    markdown += `  <summary>${company.name}</summary>\n\n`;

    // Group resources by type
    const byType = groupBy(company.resources, 'type');

    for (const [type, resources] of Object.entries(byType)) {
      markdown += `#### ${capitalize(type)}s\n`;

      for (const resource of resources) {
        markdown += `* [${resource.title}](${resource.url})\n`;
      }

      markdown += `\n`;
    }

    markdown += `</details>\n\n`;
  }

  // Add contributors, credits, etc.

  return markdown;
}
```

---

## Implementation Timeline & Milestones

### Phase 1: Data Model & Migration (2-3 weeks)
- [ ] Week 1: Design & finalize data model
  - Define JSON schema
  - Create validation rules
  - Set up topic taxonomy
- [ ] Week 2: Build migration script
  - Parse existing README.md
  - Extract companies & resources
  - Auto-classify topics (basic)
- [ ] Week 3: Manual data enhancement
  - Review extracted data
  - Add missing metadata
  - Validate all URLs

### Phase 2: Frontend Development (3-4 weeks)
- [ ] Week 1: Setup & Infrastructure
  - Initialize Next.js project
  - Set up TypeScript, Tailwind CSS
  - Create basic layout
  - Set up data fetching
- [ ] Week 2: Core Features
  - Build company card component
  - Implement filtering system
  - Add search functionality
  - Create company detail view
- [ ] Week 3: UI Polish
  - Responsive design
  - Dark/light theme
  - Animations & transitions
  - Accessibility improvements
- [ ] Week 4: Testing & Deployment
  - Write tests
  - Performance optimization
  - Deploy to Vercel/Netlify
  - Set up custom domain

### Phase 3: Contribution Workflow (1-2 weeks)
- [ ] Week 1: Build form & API
  - Create contribution form component
  - Build serverless function
  - GitHub API integration
  - Form validation
- [ ] Week 2: Automation & Testing
  - Set up GitHub Actions
  - Validation workflows
  - Test end-to-end flow
  - Documentation

### Phase 4: Launch & Migration (1 week)
- [ ] Final testing
- [ ] Migration announcement
- [ ] Update repository README
- [ ] Monitor for issues

**Total Timeline: 7-10 weeks**

---

## Technical Decisions Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Data Storage** | Individual JSON files per company + aggregated build | Version control friendly, easy to contribute |
| **Frontend Framework** | Next.js + React | Industry standard, excellent SSG, rich ecosystem |
| **Styling** | Tailwind CSS | Rapid development, consistent design system |
| **Search** | Fuse.js | Client-side fuzzy search, no backend needed |
| **Deployment** | Vercel | Native Next.js support, easy CI/CD |
| **Contribution Backend** | Vercel Serverless Functions | Integrated with Next.js, no separate backend |
| **Form Validation** | Zod | Type-safe validation, great TypeScript support |
| **GitHub Integration** | Octokit | Official GitHub API client |
| **Data Validation** | JSON Schema + Ajv | Standard validation, good tooling |

---

## Risk Mitigation

### Risk 1: Data Migration Errors
- **Mitigation**:
  - Keep original README.md
  - Manual review of all migrated data
  - URL validation scripts
  - Comparison tests (old vs new)

### Risk 2: Contributor Adoption
- **Mitigation**:
  - Clear documentation
  - Video tutorials
  - Maintain backward compatibility (GitHub PRs still work)
  - Beta testing with community

### Risk 3: Spam/Invalid Submissions
- **Mitigation**:
  - Rate limiting on API
  - CAPTCHA on form
  - All contributions reviewed before merge
  - Validation checks in CI/CD

### Risk 4: SEO Impact
- **Mitigation**:
  - Proper meta tags
  - Static site generation (SSG)
  - Sitemap generation
  - Maintain URL structure where possible

---

## Open Questions for User

1. **Industry Classification**: Should we manually classify all 102 companies or use a semi-automated approach with review?

2. **Topic Extraction**: How detailed should topics be? Should we start minimal and expand, or invest time in comprehensive tagging upfront?

3. **Design Preferences**: Do you have any specific design inspirations or brand guidelines to follow?

4. **Launch Strategy**:
   - Should we launch with basic features and iterate?
   - Or complete all phases before launch?

5. **Contribution Approval**:
   - Auto-merge after validation?
   - Manual review every PR?
   - Trusted contributors with auto-merge privilege?

6. **Company Logos**: Should we include company logos in cards? If yes, how to source them?

7. **Analytics**: Should we add analytics to track popular resources/companies?

8. **RSS/Newsletter**: Should we add RSS feed or email newsletter for new resources?

---

## Next Steps

1. **Get User Approval** on overall direction
2. **Finalize open questions** listed above
3. **Start with Phase 1**: Data model finalization and migration script
4. **Create GitHub Project** for tracking implementation
5. **Set up development environment** for Next.js

---

## Appendix A: Example Company JSON

```json
{
  "id": "carousell",
  "name": "Carousell",
  "industry": "ecommerce",
  "headquarters": "Singapore",
  "description": "Leading classifieds marketplace in Southeast Asia",
  "website": "https://carousell.com",
  "resources": [
    {
      "id": "caroufarm-device-lab",
      "title": "Building our in-house virtual device lab 'caroufarm'",
      "url": "https://medium.com/carousell-insider/building-our-in-house-virtual-device-lab-caroufarm-e72911e4593b",
      "type": "blog",
      "author": "Prabhagharan DK",
      "publishedDate": "2019-06-15",
      "topics": [
        "mobile-testing",
        "device-lab",
        "automation",
        "infrastructure",
        "virtualization"
      ],
      "platforms": [
        "android",
        "ios"
      ],
      "description": "How Carousell built an in-house virtual device farm for mobile testing"
    },
    {
      "id": "e2e-tests-culture",
      "title": "Automated end-to-end tests and how they fit into our testing culture",
      "url": "https://medium.com/carousell-insider/automated-end-to-end-tests-and-how-they-fit-into-our-testing-culture-54c3fcc5ff26",
      "type": "blog",
      "author": "Martin Schneider",
      "publishedDate": "2019-03-20",
      "topics": [
        "e2e-testing",
        "test-automation",
        "testing-culture",
        "quality-engineering"
      ],
      "platforms": [
        "web",
        "mobile"
      ]
    },
    {
      "id": "browserstack-case-study",
      "title": "Carousell scales app automation with Browserstack",
      "url": "https://www.browserstack.com/case-study/carousell-scales-app-automation-with-browserstack",
      "type": "article",
      "publishedDate": "2020-05-10",
      "topics": [
        "mobile-testing",
        "test-automation",
        "cloud-testing"
      ],
      "platforms": [
        "android",
        "ios"
      ]
    },
    {
      "id": "hustef-2019-device-lab",
      "title": "Building a scalable device lab with Ansible at Carousell",
      "url": "https://www.youtube.com/watch?v=ntRd0tiMZdE",
      "type": "video",
      "author": "Syam Sasi, Martin Schneider",
      "publishedDate": "2019-11-15",
      "event": "HUSTEF 2019",
      "topics": [
        "device-lab",
        "automation",
        "infrastructure",
        "ansible"
      ],
      "platforms": [
        "android",
        "ios"
      ]
    }
  ],
  "meta": {
    "addedDate": "2021-01-15",
    "lastUpdated": "2024-11-20",
    "totalResources": 4,
    "contributors": ["abhivaikar", "johndoe"]
  }
}
```

## Appendix B: JSON Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Company",
  "type": "object",
  "required": ["id", "name", "industry", "resources"],
  "properties": {
    "id": {
      "type": "string",
      "pattern": "^[a-z0-9-]+$",
      "description": "Unique identifier (slug)"
    },
    "name": {
      "type": "string",
      "minLength": 1,
      "description": "Company display name"
    },
    "industry": {
      "type": "string",
      "enum": [
        "ecommerce",
        "fintech",
        "social-media",
        "cloud-services",
        "travel-hospitality",
        "media-streaming",
        "food-delivery",
        "ride-hailing",
        "productivity-tools",
        "developer-tools",
        "gaming",
        "education",
        "healthcare",
        "government",
        "other"
      ]
    },
    "headquarters": {
      "type": "string"
    },
    "description": {
      "type": "string"
    },
    "website": {
      "type": "string",
      "format": "uri"
    },
    "resources": {
      "type": "array",
      "items": {
        "$ref": "#/definitions/resource"
      }
    }
  },
  "definitions": {
    "resource": {
      "type": "object",
      "required": ["id", "title", "url", "type"],
      "properties": {
        "id": {
          "type": "string"
        },
        "title": {
          "type": "string",
          "minLength": 1
        },
        "url": {
          "type": "string",
          "format": "uri"
        },
        "type": {
          "type": "string",
          "enum": ["blog", "video", "article", "book", "talk", "podcast", "handbook", "repo"]
        },
        "author": {
          "type": "string"
        },
        "publishedDate": {
          "type": "string",
          "format": "date"
        },
        "topics": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "platforms": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "description": {
          "type": "string"
        },
        "event": {
          "type": "string",
          "description": "Conference or event name for talks/videos"
        }
      }
    }
  }
}
```
