// scripts/check-metadata.js
// 公開済み記事メタデータの整合性をチェックするスクリプト

const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

const META_FILE = path.join(process.cwd(), "config", "published-articles.json");
const ARTICLES_DIR = "articles";
const DEVTO_DIR = "dev-to";

// メタデータ読み込み
let publishedMeta = {};
if (fs.existsSync(META_FILE)) {
  try {
    publishedMeta = JSON.parse(fs.readFileSync(META_FILE, "utf8"));
    console.log(`✅ メタデータファイルを読み込みました: ${META_FILE}\n`);
  } catch (error) {
    console.error(`❌ メタデータの読み込みに失敗しました:`, error.message);
    process.exit(1);
  }
} else {
  console.log(`⚠️  メタデータファイルが存在しません: ${META_FILE}`);
  process.exit(0);
}

// ローカル記事一覧取得
function getLocalArticles() {
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

// Dev.to英語版ファイル一覧取得
function getDevToEnFiles() {
  if (!fs.existsSync(DEVTO_DIR)) {
    return [];
  }
  
  const files = fs.readdirSync(DEVTO_DIR).filter((f) => f.endsWith("-en.md"));
  
  return files.map(file => {
    const filePath = path.join(DEVTO_DIR, file);
    const content = fs.readFileSync(filePath, "utf8");
    const parsed = matter(content);
    
    return {
      key: file.replace("-en.md", ""),
      title: parsed.data.title || "",
      file: file,
    };
  });
}

// メイン処理
function main() {
  console.log("=".repeat(60));
  console.log("📋 公開済み記事メタデータの整合性チェック");
  console.log("=".repeat(60));

  const localArticles = getLocalArticles();
  const devtoEnFiles = getDevToEnFiles();
  
  console.log(`\n📊 ローカル記事: ${localArticles.length}件`);
  console.log(`🌐 Dev.to英語版ファイル: ${devtoEnFiles.length}件`);
  console.log(`📦 メタデータ登録記事: ${Object.keys(publishedMeta).length}件\n`);

  // 記事ごとの状態をチェック
  console.log("-".repeat(60));
  console.log("📄 記事ごとの状態");
  console.log("-".repeat(60));

  let qiitaCount = 0;
  let devtoJaCount = 0;
  let devtoEnCount = 0;
  let issues = [];

  Object.keys(publishedMeta).forEach(key => {
    const meta = publishedMeta[key];
    const localArticle = localArticles.find(a => a.key === key);
    const devtoEnFile = devtoEnFiles.find(f => f.key === key);

    console.log(`\n🔑 ${key}`);
    if (localArticle) {
      console.log(`   📝 タイトル: ${localArticle.title}`);
    } else {
      console.log(`   ⚠️  ローカル記事が見つかりません`);
      issues.push(`${key}: ローカル記事が見つかりません`);
    }

    // Qiita
    if (meta.qiita) {
      qiitaCount++;
      console.log(`   ✅ Qiita: ID=${meta.qiita.id}, URL=${meta.qiita.url}`);
    } else {
      console.log(`   ⏭️  Qiita: 未登録`);
    }

    // Dev.to 日本語版
    if (meta.devto?.ja) {
      devtoJaCount++;
      console.log(`   ✅ Dev.to日本語版: ID=${meta.devto.ja.id}, URL=${meta.devto.ja.url}`);
    } else if (localArticle) {
      console.log(`   ⏭️  Dev.to日本語版: 未登録`);
    }

    // Dev.to 英語版
    if (meta.devto?.en) {
      devtoEnCount++;
      console.log(`   ✅ Dev.to英語版: ID=${meta.devto.en.id}, URL=${meta.devto.en.url}`);
      if (!devtoEnFile) {
        console.log(`   ⚠️  Dev.to英語版ファイルが見つかりません`);
        issues.push(`${key}: Dev.to英語版メタデータがありますがファイルが見つかりません`);
      }
    } else if (devtoEnFile) {
      console.log(`   ⚠️  Dev.to英語版: メタデータ未登録（ファイルは存在）`);
      issues.push(`${key}: Dev.to英語版ファイルがありますがメタデータ未登録`);
    } else {
      console.log(`   ⏭️  Dev.to英語版: 未登録`);
    }
  });

  // 未登録のローカル記事をチェック
  console.log("\n" + "-".repeat(60));
  console.log("📝 未登録のローカル記事");
  console.log("-".repeat(60));

  const unregisteredArticles = localArticles.filter(a => !publishedMeta[a.key]);
  if (unregisteredArticles.length > 0) {
    unregisteredArticles.forEach(article => {
      console.log(`   🔑 ${article.key}`);
      console.log(`      📝 ${article.title}`);
      issues.push(`${article.key}: まだ公開されていません`);
    });
  } else {
    console.log("   ✅ すべてのローカル記事が登録されています");
  }

  // まとめ
  console.log("\n" + "=".repeat(60));
  console.log("📊 サマリー");
  console.log("=".repeat(60));
  console.log(`   Qiita: ${qiitaCount}件`);
  console.log(`   Dev.to日本語版: ${devtoJaCount}件`);
  console.log(`   Dev.to英語版: ${devtoEnCount}件`);

  if (issues.length > 0) {
    console.log(`\n⚠️  ${issues.length}件の問題が見つかりました:`);
    issues.forEach(issue => console.log(`   - ${issue}`));
    console.log("\n💡 対策が必要な場合は、以下を実行してください:");
    console.log("   - 未登録記事の公開: npm run publish");
    console.log("   - メタデータ同期: node scripts/sync-published-articles.js");
    process.exit(1);
  } else {
    console.log("\n✅ メタデータは正常です！");
    process.exit(0);
  }
}

main();