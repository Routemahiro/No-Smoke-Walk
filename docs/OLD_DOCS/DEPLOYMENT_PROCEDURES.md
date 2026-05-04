# No-Smoke Walk Osaka - 本番環境デプロイ手順書

## 概要

このドキュメントでは、No-Smoke Walk Osakaプロジェクトのフロントエンド・バックエンドを本番環境に反映する手順をまとめています。

## プロジェクト構成

```
/
├── frontend/              # Next.js (Cloudflare Pages)
├── backend/              # Cloudflare Workers
└── docs/                # ドキュメント
```

## 本番環境URL

- **メインサイト**: https://no-smoke-alert.com
- **Cloudflare Pages**: https://f66afb3d.no-smoke-walk.pages.dev
- **Workers API**: https://no-smoke-walk-api.no-smoke-walk.workers.dev

---

## 📱 フロントエンド更新手順 (Next.js + Cloudflare Pages)

### 1. 前提条件確認

```bash
# 作業ディレクトリ移動
cd /path/to/No-Smoke-Walk/frontend

# Node.js バージョン確認
node --version  # v18以上推奨

# 依存関係最新確認
npm ci
```

### 2. 本番ビルド実行

```bash
# Next.js ビルド (静的エクスポート)
npm run build

# ビルド成功確認
ls -la out/  # outディレクトリ生成確認
```

**重要**: ビルドエラー時の対処法
```bash
# キャッシュクリア
rm -rf .next node_modules
npm ci

# 再ビルド
npm run build
```

### 3. Cloudflare Pages デプロイ

```bash
# outディレクトリからデプロイ
cd out
npx wrangler pages deploy . --project-name=no-smoke-walk

# 成功例:
# ✨ Deployment complete! 
# Take a peek over at https://[deployment-id].no-smoke-walk.pages.dev
```

### 4. デプロイ確認

```bash
# 新デプロイメントURL確認
curl -I https://[新しいdeployment-id].no-smoke-walk.pages.dev

# カスタムドメイン動作確認 (数分後)
curl -I https://no-smoke-alert.com
```

---

## 🔧 バックエンド更新手順 (Cloudflare Workers)

### 1. 前提条件確認

```bash
# 作業ディレクトリ移動
cd /path/to/No-Smoke-Walk/backend

# TypeScript コンパイル確認
npx tsc --noEmit

# 環境変数確認
npx wrangler secret list
```

### 2. Workers デプロイ

```bash
# 本番環境デプロイ
npx wrangler deploy

# 成功例:
# ✨ Uploaded no-smoke-walk-api
# Current Version ID: [version-id]
```

### 3. API動作確認

```bash
# Health check
curl "https://no-smoke-walk-api.no-smoke-walk.workers.dev/api/health"

# Heatmap API
curl "https://no-smoke-walk-api.no-smoke-walk.workers.dev/api/heatmap"

# Reports API (POST テスト)
curl -X POST "https://no-smoke-walk-api.no-smoke-walk.workers.dev/api/reports" \
  -H "Content-Type: application/json" \
  -d '{"latitude":34.6937,"longitude":135.5023,"category":"walk_smoke"}'
```

---

## 🔑 環境変数管理

### 必要な環境変数一覧

```bash
# Supabase 接続
SUPABASE_URL=https://qdqcocgoaxzbhvvmvttr.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key

# CSV エクスポート認証
EXPORT_SECRET_KEY=your-secure-export-key

# その他（オプション）
ABUSE_GUARD=false
ENVIRONMENT=production
```

### 環境変数設定方法

```bash
# 新しい環境変数追加
echo "your-secret-value" | npx wrangler secret put VARIABLE_NAME

# 環境変数確認
npx wrangler secret list

# 環境変数削除
npx wrangler secret delete VARIABLE_NAME
```

---

## 🚨 トラブルシューティング

### よくある問題と解決方法

#### 1. Next.js ビルドタイムアウト

```bash
# Google Fonts を一時的に無効化
# frontend/src/app/layout.tsx で Noto Sans JP import をコメントアウト

# ビルド最適化設定確認
# frontend/next.config.ts
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true }
}
```

#### 2. Workers API エラー

```bash
# ログ確認
npx wrangler tail --format pretty

# 環境変数確認
curl "https://no-smoke-walk-api.no-smoke-walk.workers.dev/api/debug/env"
```

#### 3. CORS エラー

フロントエンドとAPIのドメインが異なる場合、Workers側のCORS設定を確認:

```typescript
// backend/src/index.ts
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};
```

---

## 📋 デプロイチェックリスト

### フロントエンド更新時

- [ ] `npm run build` 成功確認
- [ ] TypeScript エラーなし
- [ ] `out/` ディレクトリ生成確認
- [ ] Pages デプロイ成功
- [ ] 新しいデプロイメントURL動作確認
- [ ] カスタムドメイン反映確認 (5-10分後)
- [ ] 主要機能動作確認 (位置情報取得・報告投稿・ヒートマップ)

### バックエンド更新時

- [ ] TypeScript コンパイル成功
- [ ] 環境変数設定確認
- [ ] Workers デプロイ成功
- [ ] Health API 動作確認
- [ ] Reports API 動作確認
- [ ] Heatmap API 動作確認
- [ ] CSV Export 動作確認

---

## 🔄 緊急時ロールバック手順

### フロントエンド ロールバック

```bash
# 過去のデプロイメント確認
npx wrangler pages deployment list --project-name=no-smoke-walk

# 特定のデプロイメントに戻す
# Cloudflare Dashboard で手動切り替え
# https://dash.cloudflare.com/pages/view/no-smoke-walk
```

### バックエンド ロールバック

```bash
# 過去のバージョン確認
npx wrangler deployments list

# Git から過去バージョンをチェックアウト
git log --oneline
git checkout [commit-hash]
npx wrangler deploy
git checkout main  # 作業完了後
```

---

## 📞 サポート情報

### 参考ドキュメント

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Next.js Static Exports](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
- [Supabase API Documentation](https://supabase.com/docs/guides/api)

### 緊急連絡先

- **Cloudflare サポート**: https://support.cloudflare.com/
- **Supabase サポート**: https://supabase.com/support

---

## 📝 更新履歴

| 日付 | 変更内容 | 担当者 |
|------|----------|--------|
| 2025-07-26 | 初版作成・Google Analytics/ニンジャアド統合版デプロイ手順 | Claude |

---

**最終更新**: 2025年7月26日  
**ドキュメントバージョン**: 1.0
