---
title: "Multi-Platform Publishing System: Final Verification Test"
published: true
tags: ["publishing", "automation", "test", "multiplatform"]
canonical_url: null
description: "Final comprehensive test to verify that the multi-platform publishing system works correctly across Zenn, Qiita, and Dev.to with proper tag handling and update protection."
---

## Test Objective

This article serves as the final comprehensive test to verify all fixes and improvements made to the multi-platform publishing system.

## What We're Testing

### 1. Platform-Specific Publishing

**Zenn (Japanese)**
- Source: `articles/20260112-final-test.md`
- Expected: Article appears on Zenn with Japanese content
- Tags: Should match frontmatter exactly (no conversion)

**Qiita (Japanese)**
- Source: Auto-converted from `articles/20260112-final-test.md`
- Expected: Article published to Qiita
- Tags: Should match frontmatter exactly (no conversion)

**Dev.to (English)**
- Source: `dev-to/20260112-final-test-en.md`
- Expected: English version published to Dev.to
- Tags: Should be normalized (lowercase, no special chars)

### 2. Tag Handling Verification

**Original Tags**: `["publishing", "automation", "test", "multiplatform"]`

**Expected Results**:
- ✅ Zenn: `["publishing", "automation", "test", "multiplatform"]` (no conversion)
- ✅ Qiita: `["publishing", "automation", "test", "multiplatform"]` (no conversion)
- ✅ Dev.to: `["publishing", "automation", "test", "multiplatform"]` (normalized but already lowercase)

### 3. Update Protection Mechanism

Since this is a **new article**, it should:
- ✅ Be automatically published without `--update` flag
- ✅ Create entries in `published-articles.json`
- ✅ Get platform-specific IDs assigned

### 4. Git Diff Detection

The publish script should:
- ✅ Detect this article via `git diff HEAD~1 HEAD`
- ✅ Process only this changed article
- ✅ Skip all existing published articles (protection)

## Test Execution Steps

```bash
# Step 1: Create test articles
# - articles/20260112-final-test.md (Japanese, for Zenn/Qiita)
# - dev-to/20260112-final-test-en.md (English, for Dev.to)

# Step 2: Commit and push
git add articles/20260112-final-test.md dev-to/20260112-final-test-en.md
git commit -m "テスト: 最終検証用記事"
git push

# Step 3: Run publish script
npm run publish

# Step 4: Verify results on each platform
```

## Expected Console Output

```
🚀 Multi-platform publishing started...

🔍 Git差分検出: 1件の変更ファイル
📝 1件の記事を処理対象とします
ℹ️  更新モード: 既存記事の更新はスキップします

============================================================
📄 処理対象記事: マルチプラットフォーム発布システム最終検証 (20260112-final-test)
============================================================
  🔍 Qiita用変換済みファイルを検出
  📝 Qiita: 新規投稿を作成中
    ✅ Qiita 新規投稿成功

  🌐 Dev.to英語版（手動作成）を検出
  📌 使用するtag: publishing, automation, test, multiplatform
  📝 Dev.to英語版: 新規作成リクエスト送信...
    ✅ Dev.to英語版 作成成功

  💾 メタデータを保存しました

🎉 公開処理が完了しました
```

## Key Improvements Verified

### ✅ 1. Duplicate Publishing Prevention
- Git diff-based detection prevents processing unchanged articles
- Fallback safety: Returns empty array instead of all articles on error

### ✅ 2. Update Protection
- Existing articles are protected by default
- Explicit `--update` flag required to modify published content
- Prevents accidental updates from typo fixes

### ✅ 3. Tag Normalization Clarity
- **Zenn**: No conversion (uses frontmatter `topics` directly)
- **Qiita**: No conversion (uses frontmatter `topics` directly)
- **Dev.to**: `normalizeDevToTag` applied (lowercase + special char removal)

### ✅ 4. Sync Script Improvements
- Prioritizes existing IDs to prevent duplicate matching
- Better duplicate detection across languages (en/ja)
- Prevents same article from having multiple versions

## Success Criteria

This test is successful if:

1. ✅ Article appears on all 3 platforms (Zenn, Qiita, Dev.to)
2. ✅ Tags are correct on each platform (no unexpected conversions)
3. ✅ Only this new article is processed (existing articles protected)
4. ✅ IDs are correctly recorded in `published-articles.json`
5. ✅ No duplicate versions created on Dev.to

---

## Conclusion

If all checks pass, the multi-platform publishing system is now production-ready with:
- ✅ Reliable Git-based change detection
- ✅ Safe update protection mechanism
- ✅ Correct tag handling per platform
- ✅ Prevention of duplicate publishing

**System Status**: Ready for production use! 🚀
