---
title: "Test Article: Multi-Platform Publishing Verification"
published: true
tags: ["Test", "Multi-Platform", "Automation"]
---


This is a test article for the multi-platform publishing feature.

## Test Purpose

This article is created to verify the following:

- Automatic posting to Qiita
- Automatic posting to Dev.to Japanese version
- Automatic posting to Dev.to English version (manually created)

## Test Content

### 1. Qiita

For Qiita, the converted file in `qiita/public/` will be posted.

### 2. Dev.to Japanese Version

The Dev.to Japanese version will be automatically converted from `articles/` and posted.

### 3. Dev.to English Version

The Dev.to English version will be posted from the manually created file in `dev-to/`.

## Technical Verification Items

- [x] Correct frontmatter settings
- [x] Tag normalization processing
- [x] Accurate ID recording
- [x] Prevention of duplicate posting

## Summary

If this test is successful, it confirms that the multi-platform publishing system is working correctly.
