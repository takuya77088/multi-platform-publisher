---
title: "Dev.to重複投稿バグ修正の検証"
emoji: "🔧"
type: "tech"
topics: ["test", "devto", "verification", "bugfix"]
published: true

# マルチプラットフォーム投稿設定
platforms:
  qiita: false   # Qiitaには投稿しない
  devto: true    # Dev.toに投稿（英語版）
---

## 検証目的

この記事は、Dev.to重複投稿バグの修正が正しく動作することを検証するためのテスト記事です。

## 修正内容

### 1. Git差分検出失敗時のフォールバック修正

**修正前**：Git差分検出に失敗すると、全記事が処理対象になってしまう

```javascript
} catch (error) {
  console.log("⚠️  Git差分取得に失敗、全記事を対象とします");
  return loadMarkdownFiles(); // ❌ 危険！
}
```

**修正後**：失敗時は空配列を返し、安全性を確保

```javascript
} catch (error) {
  console.error("❌ Git差分取得に失敗しました:", error.message);
  console.error("🛑 安全のため、記事の処理をスキップします");
  return []; // ✅ 安全！
}
```

### 2. .gitignore設定の修正

dev-to/ディレクトリがGit追跡から正しく除外されるように修正しました。

### 3. タグ変換の改善

日本語タグ使用時に警告を表示し、英語版ファイルの作成を推奨するようにしました。

## 期待される結果

✅ この記事のみがDev.toに投稿される
✅ 他の既存記事（AI時代に～、AIプログラミング～、Apidog MCP～）は投稿されない
✅ 英語版ファイルのタグが正しく使用される

## テスト実行

```bash
# 記事を追加してコミット
git add articles/20260112-devto-fix-verification.md
git add dev-to/20260112-devto-fix-verification-en.md
git commit -m "テスト: Dev.to修正検証"
git push

# 発布スクリプト実行
npm run publish
```

## まとめ

このテストが成功すれば、Dev.to重複投稿バグは完全に修正されています。
