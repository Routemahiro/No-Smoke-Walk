# デプロイメント設定ガイド

## 必要なもの

1. Cloudflareアカウント
2. GitHubリポジトリ
3. Supabaseプロジェクト

## GitHub Secrets設定

以下のSecretをGitHubリポジトリの Settings > Secrets and variables > Actions で設定してください：

### Cloudflare設定
- `CLOUDFLARE_API_TOKEN`: Cloudflare API Token（Zone:Read, Account:Read, Page:Edit, Worker:Edit権限）
- `CLOUDFLARE_ACCOUNT_ID`: CloudflareアカウントID

### Supabase設定
- `NEXT_PUBLIC_SUPABASE_URL`: SupabaseプロジェクトURL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase匿名キー
- `SUPABASE_SERVICE_ROLE_KEY`: Supabaseサービスロールキー
- `DATABASE_URL`: Supabase PostgreSQL接続URL

## Cloudflare Pages設定

1. Cloudflare ダッシュボードで Pages を開く
2. 「Create a project」を選択
3. GitHub連携でリポジトリを選択
4. プロジェクト名: `no-smoke-walk-frontend`
5. ビルド設定:
   - フレームワーク: Next.js
   - ビルドコマンド: `npm run build`
   - 出力ディレクトリ: `out`
   - ルートディレクトリ: `frontend`

## Cloudflare Workers設定

1. Wrangler CLIをインストール: `npm install -g wrangler`
2. ログイン: `wrangler login`
3. プロジェクト作成: `wrangler deploy --env production`

## 環境変数設定

### Cloudflare Pages
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Cloudflare Workers
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`

## 自動デプロイ

GitHub Actionsワークフローにより、`main`ブランチへのpushで自動デプロイされます：

1. **Frontend**: Cloudflare Pagesにデプロイ
2. **Backend**: Cloudflare Workersにデプロイ
3. **テスト**: TypeScriptチェック、Lint、テスト実行

## 手動デプロイ

### Frontend
```bash
cd frontend
npm run build
# Cloudflare Pagesでビルド済みファイルをアップロード
```

### Backend
```bash
cd backend
wrangler deploy --env production
```

## トラブルシューティング

### よくある問題

1. **Build失敗**: 環境変数が正しく設定されているか確認
2. **CORS エラー**: Workers の CORS 設定を確認
3. **データベース接続エラー**: Supabase接続情報を確認

### ログの確認方法

- **Pages**: Cloudflare ダッシュボード > Pages > Functions タブ
- **Workers**: Cloudflare ダッシュボード > Workers & Pages > Your Worker > Logs

## セキュリティ設定

- CSP（Content Security Policy）設定済み
- セキュリティヘッダー設定済み
- 環境変数での機密情報管理
- 本番環境でのABUSE_GUARD有効化