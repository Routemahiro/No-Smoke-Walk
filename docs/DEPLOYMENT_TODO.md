# 🚀 No-Smoke Walk Osaka 本番デプロイ TODO リスト

**開始日**: 2025年7月10日  
**デプロイ方式**: 段階的アプローチ（Phase A）  
**目標完了日**: 2025年7月12日

---

## 📅 **Phase 1: Cloudflareアカウント準備**（想定時間: 15分）

### **あなたの作業**
- [x] **1.1** Cloudflareアカウント作成
  - URL: https://dash.cloudflare.com/sign-up
  - 登録に使用するメール: mint.jam0219@gmail.com
  - 完了時刻: 2025-07-10

- [x] **1.2** Wrangler CLI インストール
  ```bash
  npm install -g wrangler
  ```
  - 完了時刻: 2025-07-10

- [x] **1.3** Cloudflareログイン
  ```bash
  wrangler login
  ```
  - 完了時刻: 2025-07-10

- [x] **1.4** アカウント情報確認
  ```bash
  wrangler whoami
  ```
  - Account ID: 50009f3eace16f98718b71ee90434cf2
  - 完了時刻: 2025-07-10

### **Phase 1 完了確認**
- [x] Cloudflareアカウントが作成済み
- [x] Wrangler CLIが正常にインストール済み
- [x] `wrangler whoami`でアカウント情報表示
- [x] **Phase 1 完了日時**: 2025-07-10

---

## 🔐 **Phase 2: GitHub Secrets設定**（想定時間: 10分）

### **あなたの作業**
- [x] **2.1** Cloudflare API Token取得
  - Cloudflareダッシュボード → My Profile → API Tokens
  - "Edit Cloudflare Workers" テンプレート使用
  - 権限: Workers/Pages関連の全権限（テンプレート設定）
  - API Token: ✅取得済み
  - 完了時刻: 2025-07-10

- [x] **2.2** GitHub Secretsに以下を設定
  - Repository → Settings → Secrets and variables → Actions
  
  | Secret名 | 値 | 設定完了 |
  |----------|-----|----------|
  | `CLOUDFLARE_API_TOKEN` | 取得したToken | [x] |
  | `CLOUDFLARE_ACCOUNT_ID` | 50009f3eace16f98718b71ee90434cf2 | [x] |
  | `SUPABASE_URL` | `https://qdqcocgoaxzbhvvmvttr.supabase.co` | [x] |
  | `SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | [x] |
  | `EXPORT_SECRET_KEY` | `b04fcc570ffebafe5ff349fe922046209259...` | [x] |

- [x] **2.3** GitHub Secrets設定確認
  - Actions secrets一覧で5つのSecretが表示されることを確認
  - 完了時刻: 2025-07-10

### **Phase 2 完了確認**
- [x] Cloudflare API Tokenが正常に取得済み
- [x] GitHub Secretsに5つの環境変数が設定済み
- [x] **Phase 2 完了日時**: 2025-07-10

---

## 🔧 **Phase 3: バックエンドWorkers化**（想定時間: 30分）

### **私（Claude）の作業**
- [ ] **3.1** `backend/wrangler.toml` 設定ファイル作成
  - Node.js互換性フラグ設定
  - 本番・ステージング環境設定
  - 完了時刻: _______________

- [ ] **3.2** `simple-server.js` → Workers形式変換
  - `backend/src/index.js` 作成
  - Fetch API形式に変換
  - CORS設定追加
  - 完了時刻: _______________

- [ ] **3.3** Supabase接続ユーティリティ更新
  - `backend/src/utils/supabase.js` Workers対応
  - 環境変数からの設定読み込み
  - 完了時刻: _______________

- [ ] **3.4** `package.json` 依存関係更新
  - Workers必要パッケージ追加
  - デプロイスクリプト追加
  - 完了時刻: _______________

### **あなたの作業**
- [ ] **3.5** 依存関係インストール
  ```bash
  cd backend
  npm install
  ```
  - 完了時刻: _______________

- [ ] **3.6** ローカルテスト
  ```bash
  wrangler dev
  ```
  - ローカルでAPIが起動することを確認
  - http://localhost:8787/api/health でレスポンス確認
  - 完了時刻: _______________

- [x] **3.7** 本番環境への初回デプロイ
  ```bash
  wrangler deploy --env production
  ```
  - デプロイURL: https://no-smoke-walk-api.no-smoke-walk.workers.dev
  - 完了時刻: 2025-07-10

- [x] **3.8** 本番API動作確認
  ```bash
  curl https://no-smoke-walk-api.no-smoke-walk.workers.dev/api/health
  ```
  - レスポンス確認: SSL設定完了待ち（数分後に利用可能）
  - 完了時刻: 2025-07-10

### **Phase 3 完了確認**
- [ ] Workers形式へのコード変換完了
- [ ] ローカル環境でWorkers正常動作
- [ ] 本番環境にWorkers正常デプロイ
- [ ] 本番APIエンドポイントが正常レスポンス
- [ ] **Phase 3 完了日時**: _______________

---

## 🎨 **Phase 4: フロントエンドPages化**（想定時間: 20分）

### **私（Claude）の作業**
- [ ] **4.1** `frontend/next.config.js` Cloudflare対応
  - Static export設定
  - API proxy設定
  - 完了時刻: _______________

- [ ] **4.2** Pages Functions ミドルウェア作成
  - `frontend/functions/_middleware.js` 作成
  - API要求のWorkers転送設定
  - 完了時刻: _______________

- [ ] **4.3** 環境変数設定更新
  - 本番API URLに変更
  - `.env.example` 更新
  - 完了時刻: _______________

### **あなたの作業**
- [ ] **4.4** フロントエンド依存関係更新
  ```bash
  cd frontend
  npm install @opennextjs/cloudflare
  ```
  - 完了時刻: _______________

- [ ] **4.5** 本番ビルドテスト
  ```bash
  npm run build
  ```
  - ビルドエラーがないことを確認
  - 完了時刻: _______________

- [ ] **4.6** Pages プロジェクト作成
  ```bash
  wrangler pages project create no-smoke-walk
  ```
  - プロジェクト名: _______________
  - 完了時刻: _______________

- [ ] **4.7** 初回Pagesデプロイ
  ```bash
  wrangler pages deploy frontend/out --project-name=no-smoke-walk
  ```
  - Pages URL: _______________
  - 完了時刻: _______________

- [ ] **4.8** Pages環境変数設定
  - Cloudflareダッシュボード → Pages → no-smoke-walk → Settings → Environment variables
  
  | 変数名 | 値 | 設定完了 |
  |-------|-----|----------|
  | `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL | [ ] |
  | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon Key | [ ] |
  | `NEXT_PUBLIC_API_BASE_URL` | Workers URL | [ ] |

