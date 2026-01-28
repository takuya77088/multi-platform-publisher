---
title: "Moltbot（旧Clawdbot）の使い方とリスク：AIにPCの実行権限を渡すとどうなる？"
emoji: "🦞"
type: "tech"
topics: ["Moltbot","AIエージェント","ローカルLLM","自動化ツール","Claude"]
published: true  # Zenn公開設定（まず false で下書き）

# マルチプラットフォーム投稿設定
platforms:
  qiita: true   # Qiitaに投稿
  devto: true   # Dev.toに投稿
---

![Moltbot」（旧Clawdbot）](https://raw.githubusercontent.com/takuya77088/multi-platform-publisher/main/images/260126-clawdbot-1.png)

最近、X（旧Twitter）で、この「ロブスター」のアイコンを見かけませんでしたか？

> **⚠️ 2026/01/27 更新: Clawdbot → Moltbot**
> 公式発表により、Clawdbotは **「Moltbot」** へと名称変更されました（商標上の理由とのこと）。
> 「Molt（脱皮）」はロブスターの成長そのもの。中身は変わらず、より強固なシェルを纏っての再出発です。
> ※本記事内の表記も新名称「Moltbot」に準拠します。

開発者の間では **「Moltbot」（旧Clawdbot）** がちょっとした祭りになっています。「また新しいAIツール？」と思ってスルーしかけましたが、GitHubで30kスターを集めているのには理由がありました。

![Moltbot](https://raw.githubusercontent.com/takuya77088/multi-platform-publisher/main/images/260128-Moltbot-1.png)


結論から言うと、これは単なる「おしゃべりBot」ではありません。**あなたのMac Miniを「24時間働くデジタル社員」に変える、最強のAgent Gateway**です。

これは「AGIの降臨」なのか、それとも「危険な遊び道具」なのか？ 実際に掘り下げてみましょう。


## 1. そもそも何が違うのか？「相談役」と「実行部隊」の差

従来のChatGPTやClaude（Web版）は、いわば「賢い相談役」でした。コードを書いてくれたり、アドバイスはくれますが、**実際の作業は人間がやる**必要がありました。

*   **従来:** 「このバグの直し方を教えて」→ AIがコード提示 → 人間がコピペして実行
*   **Moltbot:** 「このバグ直しておいて」→ AIが修正して、テスト回して、Git Commitまで完了

Moltbotの正体は、**Claude APIとあなたのローカルShellを直結させるゲートウェイ**です。Artifactsのようなサンドボックス（箱庭）ではなく、**あなたの生のマシン環境**でコマンドを叩きます。

つまり、TelegramやiMessageから「指令」を飛ばすだけで、家のPCが勝手に仕事を片付けてくれるのです。これ、ワクワクしませんか？

## 2. コアアーキテクチャ：Local-first + RAG

![](https://raw.githubusercontent.com/takuya77088/multi-platform-publisher/main/images/260126-clawdbot-2.png)

技術的に面白いのは、その設計思想です。

### 実行層（Gateway）
Telegram、WhatsApp、Discordなどのメッセージアプリを「コントローラー」として使います。外から投げた自然言語の指示が、自宅のサーバー（PC）でシェルコマンドに変換され、実行されます。

### 記憶層（MEMORY.md）とRAG
これがMoltbotのキモです。 Web版を使っていると「新しいチャットを開くたびに記憶喪失」になりますよね？
Moltbotは、会話履歴や学習したユーザーの好みを**Markdownファイルとしてローカルに保存**します。さらに、**ベクトル検索（RAG）** を使って過去の記憶を引き出します。「2週間前に話したあのバグ」の話をしても、ちゃんと覚えているのです。

### プライバシー
データは基本ローカル完結（LLMへの送信を除く）。機密性の高いRepoを扱う場合でも、ブラウザ拡張機能よりはるかに安心感があります。

## 3. 実戦投入：ただのデモで終わらせない

「天気予報を聞く」みたいな退屈な使い方はしません。エンジニアならこう使います。

*   **完全自動化DevOps:**
    出先からスマホで「◯◯のリポジトリのCI落ちてるから見て」と送信。
    Moltbotgit pull` → ログ解析 → コード修正 → コンパイル → `git commit`。
    **（個人的なアイデアですが、ここに [Apidog CLI](http://www.apidog.com/jp/?utm_source=opr&utm_medium=a2qiita11&utm_content=clawdbot) を噛ませるのも面白そうです。シェルが叩けるならAPIテストもコマンド一発なので、「修正」だけでなく「品質保証」まで寝ている間に終わらせる——そんなワークフローも夢ではありません。）**
*   **サーバー監視 & 自動復旧:**
    Cron Jobsのように常駐し、異常を検知したら即座に通知、あるいは勝手に再起動スクリプトを走らせる。
*   **音声対話 (ElevenLabs連携):**
    電話をかけさせて、レストランの予約をAIに任せる猛者もいます。
    実際、**Alex Finn** (@AlexFinn) は、Moltbotに電話をかけさせ、レストランの予約を自律的に完了させる様子をXで公開しています。失敗しても戦略を変えて再トライする「執念」は、まさにAgentです。
    > 参考: Alex Finnのデモ (X)
    https://x.com/AlexFinn/status/2015266546600550755

## 4. 知っておくべき「現実」とリスク

ここまで聞くと「神ツールじゃん」と思うかもしれませんが、**ちょっと待ってください。** 現実はそう甘くありません。

### 財布が燃える（コスト問題）
これ、めちゃくちゃお金かかります。
Moltbotは複雑なタスクのために**Claude 4.5 Sonnet**などの高性能モデルを大量に呼び出します。ローカルファイルを読み込み、文脈を確認し...とやっていると、Token消費がマッハです。ヘビーユーザーの中には週に数百ドル溶かしたという報告も。

### セキュリティリスク
「Shellの実行権限を与える」ことの怖さは、エンジニアなら分かりますよね？
もし**Prompt Injection（プロンプトインジェクション）** 攻撃を受けたり、悪意のあるPDFを読ませてしまった場合、最悪、あなたのMacがコマンド一発で初期化される可能性もゼロではありません。サンドボックス外での実行は、諸刃の剣です。

## 5. 3分で始める Quick Start

それでも試してみたいチャレンジャーへ。環境構築は意外とシンプルです。

**前提環境:**
*   Node.js 22+ (必須)
*   Mac Mini あるいは常時稼働のVPS推奨

# インストール
npm install -g Moltbot@latest

# 初期設定（APIキー設定や通信チャンネル確立）
Moltbot onboard --install-daemon

**起動 & テスト:**

```bash
# ゲートウェイ起動
Moltbot gateway --port 18789 --verbose

# テストメッセージ送信
Moltbot message send --to +1234567890 --message "Hello from Moltbot"
```

これだけで、あなたのローカルマシンに「脳」が宿ります。

## まとめ：これは「未来のOS」の形かもしれない

Moltbotはまだ荒削りで、コストも高く、万人向けではありません。
しかし、**「AIが主体的に動き、OSレベルで操作を行う」** という体験は、一度味わうと戻れません。

「チャットして終わり」のAIはもう卒業です。
あなたのPCの中に、24時間文句も言わず働き続ける「相棒」を住まわせてみませんか？

## 参考
https://github.com/moltbot/moltbot
