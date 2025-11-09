# No-Smoke Walk Osaka 🚭

大阪市の歩きタバコ・ポイ捨て報告システム

## 概要

市民が歩きタバコや禁煙エリアでの喫煙、ポイ捨てを発見した際に簡単に報告できるWebアプリケーションです。報告されたデータはヒートマップで可視化され、行政指導の資料として活用されます。

## 人間向けの説明
初回は「やりたいこと」＋AI_HANDOVER_TEMPLATE.mdを渡す。
その後は、やりたいこと + docs/sessions/最新のSESSION_HANDOVER_*.mdを渡すようにすればOK。

例：
以下のセッション引き継ぎファイルから作業を継続してください：
docs/sessions/SESSION_HANDOVER_20251110_PART1.md

今回やりたいこと：
- ○○機能を実装

CSVデータの出力は以下のデータを元に行うこと。
E:\mega\No-Smoke-Walk\docs\CSV_EXPORT_USER_GUIDE.md

## 主な機能

- 📍 **位置情報付き報告**: GPS機能を使った正確な位置での報告
- 🗺️ **ヒートマップ表示**: 報告データの視覚的な分析（800m範囲フィルタリング）
- 🛡️ **不正対策**: レート制限・フィンガープリントによるスパム防止
- 📁 **データエクスポート**: CSV形式でのデータダウンロード（シークレットキー認証）
- 🔐 **セキュアアクセス**: 管理者認証とシークレットキー保護
- 🎯 **相対密度表示**: 周辺地域との比較によるヒートマップ表示

## 技術スタック

### Frontend
- **Next.js 15** - React フレームワーク
- **TypeScript** - 型安全な開発
- **TailwindCSS** - ユーティリティファーストCSS
- **MapLibre GL JS** - インタラクティブマップ
- **shadcn/ui** - UIコンポーネント

### Backend
- **Cloudflare Workers** - サーバーレス API
- **TypeScript** - 型安全なAPI開発

### Database
- **Supabase** - PostgreSQL + PostGIS
- **Row Level Security** - データアクセス制御

### インフラ
- **Cloudflare Pages** - フロントエンドホスティング
- **GitHub Actions** - CI/CDパイプライン

## 開発環境のセットアップ

### 前提条件
- Node.js 18+
- npm または yarn
- Supabaseアカウント

### インストール

1. リポジトリをクローン
```bash
git clone <repository-url>
cd No-Smoke-Walk
```

2. フロントエンド依存関係をインストール
```bash
cd frontend
npm install
```

3. バックエンド依存関係をインストール
```bash
cd ../backend
npm install
```

4. 環境変数を設定
```bash
# frontend/.env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# backend/.env.local
DATABASE_URL=your_supabase_database_url
SUPABASE_ANON_KEY=your_supabase_anon_key
EXPORT_SECRET_KEY=your_secure_export_key
ABUSE_GUARD=false
```

### 開発サーバー起動

```bash
# フロントエンド (http://localhost:3003)
cd frontend
npx next dev --port 3003

# バックエンド (http://localhost:8787)
cd backend
node simple-server.js

# 両方を同時起動（推奨）
cd frontend && npx next dev --port 3003 > /dev/null 2>&1 & cd ../backend && node simple-server.js > /dev/null 2>&1 &
```

## デプロイ

詳細な手順は [DEPLOYMENT.md](./docs/DEPLOYMENT.md) を参照してください。

### 本番環境
- **Frontend**: Cloudflare Pages
- **Backend**: Cloudflare Workers
- **CI/CD**: GitHub Actions

## プロジェクト構造

```
/
├── frontend/              # Next.js アプリケーション
│   ├── src/
│   │   ├── app/          # App Router
│   │   ├── components/   # React コンポーネント
│   │   ├── hooks/        # カスタムフック
│   │   ├── lib/          # ユーティリティ
│   │   └── types/        # TypeScript型定義
├── backend/              # Cloudflare Workers
│   ├── src/
│   │   ├── handlers/     # API ハンドラー
│   │   ├── utils/        # ユーティリティ
│   │   └── types/        # TypeScript型定義
├── database/             # Supabase設定
├── docs/                 # ドキュメント
└── .github/workflows/    # GitHub Actions
```

## API エンドポイント

### 公開エンドポイント
- `POST /api/reports` - 新しい報告の投稿
- `GET /api/heatmap` - ヒートマップデータの取得
- `GET /api/geocode` - 住所取得（位置情報の逆ジオコーディング）

### 管理者エンドポイント
- `GET /api/export/csv` - CSVデータエクスポート（シークレットキー認証）
- `GET /api/admin/export/csv` - CSVエクスポート（管理者認証）
- `GET /api/admin/export/excel` - Excelエクスポート（管理者認証）

### データエクスポート機能

投稿されたデータはCSV形式で簡単にダウンロードできます。

#### 基本的な使用方法
```bash
# 全データをダウンロード
curl "http://localhost:8787/api/export/csv?secret=YOUR_SECRET_KEY" > reports.csv

# ブラウザでアクセス（ファイルダウンロード）
http://localhost:8787/api/export/csv?secret=YOUR_SECRET_KEY
```

#### フィルタリングオプション
```bash
# 過去30日間のデータのみ
curl "http://localhost:8787/api/export/csv?secret=YOUR_SECRET_KEY&days=30" > reports.csv

# 特定のカテゴリのみ
curl "http://localhost:8787/api/export/csv?secret=YOUR_SECRET_KEY&category=walk_smoke" > reports.csv

# 日付範囲指定
curl "http://localhost:8787/api/export/csv?secret=YOUR_SECRET_KEY&start_date=2025-01-01&end_date=2025-12-31" > reports.csv

# 地域指定
curl "http://localhost:8787/api/export/csv?secret=YOUR_SECRET_KEY&prefecture=大阪府&city=大阪市" > reports.csv
```

#### CSVフォーマット
```
ID,報告日時,緯度,経度,都道府県,市区町村,カテゴリ,信頼度スコア
uuid-123,2025/1/15 14:30:00,34.6937,135.5023,大阪府,大阪市中央区,歩きタバコ,8
```

**注意**: シークレットキーは環境変数 `EXPORT_SECRET_KEY` で管理されます。本番環境では適切にセキュアなキーを設定してください。

## セキュリティ機能

- **レート制限**: 10分間に5件まで投稿可能
- **ブラウザフィンガープリント**: プライバシー配慮の軽量版
- **IPアドレス匿名化**: 報告時にハッシュ化
- **Magic Link認証**: パスワードレス管理者認証
- **CORS設定**: 適切なオリジン制限

## 貢献

1. Forkリポジトリを作成
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. Pull Requestを作成

## ライセンス

MIT License

## サポート

問題や質問がある場合は、GitHubのIssuesで報告してください。