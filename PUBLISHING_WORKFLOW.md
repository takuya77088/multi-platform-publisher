# 记事发布工作流程

## ✅ 完全自动化发布（推荐）

### 核心原则
- 一条 `git push` 命令自动发布所有文章
- GitHub Actions 自动处理 Zenn、Qiita、Dev.to
- 英语版通过 `dev-to/*-en.md` 文件自动识别

---

## 🇯🇵 发布日语文章（3个平台）

**发布到**：Zenn（日语）、Qiita（日语）、Dev.to（日语）

```bash
# 1. 预览检查
npm run preview:all

# 2. 拉取远程更新
git pull origin main

# 3. 添加所有文件
git add articles/ images/

# 4. 提交
git commit -m "新记事: XXXX"

# 5. 推送（触发自动发布）
git push origin main

# 6. 等待 GitHub Actions 完成（约30秒）

# 7. 同步元数据
npm run sync
```

**结果**：
- ✅ Zenn: 日语文章
- ✅ Qiita: 日语文章
- ✅ Dev.to: 日语文章（自动转换）

---

## 🇬🇧 发布英语文章（Dev.to 英语版）

**发布到**：Zenn（日语）、Qiita（日语）、Dev.to（**英语版**）

```bash
# 1. 手动创建英语版文件
#    文件名：dev-to/文章key-en.md
#    例如：dev-to/cloudflare-mcp-server-setup-en.md

# 2. 预览检查
npm run preview:all

# 3. 拉取远程更新
git pull origin main

# 4. 添加所有文件（包括 dev-to/）
git add articles/ images/ dev-to/

# 5. 提交
git commit -m "新记事: XXXX（英语版）"

# 6. 推送（触发自动发布）
git push origin main

# 7. 等待 GitHub Actions 完成（约30秒）

# 8. 同步元数据
npm run sync
```

**结果**：
- ✅ Zenn: 日语文章
- ✅ Qiita: 日语文章
- ✅ Dev.to: **英语版文章**（从 dev-to/*-en.md 读取）

---

## 📝 关键说明

### 1. Dev.to 发布逻辑

系统会自动检查：

```
如果存在 dev-to/文章key-en.md：
  → 发布英语版到 Dev.to

如果不存在：
  → 发布日语版到 Dev.to（自动转换）
```

### 2. 命令简化

**方案1：通用命令（推荐）**
```bash
git add articles/ images/ dev-to/
```
- ✅ 适用于所有情况
- ✅ 即使没有 dev-to/ 文件也不会报错

**方案2：精确命令**
```bash
# 日语版
git add articles/ images/

# 英语版
git add articles/ images/ dev-to/*-en.md
```

### 3. 不会重复发布旧文章

系统有保护机制：
- ✅ Git 差分检测：只处理修改的文章
- ✅ 更新保护：已发布的文章默认不更新
- ✅ 需要更新时使用 `--update` 参数

---

## ⚠️ 重要提示

### ✅ 不会影响业务逻辑
- ✅ `dev-to/` 添加到 git 不会改变任何代码逻辑
- ✅ 发布脚本的行为完全一致
- ✅ 不会有缓存问题
- ✅ 不会重复发布文章

### ✅ dev-to/ 文件夹会显示在 GitHub
- 这是为了让 GitHub Actions 能够读取英语版文件
- 如果您不介意，这是最自动化的方案

---

## 🎯 完整示例

### 示例1：发布日语文章

```bash
# 编辑 articles/my-new-article.md
git add articles/ images/
git commit -m "新记事: 我的新文章"
git push origin main
npm run sync
```

### 示例2：发布英语文章

```bash
# 1. 编辑 articles/my-new-article.md（日语版）
# 2. 创建 dev-to/my-new-article-en.md（英语版）

git add articles/ images/ dev-to/
git commit -m "新记事: 我的新文章（英语版）"
git push origin main
npm run sync
```

---

## 📊 对比

| 方式 | 命令数 | 自动化程度 | dev-to/ 可见性 |
|------|--------|-----------|---------------|
| **完全自动** | 1条 git 命令 | ⭐⭐⭐⭐⭐ | 可见 |
| 手动发布 | git + npm run publish | ⭐⭐⭐ | 不可见 |

---

## ✨ 总结

**最简单的流程**：

```bash
git add articles/ images/ dev-to/
git commit -m "新记事: XXXX"
git push origin main
npm run sync
```

**就是这么简单！一条命令，完全自动化！** 🎉

---

最后更新: 2026-01-13
