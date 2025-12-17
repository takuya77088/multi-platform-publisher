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

  // publishedMetaからIDを取得（最新の状態を確認）
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
      tags: parsed.data.tags ? (Array.isArray(parsed.data.tags) ? parsed.data.tags : [parsed.data.tags]) : [],
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
// Slug生成ユーティリティ
// ------------------------------------------------------------
function generateSlug(filename) {
  // ファイル名から拡張子を除去
  let slug = filename.replace(/\.md$/, '');
  
  // 日付プレフィックス（YYYYMMDD-）を除去（オプション）
  // 例: 20251113-what-is-apidog-mcp-server -> what-is-apidog-mcp-server
  slug = slug.replace(/^\d{8}-/, '');
  
  // 既に適切な形式（小文字、ハイフン区切り）の場合はそのまま返す
  // そうでない場合は、より適切な形式に変換
  // Dev.to の slug は小文字、ハイフン区切り、最大250文字
  slug = slug.toLowerCase();
  
  // 特殊文字をハイフンに変換
  slug = slug.replace(/[^a-z0-9-]/g, '-');
  
  // 連続するハイフンを1つに
  slug = slug.replace(/-+/g, '-');
  
  // 先頭と末尾のハイフンを削除
  slug = slug.replace(/^-+|-+$/g, '');
  
  // 最大長を制限（Dev.to の制限に合わせて）
  if (slug.length > 250) {
    slug = slug.substring(0, 250);
    slug = slug.replace(/-+$/, ''); // 末尾のハイフンを削除
  }
  
  return slug;
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
      slug: generateSlug(file), // カスタムslugを追加
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
      
      // 変換済みファイルにIDがある場合は、それを優先（convert-articles.jsで設定されたもの）
      // ただし、publishedMetaにもIDがある場合は、それを使用（より確実）
      const fileId = qiitaParsed.data.id;
      const metaId = publishedMeta[key]?.qiita_id;
      const finalId = metaId || fileId || null;
      
      // publishedMetaを一時的に更新（関数内で使用するため）
      if (finalId && !metaId) {
        if (!publishedMeta[key]) publishedMeta[key] = {};
        publishedMeta[key].qiita_id = finalId;
        console.log(`  ℹ️  変換ファイルからIDを取得: ${finalId}`);
      }

      // 公開実⾏
      qiitaRes = await publishToQiita(key, qiitaParsed.data.title, qiitaParsed.content, qiitaTags);
    } else if (!shouldPublishToQiita) {
      console.log(`  ⏭️  Qiitaへの投稿が無効化されています（platforms.qiita: false）`);
    } else {
      console.log(`  ⏭️  Qiita用変換済みファイルが見つからないためスキップ（変更なしか、変換対象外）`);
    }

    // --- Dev.to 処理 ---
    let devtoRes = null;
    const devtoConvertedPath = path.join(process.cwd(), "dev-to", `${key}.md`);

    // プラットフォーム設定をチェック
    const shouldPublishToDevTo = !frontmatter.platforms || frontmatter.platforms.devto !== false;

    if (fs.existsSync(devtoConvertedPath) && shouldPublishToDevTo) {
      console.log(`  🔍 Dev.to用変換済みファイルを検出: ${devtoConvertedPath}`);

      // 重要: convert-articles.js で生成されたファイルを読み込む
      // そこには既に制限されたタグや整形されたFrontmatterが含まれている
      const devtoContent = fs.readFileSync(devtoConvertedPath, "utf8");
      const devtoParsed = matter(devtoContent);

      // Dev.to用のpayload作成
      // tagsの処理: 配列の場合はそのまま、文字列の場合は配列に変換
      let devtoTags = [];
      if (devtoParsed.data.tags) {
        devtoTags = Array.isArray(devtoParsed.data.tags) 
          ? devtoParsed.data.tags 
          : [devtoParsed.data.tags];
      }
      
      // カスタムslugを生成（ファイル名ベース、Zennのファイル名と一致）
      const customSlug = generateSlug(article.file);
      
      const payload = {
        article: {
          title: devtoParsed.data.title,
          body_markdown: devtoParsed.content,
          published: devtoParsed.data.published !== false, // Default true unless false
          tags: devtoTags, // Convert済みファイルは単純な配列または文字列(matterの解析次第)
          // YAML dumpで `tags: [a, b]` と書いた場合、此处は配列になる
          slug: customSlug, // カスタムslugを追加（Dev.to APIがサポートする場合）
        }
      };

      console.log(`  📌 カスタムslug: ${customSlug}`);
      devtoRes = await publishToDevToWithPayload(key, payload);
    } else if (!shouldPublishToDevTo) {
      console.log(`  ⏭️  Dev.toへの投稿が無効化されています（platforms.devto: false）`);
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
        console.log(`  ✅ Qiitaメタデータ更新: ID=${qiitaRes.id}`);
      }

      if (devtoRes) {
        publishedMeta[key].devto_id = devtoRes.id;
        publishedMeta[key].devto_url = devtoRes.url;
        console.log(`  ✅ Dev.toメタデータ更新: ID=${devtoRes.id}`);
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
