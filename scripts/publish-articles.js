// scripts/publish-articles.js
// 多プラットフォーム向け記事公開スクリプト（Qiita / Dev.to / Zenn GitHub同期）
// 公開・更新処理、フロントマターの解析などを担当

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const matter = require("gray-matter");
const { convertToDevTo, normalizeDevToTag } = require("./convert-articles.js");
const { execSync } = require("child_process");

// ------------------------------------------------------------
// 定数定義
// ------------------------------------------------------------
const ARTICLES_DIR = "articles";
const META_FILE = "config/published-articles.json";

// 公開済み記事メタデータの読み込み
let publishedMeta = {};
if (fs.existsSync(META_FILE)) {
  publishedMeta = JSON.parse(fs.readFileSync(META_FILE, "utf8"));
}

// ------------------------------------------------------------
// Qiita への記事公開処理
// ------------------------------------------------------------
async function publishToQiita(articleKey, title, body, tags) {
  const qiitaToken = process.env.QIITA_API_TOKEN;

  if (!qiitaToken) {
    console.log("⏭️ Qiita の API トークンが未設定のため、Qiita への投稿をスキップします");
    return null;
  }

  const headers = {
    Authorization: `Bearer ${qiitaToken}`,
    "Content-Type": "application/json",
  };

  // publishedMetaからIDを取得（最新の状態を確認）
  const qiitaId = publishedMeta[articleKey]?.qiita?.id;

  const payload = {
    title,
    body,
    tags: tags.map((t) => ({ name: t })),
    private: false,
  };

  try {
    if (!qiitaId) {
      console.log(`🟢 Qiita: 新規投稿を作成中 → ${articleKey}`);
      const res = await axios.post("https://qiita.com/api/v2/items", payload, { headers });
      console.log(`    ✅ Qiita 新規投稿成功: ${res.data.url}`);
      return { id: res.data.id, url: res.data.url, isNew: true };
    } else {
      console.log(`🟡 Qiita: 既存記事を更新中 → ID=${qiitaId}`);
      const res = await axios.put(`https://qiita.com/api/v2/items/${qiitaId}`, payload, { headers });
      console.log(`    ✅ Qiita 更新成功: ${res.data.url}`);
      return { id: qiitaId, url: res.data.url, isNew: false };
    }
  } catch (error) {
    // エラーの詳細をログに記録
    const errorMsg = error.response?.data || error.message;
    console.error(`❌ Qiita への投稿処理に失敗しました (${articleKey})`);
    console.error(`   エラー詳細:`, errorMsg);
    
    // 404エラーの場合、IDが無効かもしれないので警告
    if (error.response?.status === 404 && qiitaId) {
      console.warn(`    ⚠️  記事ID (${qiitaId}) が見つかりません。新規投稿として再試行する必要があるかもしれません。`);
    }
    
    return null;
  }
}

// ------------------------------------------------------------
// Dev.to への記事公開処理（非推奨、publishToDevToWithPayloadを使用してください）
// ------------------------------------------------------------
async function publishToDevTo(article) {
  console.warn(`⚠️  publishToDevToは非推奨です。publishToDevToWithPayloadを使用してください。`);
  return null;
}

// ------------------------------------------------------------
// Git差分から変更された記事のみ取得
// ------------------------------------------------------------
function getModifiedArticles(forceAll = false) {
  if (forceAll) {
    console.log("🧪 全記事を対象とします");
    return loadMarkdownFiles();
  }

  try {
    const gitDiffCommand = "git diff --name-only HEAD~1 HEAD -- articles/";
    const modifiedFiles = execSync(gitDiffCommand, { encoding: "utf8" })
      .trim()
      .split("\n")
      .filter((file) => file && file.endsWith(".md"));

    console.log(`🔍 Git差分検出: ${modifiedFiles.length}件の変更ファイル`);

    if (modifiedFiles.length === 0) {
      return [];
    }

    return modifiedFiles.map((file) => {
      const key = path.basename(file, ".md");
      const fullPath = path.join(process.cwd(), file);
      const mdContent = fs.readFileSync(fullPath, "utf8");
      const { data, content } = matter(mdContent);

      return {
        key,
        file,
        fullPath,
        frontmatter: data,
        content,
        isDraft: data?.draft === true,
      };
    });
  } catch (error) {
    console.error("❌ Git差分取得に失敗しました:", error.message);
    console.error("🛑 安全のため、記事の処理をスキップします");
    console.error("   --all フラグを使用すると全記事を強制的に処理できます");
    return []; // 🔥 修正：失敗時は空配列を返す（全記事を処理しない）
  }
}

