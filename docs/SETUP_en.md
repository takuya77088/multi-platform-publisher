# 🚀 Multi Platform Publisher Setup Guide

This guide explains the initial setup for automatic posting to multiple platforms using the Multi Platform Publisher system.

## 📋 Prerequisites

- GitHub account
- Accounts on Zenn, Qiita, and Dev.to
- Basic knowledge of Git operations

---

## 🎯 Step 1: Fork and Clone Repository

### 1.1 Fork on GitHub
1. Visit the original repository
2. Click the "Fork" button in the top right
3. Fork to your account

### 1.2 Clone to Local
```bash
# Clone your forked repository
git clone https://github.com/[your-username]/multi-platform-publisher.git
cd multi-platform-publisher

# Install dependencies
npm install
```

---

## 🔗 Step 2: Zenn GitHub Integration

Zenn uses GitHub integration instead of API.

### 2.1 Connect Repository on Zenn

1. **Login to Zenn**
   - https://zenn.dev/

2. **GitHub Deploy Settings**
   - Click avatar in top right → "GitHubからのデプロイ" (Deploy from GitHub)

3. **Repository Settings**
   - Click "リポジトリ設定" (Repository Settings)
   - Click "リポジトリを連携する" (Connect Repository)

4. **Select Repository**
   - Select "Only select repositories"
   - Select `[your-username]/multi-platform-publisher`
   - Click "連携する" (Connect)

### 2.2 Verify Integration

After setup, confirm that the connected repository is displayed in Zenn settings.

---

## 🔑 Step 3: Obtain API Keys

Get API keys for each platform.

### 3.1 Qiita API Token

1. **Access Qiita Settings**
   - https://qiita.com/settings/applications

2. **Create Personal Access Token**
   - Click "新しくトークンを発行する" (Issue new token)
   - **Description**: `Qiita Multi Platform Publisher`
   - **Scopes**: 
     - ✅ `read_qiita`
     - ✅ `write_qiita`
   - Click "発行する" (Issue)

3. **Copy Token**
   - ⚠️ **Important**: Token is only displayed once, so copy and save it securely

### 3.2 Dev.to API Key

1. **Access Dev.to Settings**
   - https://dev.to/settings/extensions

2. **Generate API Key**
   - Click "Generate API Key"
   - **Description**: `Dev.to Multi Platform Publisher`
   - Click "Generate API Key"

3. **Copy API Key**
   - Copy the displayed API key and save it securely

---

## ⚙️ Step 4: Configure GitHub Secrets

### 4.1 Navigate to GitHub Repository Settings

1. Go to your forked repository page
2. Click the "Settings" tab
3. In the left sidebar, select "Secrets and variables" → "Actions"

### 4.2 Add Secrets

Click "New repository secret" to create secrets for the platforms you want to use:

> **📌 Note**: You don't need to set all tokens. Platforms without configured tokens will be automatically skipped during publishing.

#### Secret 1: Qiita API Token (if publishing to Qiita)
- **Name**: `QIITA_API_TOKEN`
- **Secret**: Qiita API token obtained in Step 3.1
- Click "Add secret"

#### Secret 2: Dev.to API Key (if publishing to Dev.to)
- **Name**: `DEV_TO_API_KEY`
- **Secret**: Dev.to API key obtained in Step 3.2
- Click "Add secret"

### 4.3 Verify Configuration

Confirm that your configured secrets appear in "Repository secrets":
```
QIITA_API_TOKEN        •••••••••••••••• (if using Qiita)
DEV_TO_API_KEY         •••••••••••••••• (if using Dev.to)
```

## 🔧 Step 5: GitHub Actions Permissions

Configure permissions so GitHub Actions can update the tracking file (`config/published-articles.json`).

### 5.1 Open Actions Permissions

1. Click the "Settings" tab in your repository
2. In the left sidebar, select "Actions" → "General"
3. Scroll down to find the "Workflow permissions" section

### 5.2 Configure Permissions

Under "Workflow permissions", select:
- ✅ **Read and write permissions**
- ✅ **Allow GitHub Actions to create and approve pull requests** (optional)

Click "Save" to save the settings

---

## 🎨 Step 6: CLI Environment Setup (Optional)

Setup for local preview functionality.

### 6.1 Initialize Zenn CLI
```bash
# Initialize Zenn CLI
npx zenn init

# Start preview server (for testing)
npx zenn preview
# → Preview available at http://localhost:8000
```

### 6.2 Initialize Qiita CLI
```bash
# Initialize Qiita CLI
npx qiita init

# Start preview server (for testing)
npx qiita preview  
# → Preview available at http://localhost:8888
```

### 6.3 Concurrent Preview
```bash
# Preview both Zenn and Qiita simultaneously
npm run preview:all
```

---

## ✅ Setup Complete!

Basic setup is now complete.

### Next Steps
📖 **[WORKFLOW_en.md](WORKFLOW_en.md)** - Learn how to write and publish articles:
- Article creation methods
- Platform selection
- Preview confirmation
- Publishing process
- Troubleshooting

---

## 🔧 Troubleshooting

### Common Errors and Solutions

#### ❌ Article Not Appearing on Zenn

**Cause**: GitHub integration configuration error
**Solution**: Redo Zenn integration setup from Step 2 and verify the connection is properly established

#### ❌ GitHub Actions Fails

**Cause**: API key configuration error or insufficient permissions
**Solution**: 
- Recheck Secrets configuration from Step 4
- Verify Workflow permissions from Step 5
