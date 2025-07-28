# No-Smoke Walk Osaka - 引き継ぎドキュメント

## 🚀 プロジェクト概要

**No-Smoke Walk Osaka**は、大阪エリアでの歩きタバコや立ち止まり喫煙の報告・可視化Webアプリケーションです。
市民が匿名で喫煙マナー違反を報告し、ヒートマップで可視化することで、地域の禁煙環境改善を支援します。

### 本番環境
- **フロントエンド**: https://no-smoke-alert.com (Cloudflare Pages)
- **バックエンドAPI**: https://no-smoke-walk-backend.yoshimurakiyoshi-dev.workers.dev (Cloudflare Workers)
- **データベース**: Supabase (PostGIS有効化)

### 現在の状況（2025年7月時点）
- ✅ **完全動作確認済み** - 全機能が本番環境で正常動作
- ✅ **Google Analytics統合済み** (GA4 測定ID: G-3F4H0CTST0)
- ✅ **ニンジャアド統合済み** (Google AdSense承認待ちの暫定広告)
- ✅ **相対密度ヒートマップ機能実装済み**
- ✅ **CSVエクスポート機能実装済み**

## ⚠️ 重要なルール

### 作業時のルール
1. **TodoWriteツールを必ず使用** - タスク管理と進捗の可視化
2. **作業完了時はCLAUDE.mdの開発記録セクションに追記**
3. **型チェック・Lintを実行** - コード品質確保
4. **本番デプロイ前はローカルテスト完了** - 機能確認必須

### コミュニケーション
- **ユーザーとの対話は必ず日本語で行う**
- **技術的な説明も日本語で分かりやすく説明する**
- **エラーメッセージも日本語で翻訳して報告する**

### プロジェクト構造
```
/
├── frontend/              # Next.js アプリケーション
│   ├── src/
│   │   ├── app/          # App Router
│   │   ├── components/   # React コンポーネント
│   │   ├── lib/          # ユーティリティ
│   │   └── types/        # TypeScript型定義
│   ├── public/           # 静的アセット
│   └── package.json
├── backend/              # Cloudflare Workers
│   ├── src/
│   │   ├── handlers/     # API ハンドラー
│   │   ├── utils/        # ユーティリティ
│   │   └── types/        # TypeScript型定義
│   ├── wrangler.toml     # Workers設定
│   ├── simple-server.js  # 開発用Node.jsサーバー
│   └── package.json
├── database/             # Supabase設定
│   ├── migrations/       # データベース移行
│   └── seed/            # 初期データ
└── docs/                # ドキュメント
```

### 環境変数設定

#### フロントエンド (.env.local)
```env
# Supabase (公開情報)
NEXT_PUBLIC_SUPABASE_URL=https://qdqcocgoaxzbhvvmvttr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkcWNvY2dvYXh6Ymh2dm12dHRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyMjY0NzMsImV4cCI6MjA2NjgwMjQ3M30.3sr3dXq7GOz8yLcKn602Ba8Ej-X1zIpCn-T_BxM5Ofk

# Google Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-3F4H0CTST0

# API URL（本番環境では自動設定）
NEXT_PUBLIC_API_URL=http://localhost:8787
```

#### バックエンド (Cloudflare Workers)
```env
# Supabase接続
SUPABASE_URL=https://qdqcocgoaxzbhvvmvttr.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkcWNvY2dvYXh6Ymh2dm12dHRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyMjY0NzMsImV4cCI6MjA2NjgwMjQ3M30.3sr3dXq7GOz8yLcKn602Ba8Ej-X1zIpCn-T_BxM5Ofk

# セキュリティ・設定
ABUSE_GUARD=false
EXPORT_SECRET_KEY=b04fcc570ffebafe5ff349fe922046209259b95a9468acbd51c7450764956090
ENVIRONMENT=production
```

