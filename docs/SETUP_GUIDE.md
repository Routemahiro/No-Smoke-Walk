# 🚀 環境構築ガイド詳細版 - No-Smoke Walk Osaka

## 📋 目次

1. [前提条件](#前提条件)
2. [開発環境セットアップ](#開発環境セットアップ)
3. [Supabaseセットアップ](#supabaseセットアップ)
4. [フロントエンド環境構築](#フロントエンド環境構築)
5. [バックエンド環境構築](#バックエンド環境構築)
6. [ローカル開発環境の起動](#ローカル開発環境の起動)
7. [本番環境セットアップ](#本番環境セットアップ)
8. [トラブルシューティング](#トラブルシューティング)

---

## 🔧 前提条件

### 必須ソフトウェア

| ソフトウェア | バージョン | 確認コマンド | インストール方法 |
|------------|-----------|-------------|----------------|
| Node.js | 18.0.0以上 | `node -v` | [nodejs.org](https://nodejs.org/) |
| npm | 8.0.0以上 | `npm -v` | Node.jsに付属 |
| Git | 2.0以上 | `git --version` | [git-scm.com](https://git-scm.com/) |
| PowerShell | 5.1以上 | `$PSVersionTable.PSVersion` | Windows標準 |

### 推奨ツール

- **Visual Studio Code**: コードエディタ
- **Postman**: API テスト
- **TablePlus/DBeaver**: データベース管理

### 必要なアカウント

- [ ] **GitHub アカウント**: ソースコード管理
- [ ] **Supabase アカウント**: データベース
- [ ] **Cloudflare アカウント**: ホスティング

---

## 💻 開発環境セットアップ

### 1. リポジトリのクローン

```powershell
# プロジェクトをクローン
git clone https://github.com/[ユーザー名]/No-Smoke-Walk.git
cd No-Smoke-Walk

# ディレクトリ構造を確認
ls -Recurse -Depth 1
```

### 2. Node.js環境の確認

```powershell
# Node.jsバージョン確認
node -v
# 出力例: v18.19.0

# npmバージョン確認
npm -v
# 出力例: 10.2.0

# もし古いバージョンの場合
winget install OpenJS.NodeJS.LTS
```

### 3. Wrangler CLIのインストール

```powershell
# Cloudflare Wrangler CLIをグローバルインストール
npm install -g wrangler@latest

# バージョン確認
wrangler --version
# 出力例: ⛅️ wrangler 4.20.3

# Cloudflareアカウントにログイン
wrangler login
```

---

## 🗄️ Supabaseセットアップ

### 1. Supabaseプロジェクトの作成

1. [app.supabase.com](https://app.supabase.com) にアクセス
2. 「New Project」をクリック
3. 以下の情報を入力：
   - **Project Name**: `no-smoke-walk-osaka`
   - **Database Password**: 安全なパスワードを生成
   - **Region**: `Northeast Asia (Tokyo)`
   - **Pricing Plan**: Free tier でOK

### 2. データベース初期化

```sql
-- Supabase SQL Editorで実行

-- PostGIS拡張を有効化
CREATE EXTENSION IF NOT EXISTS postgis;

-- UUID生成拡張を有効化
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- reportsテーブル作成
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    category VARCHAR(50) NOT NULL,
    prefecture VARCHAR(255),
    city VARCHAR(255),
    ward VARCHAR(255),
    district VARCHAR(255),
    ip_hash VARCHAR(255),
    browser_hash VARCHAR(255),
    device_hash VARCHAR(255),
    trust_score INTEGER DEFAULT 5,
    is_verified BOOLEAN DEFAULT false,
    notes TEXT,
    is_deleted BOOLEAN DEFAULT false,
    CONSTRAINT valid_coordinates CHECK (
        latitude >= 24 AND latitude <= 46 AND
        longitude >= 122 AND longitude <= 154
    ),
    CONSTRAINT valid_category CHECK (
        category IN ('walk_smoke', 'stand_smoke')
    )
);

-- インデックス作成
CREATE INDEX idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX idx_reports_category ON reports(category);
CREATE INDEX idx_reports_location ON reports(latitude, longitude);
CREATE INDEX idx_reports_geo ON reports USING GIST (
    ST_MakePoint(longitude, latitude)
);

-- RLS (Row Level Security) を有効化
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- 公開読み取りポリシー
CREATE POLICY "Public can view reports" ON reports
    FOR SELECT USING (is_deleted = false);

-- 公開書き込みポリシー
CREATE POLICY "Anyone can insert reports" ON reports
    FOR INSERT WITH CHECK (true);
```

### 3. APIキーの取得

1. Supabase Dashboard → Settings → API
2. 以下をコピー：
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJ...`
   - **service_role key**: `eyJhbGciOiJ...`（秘密！）

---

## 🎨 フロントエンド環境構築

### 1. 依存関係のインストール

```powershell
# フロントエンドディレクトリに移動
cd frontend

# package-lock.jsonを削除（クリーンインストール）
Remove-Item package-lock.json -ErrorAction SilentlyContinue

# 依存関係をインストール
npm install

# 脆弱性チェック
npm audit
```

### 2. 環境変数の設定

```powershell
# .env.local ファイルを作成
@"
# Supabase設定
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJ...

# API設定
NEXT_PUBLIC_API_BASE_URL=http://localhost:8787

# Google Analytics（オプション）
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
"@ | Out-File -FilePath .env.local -Encoding UTF8
```

### 3. ビルドテスト

```powershell
# TypeScript型チェック
npm run typecheck

# Lintチェック
npm run lint

# ビルド実行
npm run build

# 成功メッセージが表示されればOK
```

---

## ⚙️ バックエンド環境構築

### 1. 依存関係のインストール

```powershell
# バックエンドディレクトリに移動
cd ../backend

# 依存関係をインストール
npm install

# TypeScript設定を確認
cat tsconfig.json
```

### 2. Wrangler設定

```powershell
# wrangler.toml の作成/編集
@"
name = 'no-smoke-walk-api'
main = 'src/index.js'
compatibility_date = '2024-01-01'

[env.development]
vars = { ENVIRONMENT = 'development', ABUSE_GUARD = 'false' }

[env.production]
vars = { ENVIRONMENT = 'production', ABUSE_GUARD = 'true' }
"@ | Out-File -FilePath wrangler.toml -Encoding UTF8
```

### 3. シークレット設定（開発環境）

```powershell
# ローカル開発用の.dev.varsファイル作成
@"
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJ...
EXPORT_SECRET_KEY=your-secret-key-here
"@ | Out-File -FilePath .dev.vars -Encoding UTF8

# .gitignoreに追加されているか確認
Select-String -Path .gitignore -Pattern ".dev.vars"
```

### 4. シンプルサーバーの設定

```powershell
# simple-server.js が存在することを確認
Test-Path simple-server.js

# 必要に応じてポート変更（デフォルト: 8787）
$env:PORT = 8787
```

---

## 🏃 ローカル開発環境の起動

### 方法1: 個別起動（推奨）

```powershell
# ターミナル1: フロントエンド起動
cd frontend
npm run dev
# → http://localhost:3000

# ターミナル2: バックエンド起動
cd backend
node simple-server.js
# → http://localhost:8787
```

### 方法2: 同時起動（PowerShell）

```powershell
# プロジェクトルートで実行
Start-Job -ScriptBlock { cd frontend; npm run dev }
Start-Job -ScriptBlock { cd backend; node simple-server.js }

# ジョブ確認
Get-Job

# ログ確認
Receive-Job -Id 1  # フロントエンドログ
Receive-Job -Id 2  # バックエンドログ

# 停止
Stop-Job -Id 1,2
Remove-Job -Id 1,2
```

### 方法3: バッチスクリプト（Windows）

```batch
@echo off
REM start-dev.bat として保存

echo Starting No-Smoke Walk Development Environment...

REM フロントエンドを新しいウィンドウで起動
start "Frontend" cmd /k "cd frontend && npm run dev"

REM バックエンドを新しいウィンドウで起動
start "Backend" cmd /k "cd backend && node simple-server.js"

echo Development servers started!
echo Frontend: http://localhost:3000
echo Backend: http://localhost:8787
pause
```

### 動作確認

```powershell
# ヘルスチェック
Invoke-WebRequest -Uri "http://localhost:8787/api/health" | ConvertFrom-Json

# フロントエンド確認
Start-Process "http://localhost:3000"
```

---

## 🌍 本番環境セットアップ

### 1. Cloudflare Pages（フロントエンド）

```powershell
# プロジェクトをビルド
cd frontend
npm run build

# Cloudflare Pagesにデプロイ
cd out
npx wrangler pages deploy . --project-name=no-smoke-walk

# カスタムドメイン設定
# Cloudflare Dashboard → Pages → Custom domains
# no-smoke-alert.com を追加
```

### 2. Cloudflare Workers（バックエンド）

```powershell
cd backend

# 本番環境シークレット設定
echo "https://xxxxx.supabase.co" | wrangler secret put SUPABASE_URL --env production
echo "eyJhbGciOiJ..." | wrangler secret put SUPABASE_ANON_KEY --env production
echo "your-secret-key" | wrangler secret put EXPORT_SECRET_KEY --env production

# デプロイ実行
wrangler deploy --env production

# デプロイ確認
curl https://no-smoke-walk-api.no-smoke-walk.workers.dev/api/health
```

### 3. GitHub Actions設定

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Install and Build Frontend
      run: |
        cd frontend
        npm ci
        npm run build
        
    - name: Deploy to Cloudflare Pages
      uses: cloudflare/pages-action@v1
      with:
        apiToken: ${{ secrets.CF_API_TOKEN }}
        accountId: ${{ secrets.CF_ACCOUNT_ID }}
        projectName: no-smoke-walk
        directory: frontend/out
        
    - name: Deploy Backend to Workers
      run: |
        cd backend
        npm ci
        npx wrangler deploy --env production
      env:
        CLOUDFLARE_API_TOKEN: ${{ secrets.CF_API_TOKEN }}
```

### 4. GitHub Secrets設定

GitHub Repository → Settings → Secrets and variables → Actions

追加するシークレット：
- `CF_API_TOKEN`: Cloudflare APIトークン
- `CF_ACCOUNT_ID`: CloudflareアカウントID

---

## 🔧 トラブルシューティング

### よくある問題と解決策

#### 1. npm install が失敗する

```powershell
# キャッシュクリア
npm cache clean --force

# node_modulesを削除して再インストール
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
```

#### 2. ポートが使用中

```powershell
# 使用中のポートを確認
netstat -ano | findstr :3000
netstat -ano | findstr :8787

# プロセスを終了
taskkill /PID [プロセスID] /F
```

#### 3. Supabase接続エラー

```powershell
# 環境変数を確認
Get-Content .env.local | Select-String "SUPABASE"

# APIキーの形式を確認（JWT形式であること）
# eyJhbGciOiJ... で始まる文字列
```

#### 4. TypeScriptエラー

```powershell
# TypeScript設定を初期化
npx tsc --init

# 型定義を再インストール
npm install --save-dev @types/node @types/react
```

#### 5. Wranglerログイン失敗

```powershell
# 既存の認証をクリア
wrangler logout

# 再ログイン
wrangler login

# 認証状態確認
wrangler whoami
```

### デバッグモード

```powershell
# フロントエンド詳細ログ
$env:DEBUG = "*"
npm run dev

# バックエンド詳細ログ
$env:NODE_ENV = "development"
node simple-server.js
```

---

## 📝 環境構築チェックリスト

### 開発環境

- [ ] Node.js 18以上インストール済み
- [ ] Git設定完了
- [ ] プロジェクトクローン完了
- [ ] Supabaseプロジェクト作成済み
- [ ] データベーステーブル作成済み
- [ ] フロントエンド依存関係インストール済み
- [ ] バックエンド依存関係インストール済み
- [ ] 環境変数設定済み（.env.local, .dev.vars）
- [ ] ローカルサーバー起動確認済み
- [ ] APIヘルスチェック成功

### 本番環境

- [ ] Cloudflareアカウント作成済み
- [ ] Wrangler認証完了
- [ ] Cloudflare Pages プロジェクト作成済み
- [ ] Cloudflare Workers デプロイ済み
- [ ] カスタムドメイン設定済み
- [ ] 環境変数（Secrets）設定済み
- [ ] GitHub Actions設定済み
- [ ] 本番環境動作確認済み

---

## 🎉 セットアップ完了後

### 開発を開始する

```powershell
# 開発サーバー起動
cd frontend && npm run dev

# 別ターミナルでバックエンド起動
cd backend && node simple-server.js

# ブラウザで確認
Start-Process "http://localhost:3000"
```

### 次のステップ

1. [アーキテクチャドキュメント](./ARCHITECTURE.md) を読む
2. [API仕様書](./API_SPECIFICATION.md) を確認
3. [コーディング規約](./CODING_STANDARDS.md) に従って開発
4. [デプロイ手順](./DEPLOYMENT_COMMANDS.md) でデプロイ

---

## 📚 参考リンク

- [Next.js Documentation](https://nextjs.org/docs)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Supabase Documentation](https://supabase.com/docs)
- [MapLibre GL JS](https://maplibre.org/maplibre-gl-js-docs/)

---

**最終更新:** 2025年11月9日  
**ドキュメントバージョン:** 1.0

**サポート:** 問題が発生した場合は、[TROUBLESHOOTING.md](./TROUBLESHOOTING.md) を参照するか、GitHubでIssueを作成してください。
