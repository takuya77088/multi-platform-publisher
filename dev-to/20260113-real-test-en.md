---
title: "System Operation Verification Test"
published: true
tags: ["testing", "automation", "verification"]
canonical_url: null
description: "A comprehensive test to verify that the multi-platform publishing system works correctly across Zenn, Qiita, and Dev.to."
---

## Test Objective

This article serves as a comprehensive test to verify all system functionalities.

## What We're Testing

### 1. Platform-Specific Publishing

**Zenn (Japanese)**
- Source: `articles/20260113-real-test.md`
- Expected: Article appears on Zenn with Japanese content

**Qiita (Japanese)**
- Source: Auto-converted from `articles/20260113-real-test.md`
- Expected: Article published to Qiita

**Dev.to (English)**
- Source: `dev-to/20260113-real-test-en.md`
- Expected: English version published to Dev.to

### 2. Tag Handling Verification

**Expected Results**:
- ✅ Zenn: `["test", "automation", "verification"]`
- ✅ Qiita: `["test", "automation", "verification"]`
- ✅ Dev.to: `["testing", "automation", "verification"]`

### 3. Metadata Recording

The system should:
- ✅ Create entries in `published-articles.json`
- ✅ Record platform-specific IDs
- ✅ Record article URLs

## Success Criteria

This test is successful if:

1. ✅ Article appears on all 3 platforms (Zenn, Qiita, Dev.to)
2. ✅ Tags are correct on each platform
3. ✅ Only this new article is processed
4. ✅ IDs are correctly recorded in `published-articles.json`
5. ✅ No duplicate articles are created

---

**System Status**: Testing in progress... 🧪
