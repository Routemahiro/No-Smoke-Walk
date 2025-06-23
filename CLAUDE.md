# No-Smoke Walk Osaka - 開発記録

## 開発タスクとメモ

### 開発記録テンプレート
開発の流れは以下の形式で記録する：
**保存先: /mnt/e/mega/No-Smoke-Walk/CLAUDE.md の「開発記録」セクション**
- [日付] [ファイル名] [作業内容]
- 例: 2025-06-20 src/app/page.tsx メインページのレイアウト作成

**⚠️ 重要なルール**
作業完了時は必ず以下を実行すること：
1. 開発記録に作業内容を追記
2. 詳細開発計画のチェックボックスを更新（[ ] → [x]）
3. TodoWriteツールでTodoリストの状態を更新

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
│   └── package.json
├── database/             # Supabase設定
│   ├── migrations/       # データベース移行
│   └── seed/            # 初期データ
└── docs/                # ドキュメント
```

### 環境変数設定
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Cloudflare Workers
DATABASE_URL=
ABUSE_GUARD=false

# Google AdSense
NEXT_PUBLIC_ADSENSE_CLIENT_ID=
```

### 開発コマンド
```bash
# フロントエンド開発サーバー
cd frontend && npm run dev

# Workers開発サーバー
cd backend && npm run dev

# データベース移行
cd database && supabase db push

# 型チェック
npm run typecheck

# Lint
npm run lint
```

### API エンドポイント
- POST /api/reports - 報告投稿
- GET /api/heatmap - ヒートマップデータ
- GET /api/admin/stats - 管理統計
- GET /api/admin/export - データエクスポート

## 詳細開発計画

### Phase 1: 基盤構築（Week 1-2）
**目標**: プロジェクト基盤とデータベース、基本API構築

#### 1.1 プロジェクト初期セットアップ
- [x] ルートディレクトリに frontend/, backend/, database/ フォルダ作成
- [x] Next.js 15 プロジェクト初期化（TypeScript設定）
- [x] Cloudflare Workers プロジェクト初期化
- [x] shadcn/ui + TailwindCSS セットアップ
- [x] ESLint/Prettier 設定

#### 1.2 データベース設計・セットアップ
- [x] Supabase プロジェクト作成
- [x] reports テーブル設計（UUID, 座標, カテゴリ, タイムスタンプ）
- [x] admin_users テーブル設計
- [x] PostGIS 拡張有効化
- [x] マイグレーションファイル作成
- [x] テストデータ投入

#### 1.3 基本API開発
- [x] Cloudflare Workers 環境構築
- [x] Supabase接続設定
- [x] POST /api/reports エンドポイント（基本版）
- [x] GET /api/heatmap エンドポイント（基本版）
- [x] CORS設定

### Phase 2: コア機能開発（Week 3-4）
**目標**: ユーザー向け報告・閲覧機能完成

#### 2.1 報告機能フロントエンド
- [x] メインページレイアウト作成
- [x] 位置情報取得機能（getCurrentPosition）
- [ ] 手動位置調整機能（スライダー 0-200m）
- [x] カテゴリ選択UI（walk_smoke, stand_smoke, litter）
- [x] 報告投稿フォーム
- [x] 連投防止機能（10秒クールダウン）
- [x] 投稿成功・エラーハンドリング

#### 2.2 ヒートマップ表示機能
- [ ] MapLibre GL JS セットアップ
- [ ] OpenStreetMap タイル設定
- [ ] ヒートマップレイヤー実装
- [ ] API からのGeoJSONデータ取得
- [ ] Hexagon 1km 集約表示
- [ ] 地図操作UI（ズーム、パン）

### Phase 3: 管理機能開発（Week 5-6）
**目標**: 管理者向け分析・エクスポート機能

#### 3.1 管理者認証システム
- [ ] Supabase Auth 設定
- [ ] Email-link 認証実装
- [ ] JWT トークン検証
- [ ] 管理者ロール制御
- [ ] ログイン/ログアウト画面

#### 3.2 管理者ダッシュボード
- [ ] 統計表示（日別、カテゴリ別レポート数）
- [ ] 地域別分析
- [ ] 時系列グラフ表示
- [ ] リアルタイム更新機能

#### 3.3 データエクスポート機能
- [ ] CSV エクスポート API
- [ ] Excel エクスポート API
- [ ] フィルタリング機能（日付、カテゴリ、地域）
- [ ] ダウンロードUI
- [ ] 大容量データ対応（ストリーミング）

### Phase 4: 統合・デプロイ（Week 7-8）
**目標**: 本番環境対応・収益化機能

#### 4.1 広告統合
- [ ] Google AdSense アカウント設定
- [ ] バナー広告コンポーネント作成
- [ ] 広告配置（ホーム画面下部、ヒートマップ画面下部）
- [ ] 協賛POIバッジ機能

#### 4.2 CI/CD・デプロイ設定
- [ ] GitHub Actions ワークフロー作成
- [ ] Cloudflare Pages 設定（フロントエンド）
- [ ] Cloudflare Workers 設定（バックエンド）
- [ ] 環境変数管理
- [ ] 本番環境テスト

