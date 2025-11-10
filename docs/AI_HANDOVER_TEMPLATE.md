# 🤖 AI引き継ぎファイル - No-Smoke Walk Osaka

## 📌 このファイルの使い方

### 1️⃣ セッション終了時（コンテキストが埋まってきたら）
1. このテンプレートをコピー
2. `docs/sessions/SESSION_HANDOVER_YYYYMMDD_PARTX.md` として保存
3. 必要な情報を記入

### 2️⃣ 新しいAIチャット開始時
以下の2つのファイルを新しいチャットに渡してください：
```
1. やりたいことを記載したメッセージ
2. docs/sessions/内の最新のSESSION_HANDOVER_*.md ファイル
```

これだけで前回の続きから作業を再開できます！

### 📁 セッションファイルの保存場所
```
docs/
├── sessions/                    # 🔴 ここに保存！
│   ├── SESSION_HANDOVER_20251109_PART1.md
│   ├── SESSION_HANDOVER_20251109_PART2.md
│   └── SESSION_HANDOVER_20251110_PART1.md
└── AI_HANDOVER_TEMPLATE.md     # このテンプレート
```

---

# SESSION_HANDOVER_[日付]_PART[番号].md

## 🎯 プロジェクト概要

**プロジェクト名:** No-Smoke Walk Osaka  
**概要:** 大阪市の歩きタバコ・ポイ捨て報告システム  
**本番URL:** https://no-smoke-alert.com  
**GitHub:** [リポジトリURL]

## 🤖 AIアシスタント設定

あなたは「鈴垣 美影」という16歳の少女として振る舞います。
- 一人称は「オレ」
- 日本語で回答
- Windows PowerShell環境を前提
- 開発作業は[ユーザールール](../CLAUDE.md)に従う

## 📊 現在のステータス

### システム稼働状況
- [ ] フロントエンド: 正常稼働中 / ⚠️ 問題あり
- [ ] バックエンドAPI: 正常稼働中 / ⚠️ 問題あり  
- [ ] データベース: 正常稼働中 / ⚠️ 問題あり

### 現在のブランチ
```
main / feature/[ブランチ名]
```

## 🔄 前回の作業内容

### 実施した作業（詳細）

1. **[作業項目1]**
   - 具体的な変更内容
   - 影響範囲
   - コード例：
   ```typescript
   // 変更箇所のコード
   ```

2. **[作業項目2]**
   - 具体的な変更内容
   - 影響範囲

### Gitコミット履歴
```bash
# 最新5件のコミット
[hash] feat: 機能追加の説明
[hash] fix: バグ修正の説明
[hash] docs: ドキュメント更新
[hash] refactor: リファクタリング
[hash] chore: その他の作業
```

### 変更したファイル一覧
```
modified:   frontend/src/components/ReportForm.tsx
modified:   backend/src/handlers/reports.ts
added:      docs/NEW_DOCUMENT.md
deleted:    temp/unnecessary-file.js
```

## ⏰ 現在進行中のタスク

### TODO進捗（TODO.mdより）

**進行中:**
- [ ] [タスク名] - 進捗50%
  - 完了: [完了した部分]
  - 残作業: [残っている作業]

**未着手（優先度順）:**
1. [ ] [高優先度タスク]
2. [ ] [中優先度タスク]
3. [ ] [低優先度タスク]

## 🚨 要対応事項

### 緊急度: 高
- **[問題1]**
  - 症状: [具体的な症状]
  - 影響: [影響範囲]
  - 対処案: [提案する解決策]

### 緊急度: 中
- **[問題2]**
  - 症状: [具体的な症状]
  - 対処案: [提案する解決策]

### 緊急度: 低
- **[改善項目]**
  - 内容: [改善内容]

## 💡 次回やるべきこと（具体的に）

### 1. 最優先作業
```bash
# 実行すべきコマンド例
cd frontend
npm run dev
```

**作業内容:**
- [ ] 具体的なステップ1
- [ ] 具体的なステップ2
- [ ] 具体的なステップ3

**該当コード箇所:**
```typescript:frontend/src/components/Example.tsx
// 修正が必要な箇所
export function Example() {
  // TODO: ここを修正
  return <div>...</div>;
}
```

### 2. 次の作業
**作業内容:**
- [ ] 作業項目

### 3. その後の作業
**作業内容:**
- [ ] 作業項目

## 📝 実装方針案（3パターン）

### 案1: 控えめな実装
**内容:** [簡潔な説明]
**メリット:** [利点]
**デメリット:** [欠点]
**工数:** [時間]

### 案2: バランス型実装 ★おすすめ
**内容:** [詳細な説明]
**メリット:** [利点]
**デメリット:** [欠点]
**工数:** [時間]

### 案3: 積極的な実装
**内容:** [詳細な説明]
**メリット:** [利点]
**デメリット:** [欠点]
**工数:** [時間]

## ❓ ユーザーへの確認事項

1. **[確認事項1]**
   - 質問: [具体的な質問]
   - 選択肢:
     - A: [選択肢A]
     - B: [選択肢B]

2. **[確認事項2]**
   - 質問: [具体的な質問]

## 🔧 技術的な詳細

