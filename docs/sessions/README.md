# 📁 セッション引き継ぎファイル保管庫

## 🎯 このフォルダの用途

このフォルダは、AIチャットセッション間の引き継ぎファイルを保管する専用ディレクトリです。

## 📝 ファイル命名規則

```
SESSION_HANDOVER_YYYYMMDD_PARTX.md
```

- **YYYYMMDD**: 日付（例: 20251110）
- **PARTX**: その日の何回目のセッションか（例: PART1, PART2）

## 💡 使い方

### 1. セッション終了時
```powershell
# PowerShellで自動生成
$date = Get-Date -Format "yyyyMMdd"
$part = 1  # 適宜変更
$filename = "docs/sessions/SESSION_HANDOVER_${date}_PART${part}.md"
Copy-Item "docs/AI_HANDOVER_TEMPLATE.md" $filename
```

### 2. 新しいセッション開始時
新しいチャットで以下を伝える：
```
docs/sessions/SESSION_HANDOVER_20251110_PART1.md から作業を継続してください。

今回やりたいこと：
- [具体的なタスク]
```

## 📚 ファイルリスト

現在保存されているセッションファイル：

| ファイル名 | 作成日 | 内容 |
|-----------|--------|------|
| （ここにセッションファイルが保存されます） | - | - |

## 🔍 最新ファイルの確認方法

```powershell
# PowerShellで最新ファイルを確認
Get-ChildItem "docs/sessions" -Filter "SESSION_HANDOVER_*.md" | 
  Sort-Object Name -Descending | 
  Select-Object -First 1
```

## ⚠️ 注意事項

- 古いセッションファイルも履歴として残しておく
- 機密情報は含めない
- 定期的に不要なファイルを整理する

## 🔗 関連ドキュメント

- [AI引き継ぎテンプレート](../AI_HANDOVER_TEMPLATE.md)
- [開発ルール](../../CLAUDE.md)

---

**最終更新:** 2025年11月10日
