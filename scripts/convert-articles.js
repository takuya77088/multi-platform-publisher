const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { execSync } = require('child_process');

// 公開済み記事メタデータの読み込み
const META_FILE = path.join(process.cwd(), 'config', 'published-articles.json');
let publishedMeta = {};
if (fs.existsSync(META_FILE)) {
  publishedMeta = JSON.parse(fs.readFileSync(META_FILE, 'utf8'));
}

// Git差分から変更された記事のみ取得
function getModifiedArticles(forceAll = false) {
  // テストモード：全記事を対象とする
  if (forceAll) {
    console.log('🧪 テストモード: 全記事を変換対象とします');
    return getAllArticlesForConversion();
  }
  
  try {
    // 前回コミットから変更されたarticlesファイル一覧を取得
    const gitDiffCommand = 'git diff --name-only HEAD~1 HEAD -- articles/';
    const modifiedFiles = execSync(gitDiffCommand, { encoding: 'utf8' })
      .trim()
      .split('\n')
      .filter(file => file && file.endsWith('.md'));
    
    console.log(`🔍 Git差分検出: ${modifiedFiles.length}件の変更されたファイル`);
    
    if (modifiedFiles.length === 0) {
      return [];
    }
    
    return modifiedFiles.map(file => {
      const filePath = path.join(process.cwd(), file);
      if (!fs.existsSync(filePath)) {
        console.log(`⚠️  ファイルが見つかりません: ${file}`);
        return null;
      }
      
      const content = fs.readFileSync(filePath, 'utf8');
      const parsed = matter(content);
      
      return {
        filename: path.basename(file),
        slug: path.basename(file, '.md'),
        frontmatter: parsed.data,
        content: parsed.content,
        fullContent: content
      };
    }).filter(Boolean).filter(article => {
      // published: true の記事、または platforms オブジェクトで true になっている記事を変換対象とする
      const hasPlatformEnabled = article.frontmatter.platforms && 
        typeof article.frontmatter.platforms === 'object' &&
        Object.values(article.frontmatter.platforms).some(enabled => enabled === true);
      
      return article.frontmatter.published || hasPlatformEnabled;
    });
  } catch (error) {
    console.log('⚠️  Git差分取得に失敗、全記事を変換対象とします');
    return getAllArticlesForConversion();
  }
}

