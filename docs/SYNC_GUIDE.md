# 🔄 公開済み記事メタデータ同期ガイド

## 📋 概要

`sync-published-articles.js` スクリプトは、各プラットフォーム（Qiita、Dev.to）の API から公開済み記事の情報を取得し、ローカルの `published-articles.json` を最新状態に更新します。

GitHub Actions 実行後、ローカルファイルを最新状態に保つために使用します。

## 🚀 使用方法

### 基本的な使用方法

```bash
# 環境変数を設定（.env ファイルまたは直接設定）
export QIITA_API_TOKEN="your_qiita_token"
export DEV_TO_API_KEY="your_dev_to_api_key"

# 同期スクリプトを実行
npm run sync
```

### 環境変数の設定

`.env` ファイルを作成するか、環境変数を直接設定：

```bash
# .env ファイルの例
QIITA_API_TOKEN=your_qiita_token_here
DEV_TO_API_KEY=your_dev_to_api_key_here
QIITA_USERNAME=kazuya828  # オプション（デフォルト: kazuya828）
DEV_TO_USERNAME=nakamura_takuya  # オプション（デフォルト: nakamura_takuya）
```

## 🔍 動作の仕組み

1. **ローカル記事の読み込み**
   - `articles/` ディレクトリからすべての Markdown ファイルを読み込み
   - 各ファイルのタイトルとファイル名を取得

2. **API からの記事取得**
   - Qiita API からユーザーの公開記事一覧を取得
   - Dev.to API からユーザーの公開記事一覧を取得

3. **マッチング処理**
   - API から取得した記事のタイトルとローカル記事のタイトルを比較
   - 完全一致 → 部分一致 → ファイル名一致の順でマッチング

4. **メタデータ更新**
   - マッチした記事の ID と URL を `published-articles.json` に保存
   - 既存のデータは保持し、新しい情報のみ更新

## 📝 実行例

```bash
$ npm run sync

🔄 公開済み記事メタデータの同期を開始...

📋 ローカル記事: 7件

📥 Qiita から記事一覧を取得中... (ユーザー: kazuya828)
  ✅ 6件の記事を取得しました
📥 Dev.to から記事一覧を取得中... (ユーザー: nakamura_takuya)
  ✅ 6件の記事を取得しました

🔄 メタデータを更新中...

  ✅ Qiita: cloudflare-mcp-server-setup -> 1c9f680e30d32a339e59
  ✅ Dev.to: cloudflare-mcp-server-setup -> 3110842

🎉 同期完了!
  📊 更新: 2件
  📊 新規: 0件
  💾 ファイルを保存しました: config/published-articles.json
```

## ⚠️ 注意事項

1. **API トークンが必要**
   - Qiita と Dev.to の API トークンが必要です
   - トークンが設定されていないプラットフォームはスキップされます

2. **マッチングの精度**
   - タイトルが完全に一致しない場合、マッチングに失敗する可能性があります
   - マッチングに失敗した記事は警告メッセージが表示されます

3. **既存データの保持**
   - 既存のメタデータは保持されます
   - 新しい情報のみが追加・更新されます

## 🔧 トラブルシューティング

### マッチングに失敗する場合

記事のタイトルがローカルとプラットフォームで異なる場合、マッチングに失敗します。

**解決方法**：
1. 記事のタイトルを確認
2. 必要に応じて手動で `published-articles.json` を編集

### API エラーが発生する場合

**原因**：
- API トークンが無効
- ネットワークエラー
- API レート制限

**解決方法**：
1. API トークンを確認
2. ネットワーク接続を確認
3. しばらく待ってから再実行

## 📚 関連コマンド

```bash
# 記事変換
npm run convert

# 記事公開（ローカル実行）
npm run publish

# メタデータ同期
npm run sync
```

