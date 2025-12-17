#!/bin/bash
# scripts/post-push-sync.sh
# Git push 後に自動的に published-articles.json を同期するスクリプト

echo ""
echo "🔄 GitHub Actions の完了を待機中..."
echo "   （通常は1-2分かかります）"
echo ""

# GitHub Actions の完了を待つ（最大3分）
# 注意: これは簡易的な待機です。GitHub Actions の実際の完了を確認するには
# GitHub API を使用する必要がありますが、ここでは固定時間待機します。
max_wait=120  # 2分待機
elapsed=0
interval=15   # 15秒ごとにチェック

while [ $elapsed -lt $max_wait ]; do
  sleep $interval
  elapsed=$((elapsed + interval))
  
  # 進捗表示
  if [ $((elapsed % 30)) -eq 0 ]; then
    echo "   ⏳ ${elapsed}秒経過... (最大${max_wait}秒)"
  fi
done

echo ""
echo "📥 公開済み記事メタデータを同期中..."
echo ""

# 現在のディレクトリを確認
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# リポジトリのルートディレクトリに移動
cd "$REPO_ROOT" || exit 1

# npm run sync を実行
npm run sync

echo ""
echo "✅ 同期完了！"
echo ""

