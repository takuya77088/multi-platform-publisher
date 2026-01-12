---
title: "マルチプラットフォーム発布システム最終検証"
emoji: "🚀"
type: "tech"
topics: ["github", "automation", "devops", "ci", "publishing"]
published: true

# マルチプラットフォーム投稿設定
platforms:
  qiita: true    # Qiitaに投稿
  devto: true    # Dev.toに投稿（英語版）
---

## テスト目的

このテストでは、以下の機能が正しく動作することを検証します：

### 1. Git差分検出の正確性
- ✅ 変更された記事のみが検出される
- ✅ 既存記事は更新保護により自動更新されない

### 2. 3プラットフォーム同時発布
- ✅ Zenn: 日本語版（articles/のまま）
- ✅ Qiita: 日本語版（自動変換）
- ✅ Dev.to: 英語版（dev-to/xxx-en.md から）

### 3. タグ処理の正確性
- **Zenn**: topics をそのまま使用（変換なし）
- **Qiita**: topics をそのまま使用（最大5個）
- **Dev.to**: 英語版ファイルのtagsを使用（正規化あり）

## テスト検証項目

### 1. 新規記事の自動公開
- ✅ Git差分で新規記事を検出
- ✅ 3つのプラットフォームに自動公開

### 2. プラットフォーム別設定
- ✅ Zenn: articles/のtopicsをそのまま使用
- ✅ Qiita: articles/のtopicsをそのまま使用（最大5個）
- ✅ Dev.to: 英語版ファイル（dev-to/xxx-en.md）から英語tagを使用

### 3. 更新保護機能
- ✅ 既存記事は --update フラグなしでは更新されない
- ✅ 新規記事は自動的に発布される

## テスト内容

この記事は以下の機能をテストします：

1. **Zenn**: articles/のmarkdownファイルがそのまま表示される
2. **Qiita**: articles/を変換して投稿（日本語、タグ5個まで）
3. **Dev.to**: dev-to/xxx-en.mdの英語版を投稿（タグ4個まで）

## 期待される結果

✅ **Zenn**: この記事が表示される（topics: test, automation, verification の3つ）
✅ **Qiita**: 日本語版が投稿される（tags: test, automation, verification, multiplatform, github - 最大5個）
✅ **Dev.to**: 英語版が投稿される（tags: testing, automation, devops, github）

## テスト内容

この記事は、以下の機能が正しく動作することを検証します：

1. **Git差分検出**
   - 新規記事のみが検出される
   - 既存記事は更新保護機能により保護される

2. **3プラットフォーム対応**
   - Zenn: articles/このファイルがそのまま表示される
   - Qiita: 自動変換されて投稿される
   - Dev.to: 英語版（dev-to/xxx-en.md）が投稿される

3. **タグ処理**
   - Zenn: topics フィールドをそのまま使用
   - Qiita: topics を直接使用（最大5個）
   - Dev.to: 英語版ファイルのtagsを使用（最大4個、小文字変換）

## 期待される結果

✅ Zenn: この記事が表示される（articles/がそのまま反映）
✅ Qiita: 日本語版が投稿される
✅ Dev.to: 英語版が投稿される（dev-to/xxx-en.mdを使用）

## テスト内容

このテストでは以下を検証します：

1. **Git差分検出**: 新規記事のみが処理される
2. **プラットフォーム選択**: 3つのプラットフォームすべてに投稿
3. **Dev.to英語版**: dev-to/xxx-en.md が優先される
4. **更新保護**: 既存記事は保護される（--updateなしでは更新されない）

## 期待される結果

### Zenn (articles/)
- ✅ このテスト記事が表示される
- ✅ topics: test, multiplatform, verification, automation

### Qiita (日本語)
- ✅ 新規投稿される
- ✅ タグ: test, multiplatform, automation, verification, publish

### Dev.to (英語版)
- ✅ 英語版ファイルから投稿される
- ✅ タグ: testing, automation, devops, ci

## テスト手順

```bash
# 1. 記事を追加してコミット
git add articles/20260112-final-test.md dev-to/20260112-final-test-en.md
git commit -m "テスト: 3プラットフォーム発布機能の最終検証"
git push

# 2. 発布スクリプト実行
npm run publish

# 3. 結果確認
# - Zenn: articles/ に記事が追加されていることを確認
# - Qiita: 日本語版が発布されていることを確認
# - Dev.to: 英語版が発布されていることを確認
```

## 検証項目

### ✅ Zenn (自動)
- [ ] articles/フォルダの記事が表示される
- [ ] topics: ["test", "multiplatform", "automation", "publishing"] が正しく表示される

### ✅ Qiita (platforms.qiita: true)
- [ ] 日本語記事が正しく投稿される
- [ ] Qiita形式に変換される（メッセージボックスなど）
- [ ] タグが正しく表示される（最大5個）

### ✅ Dev.to (platforms.devto: true)
- [ ] 英語版ファイル（dev-to/xxx-en.md）が使用される
- [ ] 英語タグが正しく適用される
- [ ] 新規作成される（既存記事がないため）

## 検証ポイント

### 1. Git差分検出
- ✅ 新規記事が正しく検出される
- ✅ 既存記事は保護される（--update なし）

### 2. プラットフォーム別処理
- ✅ Qiita: 日本語版が投稿される
- ✅ Dev.to: 英語版が投稿される（dev-to/xxx-en.md）
- ✅ Zenn: articles/がそのまま表示される

### 3. Tag処理
- ✅ Zenn/Qiita: 変換なし（元のtopics）
- ✅ Dev.to: normalizeDevToTag適用（小文字化）

### 4. 更新保護機能
- ✅ 新規記事のため自動公開される
- ✅ --update フラグは不要

## テスト手順

1. この記事をコミット＆プッシュ
2. npm run publish を実行
3. 各プラットフォームで確認

## 期待結果

- ✅ Zenn: タグは["publishing", "automation", "test", "multiplatform"]
- ✅ Qiita: タグは["publishing", "automation", "test", "multiplatform"]
- ✅ Dev.to: タグは["publishing", "automation", "test", "multiplatform"]（小文字化）

---

このテストが成功すれば、すべての修正が正しく動作していることが証明されます！🎉
