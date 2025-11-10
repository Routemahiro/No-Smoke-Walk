# No-Smoke Walk Osaka - アーキテクチャドキュメント

## 📊 システム概要

No-Smoke Walk Osakaは、市民参加型の歩きタバコ・ポイ捨て報告プラットフォームです。リアルタイムでの報告収集と、ヒートマップによる可視化により、行政施策の意思決定を支援します。

## 🏗️ システムアーキテクチャ

```
┌──────────────────────────────────────────────────────────────┐
│                         Users                                │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│                   Cloudflare CDN                             │
│                 (DDoS Protection, Cache)                     │
└────────────────────────┬─────────────────────────────────────┘
                         │
          ┌──────────────┴──────────────┐
          │                             │
          ▼                             ▼
┌─────────────────────┐       ┌─────────────────────┐
│  Cloudflare Pages   │       │ Cloudflare Workers  │
│   (Frontend Host)   │◄─────►│    (Backend API)    │
│                     │       │                     │
│  - Next.js 15 SSG   │       │  - TypeScript       │
│  - React 19         │       │  - Edge Runtime     │
│  - TailwindCSS      │       │  - REST API         │
│  - MapLibre GL      │       │                     │
└─────────────────────┘       └──────────┬──────────┘
                                         │
                                         ▼
                              ┌─────────────────────┐
                              │     Supabase        │
                              │  (Database + Auth)  │
                              │                     │
                              │  - PostgreSQL       │
                              │  - PostGIS          │
                              │  - Row Level Sec   │
                              └─────────────────────┘
```

## 🎯 主要コンポーネント

### 1. フロントエンド（Cloudflare Pages）

**技術スタック:**
- **Next.js 15**: App Router採用、Static Site Generation (SSG)
- **React 19**: 最新の機能を活用
- **TypeScript**: 型安全性の確保
- **TailwindCSS**: ユーティリティファーストスタイリング
- **MapLibre GL JS**: オープンソースの地図表示エンジン
- **shadcn/ui**: カスタマイズ可能なUIコンポーネント

**主要機能:**
- 位置情報付き報告フォーム
- インタラクティブなヒートマップ表示
- レスポンシブデザイン（モバイルファースト）
- Google Analytics統合

**ディレクトリ構造:**
```
frontend/src/
├── app/                    # App Router ページ
│   ├── page.tsx           # トップページ
│   ├── heatmap/           # ヒートマップページ
│   ├── blog/              # ブログ機能
│   ├── privacy/           # プライバシーポリシー
│   └── terms/             # 利用規約
├── components/            # Reactコンポーネント
│   ├── ReportForm.tsx     # 報告フォーム
│   ├── HeatmapView.tsx    # メインヒートマップ
│   ├── MiniHeatmap.tsx    # ミニヒートマップ
│   └── ui/                # 共通UIコンポーネント
├── hooks/                 # カスタムフック
│   ├── useGeolocation.ts  # 位置情報取得
│   ├── useHeatmap.ts      # ヒートマップデータ管理
│   └── useRateLimit.ts    # レート制限管理
└── lib/                   # ユーティリティ
    ├── supabase.ts        # APIクライアント
    ├── fingerprint.ts     # デバイス識別
    └── blog.ts            # ブログ関連処理
```

### 2. バックエンド（Cloudflare Workers）

**技術スタック:**
- **Cloudflare Workers**: エッジコンピューティング環境
- **TypeScript**: 型安全なAPI開発
- **Wrangler**: Cloudflare CLIツール

**エンドポイント構成:**
| エンドポイント | メソッド | 機能 | 認証 |
|---------------|----------|------|------|
| `/api/health` | GET | ヘルスチェック | なし |
| `/api/reports` | POST | 報告投稿 | なし |
| `/api/heatmap` | GET | ヒートマップデータ取得 | なし |
| `/api/heatmap/stats` | GET | 統計情報取得 | なし |
| `/api/export/csv` | GET | CSVエクスポート | シークレットキー |
| `/api/admin/export/csv` | GET | 管理者CSVエクスポート | 管理者認証 |
| `/api/admin/export/excel` | GET | Excelエクスポート | 管理者認証 |

**セキュリティ機能:**
- CORS設定（オリジン制限）
- レート制限（10分間に5件まで）
- フィンガープリント生成
- IPアドレスハッシュ化
- 環境変数による機密情報管理

### 3. データベース（Supabase）

**構成:**
- **PostgreSQL**: メインデータベース
- **PostGIS**: 地理空間データ処理拡張
- **Row Level Security**: データアクセス制御

**主要テーブル:**
```sql
-- reports テーブル（報告データ）
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
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
    verified_at TIMESTAMP WITH TIME ZONE,
    notes TEXT
);

-- インデックス
CREATE INDEX idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX idx_reports_category ON reports(category);
CREATE INDEX idx_reports_location ON reports(latitude, longitude);
CREATE INDEX idx_reports_trust_score ON reports(trust_score);
CREATE INDEX idx_reports_geo ON reports USING GIST (
    ST_MakePoint(longitude, latitude)
);
```

