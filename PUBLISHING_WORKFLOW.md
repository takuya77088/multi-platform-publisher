# 記事発布ワークフロー

## 📋 前提条件

- `dev-to/` フォルダは**常に**リモートリポジトリに表示されません
- 英語版の記事は**本地で発布**します
- GitHub Actions は日本語版（Qiita/Zenn）のみ自動発布します

---

## 🇯🇵 日本語版の発布（3プラットフォーム）

### 対象プラットフォーム
- ✅ Zenn: 日本語版
- ✅ Qiita: 日本語版
- ✅ Dev.to: 日本語版（自動変換）

### 発布手順

```bash
# 1. プレビュー確認
npm run preview:all

# 2. リモート更新を取得
git pull origin main

# 3. ステータス確認
git status

# 4. ファイルを追加（dev-to/ は含めない）
git add articles/ images/

# 5. コミット
git commit -m "記事追加: XXXX"

# 6. プッシュ
git push origin main

# 7. GitHub Actions が自動実行されるまで待つ（約30秒）

# 8. メタデータを同期
npm run sync
```

**重要**：
- ❌ `git add -f dev-to/*-en.md` は**使用しない**
- ✅ GitHub Actions が自動的に3プラットフォームに発布します

---

## 🇬🇧 英語版の発布（Dev.to のみ）

### 対象プラットフォーム
- ✅ Zenn: 日本語版
- ✅ Qiita: 日本語版
- ✅ Dev.to: **英語版**

### 発布手順

```bash
# 1. 英語版ファイルを作成
# ファイル名: dev-to/記事キー-en.md
# 例: dev-to/cloudflare-mcp-server-setup-en.md

# 2. プレビュー確認
npm run preview:all

# 3. リモート更新を取得
git pull origin main

# 4. ステータス確認
git status

# 5. ファイルを追加（dev-to/ は含めない）
git add articles/ images/

# 6. コミット
git commit -m "記事追加: XXXX（英語版追加予定）"

# 7. プッシュ
git push origin main

# 8. GitHub Actions が Qiita/Zenn を発布するまで待つ（約30秒）

# 9. ⭐ 本地で Dev.to 英語版を発布
npm run publish

# 10. メタデータを同期
npm run sync
```

**重要**：
- ❌ `git add -f dev-to/*-en.md` は**使用しない**
- ❌ `dev-to/` ファイルは**リモートに推送しない**
- ✅ `npm run publish` でローカルから直接 Dev.to に発布します
- ✅ これにより、リモートリポジトリに `dev-to/` が表示されません

---

## ❓ よくある質問

### Q1: なぜ `git add -f dev-to/*-en.md` を使わないのですか？

**A**:
- `git add -f` で追加すると、ファイルがリモートリポジトリに表示されます
- これはあなたの「リモートに表示したくない」という要求と矛盾します
- ローカルで `npm run publish` を実行すれば、リモートに推送せずに発布できます

### Q2: GitHub Actions で英語版を発布できませんか？

**A**:
- できますが、その場合は `dev-to/` ファイルをリモートに推送する必要があります
- GitHub Actions はリモートリポジトリからファイルを読み取るため、ファイルがないと発布できません
- 「リモートに表示したくない」という要求を満たすには、ローカル発布が最適です

### Q3: npm run publish は安全ですか？

**A**:
- ✅ はい、完全に安全です
- ✅ GitHub Actions と同じスクリプトを実行します
- ✅ 数秒で完了します
- ✅ 既存記事の更新保護機能も動作します

### Q4: published-articles.json はどうなりますか？

**A**:
- `npm run publish` 実行後、ローカルの `config/published-articles.json` が更新されます
- このファイルは `.gitignore` に含まれているため、リモートには推送されません
- `npm run sync` で最新状態を同期できます

---

## 📝 まとめ

### ✅ 推奨ワークフロー

| 発布タイプ | コマンド | リモート表示 |
|-----------|---------|------------|
| 日本語版 | `git add articles/ images/` → `git push` | articles/ のみ |
| 英語版 | `git add articles/ images/` → `git push` → `npm run publish` | articles/ のみ |

### ❌ 使用しないコマンド

```bash
# ❌ これは使わない（リモートに dev-to/ が表示される）
git add -f dev-to/*-en.md
```

### ✅ 正しいワークフロー

```bash
# ✅ これを使う（リモートに dev-to/ は表示されない）
git add articles/ images/
npm run publish  # 英語版のみ必要な場合
```

---

## 🎯 このワークフローの利点

1. ✅ リモートリポジトリに `dev-to/` が表示されない
2. ✅ コードが反復して変更されない
3. ✅ シンプルで一貫性のあるフロー
4. ✅ GitHub Actions と手動発布を組み合わせた柔軟性
5. ✅ 既存記事の更新保護が正常に動作

---

最終更新: 2026-01-13
