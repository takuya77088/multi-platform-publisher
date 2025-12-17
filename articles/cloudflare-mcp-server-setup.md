---
title: "個人開発者が始めるCloudflare MCPサーバー構築入門"
emoji: "🛠️"
type: "tech"
topics: ["Cloudflare","個人開発","MCP","AI連携","サーバーレス"]
published: true  # Zenn公開設定（まず false で下書き）

# マルチプラットフォーム投稿設定
platforms:
  qiita: true   # Qiitaに投稿
  devto: true   # Dev.toに投稿
---


## はじめに

AIアシスタントと連携できるModel Context Protocol（MCP）サーバーを自分で構築してみませんか？この記事では、個人開発者向けにCloudflareを使ったMCPサーバーの構築方法をステップバイステップで解説します。難しそうに聞こえるかもしれませんが、実は無料プランでも十分に始められるんです！

私自身、趣味プロジェクトでMCPサーバーを構築した経験から、つまずきやすいポイントや実用的なヒントを交えながら説明していきます。この記事を読めば、あなたも自分だけのAI連携システムを手に入れることができますよ。

## MCPサーバーって何？基本概念を理解しよう

MCPサーバーは、簡単に言えばAIアシスタント（例：Claude）と外部ツールを連携させるための橋渡し役です。例えば、AIに「今日の天気を教えて」と頼むと、AIがMCPサーバー経由で天気APIにアクセスし、最新情報を取得して回答できるようになります。

### MCPの主な特徴

- **標準化されたプロトコル**: 異なるシステム間の通信を簡単にします
- **ツール拡張**: AIの能力を外部ツールで拡張できます
- **リアルタイム処理**: ユーザーの要求に応じて即座に処理を実行します

### なぜCloudflareなの？

Cloudflareは個人開発者にとって最適なプラットフォームです。その理由は：

1. **無料プランが充実**: 1日10万リクエストまで無料で利用可能
2. **グローバルネットワーク**: 世界300以上の都市にエッジサーバーがあり、高速なレスポンスを実現
3. **簡単なデプロイ**: コマンド一つでデプロイが完了
4. **セキュリティ対策**: SSL/TLS暗号化がデフォルトで有効

## 環境構築：始める前の準備

実際にMCPサーバーを構築する前に、以下のものを用意しましょう：

