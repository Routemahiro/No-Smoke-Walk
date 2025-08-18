# ストック型ブログ記事作成機能の設計仕様書

## 🎯 設計方針
**`blog/{n}` + リッチタグシステム**による柔軟で運用しやすいブログ機能を構築

## 📁 ディレクトリ構造
```
/content/blog/
  ├── 001-osaka-smoking-ban-guide.md
  ├── 002-child-safety-secondhand-smoke.md
  ├── 003-business-impact-analysis.md
  └── ...

/frontend/src/app/
  ├── blog/
  │   ├── page.tsx              # ブログ一覧（/blog）
  │   ├── [id]/
  │   │   └── page.tsx          # 記事詳細（/blog/1）
  │   └── components/
  │       ├── BlogCard.tsx
  │       ├── TagFilter.tsx
  │       └── RelatedArticles.tsx
```

## 📝 記事メタデータ設計
```yaml
---
title: "大阪市路上喫煙禁止条例完全ガイド"
description: "2025年最新版。大阪市の路上喫煙禁止条例の詳細解説と罰則、対象エリアを徹底説明"
publishedAt: "2025-01-31"
updatedAt: "2025-01-31"
author: "No-Smoke Alert編集部"
tags: ["法律解説", "大阪市", "子育て世代", "店舗経営", "条例"]
personas: ["parents", "store_owners", "commuters"]
seo:
  ogImage: "/blog/images/001-cover.jpg"
  keywords: ["大阪市", "路上喫煙", "禁止条例", "罰則"]
readTime: 8
difficulty: "初級"
---
```

## 🔧 実装コンポーネント

### 1. ブログ一覧ページ（/blog）
- **タグフィルタ機能**: `?tag=法律解説` でフィルタリング
- **ペルソナフィルタ**: `?persona=parents` で対象者別表示
- **検索機能**: タイトル・本文の全文検索
- **ソート**: 最新順・人気順・読了時間順

### 2. 記事詳細ページ（/blog/{n}）
- **パンくずナビ**: ホーム > ブログ > 記事タイトル
- **関連記事**: タグ・ペルソナ基準の自動表示
- **目次自動生成**: h2,h3タグから目次作成
- **読了時間表示**: 文字数から自動計算

### 3. タグ管理システム
```typescript
// タグ設定
const BLOG_TAGS = {
  topic: ["法律解説", "健康情報", "統計データ", "地域活動"],
  target: ["子育て世代", "通勤者", "店舗経営", "NPO団体"],
  area: ["大阪市", "関西", "全国"],
  level: ["初級", "中級", "上級"]
} as const;
```

## 🔄 記事作成ワークフロー

### 1. **記事ファイル作成**
```bash
# 次の記事番号を自動取得して新規作成
npm run blog:new "記事タイトル"
# → 004-記事タイトル.md を自動生成
```

### 2. **ローカルプレビュー**
```bash
npm run dev
# → http://localhost:3003/blog/4 でプレビュー
```

### 3. **ビルド・デプロイ**
- 既存のNext.js SSG + Cloudflare Pagesパイプラインをそのまま活用
- 記事追加時は自動的にサイトマップ・RSS更新

## 📊 SEO・マーケティング最適化

### 1. **自動生成機能**
- **sitemap.xml**: 全記事を自動含める
- **RSS feed**: `/blog/rss.xml` で配信
- **JSON-LD**: 記事構造化データ
- **OGP**: SNSシェア最適化

### 2. **内部リンク最適化**
- 関連記事の自動リンク生成
- タグページからの被リンク
- ブログTOPからの記事誘導

## 🛠 必要な開発作業

### Phase 1: 基盤構築
1. Markdownパーサー設定（gray-matter + remark）
2. ブログ一覧・詳細ページ作成
3. タグフィルタ機能実装

### Phase 2: 機能拡張
1. 検索機能実装
2. 関連記事システム
3. SEO最適化（sitemap, RSS, JSON-LD）

### Phase 3: 運用サポート
1. 記事作成CLIツール
2. 画像最適化パイプライン
3. 内部リンク検証

## 💡 運用メリット
- **簡単な記事作成**: 番号順でファイル管理が直感的
- **柔軟な分類**: タグで多次元的な記事整理
- **SEO効果**: 一貫したURL構造＋リッチメタデータ
- **保守性**: カテゴリ変更不要で長期運用に適応

## 📋 技術要件

### 必要なライブラリ
```json
{
  "gray-matter": "^4.0.3",
  "remark": "^15.0.1", 
  "remark-html": "^16.0.1",
  "remark-gfm": "^4.0.0"
}
```

### TypeScript型定義
```typescript
interface BlogPost {
  id: number;
  slug: string;
  title: string;
  description: string;
  content: string;
  publishedAt: string;
  updatedAt: string;
  author: string;
  tags: string[];
  personas: string[];
  seo: {
    ogImage?: string;
    keywords: string[];
  };
  readTime: number;
  difficulty: "初級" | "中級" | "上級";
}

interface BlogMetadata {
  totalPosts: number;
  allTags: string[];
  allPersonas: string[];
  latestPosts: BlogPost[];
}
```

## 🎨 UI/UXガイドライン

### デザインシステム連携
- 既存のTailwind CSS + shadcn/uiコンポーネントを活用
- メインサイトとの一貫性を保持
- レスポンシブ対応必須

### ユーザビリティ
- 記事読み込み速度最適化
- モバイルファーストデザイン
- アクセシビリティ対応（ARIA、キーボードナビゲーション）

---

**作成日**: 2025年7月28日  
**最終更新**: 2025年7月28日  
**ドキュメントバージョン**: 1.0