## 🔄 データフロー

### 1. 報告投稿フロー

```
ユーザー入力
    ↓
位置情報取得（GPS/手動）
    ↓
カテゴリ選択
    ↓
レート制限チェック（Frontend）
    ↓
API呼び出し（POST /api/reports）
    ↓
バリデーション（Backend）
    - 座標範囲チェック
    - カテゴリ検証
    - レート制限（Backend）
    ↓
フィンガープリント生成
    ↓
逆ジオコーディング（地名取得）
    ↓
Supabaseへ保存
    ↓
レスポンス返却
```

### 2. ヒートマップ表示フロー

```
ページロード
    ↓
現在位置取得（任意）
    ↓
API呼び出し（GET /api/heatmap）
    - フィルタ条件付き
    ↓
Supabaseクエリ実行
    - 地理空間フィルタリング
    - 時間範囲フィルタリング
    ↓
データ集計・正規化
    ↓
GeoJSON形式で返却
    ↓
MapLibre GLで描画
    - ヒートマップレイヤー
    - クラスターマーカー
```

## 🚀 デプロイアーキテクチャ

### CI/CDパイプライン

```
GitHub Push
    ↓
GitHub Actions起動
    ↓
並列実行:
    ├─ Frontend Build & Test
    │   ├─ Next.js ビルド
    │   ├─ TypeScript型チェック
    │   └─ Jest実行
    │
    └─ Backend Build & Test
        ├─ TypeScript コンパイル
        └─ テスト実行
    ↓
デプロイ判定（mainブランチのみ）
    ↓
並列デプロイ:
    ├─ Cloudflare Pages
    │   └─ 静的ファイルアップロード
    │
    └─ Cloudflare Workers
        └─ Wrangler deploy
```

### 環境管理

| 環境 | Frontend URL | Backend URL |
|-----|--------------|-------------|
| 開発 | http://localhost:3003 | http://localhost:8787 |
| ステージング | https://staging.no-smoke-walk.pages.dev | https://staging.no-smoke-walk-api.workers.dev |
| 本番 | https://no-smoke-alert.com | https://no-smoke-walk-api.no-smoke-walk.workers.dev |

## 🔒 セキュリティ考慮事項

### 1. 不正対策
- **レート制限**: クライアント・サーバー両側で実装
- **フィンガープリント**: デバイス識別による重複防止
- **Trust Score**: 報告の信頼度評価システム
- **CORS設定**: 不正なオリジンからのアクセス防止

### 2. プライバシー保護
- **IPハッシュ化**: 個人特定を防ぐ
- **位置情報の粗度調整**: 必要に応じて精度を落とす
- **最小限のデータ収集**: 必要最小限の情報のみ保存

### 3. インフラセキュリティ
- **Cloudflare DDoS保護**: 自動的なDDoS攻撃対策
- **環境変数管理**: Wrangler secretsで機密情報管理
- **HTTPS強制**: 全通信を暗号化

## 📈 パフォーマンス最適化

### 1. フロントエンド
- **SSG (Static Site Generation)**: ビルド時に静的HTML生成
- **画像最適化**: Next.js Image最適化
- **コード分割**: 動的インポートによる遅延ロード
- **CDNキャッシュ**: Cloudflareエッジキャッシュ活用

### 2. バックエンド
- **エッジコンピューティング**: Cloudflare Workersで低レイテンシ
- **データベースインデックス**: 効率的なクエリ実行
- **地理空間インデックス**: PostGISによる高速検索

### 3. 地図表示
- **タイル型地図**: 必要な部分のみロード
- **クラスタリング**: 大量マーカーの集約表示
- **ビューポート制限**: 表示範囲のデータのみ取得

## 🔄 スケーラビリティ

### 水平スケーリング
- **Cloudflare Workers**: 自動スケーリング（リクエストベース）
- **Supabase**: データベース容量に応じた自動拡張

### 負荷分散
- **Cloudflare Load Balancer**: グローバル負荷分散
- **エッジキャッシュ**: 静的コンテンツの分散配信

## 📊 監視とログ

### 監視項目
- API応答時間
- エラー率
- データベース負荷
- CDNキャッシュヒット率

### ログ収集
- Cloudflare Analytics
- Workers Logs
- Supabase Dashboard

## 🔧 開発環境

### 必要なツール
- Node.js 18+
- npm/yarn
- Wrangler CLI
- Git

### 環境変数
```bash
# Frontend (.env.local)
NEXT_PUBLIC_API_BASE_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=

# Backend (wrangler.toml / secrets)
SUPABASE_URL=
SUPABASE_ANON_KEY=
EXPORT_SECRET_KEY=
ENVIRONMENT=
ABUSE_GUARD=
```

## 📚 関連ドキュメント

- [API仕様書](./API_SPECIFICATION.md)
- [データベース設計書](./DATABASE_DESIGN.md)
- [セットアップガイド](./SETUP_GUIDE.md)
- [デプロイ手順](./DEPLOYMENT_COMMANDS.md)

---

**最終更新:** 2025年11月9日  
**ドキュメントバージョン:** 1.0
