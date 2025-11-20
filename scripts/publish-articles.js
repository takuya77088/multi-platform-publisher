// scripts/publish-articles.js
// 多プラットフォーム向け記事公開スクリプト（Qiita / Dev.to / Zenn GitHub同期）
// 公開・更新処理、slugの統一管理、フロントマターの解析などを担当

const fs = require("fs");
const path = require("path");
const axios = require("axios");
const matter = require("gray-matter");

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

  const qiitaId = publishedMeta[articleKey]?.qiita_id;

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
      return { id: res.data.id, url: res.data.url, isNew: true };
    } else {
      console.log(`🟡 Qiita: 既存記事を更新中 → ID=${qiitaId}`);
      const res = await axios.put(`https://qiita.com/api/v2/items/${qiitaId}`, payload, { headers });
      return { id: qiitaId, url: res.data.url, isNew: false };
    }
  } catch (error) {
    console.error(`❌ Qiita への投稿処理に失敗しました (${articleKey})`, error.response?.data || error.message);
    return null;
  }
}

// ------------------------------------------------------------
// Dev.to への記事公開処理
// ------------------------------------------------------------
async function publishToDevTo(article) {
  const devKey = process.env.DEV_TO_API_KEY;

  if (!devKey || devKey.trim() === "") {
    console.log("⏭️ DEV_TO_API_KEY が未設定のため、Dev.to への投稿をスキップします");
    return null;
  }

  const devtoPath = path.join(process.cwd(), "dev-to", `${article.key}.md`);
  if (!fs.existsSync(devtoPath)) {
    console.log(`⏭️ Dev.to 用 Markdown ファイルが存在しません: ${devtoPath}`);
    return null;
  }

  const mdContent = fs.readFileSync(devtoPath, "utf8");
  const parsed = matter(mdContent);

  const existingId = publishedMeta[article.key]?.devto_id;

  const payload = {
    article: {
      title: parsed.data.title,
      body_markdown: parsed.content,
      published: parsed.data.published || true,
      tags: parsed.data.topics ? parsed.data.topics.slice(0, 4) : [],
      slug: article.key,
    },
  };

  try {
    if (existingId) {
      console.log(`🔄 Dev.to: 既存記事を更新中 → ${article.key}`);
      const res = await axios.put(`https://dev.to/api/articles/${existingId}`, payload, {
        headers: { "api-key": devKey, "Content-Type": "application/json" },
      });
      console.log(`✅ Dev.to 更新成功: ${res.data.url}`);
      return { id: res.data.id, url: res.data.url, isNew: false };
    } else {
      console.log(`📝 Dev.to: 新規記事を作成中 → ${article.key}`);
      const res = await axios.post("https://dev.to/api/articles", payload, {
        headers: { "api-key": devKey, "Content-Type": "application/json" },
      });
      console.log(`✅ Dev.to 投稿成功: ${res.data.url}`);
      return { id: res.data.id, url: res.data.url, isNew: true };
    }
  } catch (error) {
    console.error(`❌ Dev.to への投稿処理に失敗しました (${article.key})`, error.response?.data || error.message);
    return null;
  }
}

// ------------------------------------------------------------
// Markdown 記事の読み込み
// ------------------------------------------------------------
function loadMarkdownFiles() {
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
  });
}

// ------------------------------------------------------------
// メイン処理
// ------------------------------------------------------------
async function main() {
  console.log("🚀 Multi-platform publishing started...\n");

  const articles = loadMarkdownFiles();

  for (const article of articles) {
    const { key, content, frontmatter } = article;

    if (!frontmatter.title) {
      console.log(`❌ タイトルが存在しないためスキップしました: ${key}`);
      continue;
    }

    const title = frontmatter.title;
    const tags = frontmatter.topics || [];

    console.log("\n============================================================");
    console.log(`📄 処理対象記事: ${title}`);
    console.log("============================================================");

    try {
      const qiitaRes = await publishToQiita(key, title, content, tags);
      const devtoRes = await publishToDevTo(article);

      // メタデータ更新
      publishedMeta[key] = {
        qiita_id: qiitaRes?.id,
        qiita_url: qiitaRes?.url,
        devto_id: devtoRes?.id,
        devto_url: devtoRes?.url,
      };

      console.log(
        `✅ 同期完了: ${key} (Qiita: ${qiitaRes?.isNew ? "新規" : "更新"}, Dev.to: ${devtoRes?.isNew ? "新規" : "更新"})`
      );
    } catch (err) {
      console.error(`❌ 公開処理中にエラーが発生しました (${key})`, err.response?.data || err);
    }
  }

  fs.writeFileSync(META_FILE, JSON.stringify(publishedMeta, null, 2));
  console.log(`\n📦 メタデータを保存しました → ${META_FILE}`);
  console.log("\n🎉 全プラットフォームへの公開処理が完了しました\n");
}

// ------------------------------------------------------------
// スクリプト実行
// ------------------------------------------------------------
main().catch((err) => {
  console.error("❌ 致命的なエラーが発生しました:", err);
  process.exit(1);
});
