// scripts/sync-published-articles.js
// 公開済み記事メタデータを各プラットフォームAPIから同期するスクリプト
// GitHub Actions実行後、ローカルファイルを最新状態に更新するために使用

const fs = require("fs");
const path = require("path");
const axios = require("axios");
require("dotenv").config();

const META_FILE = "config/published-articles.json";
const ARTICLES_DIR = "articles";

// 公開済み記事メタデータの読み込み
let publishedMeta = {};
if (fs.existsSync(META_FILE)) {
  publishedMeta = JSON.parse(fs.readFileSync(META_FILE, "utf8"));
}

// ------------------------------------------------------------
// Qiita API から記事一覧を取得
// ------------------------------------------------------------
async function fetchQiitaArticles(username) {
  const qiitaToken = process.env.QIITA_API_TOKEN;
  
  if (!qiitaToken) {
    console.log("⏭️  QIITA_API_TOKEN が未設定のため、Qiita からの同期をスキップします");
    return [];
  }

  try {
    console.log(`📥 Qiita から記事一覧を取得中... (ユーザー: ${username})`);
    const res = await axios.get(`https://qiita.com/api/v2/users/${username}/items`, {
      headers: {
        Authorization: `Bearer ${qiitaToken}`,
      },
      params: {
        per_page: 100, // 最大100件
      },
    });

    console.log(`  ✅ ${res.data.length}件の記事を取得しました`);
    return res.data.map(item => ({
      id: item.id,
      url: item.url,
      title: item.title,
      created_at: item.created_at,
    }));
  } catch (error) {
    console.error(`❌ Qiita からの記事取得に失敗しました:`, error.response?.data || error.message);
    return [];
  }
}

// ------------------------------------------------------------
// Dev.to API から記事一覧を取得
// ------------------------------------------------------------
async function fetchDevToArticles(username) {
  const devKey = process.env.DEV_TO_API_KEY;
  
  if (!devKey) {
    console.log("⏭️  DEV_TO_API_KEY が未設定のため、Dev.to からの同期をスキップします");
    return [];
  }

  try {
    console.log(`📥 Dev.to から記事一覧を取得中... (ユーザー: ${username})`);
    const res = await axios.get(`https://dev.to/api/articles/me`, {
      headers: {
        "api-key": devKey,
      },
      params: {
        per_page: 1000, // Dev.to は最大1000件
      },
    });

    console.log(`  ✅ ${res.data.length}件の記事を取得しました`);
    return res.data.map(article => ({
      id: article.id,
      url: article.url,
      title: article.title,
      created_at: article.created_at,
    }));
  } catch (error) {
    console.error(`❌ Dev.to からの記事取得に失敗しました:`, error.response?.data || error.message);
    return [];
  }
}

// ------------------------------------------------------------
// ローカル記事ファイルからキーとタイトルを取得
// ------------------------------------------------------------
function getLocalArticles() {
  const matter = require("gray-matter");
  const files = fs.readdirSync(ARTICLES_DIR).filter((f) => f.endsWith(".md"));
  
  return files.map(file => {
    const filePath = path.join(ARTICLES_DIR, file);
    const content = fs.readFileSync(filePath, "utf8");
    const parsed = matter(content);
    
    return {
      key: file.replace(".md", ""),
      title: parsed.data.title || "",
      file: file,
    };
  });
}

// ------------------------------------------------------------
// タイトルから記事キーを推測
// ------------------------------------------------------------
function guessArticleKey(title, localArticles) {
  // タイトルを正規化（小文字、特殊文字除去）
  const normalize = (str) => str
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
  
  const normalizedTitle = normalize(title);
  
  // 1. タイトルで完全一致を探す
  for (const article of localArticles) {
    if (article.title) {
      const normalizedLocalTitle = normalize(article.title);
      if (normalizedLocalTitle === normalizedTitle) {
        return article.key;
      }
    }
  }
  
  // 2. タイトルで部分一致を探す
  for (const article of localArticles) {
    if (article.title) {
      const normalizedLocalTitle = normalize(article.title);
      if (normalizedLocalTitle.includes(normalizedTitle) || normalizedTitle.includes(normalizedLocalTitle)) {
        return article.key;
      }
    }
  }
  
  // 3. ファイル名で部分一致を探す
  for (const article of localArticles) {
    const normalizedKey = normalize(article.key).replace(/^\d{8}-/, ""); // 日付プレフィックスを除去
    if (normalizedTitle.includes(normalizedKey) || normalizedKey.includes(normalizedTitle)) {
      return article.key;
    }
  }
  
  return null;
}

// ------------------------------------------------------------
// メイン処理
// ------------------------------------------------------------
async function main() {
  console.log("🔄 公開済み記事メタデータの同期を開始...\n");

  // 環境変数からユーザー名を取得（デフォルト値を使用）
  const qiitaUsername = process.env.QIITA_USERNAME || "kazuya828";
  const devtoUsername = process.env.DEV_TO_USERNAME || "nakamura_takuya";

  // ローカル記事情報を取得
  const localArticles = getLocalArticles();
  console.log(`📋 ローカル記事: ${localArticles.length}件\n`);

  // 各プラットフォームから記事を取得
  const qiitaArticles = await fetchQiitaArticles(qiitaUsername);
  const devtoArticles = await fetchDevToArticles(devtoUsername);

  console.log("\n🔄 メタデータを更新中...\n");

  let updatedCount = 0;
  let newCount = 0;

  // Qiita 記事を処理
  for (const article of qiitaArticles) {
    const key = guessArticleKey(article.title, localArticles);
    if (key) {
      if (!publishedMeta[key]) {
        publishedMeta[key] = {};
        newCount++;
      }
      if (!publishedMeta[key].qiita_id || publishedMeta[key].qiita_id !== article.id) {
        publishedMeta[key].qiita_id = article.id;
        publishedMeta[key].qiita_url = article.url;
        updatedCount++;
        console.log(`  ✅ Qiita: ${key} -> ${article.id}`);
      }
    } else {
      console.log(`  ⚠️  Qiita記事のマッチングに失敗: "${article.title}"`);
    }
  }

  // Dev.to 記事を処理
  for (const article of devtoArticles) {
    const key = guessArticleKey(article.title, localArticles);
    if (key) {
      if (!publishedMeta[key]) {
        publishedMeta[key] = {};
        newCount++;
      }
      if (!publishedMeta[key].devto_id || publishedMeta[key].devto_id !== article.id) {
        publishedMeta[key].devto_id = article.id;
        publishedMeta[key].devto_url = article.url;
        updatedCount++;
        console.log(`  ✅ Dev.to: ${key} -> ${article.id}`);
      }
    } else {
      console.log(`  ⚠️  Dev.to記事のマッチングに失敗: "${article.title}"`);
    }
  }

  // ファイルに保存
  fs.writeFileSync(META_FILE, JSON.stringify(publishedMeta, null, 2));
  
  console.log(`\n🎉 同期完了!`);
  console.log(`  📊 更新: ${updatedCount}件`);
  console.log(`  📊 新規: ${newCount}件`);
  console.log(`  💾 ファイルを保存しました: ${META_FILE}\n`);
}

// スクリプト実行
main().catch((err) => {
  console.error("❌ 致命的なエラーが発生しました:", err);
  process.exit(1);
});