// 全記事を変換対象として取得（フォールバック用）
function getAllArticlesForConversion() {
  const articlesDir = path.join(process.cwd(), 'articles');
  const files = fs.readdirSync(articlesDir).filter(file => file.endsWith('.md'));
  
  return files.map(file => {
    const filePath = path.join(articlesDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const parsed = matter(content);
    
    return {
      filename: file,
      slug: file.replace('.md', ''),
      frontmatter: parsed.data,
      content: parsed.content,
      fullContent: content
    };
  }).filter(article => {
    // published: true の記事、または platforms オブジェクトで true になっている記事を変換対象とする
    const hasPlatformEnabled = article.frontmatter.platforms && 
      typeof article.frontmatter.platforms === 'object' &&
      Object.values(article.frontmatter.platforms).some(enabled => enabled === true);
    
    return article.frontmatter.published || hasPlatformEnabled;
  });
}

// --- 追加: 各プラットフォームのタグ数制限処理 ---
function limitTags(tags, platform) {
  if (!Array.isArray(tags)) return [];

  const limits = {
    qiita: 5,
    zenn: 5,
    devto: 4
  };

  const max = limits[platform] ?? tags.length;
  return tags.slice(0, max); // 超過分は自動カット
}


// Qiita形式に変換
function convertToQiita(article) {
  const { frontmatter, content } = article;
  
  // プラットフォーム選択チェック
  if (frontmatter.platforms && !frontmatter.platforms.qiita) {
    return null;
  }
  
  // Qiita用のYAMLフロントマターを作成（標準フォーマットに準拠）
  //const qiitaTags = frontmatter.topics ? frontmatter.topics.map(tag => `  - ${tag}`).join('\n') : '';
  // Qiitaはタグ最大5個まで
  const qiitaTagList = limitTags(frontmatter.topics || [], 'qiita');
  const qiitaTags = qiitaTagList.map(tag => `  - ${tag}`).join('\n');

  const qiitaFrontmatterYaml = `title: ${frontmatter.title}

tags:
${qiitaTags}
private: false
updated_at: ""
id: null
organization_url_name: null
slide: false`;
  
  let qiitaContent = content;
  
  // ZennメッセージボックスをQiita形式に変換
  
  // 1. :::message → :::note warn（黄色→黄色）
  const messageCount = (qiitaContent.match(/:::message\r?\n/g) || []).length;
  if (messageCount > 0) {
    console.log(`    ℹ️  ${messageCount}個のZenn messageボックスを検出`);
  }
  qiitaContent = qiitaContent.replace(
    /:::message\r?\n([\s\S]*?):::/g,
    ':::note warn\n$1:::'
  );
  
  // 2. :::message alert → :::note alert（赤→赤）
  const alertCount = (qiitaContent.match(/:::message alert/g) || []).length;
  if (alertCount > 0) {
    console.log(`    ℹ️  ${alertCount}個のZenn alertボックスを検出`);
  }
  qiitaContent = qiitaContent.replace(
    /:::message alert\r?\n([\s\S]*?):::/g,
    ':::note alert\n$1:::'
  );
  
  const convertedCount = (qiitaContent.match(/:::note (warn|alert)/g) || []).length;
  if (alertCount + messageCount > 0 && convertedCount > 0) {
    console.log(`    ✅ ${convertedCount}個のQiitaノートボックスに変換成功`);
  }
  
  
  return {
    frontmatter: qiitaFrontmatterYaml,
    content: qiitaContent,
    fullContent: `---\n${qiitaFrontmatterYaml}\n---\n\n${qiitaContent}`
  };
}

// Dev.to形式に変換
function convertToDevTo(article) {
  const { frontmatter, content } = article;

  // プラットフォーム選択チェック
  if (frontmatter.platforms && !frontmatter.platforms.devto) {
    return null;
  }

  // Dev.toタグは最大4個まで
  const rawTags = frontmatter.topics || [];

  // Dev.to tag変換ロジック：英語tagは全て小文字かつ英数字のみ、他の言語はそのまま
  const normalizeDevToTag = (tag) => {
    // 英語文字を含むか判定
    const hasEnglish = /[a-zA-Z]/.test(tag);

    if (hasEnglish) {
      // 英語tag：小文字変換 + 英数字のみ（スペース、ハイフンなど全て削除）
      return tag.toLowerCase()
        .replace(/[^a-zA-Z0-9]/g, "")
        .substring(0, 30);
    } else {
      // 他の言語（日本語など）：そのまま
      return tag;
    }
  };

  const devtoTags = rawTags.slice(0, 4).map(normalizeDevToTag);
  
  // フロントマター構築
  const devtoFrontmatter = {
    title: frontmatter.title,
    published: true,
    tags: devtoTags, // 配列のまま渡す（matter.stringify/yaml.dumpが処理する）
    canonical_url: null,
    description: content.substring(0, 150).replace(/\n/g, ' ') + '...'
  };

  // 必須: js-yaml を使って安全に YAML 化（クオーテーション問題などを回避）
  // 以前の手動文字列結合は廃止
  const yaml = require('js-yaml');
  const frontmatterStr = yaml.dump(devtoFrontmatter, { lineWidth: -1 }).trim();

  let devtoContent = content;
  
  // 画像パスの調整などをここで行う場合は追加
  
  return {
    frontmatter: devtoFrontmatter,
    content: devtoContent,
    fullContent: `---\n${frontmatterStr}\n---\n\n${devtoContent}`
  };
}

// メイン実行
function main() {
  console.log('🔄 記事変換を開始...');
  
  // コマンドライン引数をチェック
  const args = process.argv.slice(2);
  const isTestMode = args.includes('--test') || args.includes('--all');
  
  if (isTestMode) {
    console.log('🧪 テストモードが有効です');
  }
  
  // 初回プッシュまたはGit差分取得失敗時は全記事、通常時は差分のみ
  const articles = getModifiedArticles(isTestMode);
  
  if (articles.length === 0) {
    console.log('✅ 変更された記事がありません。変換をスキップします。');
    return;
  }
  
  console.log(`📝 ${articles.length}件の変更記事を検出`);
  
  let qiitaCount = 0;
  let devtoCount = 0;
  
  articles.forEach(article => {
    console.log(`\n処理中: ${article.filename}`);
    
    // Qiita変換
    const qiitaArticle = convertToQiita(article);
    if (qiitaArticle) {
      const qiitaDir = path.join(process.cwd(), 'qiita', 'public');
      if (!fs.existsSync(qiitaDir)) {
        fs.mkdirSync(qiitaDir, { recursive: true });
      }
      
      // 記事キー（ファイル名から拡張子を除いたもの）
      const articleKey = article.slug;
      const qiitaId = publishedMeta[articleKey]?.qiita_id;
      
      // 既存のIDベースのファイルを削除（重複を避けるため）
      if (qiitaId) {
        const oldIdPath = path.join(qiitaDir, `${qiitaId}.md`);
        if (fs.existsSync(oldIdPath)) {
          console.log(`  🗑️  既存のIDベースファイルを削除: ${qiitaId}.md`);
          fs.unlinkSync(oldIdPath);
        }
        
        // frontmatterにIDを設定
        const yaml = require('js-yaml');
        const parsed = matter(qiitaArticle.fullContent);
        parsed.data.id = qiitaId;
        parsed.data.updated_at = publishedMeta[articleKey]?.qiita_url ? new Date().toISOString() : '';
        const frontmatterStr = yaml.dump(parsed.data, { lineWidth: -1 }).trim();
        qiitaArticle.fullContent = `---\n${frontmatterStr}\n---\n\n${parsed.content}`;
      }
      
      // 統一されたファイル名を使用（常に元のファイル名）
      const qiitaPath = path.join(qiitaDir, article.filename);
      fs.writeFileSync(qiitaPath, qiitaArticle.fullContent);
      qiitaCount++;
      console.log(`  ✅ Qiita版作成: ${qiitaPath}`);
    } else {
      console.log(`  ⏭️  Qiita変換スキップ（プラットフォーム指定）`);
    }
    
    // Dev.to変換（スキップ - dev-to/ディレクトリには手動で作成した英語版のみを保持）
    // console.log(`  ⏭️  Dev.to変換スキップ（英語版は手動作成）`);
  });
  
  console.log(`\n🎉 変換完了!`);
  console.log(`  📊 Qiita: ${qiitaCount}件`);
  console.log(`  📝 注意: Dev.to日本語版は公開時に自動変換されます`);
}

if (require.main === module) {
  main();
}

module.exports = {
  getModifiedArticles,
  getAllArticlesForConversion,
  convertToQiita,
  convertToDevTo
};