# No-Smoke Walk Osaka - 本番データ切り替え手順書

## 📋 現在の状況

### ✅ 完了済み
- データベーススキーマ設計・実装 (Supabase)
- フロントエンド報告投稿フォーム
- バックエンドAPI実装 (Cloudflare Workers)
- 開発用デモサーバー (simple-server.js)

### 🔄 現在使用中
- **データソース**: simple-server.js の固定デモデータ (4件)
- **API**: http://localhost:8787 (開発用)
- **環境変数**: プレースホルダー値

## 🎯 本番データ切り替え手順

### Step 1: Supabase プロジェクト設定

#### 1.1 Supabaseプロジェクト作成・設定確認
```bash
# 1. Supabase にログイン
# https://supabase.com/dashboard

# 2. 新規プロジェクトを作成または既存プロジェクト確認
# プロジェクト名: no-smoke-walk-osaka
# データベースパスワードを記録

# 3. プロジェクト設定から以下を取得
# - Project URL: https://your-project-id.supabase.co
# - anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
# - service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 1.2 データベーススキーマ適用
```bash
# データベース移行を実行
cd /mnt/e/mega/No-Smoke-Walk/database

# Supabase CLI でマイグレーション実行
supabase db push

# または SQL Editor で直接実行
# - migrations/001_initial_schema.sql
# - seed/001_test_data.sql
```

### Step 2: 環境変数設定

#### 2.1 フロントエンド環境変数
```bash
# ファイル: /mnt/e/mega/No-Smoke-Walk/frontend/.env.local
cd /mnt/e/mega/No-Smoke-Walk/frontend
```

```env
# Supabase 本番設定
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# API ベースURL (本番切り替え後)
NEXT_PUBLIC_API_BASE_URL=http://localhost:8787

# Google AdSense (オプション)
# NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-xxxxxxxxx
```

#### 2.2 バックエンド環境変数
```bash
# ファイル: /mnt/e/mega/No-Smoke-Walk/backend/.env
cd /mnt/e/mega/No-Smoke-Walk/backend
```

```env
# Supabase 本番設定
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 環境設定
ENVIRONMENT=development
ABUSE_GUARD=false
```

### Step 3: Cloudflare Workers 本番APIサーバー起動

#### 3.1 依存関係インストール・設定確認
```bash
cd /mnt/e/mega/No-Smoke-Walk/backend

# 依存関係インストール
npm install

# TypeScript コンパイル確認
npm run build

# 設定ファイル確認
cat wrangler.toml
```

#### 3.2 ローカル開発サーバー起動
```bash
# Cloudflare Workers 開発サーバー起動
npm run dev

# または
npx wrangler dev --port 8788

# 確認: http://localhost:8788/api/health
```

### Step 4: API切り替え・動作確認

#### 4.1 simple-server.js 停止
```bash
# 現在のデモサーバー停止
pkill -f "simple-server"

# プロセス確認
ps aux | grep simple-server
```

#### 4.2 フロントエンド設定更新 (必要に応じて)
```bash
# API_BASE_URL を新しいポートに変更
# .env.local: NEXT_PUBLIC_API_BASE_URL=http://localhost:8788
```

#### 4.3 動作確認テスト
```bash
# 1. バックエンドAPI テスト
curl http://localhost:8788/api/health
curl http://localhost:8788/api/heatmap

# 2. フロントエンド再起動
cd /mnt/e/mega/No-Smoke-Walk/frontend
pkill -f "next dev"
npx next dev --port 3003 > /dev/null 2>&1 &

# 3. ブラウザで動作確認
# http://localhost:3003
```

### Step 5: 報告投稿機能テスト

#### 5.1 実際の報告投稿テスト
```bash
# 1. ブラウザで http://localhost:3003 アクセス
# 2. 位置情報を取得
# 3. カテゴリを選択 (歩きタバコ/立ち止まり喫煙/ポイ捨て)
# 4. 「報告を送信」ボタンクリック
# 5. 成功メッセージ確認

# API直接テスト
curl -X POST http://localhost:8788/api/reports \
  -H "Content-Type: application/json" \
  -d '{
    "lat": 34.7670,
    "lon": 135.5358,
    "category": "walk_smoke",
    "prefecture": "大阪府",
    "city": "大阪市",
    "ip_hash": "test_hash",
    "fp_hash": "test_fp"
  }'
```

#### 5.2 データベース確認
```sql
-- Supabase SQL Editor で確認
SELECT 
  id, 
  reported_at, 
  lat, 
  lon, 
  category, 
  prefecture, 
  city 
FROM reports 
ORDER BY reported_at DESC 
LIMIT 10;
```

### Step 6: ヒートマップデータ更新確認

#### 6.1 ヒートマップ表示確認
```bash
# 1. ブラウザでアプリをリロード
# 2. ミニヒートマップを確認
# 3. 「詳細マップ」ボタンでフルマップ確認
# 4. デバッグ状況を確認 (右下のDebug Status)

# デバッグ情報の確認項目:
# - Heatmap: ✅ (データ取得成功)
# - Features: X件 (実際のデータ件数)
# - 📡 デモデータ表示中 → 📊 実データ表示中 に変更
```

## 🔧 トラブルシューティング

### よくある問題と解決方法

#### 1. Supabase接続エラー
```bash
# エラー: "Failed to connect to Supabase"
# 解決: 
# - .env ファイルの SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY を確認
# - Supabaseプロジェクトのネットワーク設定確認
# - API キーの有効期限確認
```

#### 2. CORS エラー
```bash
# エラー: "CORS policy blocked"
# 解決:
# - backend/src/index.ts の CORS設定確認
# - Cloudflare Workers の設定確認
```

#### 3. データが表示されない
```bash
# 原因調査:
# 1. ブラウザのDevTools → NetworkタブでAPI呼び出し確認
# 2. バックエンドのログ確認
# 3. データベースに実際にデータが存在するか確認

# デバッグコマンド:
curl -v http://localhost:8788/api/heatmap
```

## 📊 切り替え後の確認チェックリスト

### ✅ 必須確認項目
- [ ] Supabaseプロジェクト作成・接続成功
- [ ] 環境変数設定完了 (.env.local, .env)
- [ ] Cloudflare Workers サーバー起動成功
- [ ] API呼び出し成功 (health, heatmap)
- [ ] 報告投稿機能動作確認
- [ ] データベースに実データ保存確認
- [ ] ヒートマップに実データ表示確認
- [ ] Debug Status で実データ確認

### 🎯 推奨確認項目
- [ ] 複数カテゴリでの投稿テスト
- [ ] 異なる位置での投稿テスト  
- [ ] ヒートマップフィルター機能テスト
- [ ] 管理者ダッシュボード動作確認
- [ ] エクスポート機能動作確認

## 🚀 本番デプロイ準備

### Cloudflare Workers 本番デプロイ
```bash
# 1. Cloudflare アカウント設定
wrangler login

# 2. Workers 本番デプロイ
wrangler deploy

# 3. 環境変数設定 (本番用)
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
```

### Next.js 本番ビルド
```bash
# 静的エクスポート設定
export EXPORT_MODE=true
npm run build

# Cloudflare Pages デプロイ準備
```

---

## 📞 サポート情報

**作成日**: 2025-06-29  
**対象バージョン**: v1.1.0  
**推定作業時間**: 30-60分  

**注意事項**:
- 環境変数は絶対にGitにコミットしない
- Supabaseの service_role_key は慎重に管理
- 本番切り替え前に必ずバックアップを取得