- **Cloudflareアカウント**: [Cloudflare公式サイト](https://dash.cloudflare.com/sign-up)で無料登録
- **Node.jsとnpm**: [Node.js公式サイト](https://nodejs.org/)からダウンロード（v16以上推奨）
- **テキストエディタ**: VSCodeなど好みのエディタ
- **ターミナル**: コマンドを実行するためのアプリケーション

## 実装：MCPサーバーを作ってみよう

### ステップ1：プロジェクトの作成

まずは新しいプロジェクトを作成します。ターミナルを開いて以下のコマンドを実行しましょう：

```bash
# プロジェクトフォルダの作成
mkdir my-mcp-server
cd my-mcp-server

# Cloudflare Workerプロジェクトの初期化
npx create-cloudflare@latest
```

プロンプトが表示されたら、以下のように選択します：

1. プロジェクト名を入力（例：`mcp-demo`）
2. 「Hello World」テンプレートを選択
3. 言語として「TypeScript」を選択
4. Gitの設定は任意（初心者なら「No」でOK）
5. デプロイは後で行うので「No」を選択

### ステップ2：MCPサーバーのセットアップ

プロジェクトディレクトリに移動し、MCPサーバーをセットアップします：

```bash
cd mcp-demo
npx workers-mcp setup
```

プロンプトが表示されたら、Enterキーを押して「Yes」を確認します。これにより、`src/index.ts`ファイルが自動的に更新されます。

### ステップ3：簡単な機能を追加してみよう

`src/index.ts`ファイルを開き、以下のようなシンプルな機能を追加してみましょう：

```typescript
import { createMCPServer } from "@modelcontextprotocol/server";

export default {
  async fetch(request, env, ctx) {
    const server = createMCPServer({
      tools: [
        {
          name: "greet",
          description: "あいさつを返します",
          parameters: {
            type: "object",
            properties: {
              name: {
                type: "string",
                description: "あいさつする相手の名前",
              },
            },
            required: ["name"],
          },
          handler: async ({ name }) => {
            return `こんにちは、${name}さん！今日も素晴らしい一日ですね。`;
          },
        },
        {
          name: "add",
          description: "2つの数値を足し算します",
          parameters: {
            type: "object",
            properties: {
              a: {
                type: "number",
                description: "1つ目の数値",
              },
              b: {
                type: "number",
                description: "2つ目の数値",
              },
            },
            required: ["a", "b"],
          },
          handler: async ({ a, b }) => {
            return a + b;
          },
        },
      ],
    });

    return server.fetch(request);
  },
};
```

このコードでは、2つの簡単な機能を実装しています：
1. `greet`: 名前を受け取って挨拶を返す関数
2. `add`: 2つの数値を足し算する関数

### ステップ4：ローカルでテストしてみよう

MCPサーバーが正しく動作するか確認するために、ローカルでテストしましょう：

```bash
# 開発サーバーを起動
npx wrangler dev
```

別のターミナルウィンドウを開いて、MCP Inspectorを起動します：

```bash
npx @modelcontextprotocol/inspector@latest
```

ブラウザで`http://localhost:5173`にアクセスし、以下の手順でテストします：

1. 「Connect to MCP Server」欄に`http://localhost:8787`を入力（ポート番号は開発サーバーの出力に合わせてください）
2. 「Connect」ボタンをクリック
3. 「List Tools」ボタンをクリックして、実装したツールが表示されることを確認
4. 「greet」ツールを選択し、nameパラメータに「太郎」と入力してテスト
5. 「add」ツールを選択し、aに「5」、bに「3」と入力してテスト

正しく動作すれば、「こんにちは、太郎さん！今日も素晴らしい一日ですね。」や「8」といった結果が表示されるはずです。

## デプロイ：世界に公開しよう

### ステップ1：Cloudflareにデプロイ

ローカルでのテストが完了したら、Cloudflareにデプロイしましょう：

```bash
# Cloudflareアカウントにログイン（初回のみ）
npx wrangler login

# デプロイ実行
npx wrangler deploy
```

デプロイが成功すると、以下のようなURLが表示されます：
```
https://mcp-demo.your-username.workers.dev
```

このURLをメモしておきましょう。これがあなたのMCPサーバーのアドレスです！

### ステップ2：Claudeとの連携（オプション）

Claude Desktopをお持ちの場合は、MCPサーバーと連携させることができます：

1. Claude Desktopの設定ファイルを開く（通常は`~/.config/claude-desktop/config.json`）
2. 以下のように設定を追加：

```json
{
  "mcpServers": {
    "my-mcp": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://mcp-demo.your-username.workers.dev/sse"
      ]
    }
  }
}
```

3. Claude Desktopを再起動
4. 新しいチャットを開始し、「新しいMCPツールが利用可能です」という通知が表示されることを確認
5. 「このチャットで許可する」をクリック
6. 以下のようなプロンプトを試してみる：
   - 「greetツールを使って山田さんに挨拶してください」
   - 「addツールを使って42と58を足してください」

## 応用例：個人開発者のためのアイデア

### 1. 個人ブログのコンテンツ管理

MCPサーバーを使って、ブログの記事検索や更新を自動化できます：

```typescript
{
  name: "searchBlogPosts",
  description: "ブログ記事を検索します",
  parameters: {
    type: "object",
    properties: {
      keyword: {
        type: "string",
        description: "検索キーワード",
      },
    },
    required: ["keyword"],
  },
  handler: async ({ keyword }) => {
    // 実際にはデータベースやAPIと連携する処理を実装
    return ["記事1", "記事2"];
  },
}
```

### 2. 個人プロジェクトの進捗管理

Todoリストやタスク管理をAIと連携させることができます：

```typescript
{
  name: "addTask",
  description: "新しいタスクを追加します",
  parameters: {
    type: "object",
    properties: {
      title: {
        type: "string",
        description: "タスクのタイトル",
      },
      dueDate: {
        type: "string",
        description: "期限（YYYY-MM-DD形式）",
      },
    },
    required: ["title"],
  },
  handler: async ({ title, dueDate }) => {
    // タスクを保存する処理
    return { success: true, message: `タスク「${title}」を追加しました` };
  },
}
```

### 3. 趣味の情報収集

趣味に関する情報をAIに収集させることができます：

```typescript
{
  name: "getAnimeInfo",
  description: "アニメの情報を取得します",
  parameters: {
    type: "object",
    properties: {
      title: {
        type: "string",
        description: "アニメのタイトル",
      },
    },
    required: ["title"],
  },
  handler: async ({ title }) => {
    // 外部APIから情報を取得する処理
    return { title, episodes: 12, genre: ["SF", "アクション"] };
  },
}
```

## トラブルシューティング：よくある問題と解決法

### CORS関連のエラー

他のウェブサイトからMCPサーバーにアクセスする場合、CORS設定が必要です：

```typescript
export default {
  async fetch(request, env) {
    // CORSヘッダーを設定
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };
    
    // OPTIONSリクエストへの対応
    if (request.method === "OPTIONS") {
      return new Response(null, { headers });
    }
    
    // 以下、通常の処理
    const server = createMCPServer({ /* ... */ });
    const response = await server.fetch(request);
    
    // レスポンスにCORSヘッダーを追加
    const newHeaders = new Headers(response.headers);
    Object.entries(headers).forEach(([key, value]) => {
      newHeaders.set(key, value);
    });
    
    return new Response(response.body, {
      status: response.status,
      headers: newHeaders,
    });
  }
};
```

### 無料プランの制限と対処法

Cloudflareの無料プランには1日10万リクエストという制限があります。個人開発では十分ですが、以下の点に注意しましょう：

1. **キャッシュの活用**: 同じリクエストに対する結果をキャッシュする
2. **バッチ処理**: 複数の小さなリクエストを一つにまとめる
3. **レート制限**: 短時間に大量のリクエストを送らないよう制御する

### 日本語文字化けの解決方法

日本語を扱う際に文字化けが発生する場合は、以下の点を確認してください：

1. **文字エンコーディング**: すべてのファイルがUTF-8で保存されていることを確認
2. **Content-Typeヘッダー**: レスポンスヘッダーに`Content-Type: text/plain; charset=utf-8`を設定

```typescript
return new Response(JSON.stringify(result), {
  headers: {
    "Content-Type": "application/json; charset=utf-8"
  }
});
```

## まとめ

このガイドでは、個人開発者向けにCloudflareを使ったMCPサーバーの構築方法を解説しました。基本的な概念から実装、デプロイ、そして実際の応用例まで、ステップバイステップで進めてきました。

MCPサーバーを構築することで、AIアシスタントと外部ツールを連携させる可能性が広がります。個人プロジェクトや趣味の活動を自動化したり、新しいアイデアを試したりするのに最適なプラットフォームです。

最初は難しく感じるかもしれませんが、一度構築してしまえば、あとは自分のアイデア次第で無限に拡張できます。ぜひ自分だけのMCPサーバーを作って、AIとの新しい対話体験を楽しんでください！

## 参考

- [MCP公式ドキュメント](https://modelcontextprotocol.github.io/)
- [Cloudflare Workers ドキュメント](https://developers.cloudflare.com/workers/)
- [TypeScript公式サイト](https://www.typescriptlang.org/)
