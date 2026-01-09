---
title: "マルチプラットフォーム記事発布システムのテスト"
emoji: "🚀"
type: "tech"
topics: ["GitHub", "自動化", "技術記事", "DevOps"]
published: true

# プラットフォーム設定
platforms:
  qiita: true   # Qiitaに発布
  devto: true   # Dev.toに発布（英語版）
---

## マルチプラットフォーム発布システムとは

このシステムは、1つの記事を複数のプラットフォームに自動的に発布できる仕組みです。

### 主な機能

1. **自動変換**
   - Zenn形式の記事をQiita形式に変換
   - メッセージボックスなどの記法を自動調整

2. **多言語対応**
   - 日本語版：Qiita + Dev.to
   - 英語版：Dev.to（手動作成時）

3. **重複防止**
   - published-articles.json で発布状態を管理
   - 既存記事は更新、新規記事は作成

## 発布フロー

```bash
# 1. 記事を作成
articles/your-article.md

# 2. 英語版を作成（オプション）
dev-to/your-article-en.md

# 3. プレビュー
npm run preview:all

# 4. 発布
git add articles/ images/ -f dev-to/*-en.md
git commit -m "記事追加: タイトル"
git push
```

## メリット

- ✅ 一度書けば複数プラットフォームに展開
- ✅ GitHub Actionsで自動化
- ✅ SEO効果の最大化

## まとめ

マルチプラットフォーム発布システムを使うことで、記事執筆の効率が大幅に向上します。

このテスト記事が正常に発布されれば、システムは正常に動作しています！
