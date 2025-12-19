#!/bin/bash
# scripts/trigger-zenn-sync.sh
# Zenn の統計更新を促すために、記事ファイルに微小な変更を加えて再コミットするスクリプト

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ARTICLES_DIR="$REPO_ROOT/articles"

echo "🔄 Zenn 統計更新を促すスクリプト"
echo ""

# 記事ファイルを選択
if [ -z "$1" ]; then
  echo "使用方法: $0 <記事ファイル名>"
  echo "例: $0 cloudflare-mcp-server-setup.md"
  echo ""
  echo "利用可能な記事:"
  ls -1 "$ARTICLES_DIR"/*.md | xargs -n1 basename
  exit 1
fi

ARTICLE_FILE="$ARTICLES_DIR/$1"

if [ ! -f "$ARTICLE_FILE" ]; then
  echo "❌ エラー: 記事ファイルが見つかりません: $ARTICLE_FILE"
  exit 1
fi

echo "📝 処理対象: $1"
echo ""

# 記事の末尾に空行を追加（既に空行がある場合は追加しない）
if [ -n "$(tail -c 1 "$ARTICLE_FILE")" ]; then
  # ファイルが改行で終わっていない場合
  echo "" >> "$ARTICLE_FILE"
  echo "✅ 記事末尾に空行を追加しました"
else
  # 既に改行で終わっている場合、コメントを追加
  echo "" >> "$ARTICLE_FILE"
  echo "<!-- Zenn sync trigger -->" >> "$ARTICLE_FILE"
  echo "✅ 記事末尾にコメントを追加しました"
fi

# Git に追加
cd "$REPO_ROOT" || exit 1
git add "$ARTICLE_FILE"

# コミット
COMMIT_MSG="fix: Zenn統計更新を促すため記事を更新 ($1)"
git commit -m "$COMMIT_MSG"

echo ""
echo "✅ 変更をコミットしました"
echo ""
echo "📤 次のコマンドでプッシュしてください:"
echo "   git push origin main"
echo ""
echo "💡 プッシュ後、Zenn が自動的に記事を再同期し、統計が更新されるはずです。"
echo "   通常、24-48時間以内に統計が反映されます。"