### 環境変数の状態
```bash
# Frontend
NEXT_PUBLIC_API_BASE_URL=https://no-smoke-walk-api.no-smoke-walk.workers.dev
NEXT_PUBLIC_SUPABASE_URL=[設定済み]
NEXT_PUBLIC_SUPABASE_ANON_KEY=[設定済み]

# Backend
SUPABASE_URL=[設定済み]
SUPABASE_ANON_KEY=[設定済み]
EXPORT_SECRET_KEY=[設定済み]
ENVIRONMENT=production
ABUSE_GUARD=true
```

### 依存関係の状態
```json
// 注意が必要なパッケージ
{
  "next": "15.3.4",  // 最新版
  "react": "^19.0.0", // React 19使用中
  "@supabase/supabase-js": "^2.50.0"
}
```

### 既知の問題と回避策

**問題1: [問題の名前]**
```bash
# エラーメッセージ
Error: ...

# 回避策
[回避コマンド]
```

## 📊 パフォーマンス指標

- ビルド時間: 約[X]秒
- バンドルサイズ: [X]MB
- Lighthouse Score: [X]/100
- 最大レスポンス時間: [X]ms

## 🚀 デプロイ情報

### 最後のデプロイ
- 日時: YYYY-MM-DD HH:MM
- 環境: Production
- 結果: 成功 / 失敗
- コミット: [hash]

### 次回デプロイ時の注意
- [ ] [注意事項1]
- [ ] [注意事項2]

## 📁 重要ファイルの場所

```
frontend/
  src/
    components/
      ReportForm.tsx     # 報告フォーム（主要機能）
      HeatmapView.tsx    # ヒートマップ表示
    hooks/
      useGeolocation.ts  # 位置情報取得
backend/
  src/
    handlers/
      reports.ts         # 報告API処理
      heatmap.ts         # ヒートマップAPI
docs/
  DEPLOYMENT_COMMANDS.md # デプロイ手順
  ARCHITECTURE.md        # システム構成
```

## 💬 ユーザーとの最終やり取り

```
ユーザー: [最後のリクエスト]
AI: [最後の回答の要約]
```

## 🎯 セッション開始時のアクション

1. **このファイルを読み込む**
2. **TODO.mdを確認**
   ```bash
   cat TODO.md
   ```
3. **現在のGit状態を確認**
   ```bash
   git status
   git log --oneline -5
   ```
4. **開発環境を起動（必要に応じて）**
   ```bash
   cd frontend && npx next dev --port 3003 > /dev/null 2>&1 &
   cd ../backend && node simple-server.js > /dev/null 2>&1 &
   ```
5. **ユーザーに状況を報告し、作業継続の確認を取る**

## 📌 特記事項

[その他、重要な情報や注意事項があれば記載]

---

**作成日時:** YYYY-MM-DD HH:MM  
**作成者:** AI (鈴垣 美影)  
**セッション番号:** PART[X]

---

## テンプレート使用例

### 良い引き継ぎ例:
```markdown
## 🔄 前回の作業内容

### 実施した作業（詳細）

1. **報告フォームのレート制限機能を実装**
   - useRateLimit フックを新規作成
   - localStorage で投稿履歴を管理
   - 10分間に5件の制限を実装
   - コード例：
   ```typescript:frontend/src/hooks/useRateLimit.ts
   export function useRateLimit() {
     const [isBlocked, setIsBlocked] = useState(false);
     // ... 実装
   }
   ```
   
2. **APIエンドポイントのエラーハンドリング改善**
   - try-catch の追加
   - エラーレスポンスの統一化
```

### 悪い引き継ぎ例:
```markdown
## 🔄 前回の作業内容

バグを修正した。
フロントエンドを更新した。
```

**ポイント:**
- 具体的に書く
- コード例を含める
- 次の人が迷わないレベルの詳細度
- 確認事項は明確に質問形式で

---

## 🔄 自動生成スクリプト

以下のコマンドで引き継ぎファイルの雛形を生成：

```powershell
# PowerShell
$date = Get-Date -Format "yyyyMMdd"
$part = 1  # パート番号を適宜変更
$filename = "docs/sessions/SESSION_HANDOVER_${date}_PART${part}.md"

# sessionsフォルダがなければ作成
New-Item -Path "docs/sessions" -ItemType Directory -Force | Out-Null

# テンプレートをコピー
Copy-Item "docs/AI_HANDOVER_TEMPLATE.md" $filename
Write-Host "✅ 引き継ぎファイルを作成しました: $filename"
Write-Host "📝 ファイルを編集して、作業内容を記入してください"
```

## 💡 新しいチャットでの使い方（詳細）

### 方法1: シンプルな開始（推奨）
新しいチャットで以下のように伝える：
```
以下のセッション引き継ぎファイルから作業を継続してください：
docs/sessions/SESSION_HANDOVER_20251110_PART1.md

今回やりたいこと：
- [具体的なタスク]
```

### 方法2: AI_HANDOVER_TEMPLATE.mdも一緒に渡す
```
引き継ぎテンプレート: docs/AI_HANDOVER_TEMPLATE.md
前回のセッション: docs/sessions/SESSION_HANDOVER_20251110_PART1.md

これらを参照して、[やりたいこと]を実行してください。
```

### 📌 重要なポイント
- **最新のセッションファイル**を使用すること
- ファイルパスは `docs/sessions/` から始まること
- やりたいことは**具体的に**記載すること
