# 🔧 トラブルシューティングガイド - No-Smoke Walk Osaka

## 📋 目次

1. [開発環境の問題](#開発環境の問題)
2. [ビルド・デプロイの問題](#ビルドデプロイの問題)
3. [API関連の問題](#api関連の問題)
4. [データベースの問題](#データベースの問題)
5. [フロントエンドの問題](#フロントエンドの問題)
6. [地図表示の問題](#地図表示の問題)
7. [パフォーマンスの問題](#パフォーマンスの問題)
8. [本番環境の問題](#本番環境の問題)

---

## 🖥️ 開発環境の問題

### Node.js/npmエラー

#### 問題: `npm install` が失敗する
```
npm ERR! code ERESOLVE
npm ERR! ERESOLVE unable to resolve dependency tree
```

**解決策:**
```powershell
# 1. キャッシュをクリア
npm cache clean --force

# 2. node_modulesとpackage-lock.jsonを削除
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json

# 3. 再インストール（legacy peer deps）
npm install --legacy-peer-deps

# または強制インストール
npm install --force
```

#### 問題: Node.jsバージョンエラー
```
error: Node.js version 16.x.x is not supported
```

**解決策:**
```powershell
# Node.js 18以上にアップグレード
winget install OpenJS.NodeJS.LTS

# nvm使用の場合
nvm install 18
nvm use 18

# バージョン確認
node -v
```

### ポート競合

#### 問題: ポートが既に使用されている
```
Error: listen EADDRINUSE: address already in use :::3000
```

**解決策:**
```powershell
# Windows: 使用中のポートを確認
netstat -ano | findstr :3000

# プロセスID（PID）を確認してキル
taskkill /PID [プロセスID] /F

# または別のポートを使用
npm run dev -- --port 3001

# バックエンドの場合
$env:PORT = 8788
node simple-server.js
```

### PowerShellスクリプトエラー

#### 問題: スクリプト実行ポリシーエラー
```
cannot be loaded because running scripts is disabled on this system
```

**解決策:**
```powershell
# 管理者権限でPowerShellを開いて実行
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# 一時的に許可
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
```

---

## 🏗️ ビルド・デプロイの問題

### Next.jsビルドエラー

#### 問題: ビルドがタイムアウトする
```
Creating an optimized production build ...
[2時間経過してもビルドが終わらない]
```

**解決策:**
```javascript
// next.config.ts
const nextConfig = {
  // Google Fontsを一時的に無効化
  optimizeFonts: false,
  
  // タイムアウトを延長
  staticPageGenerationTimeout: 180,
  
  // ビルド最適化を調整
  swcMinify: false,
  
  // エラーを無視（一時的）
  eslint: {
    ignoreDuringBuilds: true
  },
  typescript: {
    ignoreBuildErrors: true
  }
};
```

#### 問題: メモリ不足エラー
```
FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory
```

**解決策:**
```powershell
# メモリ制限を増やす
$env:NODE_OPTIONS = "--max-old-space-size=4096"
npm run build

# package.jsonでスクリプト修正
"scripts": {
  "build": "NODE_OPTIONS='--max-old-space-size=4096' next build"
}
```

### Wranglerデプロイエラー

#### 問題: 認証エラー
```
Error: Authentication error: Invalid API token
```

**解決策:**
```powershell
# 再ログイン
wrangler logout
wrangler login

# API トークンを使用
$env:CLOUDFLARE_API_TOKEN = "your-api-token"
wrangler deploy

# アカウント確認
wrangler whoami
```

#### 問題: Workers サイズ制限エラー
```
Error: Script size exceeds limit (1MB)
```

**解決策:**
```javascript
// wrangler.toml
[build]
command = "npm run build"
minify = true

// webpack設定で最適化
module.exports = {
  optimization: {
    minimize: true,
    sideEffects: false,
    usedExports: true
  }
};
```

---

## 🌐 API関連の問題

### CORSエラー

#### 問題: Access-Control-Allow-Origin エラー
```
Access to fetch at 'http://localhost:8787/api/reports' from origin 'http://localhost:3000' has been blocked by CORS policy
```

**解決策:**
```javascript
// backend/src/index.js
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // 本番では特定のオリジンに制限
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400'
};

// すべてのレスポンスにCORSヘッダーを追加
return new Response(body, {
  headers: {
    ...corsHeaders,
    'Content-Type': 'application/json'
  }
});
```

### APIレスポンスエラー

#### 問題: 500 Internal Server Error
```
{"success":false,"error":"Internal server error"}
```

**デバッグ手順:**
```powershell
# 1. ログを確認（開発環境）
wrangler dev --local

# 2. 環境変数を確認
curl http://localhost:8787/api/debug/env

# 3. ヘルスチェック
curl http://localhost:8787/api/health

# 4. 詳細なエラーログを有効化
```

```javascript
// デバッグ用の詳細エラー出力
try {
  // API処理
} catch (error) {
  console.error('Detailed error:', {
    message: error.message,
    stack: error.stack,
    env: {
      hasSupabaseUrl: !!env.SUPABASE_URL,
      hasSupabaseKey: !!env.SUPABASE_ANON_KEY
    }
  });
  
  // 開発環境では詳細を返す
  if (env.ENVIRONMENT === 'development') {
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      stack: error.stack
    }), { status: 500 });
  }
}
```

### レート制限エラー

#### 問題: 429 Too Many Requests
```
{"success":false,"error":"Rate limit exceeded"}
```

**解決策:**
```javascript
// クライアント側でリトライロジック
async function apiCallWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After') || 60;
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        continue;
      }
      
      return response;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
    }
  }
}
```

---

## 💾 データベースの問題

### Supabase接続エラー

#### 問題: データベース接続失敗
```
Error: Could not connect to database
```

**確認手順:**
```powershell
# 1. 環境変数を確認
Get-Content .env.local | Select-String "SUPABASE"

# 2. Supabase URLの形式を確認
# 正しい形式: https://xxxxx.supabase.co
# 間違い: xxxxx.supabase.co (httpsなし)

# 3. APIキーの形式を確認
# Anon keyはeyJhbGciOiJ...で始まる長い文字列
```

**解決策:**
```javascript
// 接続テストスクリプト
const testConnection = async () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  try {
    const response = await fetch(`${url}/rest/v1/reports?limit=1`, {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      }
    });
    
    if (response.ok) {
      console.log('✅ Database connection successful');
    } else {
      console.error('❌ Database connection failed:', response.status);
    }
  } catch (error) {
    console.error('❌ Connection error:', error);
  }
};
```

### マイグレーションエラー

#### 問題: テーブルが存在しない
```
Error: relation "reports" does not exist
```

**解決策:**
```sql
-- Supabase SQL Editorで実行

-- 既存テーブルの確認
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- マイグレーション再実行
-- database/migrations/001_initial_schema.sql の内容をコピペして実行

-- RLSポリシーの確認
SELECT * FROM pg_policies WHERE tablename = 'reports';
```

---

## 🎨 フロントエンドの問題

### React/Next.jsエラー

#### 問題: Hydration エラー
```
Error: Hydration failed because the initial UI does not match what was rendered on the server
```

**解決策:**
```typescript
// 1. useEffect内で動的な値を設定
const [mounted, setMounted] = useState(false);

useEffect(() => {
  setMounted(true);
}, []);

if (!mounted) return null;

// 2. suppressHydrationWarning を使用（最終手段）
<div suppressHydrationWarning>
  {new Date().toLocaleString()}
</div>

// 3. dynamic importでSSRを無効化
const DynamicComponent = dynamic(
  () => import('./Component'),
  { ssr: false }
);
```

#### 問題: useState が動作しない
```
Error: Invalid hook call
```

**解決策:**
```typescript
// ✅ 正しい: コンポーネントのトップレベル
function Component() {
  const [state, setState] = useState(0);
  
  return <div>{state}</div>;
}

// ❌ 間違い: 条件文内
function Component() {
  if (condition) {
    const [state, setState] = useState(0); // エラー
  }
}
```

### スタイリングの問題

#### 問題: Tailwind CSSが適用されない

**解決策:**
```javascript
// tailwind.config.js
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  // 追加パスがある場合
  safelist: [
    'bg-red-500',
    'text-white',
    // 動的クラス用
  ]
};

// globals.css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

---

## 🗺️ 地図表示の問題

### MapLibre GLエラー

#### 問題: 地図が表示されない

**解決策:**
```typescript
// 1. MapLibre CSSをインポート
import 'maplibre-gl/dist/maplibre-gl.css';

// 2. コンテナに高さを設定
<div 
  ref={mapContainer}
  style={{ width: '100%', height: '400px' }} // 高さ必須
/>

// 3. マウント後に初期化
useEffect(() => {
  if (!mapContainer.current) return;
  
  const map = new maplibregl.Map({
    container: mapContainer.current,
    style: 'https://tile.openstreetmap.jp/styles/osm-bright-ja/style.json',
    center: [135.5023, 34.6937],
    zoom: 12
  });
  
  return () => map.remove();
}, []);
```

#### 問題: マーカーが重複する

**解決策:**
```typescript
// クリーンアップ処理を追加
useEffect(() => {
  // 既存マーカーを削除
  markers.forEach(marker => marker.remove());
  setMarkers([]);
  
  // 新しいマーカーを追加
  const newMarkers = data.map(point => {
    return new maplibregl.Marker()
      .setLngLat([point.longitude, point.latitude])
      .addTo(map);
  });
  
  setMarkers(newMarkers);
  
  return () => {
    newMarkers.forEach(marker => marker.remove());
  };
}, [data]);
```

---

## ⚡ パフォーマンスの問題

### ビルドサイズが大きい

#### 問題: バンドルサイズが1MB超える

**解決策:**
```javascript
// next.config.js
module.exports = {
  // 未使用コードの除去
  experimental: {
    optimizePackageImports: ['lodash', 'date-fns'],
  },
  
  // 圧縮設定
  compress: true,
  
  // 画像最適化
  images: {
    formats: ['image/avif', 'image/webp'],
  },
};

// 動的インポートを活用
const HeavyComponent = dynamic(() => import('./HeavyComponent'));

// Tree shakingを有効化
import { debounce } from 'lodash-es'; // lodashではなくlodash-es
```

### API応答が遅い

#### 問題: APIレスポンスに3秒以上かかる

**最適化策:**
```javascript
// 1. インデックスの確認（データベース）
CREATE INDEX idx_reports_created_location 
ON reports(created_at DESC, latitude, longitude);

// 2. キャッシング実装
const cache = new Map();

async function getCachedData(key, fetcher) {
  if (cache.has(key)) {
    const cached = cache.get(key);
    if (Date.now() - cached.timestamp < 300000) { // 5分
      return cached.data;
    }
  }
  
  const data = await fetcher();
  cache.set(key, { data, timestamp: Date.now() });
  return data;
}

// 3. ページネーション
const limit = 100;
const offset = page * limit;
```

---

## 🚀 本番環境の問題

### Cloudflare特有のエラー

#### 問題: 522 Connection timed out

**解決策:**
```javascript
// Workers timeout設定
// CPU時間制限: 10ms (Free), 50ms (Paid)
// 実時間制限: 30秒

// 長時間処理を分割
async function processLargeDataset(data) {
  const BATCH_SIZE = 100;
  const results = [];
  
  for (let i = 0; i < data.length; i += BATCH_SIZE) {
    const batch = data.slice(i, i + BATCH_SIZE);
    const batchResult = await processBatch(batch);
    results.push(...batchResult);
    
    // CPU時間を節約
    await new Promise(resolve => setTimeout(resolve, 0));
  }
  
  return results;
}
```

#### 問題: KVストレージエラー

**解決策:**
```javascript
// Workers KVの制限
// Key: 最大512バイト
// Value: 最大25MB
// 書き込み: 1回/秒

// リトライロジック
async function kvPutWithRetry(namespace, key, value, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      await namespace.put(key, value);
      return;
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}
```

### SSL/HTTPS問題

#### 問題: Mixed Content エラー

**解決策:**
```html
<!-- meta タグ追加 -->
<meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests">

<!-- すべてのURLをHTTPSに -->
<!-- ❌ Bad -->
<script src="http://example.com/script.js"></script>

<!-- ✅ Good -->
<script src="https://example.com/script.js"></script>

<!-- ✅ Better: プロトコル相対URL -->
<script src="//example.com/script.js"></script>
```

---

## 🆘 緊急時の対処

### システム全体がダウン

```powershell
# 1. ステータス確認
curl https://no-smoke-alert.com
curl https://no-smoke-walk-api.no-smoke-walk.workers.dev/api/health

# 2. Cloudflareステータス確認
# https://www.cloudflarestatus.com/

# 3. Supabaseステータス確認
# https://status.supabase.com/

# 4. ロールバック（必要に応じて）
git log --oneline -5
git checkout [前の安定版コミット]

# 再デプロイ
cd frontend && npm run build && cd out && npx wrangler pages deploy .
cd ../../backend && npx wrangler deploy --env production
```

### データ損失の可能性

```sql
-- Supabaseバックアップから復元
-- Dashboard → Settings → Backups → Restore

-- 手動バックアップ
pg_dump -h [host] -U [user] -d [database] > backup_emergency.sql

-- 削除フラグでソフトデリート実装
UPDATE reports SET is_deleted = true WHERE id = 'xxx';
```

---

## 📞 サポート連絡先

### 開発チーム
- **GitHub Issues**: [リポジトリ]/issues
- **Discord**: [サーバー招待リンク]

### 外部サービス
- **Cloudflare Support**: https://support.cloudflare.com
- **Supabase Support**: https://supabase.com/support
- **Next.js Discord**: https://discord.gg/nextjs

---

## 📝 デバッグチェックリスト

問題が発生したら以下を順番に確認：

1. [ ] エラーメッセージをコピー
2. [ ] ブラウザのコンソールを確認
3. [ ] ネットワークタブでAPIレスポンスを確認
4. [ ] 環境変数が正しく設定されているか確認
5. [ ] 最近の変更をgit diffで確認
6. [ ] 開発環境で再現するか確認
7. [ ] 関連するログを収集
8. [ ] このガイドで解決策を検索
9. [ ] GitHub Issuesで類似の問題を検索
10. [ ] 解決したら対処法をドキュメント化

---

**最終更新:** 2025年11月9日  
**ドキュメントバージョン:** 1.0

**ヒント:** `Ctrl+F` で問題のキーワードを検索してください！
