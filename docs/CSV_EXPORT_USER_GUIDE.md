# 📊 CSV出力機能 ユーザーガイド - No-Smoke Walk Osaka

## 🎯 このガイドについて

**このガイドは、No-Smoke Walk Osakaの報告データをCSV形式でダウンロードする方法を説明します。**
**行政担当者やデータ分析を行う方向けの、わかりやすい手順書です。**

---

## 📥 データダウンロードの基本

### 必要なもの

1. **シークレットキー**（管理者から提供されます）
2. **Webブラウザ** または **コマンドラインツール**
3. **Excel** または **Googleスプレッドシート**（データ閲覧用）

### ダウンロード用URL

```
https://no-smoke-walk-api.no-smoke-walk.workers.dev/api/export/csv?secret=あなたのシークレットキー
```

---

## 🚀 かんたん3ステップでダウンロード

### ステップ1: ブラウザでアクセス

以下のURLをコピーして、ブラウザのアドレスバーに貼り付けてください：

```
https://no-smoke-walk-api.no-smoke-walk.workers.dev/api/export/csv?secret=YOUR_SECRET_KEY
```

**YOUR_SECRET_KEY** の部分を、管理者から提供されたシークレットキーに置き換えてください。

### ステップ2: ファイルを保存

ブラウザが自動的にCSVファイルのダウンロードを開始します。
ファイル名は `reports_YYYYMMDD_HHMMSS.csv` の形式になります。

### ステップ3: Excelで開く

ダウンロードしたCSVファイルをダブルクリックすると、Excelで開きます。

---

## 🔍 フィルタリング機能

### 期間を指定してダウンロード

#### 過去30日間のデータ
```
https://no-smoke-walk-api.no-smoke-walk.workers.dev/api/export/csv?secret=YOUR_SECRET_KEY&days=30
```

#### 過去7日間のデータ（週次レポート用）
```
https://no-smoke-walk-api.no-smoke-walk.workers.dev/api/export/csv?secret=YOUR_SECRET_KEY&days=7
```

#### 特定の日付範囲
```
https://no-smoke-walk-api.no-smoke-walk.workers.dev/api/export/csv?secret=YOUR_SECRET_KEY&start_date=2025-01-01&end_date=2025-12-31
```

### カテゴリ別にダウンロード

#### 歩きタバコのみ
```
https://no-smoke-walk-api.no-smoke-walk.workers.dev/api/export/csv?secret=YOUR_SECRET_KEY&category=walk_smoke
```

#### 立ち止まり喫煙のみ
```
https://no-smoke-walk-api.no-smoke-walk.workers.dev/api/export/csv?secret=YOUR_SECRET_KEY&category=stand_smoke
```

### 地域を絞ってダウンロード

#### 大阪府のデータのみ
```
https://no-smoke-walk-api.no-smoke-walk.workers.dev/api/export/csv?secret=YOUR_SECRET_KEY&prefecture=大阪府
```

#### 大阪市のデータのみ
```
https://no-smoke-walk-api.no-smoke-walk.workers.dev/api/export/csv?secret=YOUR_SECRET_KEY&city=大阪市
```

### 複合条件（組み合わせ）

#### 過去30日間の大阪市の歩きタバコデータ
```
https://no-smoke-walk-api.no-smoke-walk.workers.dev/api/export/csv?secret=YOUR_SECRET_KEY&days=30&city=大阪市&category=walk_smoke
```

---

## 📋 CSVファイルの内容

### データ項目の説明

| 列名 | 説明 | 例 |
|------|------|-----|
| ID | 報告の固有ID | 550e8400-e29b-41d4... |
| 報告日時 | 報告された日時 | 2025/11/09 14:30:00 |
| 緯度 | 報告地点の緯度 | 34.6937 |
| 経度 | 報告地点の経度 | 135.5023 |
| 都道府県 | 都道府県名 | 大阪府 |
| 市区町村 | 市区町村名 | 大阪市 |
| 区 | 区名 | 中央区 |
| 地区 | 詳細地区名 | 難波 |
| カテゴリ | 報告の種類 | 歩きタバコ |
| 信頼度スコア | データの信頼度（1-10） | 8 |
| 検証済み | 管理者による検証状態 | false |

### カテゴリの意味

- **歩きタバコ**: 歩きながら喫煙している事例
- **立ち止まり喫煙**: 禁煙エリアで立ち止まって喫煙している事例

### 信頼度スコアの目安

- **8-10**: 非常に信頼できる報告
- **5-7**: 通常の報告
- **1-4**: 要確認の報告

---

## 💡 便利な使い方

### 定期レポート作成

#### 週次レポート（毎週月曜日に実行）
```
https://no-smoke-walk-api.no-smoke-walk.workers.dev/api/export/csv?secret=YOUR_SECRET_KEY&days=7
```

#### 月次レポート（月初に実行）
```
https://no-smoke-walk-api.no-smoke-walk.workers.dev/api/export/csv?secret=YOUR_SECRET_KEY&days=30
```

### Excel でのデータ分析

