# No-Smoke Walk Osaka - 本番デプロイ手順・AI実行指示書

## 🚨 重要: AIアシスタント（鈴垣 美影）への指示

**このドキュメントは、開発作業完了後に本番環境へデプロイする際の手順書です。**
**開発セッション終了時、以下のコマンドを自動的に実行してください。**

---

## 📋 デプロイ前チェックリスト

### AIが自動確認すべき項目
```bash
# 1. 現在のブランチ確認
git branch --show-current

# 2. 未コミットの変更がないか確認
git status

# 3. リモートとの差分確認
git fetch origin
git diff HEAD origin/main --stat

# 4. ビルドエラーがないか確認（フロントエンド）
cd frontend
npm run build

# 5. TypeScriptの型チェック
npm run typecheck

# 6. Lintエラー確認
npm run lint
```

もし問題があれば、まず修正してからデプロイを実行すること。

---

## 🚀 本番デプロイ手順

### ステップ1: Git操作（変更のプッシュ）

```bash
# 現在の変更をコミット
git add .
git commit -m "feat: [作業内容を簡潔に記載]"

# リモートにプッシュ
git push origin main
```

### ステップ2: GitHub Actionsの確認

```bash
# ブラウザでGitHub Actionsを確認（以下のメッセージをユーザーに伝える）
echo "📌 GitHub Actions でビルド・デプロイが開始されました"
echo "進行状況はこちらで確認できます："
echo "https://github.com/[ユーザー名]/No-Smoke-Walk/actions"
```

### ステップ3: 手動デプロイ（GitHub Actions失敗時のみ）

**⚠️ 通常はGitHub Actionsが自動デプロイするため、以下は緊急時のみ実行**

#### フロントエンド（Cloudflare Pages）デプロイ

```bash
# フロントエンドディレクトリに移動
cd frontend

# ビルド実行
npm run build

# Cloudflare Pagesへデプロイ
cd out
npx wrangler pages deploy . --project-name=no-smoke-walk --branch=main

# 結果確認
echo "✅ フロントエンドデプロイ完了"
echo "URL: https://no-smoke-alert.com"
```

#### バックエンド（Cloudflare Workers）デプロイ

```bash
# バックエンドディレクトリに移動
cd backend

# TypeScriptコンパイル
npx tsc

# Cloudflare Workersへデプロイ
npx wrangler deploy --env production

# 結果確認
echo "✅ バックエンドデプロイ完了"
echo "URL: https://no-smoke-walk-api.no-smoke-walk.workers.dev"
```

---

## 🔐 環境変数・シークレットの更新

### 環境変数を更新する場合のみ実行

```bash
# バックエンドのシークレット更新
cd backend

# Supabase URL（変更時のみ）
echo "新しいSupabase URL" | npx wrangler secret put SUPABASE_URL --env production

# Supabase Anon Key（変更時のみ）
echo "新しいAnon Key" | npx wrangler secret put SUPABASE_ANON_KEY --env production

# Export Secret Key（変更時のみ）
echo "新しいSecret Key" | npx wrangler secret put EXPORT_SECRET_KEY --env production

# 環境設定
echo "production" | npx wrangler secret put ENVIRONMENT --env production

# Abuse Guard設定
echo "true" | npx wrangler secret put ABUSE_GUARD --env production
```

---

## ✅ デプロイ後の動作確認

### AIが自動実行すべき確認コマンド

```bash
# 1. ヘルスチェック
curl https://no-smoke-walk-api.no-smoke-walk.workers.dev/api/health

# 期待される結果:
# {"status":"ok","timestamp":"2025-XX-XX...","environment":"production"}

# 2. フロントエンドアクセス確認
curl -I https://no-smoke-alert.com

# 期待される結果:
# HTTP/2 200

# 3. API疎通確認（ヒートマップデータ）
curl "https://no-smoke-walk-api.no-smoke-walk.workers.dev/api/heatmap?days=1"

# 期待される結果:
# {"type":"FeatureCollection","features":[...],"metadata":{...}}
```

### ユーザーへの確認依頼メッセージ

```markdown
🎉 デプロイが完了しました！

以下のURLで動作確認をお願いします：
- 📱 メインサイト: https://no-smoke-alert.com
- 🗺️ ヒートマップ: https://no-smoke-alert.com/heatmap
- 📝 API: https://no-smoke-walk-api.no-smoke-walk.workers.dev/api/health

問題がないか確認してください。
```

---

## 🔄 ロールバック手順（問題発生時）

### 前のバージョンに戻す