// ------------------------------------------------------------
// Markdown 記事の読み込み
// ------------------------------------------------------------
function loadMarkdownFiles(targetKey = null) {
  const files = fs.readdirSync(ARTICLES_DIR).filter((f) => f.endsWith(".md"));

  return files.map((file) => {
    const fullPath = path.join(ARTICLES_DIR, file);
    const mdContent = fs.readFileSync(fullPath, "utf8");
    const { data, content } = matter(mdContent);

    return {
      key: file.replace(".md", ""),
      file,
      fullPath,
      frontmatter: data,
      content,
      isDraft: data?.draft === true,
    };
  }).filter(article => {
    if (targetKey) {
      return article.key === targetKey;
    }
    return true;
  });
}

// ------------------------------------------------------------
// メイン処理
// ------------------------------------------------------------
async function main() {
  console.log("🚀 Multi-platform publishing started...\n");

  const args = process.argv.slice(2);
  const targetKey = args.find((arg) => arg.startsWith("--article="))?.split("=")[1];
  const isForceAll = args.includes("--all") || args.includes("--force");
  const allowUpdate = args.includes("--update") || args.includes("--force-update");

  let articles = [];

  if (targetKey) {
    console.log(`🎯 特定記事のみ処理: ${targetKey}`);
    articles = loadMarkdownFiles(targetKey);
  } else {
    articles = getModifiedArticles(isForceAll);
  }

  if (articles.length === 0) {
    console.log("✅ 変更された記事がありません。公開処理をスキップします。\n");
    return;
  }

  console.log(`📝 ${articles.length}件の記事を処理対象とします`);

  if (!allowUpdate) {
    console.log("ℹ️  更新モード: 既存記事の更新はスキップします");
    console.log("   既存記事を更新する場合は --update フラグを使用してください\n");
  } else {
    console.log("⚠️  更新モード: 既存記事も更新します\n");
  }

  for (const article of articles) {
    const { key, frontmatter } = article;

    if (!frontmatter.title) {
      console.log(`❌ タイトルが存在しないためスキップしました: ${key}`);
      continue;
    }

    // published: true でない場合はスキップ
    if (frontmatter.published !== true) {
      console.log(`⏭️  記事が公開設定でないためスキップ: ${key} (published: ${frontmatter.published})`);
      continue;
    }

    console.log("\n============================================================");
    console.log(`📄 処理対象記事: ${frontmatter.title} (${key})`);
    console.log("============================================================");

    // --- Qiita 処理 ---
    let qiitaRes = null;
    const qiitaConvertedPath = path.join(process.cwd(), "qiita", "public", `${key}.md`);

    // プラットフォーム設定をチェック
    const shouldPublishToQiita = !frontmatter.platforms || frontmatter.platforms.qiita !== false;

    // 変換済みファイルが存在するか確認（存在しない場合は、変更がないか変換エラーなのでスキップ）
    if (fs.existsSync(qiitaConvertedPath) && shouldPublishToQiita) {
      console.log(`  🔍 Qiita用変換済みファイルを検出: ${qiitaConvertedPath}`);
      const qiitaContent = fs.readFileSync(qiitaConvertedPath, "utf8");
      const qiitaParsed = matter(qiitaContent);

      // 変換済みファイルからタグなどを取得
      const qiitaTags = qiitaParsed.data.tags || [];

      // publishedMetaからIDを取得（正しい構造でアクセス）
      const metaId = publishedMeta[key]?.qiita?.id;

      // 既存記事の更新保護チェック
      if (metaId && !allowUpdate) {
        console.log(`  ⏭️  Qiita: 既存記事のため更新をスキップ (ID: ${metaId})`);
        console.log(`       更新する場合は --update フラグを使用してください`);
      } else {
        // 公開実⾏
        qiitaRes = await publishToQiita(key, qiitaParsed.data.title, qiitaParsed.content, qiitaTags);
      }
    } else if (!shouldPublishToQiita) {
      console.log(`  ⏭️  Qiitaへの投稿が無効化されています（platforms.qiita: false）`);
    } else {
      console.log(`  ⏭️  Qiita用変換済みファイルが見つからないためスキップ（変更なしか、変換対象外）`);
    }

    // --- Dev.to 処理（英語版優先ロジック） ---
    let devtoRes = null;

    const devtoEnPath = path.join(process.cwd(), "dev-to", `${key}-en.md`); // 手動作成された英語版

    // プラットフォーム設定をチェック
    const shouldPublishToDevTo = !frontmatter.platforms || frontmatter.platforms.devto !== false;

    if (!shouldPublishToDevTo) {
      console.log(`  ⏭️  Dev.toへの投稿が無効化されています（platforms.devto: false）`);
    } else {
      // 既存記事の更新保護チェック（言語に関係なく、既にDev.toに投稿済みかチェック）
      const hasDevToId = publishedMeta[key]?.devto?.en?.id || publishedMeta[key]?.devto?.ja?.id;

      if (hasDevToId && !allowUpdate) {
        console.log(`  ⏭️  Dev.to: 既存記事のため更新をスキップ (ID: ${hasDevToId})`);
        console.log(`       更新する場合は --update フラグを使用してください`);
      } else if (fs.existsSync(devtoEnPath)) {
        // 英語版を投稿（手動作成されたファイル）
        console.log(`  🌐 Dev.to英語版（手動作成）を検出: ${devtoEnPath}`);

        const devtoEnContent = fs.readFileSync(devtoEnPath, "utf8");
        const devtoEnParsed = matter(devtoEnContent);

        let devtoEnTags = [];
        if (devtoEnParsed.data.tags) {
          devtoEnTags = Array.isArray(devtoEnParsed.data.tags)
            ? devtoEnParsed.data.tags
            : [devtoEnParsed.data.tags];
        }

        // Dev.to tag正規化（共通関数を使用）
        devtoEnTags = devtoEnTags.slice(0, 4).map(normalizeDevToTag);

        console.log(`  📌 使用するtag: ${devtoEnTags.join(", ")}`);

        const payloadEn = {
          article: {
            title: devtoEnParsed.data.title,
            body_markdown: devtoEnParsed.content,
            published: devtoEnParsed.data.published !== false,
            tags: devtoEnTags,
          }
        };

        // 元のキーを使用して英語版を投稿
        devtoRes = await publishToDevToWithPayload(key, payloadEn, "en");
      } else {
        // 日本語版を投稿（articles/から自動変換）
        console.log(`  📝 Dev.to日本語版を投稿（articles/から自動変換）`);
        console.log(`  ⚠️  注意: 日本語tagはDev.to APIにより英語に翻訳される可能性があります`);
        console.log(`  💡 英語版（dev-to/${key}-en.md）を作成して英語tagを指定することを推奨します`);

        // articles/から読み込んで変換
        const devtoArticle = convertToDevTo(article);
        if (devtoArticle) {
          const payload = {
            article: {
              title: devtoArticle.frontmatter.title,
              body_markdown: devtoArticle.content,
              published: devtoArticle.frontmatter.published !== false,
              tags: devtoArticle.frontmatter.tags || [],
            }
          };

          console.log(`  📌 使用するtag: ${(devtoArticle.frontmatter.tags || []).join(", ")}`);

          devtoRes = await publishToDevToWithPayload(key, payload, "ja");
        } else {
          console.log(`  ⏭️  Dev.to変換スキップ（プラットフォーム指定）`);
        }
      }
    }

    // --- メタデータ更新 (新構造: ネストされたプラットフォーム/言語情報、動的生成) ---
    if (qiitaRes || devtoRes) {
      if (!publishedMeta[key]) {
        publishedMeta[key] = {};
      }

      // Qiitaの場合
      if (qiitaRes) {
        if (!publishedMeta[key].qiita) {
          publishedMeta[key].qiita = { id: null, url: null };
        }
        publishedMeta[key].qiita.id = qiitaRes.id;
        publishedMeta[key].qiita.url = qiitaRes.url;
        console.log(`  ✅ Qiitaメタデータ更新: ID=${qiitaRes.id}`);
      }

      // Dev.toの場合
      if (devtoRes) {
        const lang = devtoRes.language;
        const articleKey = devtoRes.articleKey;
        const langLabel = lang === 'en' ? "英語版" : "日本語版";

        if (!publishedMeta[articleKey]) {
          publishedMeta[articleKey] = {};
        }
        if (!publishedMeta[articleKey].devto) {
          publishedMeta[articleKey].devto = {};
        }
        if (!publishedMeta[articleKey].devto[lang]) {
          publishedMeta[articleKey].devto[lang] = { id: null, url: null };
        }

        publishedMeta[articleKey].devto[lang].id = devtoRes.id;
        publishedMeta[articleKey].devto[lang].url = devtoRes.url;
        console.log(`  ✅ Dev.to${langLabel}メタデータ更新: ID=${devtoRes.id}`);
      }

      // 各記事処理後に即座に保存（エラー時のデータ損失を防ぐ）
      try {
        fs.writeFileSync(META_FILE, JSON.stringify(publishedMeta, null, 2));
        console.log(`  💾 メタデータを保存しました`);
      } catch (saveError) {
        console.error(`  ❌ メタデータの保存に失敗しました:`, saveError.message);
        // エラーが発生しても処理は続行
      }
    }
  }

  console.log(`\n📦 最終メタデータ状態を確認しました`);
  console.log("\n🎉 公開処理が完了しました\n");
}

