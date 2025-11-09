# Claude Code MCP サーバー設定完全ガイド

## 📋 基本概念

### MCP (Model Context Protocol) とは
- Claude が外部ツールやサービスと連携するためのプロトコル
- リアルタイムでデータベース操作、ブラウザ自動化、ファイル変換などが可能
- コマンドラインから簡単に追加・管理可能

## 🎯 設定スコープの理解

### 3つのスコープ
| スコープ | 保存場所 | 用途 |
|---------|----------|------|
| `local` | `~/.claude.json` | 現在のプロジェクトでのみ使用 |
| `project` | `.mcp.json` (プロジェクトルート) | プロジェクト共有・チーム開発 |
| `user` | `~/.claude.json` | 全プロジェクトで使用 |

**推奨**: プロジェクト固有のツールは `project` スコープを使用

## 🔧 基本コマンド

### MCPサーバー追加
```bash
# 基本構文
claude mcp add <サーバー名> -s <スコープ> -- <実行コマンド>

# 例: Playwright（プロジェクトスコープ）
claude mcp add playwright -s project -- npx -y @playwright/mcp@latest

# 例: Supabase（プロジェクトスコープ）
claude mcp add supabase -s project -- npx -y @supabase/mcp-server-supabase@latest --access-token YOUR_TOKEN
```

### MCPサーバー管理
```bash
# インストール済みサーバー確認
claude mcp list

# サーバー削除
claude mcp remove <サーバー名>

# 設定詳細確認
cat .mcp.json  # プロジェクトスコープの場合
```

## 📚 推奨MCPサーバー（開発・デバッグ用）

### 1. Playwright（ブラウザ自動化）
```bash
claude mcp add playwright -s project -- npx -y @playwright/mcp@latest
```
**用途**: Webアプリテスト、スクリーンショット、UI操作自動化

### 2. Supabase（データベース操作）
```bash
claude mcp add supabase -s project -- npx -y @supabase/mcp-server-supabase@latest --access-token YOUR_TOKEN
```
**用途**: データベース作成・操作、スキーマ管理、リアルタイムデータ確認

### 3. Markitdown（ファイル変換）
```bash
claude mcp add markitdown -s project -- python -m markitdown_mcp
```
**用途**: PDF・PowerPoint→Markdown変換、ドキュメント処理

### 4. ArXiv（論文検索）
```bash
claude mcp add arxiv -s project -- python -m arxiv_mcp
```
**用途**: 技術論文検索・要約、最新研究動向調査

### 5. YouTube（動画分析）
```bash
claude mcp add youtube -s project -- python -m youtube_mcp
```
**用途**: 動画コンテンツ分析、字幕抽出、メタデータ取得

## 🎯 No-Smoke Walk プロジェクト推奨設定

### 最小構成（必須）
```bash
# ブラウザテスト用
claude mcp add playwright -s project -- npx -y @playwright/mcp@latest

# データベース操作用
claude mcp add supabase -s project -- npx -y @supabase/mcp-server-supabase@latest --access-token YOUR_SUPABASE_TOKEN
```

### 完全構成（開発効率向上）
```bash
# 基本ツール
claude mcp add playwright -s project -- npx -y @playwright/mcp@latest
claude mcp add supabase -s project -- npx -y @supabase/mcp-server-supabase@latest --access-token YOUR_SUPABASE_TOKEN

# 開発支援ツール
claude mcp add markitdown -s project -- python -m markitdown_mcp
claude mcp add context7 -s project -- npx -y @context7/mcp@latest

# 検索・情報収集
claude mcp add arxiv -s project -- python -m arxiv_mcp
claude mcp add gemini-search -s project -- python -m gemini_search_mcp --api-key YOUR_GEMINI_KEY
```

## 🔍 設定確認・動作テスト

### 1. インストール確認
```bash
# コマンドライン確認
claude mcp list

# Claude Code内確認
# 1. Claude Code起動
# 2. `/mcp` と入力
# 3. 利用可能なサーバー一覧表示確認
```

### 2. 動作テスト例

#### Playwright テスト
```
「Playwrightを使って現在のNo-Smoke Walkアプリのスクリーンショットを撮影してください」
```

#### Supabase テスト
```
「Supabaseでno-smoke-walk-osakaプロジェクトを作成してください」
```

#### 統合テスト
```
「Supabaseでデータベースを作成し、Playwrightでフロントエンドの動作を確認してください」
```

## 🚨 トラブルシューティング

### よくある問題と解決方法

#### 1. MCPサーバーが認識されない
```bash
# 問題: `/mcp` で表示されない
# 解決:
claude mcp list  # インストール確認
cat .mcp.json    # 設定ファイル確認
# Claude Code再起動
```

#### 2. 権限エラー
```bash
# 問題: "Permission denied"
# 解決:
chmod +x .mcp.json  # ファイル権限確認
npm config get prefix  # npm権限確認
```

#### 3. トークン認証エラー
```bash
# 問題: "Invalid token"
# 解決:
# - アクセストークンの有効期限確認
# - 権限スコープ確認
# - トークン再生成・設定更新
```

#### 4. 依存関係エラー
```bash
# 問題: "Module not found"
# 解決:
npm install -g @playwright/mcp  # グローバルインストール
python -m pip install markitdown-mcp  # Python依存関係
```

## 📊 設定ファイル例

### .mcp.json（プロジェクトスコープ）
```json
{
  "mcpServers": {
    "playwright": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@playwright/mcp@latest"],
      "env": {}
    },
    "supabase": {
      "type": "stdio",
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--access-token",
        "YOUR_SUPABASE_TOKEN"
      ],
      "env": {}
    }
  }
}
```

### ~/.claude.json（ユーザースコープ）
```json
{
  "mcpServers": {
    "markitdown": {
      "type": "stdio",
      "command": "python",
      "args": ["-m", "markitdown_mcp"],
      "env": {}
    },
    "arxiv": {
      "type": "stdio", 
      "command": "python",
      "args": ["-m", "arxiv_mcp"],
      "env": {}
    }
  }
}
```

## 🎯 ベストプラクティス

### 1. スコープ選択
- **プロジェクト固有**: `project` スコープ
- **汎用ツール**: `user` スコープ
- **テスト用**: `local` スコープ

### 2. セキュリティ
- トークンは環境変数で管理
- .mcp.json をGitignoreに追加
- 定期的なトークンローテーション

### 3. チーム開発
- .mcp.json をバージョン管理
- トークンは各自で設定
- 共通MCPサーバーセットの標準化

### 4. パフォーマンス
- 必要最小限のサーバーのみインストール
- 未使用サーバーの定期削除
- 重い処理は非同期実行

## 🚀 応用活用例

### 開発ワークフロー自動化
```
1. Supabaseでスキーマ更新
2. TypeScript型定義自動生成
3. Playwrightで自動テスト実行
4. スクリーンショット比較
5. 結果をMarkdownでレポート生成
```

### 品質管理フロー
```
1. ArXivで最新技術動向調査
2. 実装方針のドキュメント化
3. Context7で最新ライブラリ仕様確認
4. コード実装・テスト
5. 結果の自動レポート生成
```

---

## 📞 リファレンス

**記事元**: https://zenn.dev/karaage0703/articles/3bd2957807f311  
**作成日**: 2025-06-29  
**Claude Code バージョン**: 最新版対応

**重要コマンド一覧**:
```bash
claude mcp add <name> -s <scope> -- <command>
claude mcp list
claude mcp remove <name>
```

**設定確認方法**:
- Claude Code内: `/mcp`
- ファイル確認: `cat .mcp.json` または `cat ~/.claude.json`