# GitHub Actions自動デプロイ設定 - 引き継ぎ文書

**作成日時**: 2025-08-27  
**作成者**: Claude Code  
**ステータス**: GitHub認証設定のみ残作業あり

## 📋 作業概要

### 目的
GitHubにpushするだけで自動的にCloudflare Pagesにデプロイされる仕組みを構築する

### 背景
手動デプロイ（`npx wrangler pages deploy out`）の手間を削減し、開発効率を向上させるため

## ✅ 完了した作業

### 1. GitHub Actions設定ファイル作成・修正
**ファイル**: `.github/workflows/deploy.yml`
**変更内容**:
- プロジェクト名を `no-smoke-walk-frontend` → `no-smoke-walk` に修正
- ビルド・テスト・デプロイのワークフローを設定済み

### 2. テスト記事作成
**作成ファイル**: 
- `content/blog/003-github-actions-test.md` - テスト用記事（Markdownファイル）
- `frontend/src/app/blog/page.tsx` - ブログ一覧に3番目の記事を追加
- `frontend/src/app/blog/[id]/page.tsx` - 記事詳細ページに3番目の記事を追加、静的生成パラメータを更新

**記事詳細**:
```
タイトル: "GitHub Actionsテスト記事 - 自動デプロイ機能の動作確認"
タグ: ["テスト", "GitHub Actions", "自動化", "開発"]
ペルソナ: ["developers", "system_admin"] 
読了時間: 3分
難易度: 初級
```

### 3. ローカル動作確認
**確認結果**: ✅ 正常動作
- ビルドログで `/blog/3` ページの静的生成を確認
- ローカルサーバーでテスト記事が正しく表示されることを確認
- タグフィルタに新しいタグ（"#テスト", "#GitHub Actions"等）が表示されることを確認

### 4. Cloudflare API認証情報確認
**取得済み情報**:
```
CLOUDFLARE_ACCOUNT_ID = 50009f3eace16f98718b71ee90434cf2
現在のトークン権限: pages (write), workers (write), account (read) 等
```

## ⚠️ 残作業（手動設定が必要）

### GitHub Secrets設定
**リポジトリ**: `https://github.com/Routemahiro/No-Smoke-Walk`  
**設定場所**: Settings → Secrets and variables → Actions → New repository secret

**設定が必要なSecrets**:
```
CLOUDFLARE_ACCOUNT_ID = 50009f3eace16f98718b71ee90434cf2
CLOUDFLARE_API_TOKEN = [Cloudflareダッシュボードで新規作成]
NEXT_PUBLIC_SUPABASE_URL = https://qdqcocgoaxzbhvvmvttr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkcWNvY2dvYXh6Ymh2dm12dHRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyMjY0NzMsImV4cCI6MjA2NjgwMjQ3M30.3sr3dXq7GOz8yLcKn602Ba8Ej-X1zIpCn-T_BxM5Ofk
```

### Cloudflare API Token作成方法
1. [Cloudflare ダッシュボード](https://dash.cloudflare.com/profile/api-tokens) にアクセス
2. **Create Token** → **Use template** で「Edit Cloudflare Workers」を選択
3. **Account** = All accounts, **Zone** = All zones を設定
4. 生成されたトークンをコピーして、GitHub Secretsに `CLOUDFLARE_API_TOKEN` として保存

## 🚀 自動デプロイ完了後の動作

### トリガー
- **mainブランチへのpush** → 自動ビルド&デプロイ実行
- **Pull Request作成** → プレビューデプロイ実行

### 動作フロー
1. **ビルド**: `cd frontend && npm ci && npm run build`
2. **デプロイ**: `wrangler pages deploy frontend/out --project-name=no-smoke-walk`
3. **結果通知**: GitHub Actionsのログで確認可能

### 期待される効果
- 手動デプロイ作業が不要になる
- ヒューマンエラーの削減
- デプロイ履歴の自動管理

## 🔍 現在のコミット状況

**ローカルコミット済み（未push）**:
```bash
dffd1d2 GitHub Actionsテスト記事を追加し、自動デプロイ機能をテスト
```

**変更ファイル**:
- `content/blog/003-github-actions-test.md` (新規作成)
- `frontend/src/app/blog/page.tsx` (記事追加)
- `frontend/src/app/blog/[id]/page.tsx` (記事追加、静的生成設定)
- `.github/workflows/deploy.yml` (プロジェクト名修正)

## 📝 次回の作業手順

1. **GitHub Secretsを設定**（上記の値を使用）
2. **GitHub認証の解決**（Personal Access Token設定 または Web UI使用）
3. **コミットをpush**（`git push origin main`）
4. **GitHub Actionsの実行確認**（リポジトリのActionsタブで確認）
5. **本番環境での動作確認**（https://no-smoke-alert.com でテスト記事表示確認）

## 🛡️ トラブルシューティング

### GitHub認証エラーの場合
```bash
# Personal Access Token設定後
git remote set-url origin https://[token]@github.com/Routemahiro/No-Smoke-Walk.git
git push origin main
```

### GitHub Actions失敗の場合
- リポジトリのActionsタブでエラーログ確認
- Secrets設定の確認
- wrangler.toml設定の確認

## 💡 補足情報

**ブログ記事の追加方法**:
1. `content/blog/00X-filename.md` にMarkdownファイル作成
2. `frontend/src/app/blog/page.tsx` の静的データ配列に追加
3. `frontend/src/app/blog/[id]/page.tsx` の `generateStaticParams` に新ID追加
4. GitHubにpush → 自動デプロイ

**設定完了後は記事作成がめちゃくちゃ簡単になります！** 🚀