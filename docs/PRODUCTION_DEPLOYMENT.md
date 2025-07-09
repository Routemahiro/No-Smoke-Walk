# No-Smoke Walk Osaka 本番環境デプロイ手順書

## 🎯 概要

このドキュメントでは、No-Smoke Walk OsakaプロジェクトをCloudflare Pages + Workersで本番環境にデプロイし、GitHub Actionsによる自動デプロイを構築する手順を説明します。

## 🏗️ アーキテクチャ構成

```
GitHub Repository
├── GitHub Actions (CI/CD)
├── Frontend (Next.js 15)
│   └── Cloudflare Pages (@opennextjs/cloudflare)
├── Backend (Node.js API)
│   └── Cloudflare Workers
└── Database
    └── Supabase PostgreSQL
```

## 📋 前準備

### 1. 必要なアカウント・サービス

- [x] **GitHub アカウント**（リポジトリ管理）
- [x] **Cloudflare アカウント**（ホスティング）
- [x] **Supabase アカウント**（データベース）

### 2. ローカル環境セットアップ

```bash
# 必要なツールのインストール
npm install -g wrangler
npm install -g @cloudflare/next-on-pages

# Cloudflareログイン
wrangler login

# アカウント情報確認
wrangler whoami
```

## 🔧 Step 1: バックエンド移植（Workers化）

### 1.1 Workers設定ファイル更新

```toml
# backend/wrangler.toml
name = "no-smoke-walk-api"
main = "src/index.js"
compatibility_date = "2025-04-01"
compatibility_flags = ["nodejs_compat"]

[env.production]
name = "no-smoke-walk-api"
vars = { ENVIRONMENT = "production" }

[env.staging]
name = "no-smoke-walk-api-staging"
vars = { ENVIRONMENT = "staging" }
```

### 1.2 simple-server.js のWorkers化

```javascript
// backend/src/index.js
import { createSupabaseClient } from './utils/supabase';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // CORS設定
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    // ルーティング
    if (path === '/api/health') {
      return new Response(JSON.stringify({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: env.ENVIRONMENT || 'production'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    if (path === '/api/reports' && request.method === 'POST') {
      return handleReports(request, env, corsHeaders);
    }
    
    if (path === '/api/heatmap' && request.method === 'GET') {
      return handleHeatmap(request, env, corsHeaders);
    }
    
    if (path === '/api/export/csv' && request.method === 'GET') {
      return handleCSVExport(request, env, corsHeaders);
    }
    
    return new Response('Not Found', { status: 404 });
  }
};

// 既存のsimple-server.jsの関数をWorkers形式に変換
async function handleReports(request, env, corsHeaders) {
  // 既存のロジックを移植
}

async function handleHeatmap(request, env, corsHeaders) {
  // 既存のロジックを移植
}

async function handleCSVExport(request, env, corsHeaders) {
  // 既存のロジックを移植
}
```

### 1.3 Supabase接続設定

```javascript
// backend/src/utils/supabase.js
export function createSupabaseClient(env) {
  const supabaseUrl = env.SUPABASE_URL;
  const supabaseAnonKey = env.SUPABASE_ANON_KEY;
  
  return {
    async request(endpoint, options = {}) {
      const url = `${supabaseUrl}/rest/v1/${endpoint}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'apikey': supabaseAnonKey,
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });
      
      if (!response.ok) {
        throw new Error(`Supabase request failed: ${response.statusText}`);
      }
      
      return response.json();
    }
  };
}
```

## 🎨 Step 2: フロントエンド設定

### 2.1 Next.js Cloudflare対応

```bash
# フロントエンドディレクトリで実行
cd frontend
npm install @opennextjs/cloudflare
```

### 2.2 Next.js設定更新

```javascript
// frontend/next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

### 2.3 Cloudflare Pages設定

