---
title: "Claude Code × Superpowers：30kスターの最強プラグインを試してみた"
emoji: "🛠️"
type: "tech"
topics: ["テスト駆動開発","自動テスト","Superpowers","ClaudeCode","Claude活用術"]
published: true  # Zenn公開設定（まず false で下書き）

# マルチプラットフォーム投稿設定
platforms:
  qiita: true   # Qiitaに投稿
  devto: true   # Dev.toに投稿
---

最近、「Vibe Coding（雰囲気プログラミング）」なんて言葉が流行ってるけど、正直言って危なっかしいよね。
Claude Codeは確かに優秀だ。でも、優秀すぎて「イエスマン」になってない？

「これ作って」って言えば、秒速でコードを吐き出してくれる。でも、いざ動かしてみるとエラーの嵐。「動けばいい」レベルのコードなら書けるけど、堅牢なシステムとなると、やっぱりまだ「新人クン」なんだよな。

そんな中、GitHubで**30kスター**を叩き出したモンスター級のプロジェクトを見つけた。「**Superpowers**」だ。これ、マジでClaude Codeの使い方が変わるぞ。

単なるプロンプト集じゃない。これはClaude Codeに「エンジニアリングの規律」を叩き込む**最強のスキルセット**だ。「まず実装」じゃなくて、「まず思考、次に設計、最後にコーディング」という、僕らごく普通のエンジニアが当たり前にやってることを、AIに強制させるんだ。

## 1. 真の強みは「サブエージェント・モード」にあり

なぜSuperpowersがデフォルトのClaudeより圧倒的に使えるのか？その秘密は**サブエージェント（Subagent）**という仕組みにある。

普通のチャットモードだと、Claudeは一人で全責任を負う「孤独な戦士」だ。会話が長くなればなるほど、前のコンテキストを忘れてポンコツになっていく。いわゆる「断片化」ってやつだ。

でもSuperpowersを入れると、Claudeは**「鬼PM + エリート外注部隊」**に進化する。

*   **メインエージェント（PM）:** 全体を俯瞰し、設計書を握りしめて指示を出す。絶対に手を動かさない。
*   **サブエージェント（実働部隊）:** 「暗号化モジュールを書く」「バリデーションを作る」といった細かいタスクごとに、**その場限りの使い捨てエージェント**を召喚する。
*   **完全分離:** このサブエージェントは、前のタスクのエラーログなんて知らない。真っさらな状態で作業して、終わったら消える。だから「幻覚（ハルシネーション）」が起きにくいんだ。

これ、考えた人天才だと思うよ。

## 2. 実践：ガチの「メール検証サービス」を作らせてみた

口だけならなんとでも言える。実際に、ちょっと面倒な要件でPythonのメール検証サービスを作らせてみた。

> **Prompt:**
> Pythonで企業レベルの「メール検証サービス」を開発したいです。RFC標準（サブアドレス user+tagを含む）に対応し、国際化ドメイン（IDN）をサポートし、無効なメールを防ぐためにDNS MXレコードチェックを行う必要があります。アーキテクチャを設計してください。

初心者が躓きそうなポイント満載だろ？

![Superpowers](https://raw.githubusercontent.com/takuya77088/multi-platform-publisher/main/images/superpowers-2.png)

### Step 1. Brainstorm：いきなりコードを書かせない

要件を投げると、Superpowersは自動で `/brainstorm` を発動。 「わかりました、コード書きます！」じゃないんだ。

「使用シナリオは？」「DNS検証のレベルは？」「デプロイ環境は？」と、まるでベテランアーキテクトのように逆質問してくる。このやり取りを経て、ターミナルに **美しいASCIIアートの設計図** が描かれたときは、正直震えたよ。

![Superpowers](https://raw.githubusercontent.com/takuya77088/multi-platform-publisher/main/images/superpowers-3.png)

### Step 2. Write Plan：プロ級のプロジェクト構成

設計が固まると、Claudeは単なる「コードの断片」ではなく、完全なプロジェクト構造を提示してきた。 `validators/`（ロジック）、`middleware/`（制限）、`cache/`（高速化）……。 これ、人間がゼロから考えると数時間はかかる「プロの構成」だ。Superpowersはこれを「原子タスク」として定義し、実装の迷いをゼロにしてくれる。

![Superpowers](https://raw.githubusercontent.com/takuya77088/multi-platform-publisher/main/images/superpowers-4.png)

### Step 3. 実装とTDD：規律あるコーディング

あとは `/execute-plan` を実行するだけだ。 Superpowersは **TDD（テスト駆動開発）** を重視する。まず `tests/` ディレクトリに「失敗するテスト」を用意し、それをパスするようにコードを組み上げていく。

AIにありがちな「とりあえず動くけどテストがない」というクソコードの量産を、根本から防いでくれるんだ。

![Superpowers](https://raw.githubusercontent.com/takuya77088/multi-platform-publisher/main/images/superpowers-5.png)

## 3. そのAPI、本当に「プロ仕様」か？ Apidogで仕上げる

Superpowersのおかげで、ロジック自体はかなり堅牢なものができた。でも、サービスとして公開するなら、もうワンステップ必要だ。**インターフェースの標準化**だ。

ローカルで動いただけで満足しちゃダメだ。僕は生成されたコードからAPI定義を吸い出して、**[Apidog](https://apidog.com/jp/)**に放り込むようにしてる。

1.  **自動受け入れテスト:** Apidogの自動テスト機能を使って、AIが書いたロジックにい地引網のようなテストをかける。「動く」と「運用に耐える」は別物だからね。
2.  **ドキュメントの即時生成:** AIがいいコードを書いても、ドキュメントがゴミなら誰も使ってくれない。Apidogならコードから美しいAPIドキュメントを自動生成してくれる。これをチームに共有した瞬間、「おっ、ちゃんとしてるな」って空気になるんだ。
3.  **責務の分離:** Superpowersは「ロジックの正しさ」を保証し、Apidogは「サービスの品質」を保証する。このコンビネーションが最強だ。

## 4. 導入はたったの2行

Claude Codeの環境があるなら、導入は一瞬だ。

1.  **マーケットプレイスを追加:**
    ```bash
    /plugin marketplace add obra/superpowers-marketplace
    ```

2.  **インストール:**
    ```bash
    /plugin install superpowers@superpowers-marketplace
    ```

**検証:** `/sup` と打って、`execute-plan` 、`brainstorm` や `write-plan` が出てくればOK。

![Superpowers](https://raw.githubusercontent.com/takuya77088/multi-platform-publisher/main/images/superpowers-1.png)

## まとめ：急がば回れ

今のAIトレンドは「生成速度」ばかり競ってる。でもSuperpowersは真逆だ。「考えろ」「テストしろ」と、あえてスピードを落とさせる。

でも結果的にどうだ？ バグ修正の手戻りがなくなって、トータルの開発時間は圧倒的に短縮された。
ソフトウェアエンジニアリングの真理だよ。「コードの量より、質」。それをAIに教わるとはね。

**GitHub:**  https://github.com/obra/superpowers
