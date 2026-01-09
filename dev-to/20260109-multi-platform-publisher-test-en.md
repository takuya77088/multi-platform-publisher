---
title: "Multi-Platform Article Publishing System: A Complete Guide"
published: true
tags: ["github", "automation", "devops", "productivity"]
canonical_url: null
description: "Learn how to build an automated multi-platform publishing system that distributes your technical articles to Qiita, Dev.to, and more with a single push."
---

## What is a Multi-Platform Publishing System?

A multi-platform publishing system allows you to write an article once and automatically publish it across multiple platforms, saving time and maximizing your content's reach.

### Key Features

1. **Automatic Conversion**
   - Converts Zenn-format articles to Qiita format
   - Auto-adjusts syntax like message boxes and code blocks

2. **Multi-Language Support**
   - Japanese version: Qiita + Dev.to
   - English version: Dev.to (manually created)

3. **Duplicate Prevention**
   - Manages publishing state via `published-articles.json`
   - Updates existing articles, creates new ones automatically

## Publishing Workflow

```bash
# 1. Create your article
articles/your-article.md

# 2. Create English version (optional)
dev-to/your-article-en.md

# 3. Preview
npm run preview:all

# 4. Publish
git add articles/ images/ -f dev-to/*-en.md
git commit -m "Add article: Title"
git push
```

## Benefits

- ✅ Write once, publish everywhere
- ✅ Automated via GitHub Actions
- ✅ Maximize SEO impact

## System Architecture

The system consists of three main components:

### 1. Conversion Script (`convert-articles.js`)
- Detects changed articles via Git diff
- Converts to platform-specific formats
- Applies tag limits (Qiita: 5, Dev.to: 4)

### 2. Publishing Script (`publish-articles.js`)
- Reads converted articles
- Publishes to Qiita and Dev.to APIs
- Updates metadata JSON for duplicate prevention

### 3. GitHub Actions Workflow
- Triggers on push to `main` branch
- Runs conversion and publishing automatically
- Caches `published-articles.json` between runs

## Real-World Example

Here's how I publish articles daily:

```bash
# Write article in Zenn format
vim articles/my-new-article.md

# Create English version for Dev.to
vim dev-to/my-new-article-en.md

# Preview locally
npm run preview:all

# Publish to all platforms
git add articles/ images/ -f dev-to/*-en.md
git commit -m "Add: My New Article"
git push
```

GitHub Actions handles the rest automatically!

## Conclusion

This multi-platform publishing system dramatically improves content creation efficiency. By automating the distribution process, you can focus on writing great content while reaching a wider audience.

If this test article publishes successfully, the system is working correctly! 🎉

---

**Tech Stack:**
- Node.js
- GitHub Actions
- Qiita API
- Dev.to API
- gray-matter (frontmatter parser)
