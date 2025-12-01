# Git Branch Structure

## Overview

The repository now has a well-organized branch structure to safely manage the redesign while preserving the current production site.

---

## Branches

### 1. `master` (Main Branch)
- **Status**: Current production version (old docsify site)
- **Purpose**: Main branch, currently unchanged
- **Contains**: Original README.md-based docsify site
- **Use**: Production deployment via GitHub Pages

### 2. `production-backup` (Safety Backup)
- **Status**: Exact copy of current master
- **Purpose**: Safety backup of the current production site
- **Contains**: Same as master - original docsify site
- **Use**: Fallback if anything goes wrong

### 3. `redesign-v2` (Development Branch) ⭐
- **Status**: Active development with all new changes
- **Purpose**: Complete redesign with structured data + Next.js
- **Contains**:
  - Phase 1: Structured JSON data (101 companies, 784 resources)
  - Phase 2: Next.js foundation with basic homepage
  - All migration scripts and documentation
- **Use**: Continue development here

---

## Branch Relationships

```
master (f1452c4)
├── production-backup (f1452c4) [Safety copy]
└── redesign-v2 (b98ea67) [Active development - 125 files changed]
```

---

## Current Commit Details

### `master` & `production-backup`
```
commit f1452c4
Date: Recent
Message: "Merge pull request #140 from gdonati78/add-trivago-gql-blog"
```

### `redesign-v2`
```
commit b98ea67
Date: 2025-12-01
Message: "Phase 1 & 2: Data migration and Next.js foundation"
Files: 125 files changed, 20,888 insertions(+)
```

---

## How to Work with These Branches

### Continue Development
```bash
# Switch to redesign branch
git checkout redesign-v2

# Start dev server
npm install  # if needed
npm run dev

# Make changes and commit
git add .
git commit -m "Your message"
```

### View Current Production Site
```bash
# Switch to production backup
git checkout production-backup

# Or stay on master
git checkout master

# The original docsify site is unchanged here
```

### When Ready to Deploy Redesign
```bash
# 1. Ensure redesign-v2 is complete
git checkout redesign-v2
npm run build

# 2. Merge into master (when ready)
git checkout master
git merge redesign-v2

# 3. Push to GitHub
git push origin master

# 4. Deploy will happen automatically via GitHub Pages
```

---

## File Differences

### `master` / `production-backup`
```
howtheytest/
├── index.html              # Docsify entry point
├── _coverpage.md
├── README.md               # All content in markdown
├── _config.yml
├── .nojekyll
└── howtheytest-banner-transparent.png
```

### `redesign-v2`
```
howtheytest/
├── app/                    # Next.js pages
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/             # React components (pending)
├── data/
│   ├── companies/          # 101 JSON files
│   ├── schemas/
│   └── topics.json
├── lib/                    # Utilities
├── public/
│   ├── database.json       # Aggregated data
│   └── database.min.json
├── scripts/                # Migration & build scripts
├── types/                  # TypeScript definitions
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json            # Updated with Next.js
├── IMPLEMENTATION_PLAN.md
├── PHASE1_COMPLETE.md
└── PHASE2_PROGRESS.md
```

---

## Safety Measures

✅ **Original site preserved** in both `master` and `production-backup`
✅ **All new work isolated** in `redesign-v2` branch
✅ **No risk to production** - changes only merged when ready
✅ **Easy rollback** - can always return to `production-backup`

---

## Next Steps

1. **Continue on `redesign-v2`**: Build remaining Phase 2 features
2. **Test thoroughly**: Ensure everything works
3. **Review & approve**: Check the redesign meets requirements
4. **Merge to master**: Deploy when ready
5. **Update GitHub Pages**: Site automatically updates

---

## Quick Reference

| Branch | Purpose | State | Safe to Deploy? |
|--------|---------|-------|-----------------|
| `master` | Production | Current live site | ✅ Yes (live) |
| `production-backup` | Backup | Same as master | ✅ Yes (backup) |
| `redesign-v2` | Development | Active work | ⏳ Not yet (WIP) |

---

Generated on: 2025-12-01
