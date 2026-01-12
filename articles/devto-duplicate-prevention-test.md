---
title: "Dev.to公開テスト記事 - 重複投稿防止検証"
emoji: "🧪"
type: "tech"
topics: ["テスト", "Dev.to", "検証"]
published: true

# マルチプラットフォーム投稿設定
platforms:
  qiita: false   # Qiitaには投稿しない
  devto: true    # Dev.toに投稿（英語版）
---

## テスト目的

この記事は、Dev.toへの重複投稿バグが修正されたことを検証するためのテスト記事です。

## 検証項目

- ✅ Git差分で検出された記事のみが投稿される
- ✅ 他の既存記事が同時に投稿されない
- ✅ 英語版ファイルが正しく読み込まれる

## 期待結果

- テスト記事のみがDev.toに投稿される
- 他の既存記事（AI時代に手動APIテストが破綻する理由10選、AIプログラミングの質を決める3つのエンジニアリングSkillとは、Apidog MCPサーバー入門）は投稿されない

## テスト手順

```bash
# 1. テスト記事をコミット
git add articles/devto-duplicate-prevention-test.md
git commit -m "テスト: Dev.to重複投稿防止検証"
git push

# 2. 公開スクリプト実行
npm run publish

# 3. 結果確認
# テスト記事のみが投稿され、他の記事は投稿されないことを確認
```

## まとめ

このテストが成功すれば、Dev.toへの重複投稿バグは修正されています。
