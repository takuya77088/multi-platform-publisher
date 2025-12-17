#!/bin/bash
# scripts/install-post-push-hook.sh
# Git post-push hook をインストールするスクリプト

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
HOOK_FILE="$REPO_ROOT/.git/hooks/post-push"

echo "🔧 Git post-push hook をインストール中..."

# hook ファイルを作成
cat > "$HOOK_FILE" << 'EOF'
#!/bin/bash
# .git/hooks/post-push
# Git push 後に自動的に published-articles.json を同期するフック

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
SYNC_SCRIPT="$REPO_ROOT/scripts/post-push-sync.sh"

if [ -f "$SYNC_SCRIPT" ] && [ -x "$SYNC_SCRIPT" ]; then
  # バックグラウンドで実行（ユーザーの作業をブロックしない）
  "$SYNC_SCRIPT" &
else
  echo "⚠️  同期スクリプトが見つかりません: $SYNC_SCRIPT"
fi

exit 0
EOF

# 実行権限を付与
chmod +x "$HOOK_FILE"

# post-push-sync.sh にも実行権限を付与（重要！）
SYNC_SCRIPT="$REPO_ROOT/scripts/post-push-sync.sh"
if [ -f "$SYNC_SCRIPT" ]; then
  chmod +x "$SYNC_SCRIPT"
  echo "✅ 同期スクリプトに実行権限を付与しました"
else
  echo "⚠️  同期スクリプトが見つかりません: $SYNC_SCRIPT"
fi

echo "✅ Git post-push hook をインストールしました"
echo ""
echo "📝 使用方法:"
echo "   git push を実行すると、自動的に npm run sync が実行されます"
echo ""
echo "💡 無効化する場合:"
echo "   rm .git/hooks/post-push"
