# No-Smoke Walk Osaka - 開発記録

## 開発タスクとメモ

### 開発記録テンプレート
開発の流れは以下の形式で記録する：
**保存先: /mnt/e/mega/No-Smoke-Walk/CLAUDE.md の「開発記録」セクション**
- [日付] [ファイル名] [作業内容]
- 例: 2025-06-20 src/app/page.tsx メインページのレイアウト作成

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
- [ ] ルートディレクトリに frontend/, backend/, database/ フォルダ作成
- [ ] Next.js 15 プロジェクト初期化（TypeScript設定）
- [ ] Cloudflare Workers プロジェクト初期化
- [ ] shadcn/ui + TailwindCSS セットアップ
- [ ] ESLint/Prettier 設定

#### 1.2 データベース設計・セットアップ
- [ ] Supabase プロジェクト作成
- [ ] reports テーブル設計（UUID, 座標, カテゴリ, タイムスタンプ）
- [ ] admin_users テーブル設計
- [ ] PostGIS 拡張有効化
- [ ] マイグレーションファイル作成
- [ ] テストデータ投入

#### 1.3 基本API開発
- [ ] Cloudflare Workers 環境構築
- [ ] Supabase接続設定
- [ ] POST /api/reports エンドポイント（基本版）
- [ ] GET /api/heatmap エンドポイント（基本版）
- [ ] CORS設定

### Phase 2: コア機能開発（Week 3-4）
**目標**: ユーザー向け報告・閲覧機能完成

#### 2.1 報告機能フロントエンド
- [ ] メインページレイアウト作成
- [ ] 位置情報取得機能（getCurrentPosition）
- [ ] 手動位置調整機能（スライダー 0-200m）
- [ ] カテゴリ選択UI（walk_smoke, stand_smoke, litter）
- [ ] 報告投稿フォーム
- [ ] 連投防止機能（10秒クールダウン）
- [ ] 投稿成功・エラーハンドリング

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