### 開発コマンド
```bash
# フロントエンド開発サーバー（メイン - 推奨）
cd frontend && npx next dev --port 3003

# フロントエンド開発サーバー（バックグラウンド実行）
cd frontend && npx next dev --port 3003 > /dev/null 2>&1 &

# バックエンドAPIサーバー（推奨 - シンプル版）
cd backend && node simple-server.js

# バックエンドAPIサーバー（バックグラウンド実行）
cd backend && node simple-server.js > /dev/null 2>&1 &

# Workers開発サーバー（Cloudflare Workers）
cd backend && npm run dev

# 両方のサーバー同時起動（推奨方法）
cd frontend && npx next dev --port 3003 > /dev/null 2>&1 & cd ../backend && node simple-server.js > /dev/null 2>&1 &

# サーバープロセス確認
ps aux | grep -E "(next|node.*simple-server)"

# サーバー停止
pkill -f "next dev" && pkill -f "simple-server"

# データベース移行
cd database && supabase db push

# 型チェック
npm run typecheck

# Lint
npm run lint
```

**⚠️ 開発サーバー起動時の注意事項**
- 長時間実行する場合は必ずバックグラウンド実行（`&`）を使用
- Bashツールの2分タイムアウト制限を回避するため
- Playwright MCPテスト前は必ずプロセス生存確認を実施
- `curl -s http://localhost:3003 | head -5` でフロントエンド動作確認
- `curl -s http://localhost:8787/api/health` でバックエンド動作確認

### API エンドポイント
- POST /api/reports - 報告投稿
- GET /api/heatmap - ヒートマップデータ
- GET /api/admin/stats - 管理統計
- GET /api/admin/export - データエクスポート
- GET /api/geocode - 逆ジオコーディング（住所取得）
- GET /api/export/csv - CSVデータエクスポート（シークレットキー認証）

### CSVエクスポート機能の使用方法

**基本的な使用方法**
```bash
# 全データダウンロード
curl "http://localhost:8787/api/export/csv?secret=b04fcc570ffebafe5ff349fe922046209259b95a9468acbd51c7450764956090" > reports.csv

# ブラウザでアクセス（ファイルダウンロード）
http://localhost:8787/api/export/csv?secret=b04fcc570ffebafe5ff349fe922046209259b95a9468acbd51c7450764956090
```

**フィルタリング オプション**
```bash
# 過去30日間のデータのみ
curl "http://localhost:8787/api/export/csv?secret=no-smoke-walk-export-2025&days=30" > reports_30days.csv

# 歩きタバコのみ
curl "http://localhost:8787/api/export/csv?secret=no-smoke-walk-export-2025&category=walk_smoke" > walk_smoke.csv

# 立ち止まり喫煙のみ
curl "http://localhost:8787/api/export/csv?secret=no-smoke-walk-export-2025&category=stand_smoke" > stand_smoke.csv

# 特定の期間（日付指定）
curl "http://localhost:8787/api/export/csv?secret=no-smoke-walk-export-2025&start_date=2025-01-01&end_date=2025-12-31" > reports_2025.csv

# 大阪府のデータのみ
curl "http://localhost:8787/api/export/csv?secret=no-smoke-walk-export-2025&prefecture=大阪府" > osaka_reports.csv

# 吹田市のデータのみ
curl "http://localhost:8787/api/export/csv?secret=no-smoke-walk-export-2025&city=吹田市" > suita_reports.csv

# 複数条件の組み合わせ
curl "http://localhost:8787/api/export/csv?secret=no-smoke-walk-export-2025&days=7&category=walk_smoke&city=吹田市" > filtered_reports.csv
```

**CSVフォーマット**
```
ID,報告日時,緯度,経度,都道府県,市区町村,カテゴリ,信頼度スコア
uuid-123,2025/1/15 14:30:00,34.6937,135.5023,大阪府,大阪市中央区,歩きタバコ,8
```

**セキュリティ**
- シークレットキー: `b04fcc570ffebafe5ff349fe922046209259b95a9468acbd51c7450764956090`
- 環境変数 `EXPORT_SECRET_KEY` で設定（`backend/.env.local`ファイルで管理）
- 無効なキーの場合は403エラーを返します
- IPアドレス等の個人情報は含まれません（匿名化済みデータのみ）