```javascript
// frontend/functions/_middleware.js
export async function onRequest(context) {
  const { request } = context;
  
  // API要求をWorkers APIにプロキシ
  if (request.url.includes('/api/')) {
    const url = new URL(request.url);
    const workerUrl = `https://no-smoke-walk-api.${context.env.CLOUDFLARE_ACCOUNT_ID}.workers.dev${url.pathname}${url.search}`;
    
    return fetch(workerUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body
    });
  }
  
  return await context.next();
}
```

## 🔒 Step 3: 環境変数・シークレット管理

### 3.1 Workers環境変数設定

```bash
# 本番環境設定
wrangler secret put SUPABASE_URL --env production
wrangler secret put SUPABASE_ANON_KEY --env production
wrangler secret put EXPORT_SECRET_KEY --env production

# ステージング環境設定
wrangler secret put SUPABASE_URL --env staging
wrangler secret put SUPABASE_ANON_KEY --env staging
wrangler secret put EXPORT_SECRET_KEY --env staging
```

### 3.2 Pages環境変数設定

Cloudflareダッシュボード → Pages → 環境変数で設定：

```bash
# 本番環境
NEXT_PUBLIC_SUPABASE_URL=https://qdqcocgoaxzbhvvmvttr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_API_BASE_URL=https://no-smoke-walk-api.your-subdomain.workers.dev

# プレビュー環境
NEXT_PUBLIC_SUPABASE_URL=https://qdqcocgoaxzbhvvmvttr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_API_BASE_URL=https://no-smoke-walk-api-staging.your-subdomain.workers.dev
```

## 🚀 Step 4: GitHub Actions CI/CD設定

### 4.1 GitHub Secrets設定

GitHub Repository → Settings → Secrets and variables → Actions:

```bash
# Cloudflare認証
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token
CLOUDFLARE_ACCOUNT_ID=your_account_id

# Supabase設定
SUPABASE_URL=https://qdqcocgoaxzbhvvmvttr.supabase.co
SUPABASE_ANON_KEY=your_anon_key
EXPORT_SECRET_KEY=b04fcc570ffebafe5ff349fe922046209259b95a9468acbd51c7450764956090
```

### 4.2 GitHub Actions ワークフロー

```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloudflare

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  deploy-workers:
    runs-on: ubuntu-latest
    name: Deploy Workers API
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json
      
      - name: Install dependencies
        run: |
          cd backend
          npm ci
      
      - name: Deploy to Cloudflare Workers
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: deploy --env ${{ github.ref == 'refs/heads/main' && 'production' || 'staging' }}
          workingDirectory: backend
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
          EXPORT_SECRET_KEY: ${{ secrets.EXPORT_SECRET_KEY }}

  deploy-pages:
    runs-on: ubuntu-latest
    name: Deploy Pages Frontend
    needs: deploy-workers
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
      
      - name: Install dependencies
        run: |
          cd frontend
          npm ci
      
      - name: Build Next.js app
        run: |
          cd frontend
          npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
      
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy frontend/out --project-name=no-smoke-walk --compatibility-date=2025-04-01
```

## 🔄 Step 5: デプロイとテスト

### 5.1 初回デプロイ

```bash
# 1. Workers APIデプロイ
cd backend
wrangler deploy --env production

# 2. Pages フロントエンドデプロイ
cd ../frontend
npm run build
wrangler pages deploy out --project-name=no-smoke-walk
```

### 5.2 動作確認

```bash
# APIエンドポイント確認
curl https://no-smoke-walk-api.your-subdomain.workers.dev/api/health

# CSVエクスポート確認
curl "https://no-smoke-walk-api.your-subdomain.workers.dev/api/export/csv?secret=your_secret" | head -5