```bash
# Gitで前のコミットに戻す
git log --oneline -5  # 最近の5コミットを表示
git checkout [前のコミットハッシュ]

# フロントエンド再デプロイ
cd frontend
npm run build
cd out && npx wrangler pages deploy . --project-name=no-smoke-walk

# バックエンド再デプロイ
cd ../../backend
npx wrangler deploy --env production

# mainブランチに戻す
git checkout main
```

---

## 📝 AI実行ルール

### 開発作業完了時の自動実行フロー

1. **コミット作成**
   - 実装内容を適切なコミットメッセージで記録
   - Conventional Commits形式を使用

2. **プッシュ実行**
   - `git push origin main` を自動実行

3. **確認メッセージ**
   ```
   デプロイを開始しました！
   GitHub Actionsが自動的にビルド・デプロイを行います。
   進行状況: https://github.com/[ユーザー名]/No-Smoke-Walk/actions
   ```

4. **動作確認**
   - 3分後にヘルスチェックAPIを実行
   - 結果をユーザーに報告

### 判断基準

以下のケースではデプロイを実行：
- ✅ 機能追加・修正が完了
- ✅ バグ修正が完了
- ✅ ドキュメント更新（重要な変更のみ）

以下のケースではデプロイをスキップ：
- ❌ 開発途中の作業
- ❌ テスト実装のみ
- ❌ ローカルファイルの変更のみ

### エラー時の対応

```bash
# エラーが発生した場合の報告テンプレート
echo "⚠️ デプロイ中にエラーが発生しました"
echo "エラー内容: [具体的なエラーメッセージ]"
echo ""
echo "対処法:"
echo "1. エラーメッセージを確認してください"
echo "2. 必要に応じて修正を行います"
echo "3. 再度デプロイを試みます"
```

---

## 🏷️ デプロイタグ管理

### バージョンタグの作成（重要なリリース時）

```bash
# セマンティックバージョニング
# v[メジャー].[マイナー].[パッチ]

# タグ作成
git tag -a v1.0.0 -m "初回リリース"

# タグをプッシュ
git push origin v1.0.0

# タグ一覧確認
git tag -l
```

---

## 📊 デプロイ履歴の記録

### デプロイ実行後、以下をprogress_log.txtに記録

```
=== デプロイ実行 ===
日時: YYYY-MM-DD HH:MM:SS
環境: Production
フロントエンド: https://no-smoke-alert.com
バックエンド: https://no-smoke-walk-api.no-smoke-walk.workers.dev
コミット: [コミットハッシュ]
実行者: AI (鈴垣 美影)
結果: 成功/失敗
備考: [特記事項があれば]
====================
```

---

## 🚦 ステータスコードの意味

| ステータス | 意味 | 対処法 |
|-----------|------|--------|
| 200 | 成功 | - |
| 400 | リクエスト不正 | パラメータ確認 |
| 401 | 認証失敗 | トークン確認 |
| 403 | アクセス拒否 | 権限確認 |
| 404 | リソースなし | URL確認 |
| 429 | レート制限 | 時間をおいて再試行 |
| 500 | サーバーエラー | ログ確認 |
| 522 | タイムアウト | Cloudflare設定確認 |

---

## 🔧 トラブルシューティング

### よくある問題と解決策

#### 1. ビルドが失敗する
```bash
# キャッシュクリア
rm -rf .next node_modules package-lock.json
npm install
npm run build
```

#### 2. Wranglerデプロイが失敗
```bash
# Wrangler再ログイン
npx wrangler login
npx wrangler whoami
```

#### 3. 環境変数が反映されない
```bash
# シークレットの再設定
npx wrangler secret list --env production
npx wrangler secret put [SECRET_NAME] --env production
```

---

## 📚 関連ドキュメント

- [アーキテクチャドキュメント](./ARCHITECTURE.md)
- [API仕様書](./API_SPECIFICATION.md)
- [トラブルシューティングガイド](./TROUBLESHOOTING.md)
- [GitHub Actions設定](./GITHUB_ACTIONS_SETUP_HANDOVER.md)

---

## 🎯 クイックデプロイコマンド（コピペ用）

```bash
# 全自動デプロイ（推奨）
git add . && git commit -m "feat: update implementation" && git push origin main

# 手動フロントエンドデプロイ
cd frontend && npm run build && cd out && npx wrangler pages deploy . --project-name=no-smoke-walk

# 手動バックエンドデプロイ
cd backend && npx wrangler deploy --env production

# ヘルスチェック
curl https://no-smoke-walk-api.no-smoke-walk.workers.dev/api/health
```

---

**最終更新:** 2025年11月9日  
**ドキュメントバージョン:** 1.0

**重要:** このドキュメントは開発AIが自動的に参照・実行するためのものです。
常に最新の状態に保つよう心がけてください。