**本番環境への適用**
```bash
# 本番環境では環境変数として設定
EXPORT_SECRET_KEY=b04fcc570ffebafe5ff349fe922046209259b95a9468acbd51c7450764956090

# または Cloudflare Workers の場合
wrangler secret put EXPORT_SECRET_KEY
# プロンプトで値を入力: b04fcc570ffebafe5ff349fe922046209259b95a9468acbd51c7450764956090
```

## 🔧 技術スタック

### フロントエンド
- **Next.js 15** (App Router)
- **TypeScript** + **TailwindCSS**
- **shadcn/ui** コンポーネント
- **MapLibre GL JS** (ヒートマップ表示)
- **Google Analytics 4** (追跡・分析)

### バックエンド
- **Cloudflare Workers** (サーバーレス)
- **Node.js simple-server.js** (開発用)
- **Supabase HTTP API** (データベース接続)

### データベース
- **Supabase PostgreSQL**
- **PostGIS拡張** (地理情報処理)
- **abuse_guard テーブル** (不正投稿対策)

### インフラ・デプロイ
- **Cloudflare Pages** (フロントエンド)
- **Cloudflare Workers** (バックエンドAPI)
- **GitHub Actions** (CI/CD)

## 🛡️ セキュリティ・不正対策

### 実装済み対策
- **IPアドレスSHA-256ハッシュ化** - 個人情報保護
- **ブラウザフィンガープリント** - 重複投稿検出
- **レート制限** (10分間で5件まで)
- **位置情報検証** - 日本国内のみ受付
- **CORS設定** - 適切なオリジン制限

### CSVエクスポートセキュリティ
- **シークレットキー認証** (環境変数管理)
- **匿名化データのみ** (IPアドレス等除外)
- **アクセス制限** (認証済みユーザーのみ)

## 📊 重要な機能詳細

### ヒートマップシステム
- **相対密度計算** - 800m範囲での密度比較
- **75mグリッド集約** - 詳細な位置表示
- **1ヶ月時間フィルター** - 最新データのみ表示
- **TTLキャッシュ** (5分間) - パフォーマンス最適化

### 広告・収益化
- **ニンジャアド** - Google AdSense承認待ちの暫定広告
- **Google Analytics** - ユーザー行動分析
- **イベントトラッキング** - 投稿・マップ操作の測定

## 🚨 よくある問題とトラブルシューティング

### Next.jsビルド問題
**症状**: ビルドが "Creating an optimized production build" で停止
**原因**: Google Fonts読み込み・依存関係キャッシュ・メモリ不足
**解決策**:
```bash
# 1. プロセス停止
pkill -f "next dev" && pkill -f "simple-server"

# 2. キャッシュクリア
cd frontend && rm -rf .next node_modules
npm install

# 3. ビルド再実行（タイムアウト延長）
npm run build
```

### Workers API エラー
**症状**: 本番環境で500エラー・環境変数未定義
**原因**: 環境変数名不一致・Supabaseキー設定漏れ
**解決策**:
```bash
# 環境変数確認
wrangler secret list

# 環境変数設定
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_ANON_KEY
wrangler secret put EXPORT_SECRET_KEY

# デプロイ
wrangler deploy
```

### カスタムドメイン問題
**症状**: no-smoke-alert.comでデモデータ表示
**原因**: APIエンドポイントURLの設定ミス
**解決策**: 環境変数 `NEXT_PUBLIC_API_URL` の確認・Workers再デプロイ


## 📈 今後の改善案
- ストック型ブログ記事の作成をしやすくするための仕様づくり
- 利用規約ページやプライバシーポリシーページの作成

## その他情報
- planディレクトリにはサイトの運営方針やマーケティング戦略などが記載されている。指示がない限りこのディレクトリに対しては何も行わないこと。

---

## 開発記録

**現在の作業を記録する場合はここに追記してください**
- [日付] [ファイル名] [作業内容]
- 例: 2025-07-27 src/components/NewFeature.tsx 新機能追加

- 2025-07-28 src/app/terms/page.tsx 利用規約ページ作成
- 2025-07-28 src/app/privacy/page.tsx プライバシーポリシーページ作成
- 2025-07-28 src/app/page.tsx, src/app/heatmap/page.tsx フッターに利用規約・プライバシーポリシーリンク追加