#### 4.3 不正対策機能（オプション）
- [ ] IP アドレス SHA-256 ハッシュ化
- [ ] ブラウザフィンガープリント取得
- [ ] レート制限実装（10分間で5件）
- [ ] abuse_guard テーブル設計
- [ ] 環境変数での ON/OFF 切り替え

### 技術的考慮事項

#### セキュリティ
- HTTPS 必須
- CSRFトークン実装
- SQLインジェクション対策
- XSS対策

#### パフォーマンス
- CDN活用（Cloudflare）
- 画像最適化
- コード分割（React.lazy）
- API レスポンスキャッシュ

#### スケーラビリティ
- データベースインデックス最適化
- API レート制限
- 自動スケーリング対応

### 開発記録

**2025-06-20 プロジェクト初期セットアップ完了**
- 2025-06-20 / プロジェクト基本フォルダ構造作成（frontend/, backend/, database/, docs/）
- 2025-06-20 frontend/package.json Next.js 15 + TypeScript + TailwindCSS初期化
- 2025-06-20 frontend/components.json shadcn/ui設定
- 2025-06-20 frontend/src/lib/utils.ts shadcn/ui utilsライブラリ作成
- 2025-06-20 backend/package.json Cloudflare Workers + TypeScript環境構築
- 2025-06-20 backend/tsconfig.json TypeScript設定ファイル作成
- 2025-06-20 backend/wrangler.toml Workers設定ファイル作成
- 2025-06-20 backend/src/index.ts 基本APIルーティング実装（/health, /reports, /heatmap）
- 2025-06-20 database/migrations/ データベースマイグレーションフォルダ作成
- 2025-06-20 .gitignore 包括的な.gitignore設定作成
- 2025-06-20 CLAUDE.md 開発記録テンプレート・保存先明示

**2025-06-20 基盤整備完了**
- 2025-06-20 frontend/.prettierrc Prettier設定ファイル作成
- 2025-06-20 frontend/package.json 開発コマンド追加（lint:fix, format, typecheck, test）
- 2025-06-20 frontend/.env.local.example 環境変数テンプレート作成
- 2025-06-20 backend/.env.example バックエンド環境変数テンプレート作成
- 2025-06-20 frontend/src/types/index.ts フロントエンド型定義作成
- 2025-06-20 backend/src/types/index.ts バックエンド型定義作成
- 2025-06-20 frontend/src/app/globals.css MapLibre GL CSS インポート追加
- 2025-06-20 frontend/jest.config.js テスト環境設定
- 2025-06-20 frontend/jest.setup.js テストセットアップファイル作成

**2025-06-20 Supabaseデータベースセットアップ完了**
- 2025-06-20 database/migrations/001_initial_schema.sql データベーススキーマ作成（reports, admin_users, abuse_guard テーブル + PostGIS）
- 2025-06-20 database/seed/001_test_data.sql テストデータ作成（大阪エリアの報告データ）
- 2025-06-20 database/package.json Supabase CLI コマンド設定
- 2025-06-20 database/supabase/ Supabaseプロジェクト初期化
- 2025-06-20 database/setup_instructions.md Supabaseクラウドセットアップ手順書作成
- 2025-06-20 backend/src/utils/supabase.ts Supabase接続ユーティリティ作成
- 2025-06-20 backend/package.json @supabase/supabase-js 依存関係追加

**2025-06-20 Reports & Heatmap API実装完了**
- 2025-06-20 backend/src/handlers/reports.ts Reports API実装（位置検証、不正対策、データベース投稿）
- 2025-06-20 backend/src/handlers/heatmap.ts Heatmap API実装（グリッド集約、GeoJSON変換、統計API）
- 2025-06-20 backend/src/index.ts メインルーターにAPI統合
- 2025-06-20 backend/src/types/index.ts Heatmap型定義更新（categories, intensity対応）
- 2025-06-20 backend/tests/reports.test.js Reports APIテスト実装・実行
- 2025-06-20 backend/tests/heatmap.test.js Heatmap APIテスト実装・実行  
- 2025-06-20 backend/tests/integration.test.js 統合テスト実装・実行
- 2025-06-20 backend/ TypeScript型チェック完了（全エラー解消）

**2025-06-20 報告機能フロントエンド実装完了**
- 2025-06-20 frontend/src/lib/supabase.ts Supabaseクライアント・API通信設定
- 2025-06-20 frontend/src/hooks/useGeolocation.ts 位置情報取得カスタムフック（日本境界検証付き）
- 2025-06-20 frontend/src/components/ReportForm.tsx 報告投稿フォーム実装（カテゴリ選択・連投防止・エラーハンドリング）
- 2025-06-20 frontend/src/app/page.tsx メインページデザイン実装（レスポンシブ対応）
- 2025-06-20 frontend/.env.local 開発環境変数ファイル作成
- 2025-06-20 frontend/package.json shadcn/ui依存関係追加（Button, Card, Alert等）
- 2025-06-20 frontend/ TypeScript型チェック完了・開発サーバー起動テスト実行