# フロントエンド確認
curl https://no-smoke-walk.pages.dev
```

## 📊 Step 6: 監視・運用設定

### 6.1 Cloudflare Analytics設定

```javascript
// backend/src/index.js に追加
export default {
  async fetch(request, env, ctx) {
    const startTime = Date.now();
    
    try {
      const response = await handleRequest(request, env, ctx);
      
      // メトリクス記録
      const duration = Date.now() - startTime;
      console.log(`Request: ${request.method} ${new URL(request.url).pathname} - ${response.status} (${duration}ms)`);
      
      return response;
    } catch (error) {
      console.error('Request failed:', error);
      return new Response('Internal Server Error', { status: 500 });
    }
  }
};
```

### 6.2 カスタムドメイン設定

```bash
# Pages カスタムドメイン
wrangler pages project create no-smoke-walk
wrangler pages domain add no-smoke-walk.osaka.jp --project-name=no-smoke-walk

# Workers カスタムドメイン
wrangler custom-domain add api.no-smoke-walk.osaka.jp --service=no-smoke-walk-api
```

## 🎯 Step 7: 完全自動化設定

### 7.1 自動スケーリング設定

```toml
# backend/wrangler.toml に追加
[env.production]
name = "no-smoke-walk-api"
vars = { ENVIRONMENT = "production" }

# パフォーマンス最適化
[env.production.limits]
cpu_ms = 50000  # 50秒制限
memory_mb = 128  # 128MB制限
```

### 7.2 監視・アラート設定

```yaml
# .github/workflows/health-check.yml
name: Health Check

on:
  schedule:
    - cron: '*/5 * * * *'  # 5分ごと
  workflow_dispatch:

jobs:
  health-check:
    runs-on: ubuntu-latest
    steps:
      - name: Check API Health
        run: |
          response=$(curl -s -o /dev/null -w "%{http_code}" https://no-smoke-walk-api.your-subdomain.workers.dev/api/health)
          if [ $response -ne 200 ]; then
            echo "API health check failed: $response"
            exit 1
          fi
      
      - name: Check Frontend
        run: |
          response=$(curl -s -o /dev/null -w "%{http_code}" https://no-smoke-walk.pages.dev)
          if [ $response -ne 200 ]; then
            echo "Frontend health check failed: $response"
            exit 1
          fi
```

## 🔄 運用フロー

### 日常運用

1. **開発**: `develop`ブランチでの開発
2. **ステージング**: `develop`ブランチのプッシュで自動デプロイ
3. **本番**: `main`ブランチのマージで自動デプロイ
4. **監視**: 5分ごとのヘルスチェック
5. **メンテナンス**: 必要に応じて環境変数更新

### 緊急時対応

```bash
# 緊急時ロールバック
wrangler rollback --env production
wrangler pages deployment list --project-name=no-smoke-walk
wrangler pages deployment rollback [deployment-id] --project-name=no-smoke-walk
```

## 💰 コスト試算

### 無料枠での運用予想

- **Workers**: 月10万リクエスト（日3,300リクエスト相当）
- **Pages**: 月500ビルド（日16ビルド相当）
- **帯域幅**: 無制限（追加料金なし）

### 有料化タイミング

- **Workers**: 日10万リクエスト超過時（月$5〜）
- **Pages**: 日16ビルド超過時（月$5〜）

## ✅ 完了チェックリスト

- [ ] Cloudflareアカウント作成・設定
- [ ] GitHub ActionsでのCI/CD構築
- [ ] Workers APIデプロイ
- [ ] Pages フロントエンドデプロイ
- [ ] 環境変数・シークレット設定
- [ ] カスタムドメイン設定
- [ ] 監視・アラート設定
- [ ] 動作確認・テスト実施

## 🎉 完成

この手順書に従うことで、完全自動化された本番環境が構築され、以下が実現されます：

- ✅ **完全自動デプロイ**: GitHubプッシュで自動デプロイ
- ✅ **高可用性**: グローバルCDN配信
- ✅ **低コスト**: 無料枠で十分な運用
- ✅ **高セキュリティ**: 企業級暗号化・認証
- ✅ **監視完備**: 自動ヘルスチェック・アラート
- ✅ **運用負荷ゼロ**: 設定後はメンテナンスフリー

No-Smoke Walk Osakaが世界水準のインフラで安定運用されます！