// Helper: Dev.to publish with payload
// articleKey: 原始記事キー（-enなどのサフィックスなし）
// language: "ja" (日本語) または "en" (英語)
// 注意: Dev.toは1記事につき1バージョンのみ（日本語または英語）
async function publishToDevToWithPayload(articleKey, payload, language = "ja") {
  const devKey = process.env.DEV_TO_API_KEY;
  if (!devKey) {
    console.log("  ⏭️  DEV_TO_API_KEY 未設定");
    return null;
  }

  // 正しいデータ構造から既存IDを取得
  const existingId = publishedMeta[articleKey]?.devto?.[language]?.id;
  
  const headers = { "api-key": devKey, "Content-Type": "application/json" };
  const langLabel = language === "en" ? "英語" : "日本語";

  try {
    if (existingId) {
      console.log(`  🔄 Dev.to${langLabel}版: 更新リクエスト送信... (ID: ${existingId})`);
      const res = await axios.put(`https://dev.to/api/articles/${existingId}`, payload, { headers });
      console.log(`    ✅ Dev.to${langLabel}版 更新成功: ${res.data.url}`);
      return { id: res.data.id, url: res.data.url, isNew: false, articleKey, language };
    } else {
      console.log(`  📝 Dev.to${langLabel}版: 新規作成リクエスト送信...`);
      const res = await axios.post("https://dev.to/api/articles", payload, { headers });
      console.log(`    ✅ Dev.to${langLabel}版 作成成功: ${res.data.url}`);
      return { id: res.data.id, url: res.data.url, isNew: true, articleKey, language };
    }
  } catch (error) {
    const msg = error.response?.data?.error || error.message;
    console.error(`  ❌ Dev.to${langLabel}版 エラー: ${msg}`);
    return null;
  }
}

// ------------------------------------------------------------
// スクリプト実行
// ------------------------------------------------------------
main().catch((err) => {
  console.error("❌ 致命的なエラーが発生しました:", err);
  process.exit(1);
});
