# 🔄 自動同期機能

## 📋 概要

Git push 後に自動的に `published-articles.json` を同期する機能です。

## 🚀 セットアップ

### 初回セットアップ

```bash
# Git hook をインストール
npm run install:hook
```

これで、以後 `git push` を実行すると自動的に同期が実行されます。

## 🔧 動作の仕組み

1. **Git push 実行**
   ```bash
   git push origin main
   ```

2. **自動的に post-push hook が実行**
   - GitHub Actions の完了を待機（約2分）
   - 自動的に `npm run sync` を実行
   - バックグラウンドで実行されるため、作業をブロックしません

3. **同期完了**
   - `published-articles.json` が最新状態に更新されます

## ⚙️ カスタマイズ

### 待機時間を変更する場合

`scripts/post-push-sync.sh` の `max_wait` 変数を変更：

```bash
max_wait=120  # 秒単位（デフォルト: 120秒 = 2分）
```

### Hook を無効化する場合

```bash
rm .git/hooks/post-push
```

### 手動で同期する場合

```bash
npm run sync
```

## 📝 注意事項

1. **初回セットアップが必要**
   - 新しい環境では `npm run install:hook` を実行してください
   - Git hook はリポジトリに含まれないため、各環境で設定が必要です

2. **待機時間について**
   - デフォルトで2分待機します
   - GitHub Actions が完了する前に同期が実行される可能性があります
   - その場合は手動で `npm run sync` を実行してください

3. **バックグラウンド実行**
   - Hook はバックグラウンドで実行されるため、すぐに次の作業に進めます
   - 同期の進捗はターミナルに表示されます

## 🔍 トラブルシューティング

### Hook が実行されない場合

```bash
# Hook ファイルの存在を確認
ls -la .git/hooks/post-push

# 実行権限を確認
chmod +x .git/hooks/post-push

# 再インストール
npm run install:hook
```

### 同期が失敗する場合

```bash
# 環境変数を確認
echo $QIITA_API_TOKEN
echo $DEV_TO_API_KEY

# 手動で同期を実行
npm run sync
```

