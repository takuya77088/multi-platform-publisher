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
// ------------------------------------------------------------
// メイン処理
// ------------------------------------------------------------
async function main() {
  console.log("🚀 Multi-platform publishing started...\n");

  // 元記事（Zenn形式）のリストを取得 - これをマスターリストとする
  const articles = loadMarkdownFiles();

  for (const article of articles) {
    const { key, frontmatter } = article;

    if (!frontmatter.title) {
      console.log(`❌ タイトルが存在しないためスキップしました: ${key}`);
      continue;
    }

    console.log("\n============================================================");
    console.log(`📄 処理対象記事: ${frontmatter.title} (${key})`);
    console.log("============================================================");

    // --- Qiita 処理 ---
    let qiitaRes = null;
    const qiitaConvertedPath = path.join(process.cwd(), "qiita", "public", `${key}.md`);

    // 変換済みファイルが存在するか確認（存在しない場合は、変更がないか変換エラーなのでスキップ）
    if (fs.existsSync(qiitaConvertedPath)) {
      console.log(`  🔍 Qiita用変換済みファイルを検出: ${qiitaConvertedPath}`);
      const qiitaContent = fs.readFileSync(qiitaConvertedPath, "utf8");
      const qiitaParsed = matter(qiitaContent);

      // 変換済みファイルからタグなどを取得
      const qiitaTags = qiitaParsed.data.tags || [];
      // Note: qiitaTags might be array or object from YAML? usually array.
      // convert-articles.js creates explicit YAML tags list. matter() should parse it as array?
      // Actually convert-articles.js writes `tags: \n  - tag1` etc. gray-matter parses this as array.

      // 公開実⾏
      qiitaRes = await publishToQiita(key, qiitaParsed.data.title, qiitaParsed.content, qiitaTags);
    } else {
      console.log(`  ⏭️  Qiita用変換済みファイルが見つからないためスキップ（変更なしか、変換対象外）`);
    }

    // --- Dev.to 処理 ---
    let devtoRes = null;
    const devtoConvertedPath = path.join(process.cwd(), "dev-to", `${key}.md`);

    if (fs.existsSync(devtoConvertedPath)) {
      console.log(`  🔍 Dev.to用変換済みファイルを検出: ${devtoConvertedPath}`);

      // 重要: convert-articles.js で生成されたファイルを読み込む
      // そこには既に制限されたタグや整形されたFrontmatterが含まれている
      const devtoContent = fs.readFileSync(devtoConvertedPath, "utf8");
      const devtoParsed = matter(devtoContent);

      // Dev.to用のpayload作成
      const payload = {
        article: {
          title: devtoParsed.data.title,
          body_markdown: devtoParsed.content,
          published: devtoParsed.data.published !== false, // Default true unless false
          tags: devtoParsed.data.tags || [], // Convert済みファイルは単純な配列または文字列(matterの解析次第)
          // YAML dumpで `tags: [a, b]` と書いた場合、此处は配列になる
        }
      };

      devtoRes = await publishToDevToWithPayload(key, payload);
    } else {
      console.log(`  ⏭️  Dev.to用変換済みファイルが見つからないためスキップ（変更なしか、変換対象外）`);
    }

    // --- メタデータ更新 (安全なマージ) ---
    // 成功した場合のみIDを更新し、既存のデータは保持する
    if (qiitaRes || devtoRes) {
      if (!publishedMeta[key]) publishedMeta[key] = {};

      if (qiitaRes) {
        publishedMeta[key].qiita_id = qiitaRes.id;
        publishedMeta[key].qiita_url = qiitaRes.url;
      }

      if (devtoRes) {
        publishedMeta[key].devto_id = devtoRes.id;
        publishedMeta[key].devto_url = devtoRes.url;
      }

      console.log(`  📦 メタデータをメモリ内で更新しました`);
    }
  }

  // 最後に一括保存
  fs.writeFileSync(META_FILE, JSON.stringify(publishedMeta, null, 2));
  console.log(`\n📦 メタデータファイルをディスクに保存しました → ${META_FILE}`);
  console.log("\n🎉 公開処理が完了しました\n");
}

// Helper: Refactored Dev.to publish that takes payload directly
async function publishToDevToWithPayload(key, payload) {
  const devKey = process.env.DEV_TO_API_KEY;
  if (!devKey) {
    console.log("  ⏭️  DEV_TO_API_KEY 未設定");
    return null;
  }

  const existingId = publishedMeta[key]?.devto_id;
  const headers = { "api-key": devKey, "Content-Type": "application/json" };

  try {
    if (existingId) {
      console.log(`  🔄 Dev.to: 更新リクエスト送信... (ID: ${existingId})`);
      const res = await axios.put(`https://dev.to/api/articles/${existingId}`, payload, { headers });
      console.log(`    ✅ Dev.to 更新成功: ${res.data.url}`);
      return { id: res.data.id, url: res.data.url, isNew: false };
    } else {
      console.log(`  📝 Dev.to: 新規作成リクエスト送信...`);
      const res = await axios.post("https://dev.to/api/articles", payload, { headers });
      console.log(`    ✅ Dev.to 作成成功: ${res.data.url}`);
      return { id: res.data.id, url: res.data.url, isNew: true };
    }
  } catch (error) {
    const msg = error.response?.data?.error || error.message;
    console.error(`  ❌ Dev.to エラー: ${msg}`);
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
