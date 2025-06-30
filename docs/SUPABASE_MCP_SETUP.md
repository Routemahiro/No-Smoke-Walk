# Supabase MCP サーバー設定手順書

## 📋 概要

Supabase MCPサーバーを使用して、Claude CodeからSupabaseプロジェクトを直接管理できるようにします。

**参考記事**: https://dev.classmethod.jp/articles/supabase-mcp-yattaze/

## 🎯 利用可能な機能

### ✅ プロジェクト管理
- プロジェクト一覧取得・作成
- プロジェクトの一時停止・再開
- プロジェクト設定確認

### ✅ データベース操作
- テーブル作成・管理
- SQL クエリ実行
- TypeScript型定義生成

### ✅ 設定取得
- API URL取得
- 接続キー取得
- プロジェクト情報確認

## 🔧 設定手順

### Step 1: Supabase Personal Access Token 取得

#### 1.1 Supabase ダッシュボードにアクセス
```
1. https://supabase.com/dashboard にアクセス
2. ログイン（GitHubアカウント推奨）
3. 右上のアバター → Account Settings
```

#### 1.2 Personal Access Token 生成
```
1. Settings → Access Tokens
2. "Generate new token" をクリック
3. Token名: "Claude-Code-MCP" (任意の名前)
4. Expiration: 選択（推奨: 90日または無期限）
5. Scope: 必要な権限を選択
   - ✅ All projects access
   - ✅ Read/Write permissions
6. "Generate token" をクリック
7. ⚠️ トークンをコピー・安全に保存（一度だけ表示）
```

### Step 2: Claude Code MCP クライアント設定

#### 2.1 MCP設定ファイル更新
```bash
# ホームディレクトリの .claude.json を編集
nano ~/.claude.json
```

#### 2.2 Supabase MCP サーバー追加
```json
{
  "mcpServers": {
    "playwright": {
      "type": "stdio",
      "command": "npx",
      "args": ["@playwright/mcp@latest", "--config", "./playwright-config.json"],
      "env": {}
    },
    "supabase": {
      "type": "stdio",
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--access-token",
        "YOUR_PERSONAL_ACCESS_TOKEN_HERE"
      ],
      "env": {}
    }
  }
}
```

**⚠️ 重要**: `YOUR_PERSONAL_ACCESS_TOKEN_HERE` を実際のトークンに置き換える

#### 2.3 Claude Code 再起動
```bash
# Claude Code を完全に終了
# アプリケーションを再起動
# MCP接続が確立されるまで数秒待機
```

### Step 3: 接続確認・テスト

#### 3.1 基本接続確認
Claude Code で以下のコマンドが使用可能になります：

```
# プロジェクト一覧取得
supabase:list_projects

# 新規プロジェクト作成
supabase:create_project

# プロジェクト詳細取得
supabase:get_project

# データベース操作
supabase:execute_sql
```

#### 3.2 No-Smoke Walk プロジェクト作成
```bash
# Claude Code で以下のようにリクエスト可能
"Supabaseに新しいプロジェクトを作成してください"
"プロジェクト名: no-smoke-walk-osaka"
"リージョン: ap-northeast-1 (東京)"
"データベースパスワード: 安全なパスワードを生成"
```

### Step 4: プロジェクト設定取得

#### 4.1 接続情報取得
MCPサーバー経由で以下の情報を自動取得：
```
- Project URL: https://your-project-id.supabase.co
- anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
- service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 4.2 環境変数自動設定
MCPサーバーで取得した情報を直接環境変数ファイルに設定可能

## 🎯 No-Smoke Walk での活用

### 1. データベーススキーマ適用
```sql
-- MCPサーバー経由でSQL実行
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE TYPE report_category AS ENUM ('walk_smoke', 'stand_smoke', 'litter');
-- 以下、スキーマ作成
```

### 2. テストデータ投入
```sql
-- サンプルデータをMCP経由で投入
INSERT INTO reports (lat, lon, prefecture, city, category, ...) 
VALUES (...);
```

### 3. TypeScript型定義生成
```bash
# データベーススキーマから型定義を自動生成
# frontend/src/types/supabase.ts に出力
```

### 4. リアルタイム監視
```bash
# データベースの変更をリアルタイムで監視
# 新しい報告が投稿されたら通知
```

## 🔒 セキュリティ考慮事項

### ✅ Personal Access Token 管理
```bash
# 環境変数として管理（推奨）
export SUPABASE_ACCESS_TOKEN="your-token-here"

# .claude.json では環境変数参照
"--access-token",
"$SUPABASE_ACCESS_TOKEN"
```

### ✅ 権限制限
- 必要最小限の権限のみ付与
- トークンの定期的なローテーション
- プロジェクト別アクセス制御

### ❌ 注意事項
- .claude.json をGitにコミットしない
- トークンをログに出力しない
- チーム共有時の設定方法統一

## 🚀 高度な機能

### 1. ブランチング（有料プランのみ）
```bash
# データベースブランチの作成・管理
# 開発・ステージング・本番環境の分離
```

### 2. Edge Functions（今後対応予定）
```bash
# サーバーレス関数のデプロイ・管理
# API エンドポイントの直接管理
```

### 3. 認証設定（今後対応予定）
```bash
# 認証プロバイダーの設定
# ユーザー管理・ロール設定
```

## 🔧 トラブルシューティング

### よくある問題と解決方法

#### 1. トークン認証エラー
```bash
# エラー: "Invalid access token"
# 解決: 
# - トークンの有効期限確認
# - 権限設定の確認
# - トークンの再生成
```

#### 2. MCP接続エラー
```bash
# エラー: "Failed to connect to MCP server"
# 解決:
# - .claude.json の構文確認
# - Claude Code の再起動
# - ネットワーク接続確認
```

#### 3. プロジェクト作成エラー
```bash
# エラー: "Project creation failed"
# 解決:
# - 課金設定の確認
# - プロジェクト名の重複確認
# - リージョン設定の確認
```

## 📊 設定完了チェックリスト

### ✅ 必須確認項目
- [ ] Supabase アカウント作成・ログイン完了
- [ ] Personal Access Token 生成・保存完了
- [ ] .claude.json にMCPサーバー設定追加
- [ ] Claude Code 再起動・MCP接続確認
- [ ] supabase: コマンド動作確認

### 🎯 プロジェクト準備確認
- [ ] no-smoke-walk-osaka プロジェクト作成
- [ ] データベース接続情報取得
- [ ] 環境変数ファイル更新
- [ ] スキーマ適用・テストデータ投入
- [ ] TypeScript型定義生成

---

## 📞 サポート情報

**作成日**: 2025-06-29  
**対象バージョン**: @supabase/mcp-server-supabase@latest  
**推定設定時間**: 15-30分  

**重要リンク**:
- [Supabase Dashboard](https://supabase.com/dashboard)
- [Personal Access Tokens](https://supabase.com/dashboard/account/tokens)
- [Supabase MCP Documentation](https://github.com/supabase/mcp-server-supabase)

**注意事項**:
- Personal Access Token は機密情報として厳重管理
- 無料プランでは一部機能制限あり
- MCP設定後は必ずClaude Code再起動