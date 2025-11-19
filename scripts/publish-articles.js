// scripts/publish-articles.js
// 多平台文章发布脚本（Qiita + Dev.to + Zenn GitHub同步）
// 功能：支持文章新增和更新，Dev.to slug 强制与文件名一致
// 中文注释：每一行主要操作都有注释，方便后期维护

const fs = require("fs");
const path = require("path");
const axios = require("axios");
const matter = require("gray-matter");

// 本地文章目录和已发布文章 metadata 文件
const ARTICLES_DIR = "articles";
const META_FILE = "config/published-articles.json";

// 加载已发布文章的 metadata
let publishedMeta = {};
if (fs.existsSync(META_FILE)) {
  publishedMeta = JSON.parse(fs.readFileSync(META_FILE, "utf8"));
}

// ---------------- Qiita 发布函数 ----------------
async function publishToQiita(articleKey, title, body, tags) {
  const qiitaToken = process.env.QIITA_API_TOKEN;
  if (!qiitaToken) {
    console.log("⏭️ Qiita token 未设置，跳过 Qiita 发布");
    return null;
  }

  // 设置请求头
  const headers = {
    Authorization: `Bearer ${qiitaToken}`,
    "Content-Type": "application/json",
  };

  // 检查文章是否已发布过（Qiita ID）
  const qiitaId = publishedMeta[articleKey]?.qiita_id;

  const payload = {
    title,
    body,
    tags: tags.map((t) => ({ name: t })), // Qiita tags 格式
    private: false,
  };

  try {
    if (!qiitaId) {
      // 新建文章
      console.log(`🟢 创建 Qiita 新文章: ${articleKey}`);
      const res = await axios.post("https://qiita.com/api/v2/items", payload, { headers });
      return { id: res.data.id, url: res.data.url, isNew: true };
    } else {
      // 更新文章
      console.log(`🟡 更新 Qiita 文章: ID=${qiitaId}`);
      const res = await axios.put(`https://qiita.com/api/v2/items/${qiitaId}`, payload, { headers });
      return { id: qiitaId, url: res.data.url, isNew: false };
    }
  } catch (error) {
    console.error(`❌ Qiita 发布失败 (${articleKey})`, error.response?.data || error.message);
    return null;
  }
}

// ---------------- Dev.to 发布函数 ----------------
async function publishToDevTo(article) {
  const devKey = process.env.DEV_TO_API_KEY;
  if (!devKey || devKey.trim() === "") {
    console.log("⏭️ DEV_TO_API_KEY 未设置，跳过 Dev.to 发布");
    return null;
  }

  // 本地 Dev.to Markdown 文件路径
  const devtoPath = path.join(process.cwd(), "dev-to", `${article.key}.md`);
  if (!fs.existsSync(devtoPath)) {
    console.log(`⏭️ Dev.to 文件不存在: ${devtoPath}`);
    return null;
  }

  const mdContent = fs.readFileSync(devtoPath, "utf8");
  const parsed = matter(mdContent); // 解析 frontmatter

  try {
    const existingId = publishedMeta[article.key]?.devto_id;

    // 构建请求体
    const payload = {
      article: {
        title: parsed.data.title,                    // 标题
        body_markdown: parsed.content,              // 文章内容
        published: parsed.data.published || true,  // 是否发布
        tags: parsed.data.topics ? parsed.data.topics.slice(0, 4) : [], // 前4个tags
        slug: article.key                            // 强制 slug = 文件名
      },
    };

    if (existingId) {
      // 更新已发布文章
      console.log(`🔄 更新 Dev.to 文章: ${article.key}`);
      const res = await axios.put(`https://dev.to/api/articles/${existingId}`, payload, {
        headers: { "api-key": devKey, "Content-Type": "application/json" },
      });
      console.log(`✅ Dev.to 更新成功: ${res.data.url}`);
      return { id: res.data.id, url: res.data.url, isNew: false };
    } else {
      // 新建文章
      console.log(`📝 创建 Dev.to 新文章: ${article.key}`);
      const res = await axios.post(`https://dev.to/api/articles`, payload, {
        headers: { "api-key": devKey, "Content-Type": "application/json" },
      });
      console.log(`✅ Dev.to 发布成功: ${res.data.url}`);
      return { id: res.data.id, url: res.data.url, isNew: true };
    }
  } catch (error) {
    console.error(`❌ Dev.to 发布失败 (${article.key})`, error.response?.data || error.message);
    return null;
  }
}

// ---------------- 加载本地 Markdown 文件 ----------------
function loadMarkdownFiles() {
  const files = fs.readdirSync(ARTICLES_DIR).filter((f) => f.endsWith(".md"));
  return files.map((file) => {
    const fullPath = path.join(ARTICLES_DIR, file);
    const mdContent = fs.readFileSync(fullPath, "utf8");
    const { data, content } = matter(mdContent);
    return {
      key: file.replace(".md", ""), // 文件名作为 key/slug
      file,
      fullPath,
      frontmatter: data,
      content,
      isDraft: data?.draft === true,
    };
  });
}

// ---------------- 主函数 ----------------
async function main() {
  console.log("🚀 Multi-platform publishing started...\n");

  const articles = loadMarkdownFiles();

  for (const article of articles) {
    const { key, content, frontmatter } = article;

    if (!frontmatter.title) {
      console.log(`❌ Skipped (没有标题): ${key}`);
      continue;
    }

    const title = frontmatter.title;
    const tags = frontmatter.topics || [];

    console.log(`\n===============================`);
    console.log(`📄 处理文章: ${title}`);
    console.log(`===============================`);

    try {
      // 发布到 Qiita
      const qiitaRes = await publishToQiita(key, title, content, tags);

      // 发布到 Dev.to
      const devtoRes = await publishToDevTo(article);

      // 更新已发布 metadata
      publishedMeta[key] = {
        qiita_id: qiitaRes?.id,
        qiita_url: qiitaRes?.url,
        devto_id: devtoRes?.id,
        devto_url: devtoRes?.url,
      };

      console.log(
        `✅ 同步完成: ${key} (Qiita: ${qiitaRes?.isNew ? "创建" : "更新"}, Dev.to: ${devtoRes?.isNew ? "创建" : "更新"})`
      );
    } catch (err) {
      console.error(`❌ 发布错误 (${key}):`, err.response?.data || err);
    }
  }

  // 保存 metadata 到 JSON 文件
  fs.writeFileSync(META_FILE, JSON.stringify(publishedMeta, null, 2));
  console.log(`\n📦 Metadata 已保存 → ${META_FILE}`);

  console.log("\n🎉 多平台发布完成\n");
}

// 运行主函数
main().catch((err) => {
  console.error("❌ Fatal error:", err);
  process.exit(1);
});