1. **ピボットテーブルの作成**
   - データ全体を選択
   - 「挿入」→「ピボットテーブル」
   - 行に「市区町村」、値に「カテゴリ」を配置

2. **グラフ作成**
   - ピボットテーブルを選択
   - 「挿入」→「グラフ」→「円グラフ」または「棒グラフ」

3. **日別集計**
   - 報告日時列を選択
   - 「データ」→「テキストを列に分割」で日付と時刻を分離
   - ピボットテーブルで日別集計

### Google スプレッドシートでの活用

1. **インポート方法**
   - Googleスプレッドシートを開く
   - 「ファイル」→「インポート」
   - CSVファイルをアップロード

2. **自動更新の設定**
   - `=IMPORTDATA("URL")` 関数を使用（要公開設定）

---

## 🔒 セキュリティについて

### シークレットキーの管理

⚠️ **重要な注意事項:**
- シークレットキーは**絶対に第三者に共有しない**でください
- メールやチャットでキーを送信しないでください
- ブラウザの履歴に残る可能性があるため、共用PCでは注意してください

### セキュアな利用方法

1. **個人PCでのみアクセス**
2. **ダウンロード後はブラウザ履歴をクリア**
3. **定期的にシークレットキーの変更を依頼**

---

## ❓ よくある質問

### Q1: ダウンロードできません
**A:** 以下を確認してください：
- シークレットキーが正しく入力されているか
- URLに余計なスペースが入っていないか
- インターネット接続が正常か

### Q2: 文字化けしています
**A:** ExcelでCSVを開く際の対処法：
1. Excelを起動
2. 「データ」→「テキストファイル」でCSVを選択
3. 文字コードを「UTF-8」に設定

### Q3: データが多すぎて開けません
**A:** 期間を絞ってダウンロードしてください：
```
&days=7  # 7日間のみ
&days=1  # 本日のみ
```

### Q4: リアルタイムデータは見れますか？
**A:** CSVは定期的な集計用です。リアルタイム表示は [ヒートマップページ](https://no-smoke-alert.com/heatmap) をご覧ください。

---

## 📞 サポート

### 技術的な問題

- **メール:** [サポートメールアドレス]
- **電話:** [サポート電話番号]
- **対応時間:** 平日 9:00-17:00

### よく使うURLリスト（コピー用）

```
# 全データ
https://no-smoke-walk-api.no-smoke-walk.workers.dev/api/export/csv?secret=YOUR_SECRET_KEY

# 過去7日間
https://no-smoke-walk-api.no-smoke-walk.workers.dev/api/export/csv?secret=YOUR_SECRET_KEY&days=7

# 過去30日間
https://no-smoke-walk-api.no-smoke-walk.workers.dev/api/export/csv?secret=YOUR_SECRET_KEY&days=30

# 今月のデータ（月初から今日まで）
https://no-smoke-walk-api.no-smoke-walk.workers.dev/api/export/csv?secret=YOUR_SECRET_KEY&start_date=2025-11-01

# 大阪市のみ
https://no-smoke-walk-api.no-smoke-walk.workers.dev/api/export/csv?secret=YOUR_SECRET_KEY&city=大阪市
```

---

## 📈 活用事例

### 行政報告書での利用

1. **月次報告書**
   - 地域別の発生件数グラフ
   - 前月比較
   - ホットスポット特定

2. **対策効果の測定**
   - キャンペーン前後の比較
   - 特定エリアの改善状況
   - 時間帯別分析

3. **予算計画の根拠資料**
   - 重点対策エリアの特定
   - パトロール計画の策定
   - 啓発活動の効果測定

---

## 🎓 上級者向け機能

### コマンドライン（Windows PowerShell）

```powershell
# データダウンロード
Invoke-WebRequest -Uri "https://no-smoke-walk-api.no-smoke-walk.workers.dev/api/export/csv?secret=YOUR_SECRET_KEY" -OutFile "reports.csv"

# 日付付きファイル名で保存
$date = Get-Date -Format "yyyyMMdd"
Invoke-WebRequest -Uri "https://no-smoke-walk-api.no-smoke-walk.workers.dev/api/export/csv?secret=YOUR_SECRET_KEY" -OutFile "reports_$date.csv"
```

### 自動化スクリプト

```powershell
# 毎週月曜日に自動ダウンロード
$secret = "YOUR_SECRET_KEY"
$url = "https://no-smoke-walk-api.no-smoke-walk.workers.dev/api/export/csv?secret=$secret&days=7"
$date = Get-Date -Format "yyyyMMdd"
$filename = "weekly_report_$date.csv"

Invoke-WebRequest -Uri $url -OutFile $filename
Write-Host "週次レポートをダウンロードしました: $filename"
```

---

## 📅 更新履歴

- **2025年11月9日**: 初版作成
- **随時更新予定**: 新機能追加時に更新

---

**最終更新:** 2025年11月9日  
**ドキュメントバージョン:** 1.0

💡 **ヒント:** このガイドをブックマークして、いつでも参照できるようにしておきましょう！
