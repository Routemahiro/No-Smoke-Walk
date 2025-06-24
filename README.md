# No-Smoke Walk Osaka 🚭

大阪市の歩きタバコ・ポイ捨て報告システム

## 概要

市民が歩きタバコや禁煙エリアでの喫煙、ポイ捨てを発見した際に簡単に報告できるWebアプリケーションです。報告されたデータはヒートマップで可視化され、行政指導の資料として活用されます。

## 主な機能

- 📍 **位置情報付き報告**: GPS機能を使った正確な位置での報告
- 🗺️ **ヒートマップ表示**: 報告データの視覚的な分析
- 🛡️ **不正対策**: レート制限・フィンガープリントによるスパム防止
- 📊 **管理者ダッシュボード**: 統計情報の表示と分析
- 📁 **データエクスポート**: CSV/Excel形式でのデータダウンロード
- 🔐 **管理者認証**: Magic Link認証による安全なアクセス

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

# backend/.env
DATABASE_URL=your_supabase_database_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 開発サーバー起動

```bash
# フロントエンド (http://localhost:3000)
cd frontend
npm run dev

# バックエンド (http://localhost:8787)
cd backend
npx wrangler dev
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

### 管理者エンドポイント
- `GET /api/admin/export/csv` - CSVエクスポート
- `GET /api/admin/export/excel` - Excelエクスポート

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