### **Phase 4 完了確認**
- [ ] Next.js Cloudflare Pages対応完了
- [ ] 本番ビルドが正常動作
- [ ] Pagesプロジェクト作成・デプロイ完了
- [ ] Pages環境変数設定完了
- [ ] **Phase 4 完了日時**: _______________

---

## 🤖 **Phase 5: GitHub Actions自動デプロイ**（想定時間: 15分）

### **私（Claude）の作業**
- [ ] **5.1** GitHub Actions ワークフロー作成
  - `.github/workflows/deploy.yml` 作成
  - Workers・Pages 自動デプロイ設定
  - ステージング・本番環境分離
  - 完了時刻: _______________

- [ ] **5.2** ヘルスチェック ワークフロー作成
  - `.github/workflows/health-check.yml` 作成
  - 5分ごとの自動監視設定
  - 完了時刻: _______________

### **あなたの作業**
- [ ] **5.3** GitHub Actions動作確認
  - 新しいcommitをpushして自動デプロイ確認
  - Actions タブでワークフロー実行状況確認
  - 完了時刻: _______________

- [ ] **5.4** 自動デプロイテスト
  - 軽微な変更（コメント追加など）をcommit
  - 自動デプロイが正常動作することを確認
  - 完了時刻: _______________

### **Phase 5 完了確認**
- [ ] GitHub Actionsワークフロー設定完了
- [ ] 自動デプロイが正常動作
- [ ] ヘルスチェック監視が動作
- [ ] **Phase 5 完了日時**: _______________

---

## 🎯 **Phase 6: 最終動作確認**（想定時間: 10分）

### **あなたの作業**
- [ ] **6.1** フロントエンド動作確認
  - Pages URL にアクセス
  - 位置情報取得テスト
  - 報告投稿テスト
  - ヒートマップ表示テスト
  - 完了時刻: _______________

- [ ] **6.2** CSVエクスポート動作確認
  ```bash
  curl "https://your-worker.workers.dev/api/export/csv?secret=your_secret" | head -5
  ```
  - CSVデータ正常取得確認
  - 完了時刻: _______________

- [ ] **6.3** 管理者機能確認
  - 管理者ログインテスト
  - 統計データ表示確認
  - 完了時刻: _______________

### **Phase 6 完了確認**
- [ ] 全フロントエンド機能が正常動作
- [ ] CSVエクスポート機能が正常動作
- [ ] 管理者機能が正常動作
- [ ] **Phase 6 完了日時**: _______________

---

## 🎉 **最終チェックリスト**

### **技術的確認**
- [ ] フロントエンド（Pages）が正常動作
- [ ] バックエンド（Workers）が正常動作
- [ ] データベース（Supabase）連携が正常動作
- [ ] CSVエクスポート機能が正常動作
- [ ] 自動デプロイ（GitHub Actions）が正常動作
- [ ] 監視・ヘルスチェックが正常動作

### **運用確認**
- [ ] カスタムドメイン設定（必要に応じて）
- [ ] SSL証明書が正常適用
- [ ] パフォーマンステスト実施
- [ ] セキュリティチェック実施

### **ドキュメント確認**
- [ ] 運用手順書更新
- [ ] README.md更新
- [ ] 緊急時対応手順確認

---

## 📊 **実績記録**

| Phase | 予定時間 | 実際時間 | 完了日時 | 備考 |
|-------|----------|----------|----------|------|
| Phase 1 | 15分 | ___分 | _______ | _____ |
| Phase 2 | 10分 | ___分 | _______ | _____ |
| Phase 3 | 30分 | ___分 | _______ | _____ |
| Phase 4 | 20分 | ___分 | _______ | _____ |
| Phase 5 | 15分 | ___分 | _______ | _____ |
| Phase 6 | 10分 | ___分 | _______ | _____ |
| **合計** | **100分** | **___分** | _______ | _____ |

---

## 🆘 **問題発生時の連絡先・手順**

### **よくある問題と解決方法**
1. **Wrangler login エラー** → ブラウザでCloudflareログイン確認
2. **GitHub Actions失敗** → Secrets設定確認
3. **API接続エラー** → CORS設定確認
4. **Pages ビルドエラー** → Next.js設定確認

### **緊急時連絡**
- **Claude**: このチャットで質問・相談
- **Cloudflare**: サポートドキュメント確認
- **GitHub**: Actions ログ確認

---

**🚀 頑張って本番環境を構築しましょう！**