# No-Smoke Walk Osaka - API仕様書

## 📝 概要

本ドキュメントは、No-Smoke Walk OsakaのバックエンドAPIの仕様を定義します。すべてのAPIはCloudflare Workers上で動作し、RESTful設計に基づいています。

## 🌐 基本情報

### ベースURL

| 環境 | URL |
|-----|-----|
| 開発 | `http://localhost:8787` |
| ステージング | `https://staging.no-smoke-walk-api.workers.dev` |
| 本番 | `https://no-smoke-walk-api.no-smoke-walk.workers.dev` |

### 共通ヘッダー

**リクエストヘッダー:**
```
Content-Type: application/json
```

**レスポンスヘッダー:**
```
Content-Type: application/json
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

### エラーレスポンス形式

```json
{
  "success": false,
  "error": "エラーメッセージ",
  "details": {
    "field": "詳細情報"
  }
}
```

## 📍 APIエンドポイント

### 1. ヘルスチェック

#### `GET /api/health`

システムの稼働状態を確認します。

**パラメータ:** なし

**レスポンス例:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-09T10:30:00.000Z",
  "environment": "production"
}
```

**ステータスコード:**
- `200 OK`: 正常動作

---

### 2. 報告投稿

#### `POST /api/reports`

市民からの歩きタバコ・ポイ捨て報告を受け付けます。

**リクエストボディ:**
```json
{
  "lat": 34.6937,
  "lon": 135.5023,
  "category": "walk_smoke"
}
```

または

```json
{
  "latitude": 34.6937,
  "longitude": 135.5023,
  "category": "walk_smoke"
}
```

**パラメータ詳細:**

| パラメータ | 型 | 必須 | 説明 | 制約 |
|-----------|-----|------|------|------|
| `lat/latitude` | number | ✓ | 緯度 | 24.0 ≤ lat ≤ 46.0 |
| `lon/longitude` | number | ✓ | 経度 | 122.0 ≤ lon ≤ 154.0 |
| `category` | string | ✓ | 報告カテゴリ | "walk_smoke" または "stand_smoke" |

**カテゴリ説明:**
- `walk_smoke`: 歩きタバコ
- `stand_smoke`: 立ち止まり喫煙（禁煙エリア）

**レート制限:**
- 10分間に5件まで投稿可能
- IPアドレスとデバイスフィンガープリントで判定

**レスポンス例（成功）:**
```json
{
  "success": true,
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Report submitted successfully",
  "data": {
    "latitude": 34.6937,
    "longitude": 135.5023,
    "category": "walk_smoke",
    "created_at": "2025-11-09T10:30:00.000Z",
    "trust_score": 8,
    "location": {
      "prefecture": "大阪府",
      "city": "大阪市",
      "ward": "中央区",
      "district": "難波"
    }
  }
}
```

**レスポンス例（エラー）:**
```json
{
  "success": false,
  "error": "Invalid coordinates",
  "details": {
    "lat": "Latitude must be between 24 and 46",
    "lon": "Longitude must be between 122 and 154"
  }
}
```

**ステータスコード:**
- `200 OK`: 報告成功
- `400 Bad Request`: パラメータ不正
- `429 Too Many Requests`: レート制限超過
- `500 Internal Server Error`: サーバーエラー

**処理フロー:**
1. リクエストパラメータのバリデーション
2. 座標が日本国内かチェック
3. カテゴリの妥当性確認
4. レート制限チェック（ABUSE_GUARD有効時）
5. フィンガープリント生成
6. 逆ジオコーディング（地名取得）
7. データベースへの保存
8. Trust Scoreの計算
9. レスポンス返却

---

### 3. ヒートマップデータ取得

#### `GET /api/heatmap`

指定条件でフィルタリングされた報告データをGeoJSON形式で返します。

**クエリパラメータ:**

| パラメータ | 型 | 必須 | デフォルト | 説明 |
|-----------|-----|------|------------|------|
| `days` | number | × | 30 | 過去n日間のデータを取得 |
| `category` | string | × | all | フィルタするカテゴリ |
| `minReports` | number | × | 1 | 最小報告数の閾値 |
| `lat` | number | × | - | 中心緯度（範囲フィルタ用） |
| `lon` | number | × | - | 中心経度（範囲フィルタ用） |
| `radius` | number | × | 800 | 範囲半径（メートル） |

**レスポンス例:**
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [135.5023, 34.6937]
      },
      "properties": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "category": "walk_smoke",
        "created_at": "2025-11-09T10:30:00.000Z",
        "trust_score": 8,
        "intensity": 0.85,
        "prefecture": "大阪府",
        "city": "大阪市",
        "ward": "中央区"
      }
    }
  ],
  "metadata": {
    "total": 150,
    "filtered": 45,
    "dateRange": {
      "start": "2025-10-10T00:00:00.000Z",
      "end": "2025-11-09T23:59:59.999Z"
    },
    "categories": {
      "walk_smoke": 30,
      "stand_smoke": 15
    }
  }
}
```

**ステータスコード:**
- `200 OK`: 取得成功
- `400 Bad Request`: パラメータ不正
- `500 Internal Server Error`: サーバーエラー

**最適化:**
- 地理空間インデックスによる高速検索
- 結果のキャッシング（5分間）
- 相対密度計算による正規化

---

### 4. ヒートマップ統計情報

#### `GET /api/heatmap/stats`

報告データの統計情報を取得します。

**クエリパラメータ:**

| パラメータ | 型 | 必須 | デフォルト | 説明 |
|-----------|-----|------|------------|------|
| `days` | number | × | 30 | 統計期間（日数） |
| `groupBy` | string | × | day | グループ単位（day/week/month） |

**レスポンス例:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "total": 1250,
      "period": {
        "start": "2025-10-10T00:00:00.000Z",
        "end": "2025-11-09T23:59:59.999Z"
      },
      "daily_average": 41.7
    },
    "by_category": {
      "walk_smoke": 850,
      "stand_smoke": 400
    },
    "by_location": {
      "大阪市": {
        "total": 900,
        "中央区": 350,
        "北区": 250,
        "浪速区": 300
      }
    },
    "trend": [
      {
        "date": "2025-11-01",
        "count": 45,
        "categories": {
          "walk_smoke": 30,
          "stand_smoke": 15
        }
      }
    ],
    "hotspots": [
      {
        "location": "難波駅周辺",
        "lat": 34.6654,
        "lon": 135.5012,
        "count": 120
      }
    ]
  }
}
```

---

### 5. CSVエクスポート（公開）

#### `GET /api/export/csv`

報告データをCSV形式でエクスポートします。シークレットキーによる認証が必要です。

**クエリパラメータ:**

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `secret` | string | ✓ | 認証用シークレットキー |
| `days` | number | × | 過去n日間のデータ |
| `category` | string | × | カテゴリフィルタ |
| `start_date` | string | × | 開始日（YYYY-MM-DD） |
| `end_date` | string | × | 終了日（YYYY-MM-DD） |
| `prefecture` | string | × | 都道府県フィルタ |
| `city` | string | × | 市区町村フィルタ |

**使用例:**
```bash
# 全データ取得
curl "https://api.example.com/api/export/csv?secret=YOUR_SECRET_KEY" > reports.csv

# 過去30日間のデータ
curl "https://api.example.com/api/export/csv?secret=YOUR_SECRET_KEY&days=30" > reports_30days.csv

# 特定期間・地域のデータ
curl "https://api.example.com/api/export/csv?secret=YOUR_SECRET_KEY&start_date=2025-01-01&end_date=2025-12-31&prefecture=大阪府&city=大阪市" > osaka_2025.csv
```

**レスポンス形式:**
```csv
ID,報告日時,緯度,経度,都道府県,市区町村,区,地区,カテゴリ,信頼度スコア,検証済み
550e8400-e29b-41d4-a716-446655440000,2025-11-09 10:30:00,34.6937,135.5023,大阪府,大阪市,中央区,難波,歩きタバコ,8,false
```

**ヘッダー:**
```
Content-Type: text/csv; charset=utf-8
Content-Disposition: attachment; filename="reports_YYYYMMDD_HHMMSS.csv"
```

**ステータスコード:**
- `200 OK`: エクスポート成功
- `403 Forbidden`: 認証失敗
- `500 Internal Server Error`: サーバーエラー

---

### 6. 管理者用CSVエクスポート

#### `GET /api/admin/export/csv`

管理者認証でCSVエクスポートを行います。より詳細な情報を含みます。

**認証:**
- Bearer Token または Session Cookie

**追加フィールド:**
- IPハッシュ
- ブラウザハッシュ
- デバイスハッシュ
- 内部メモ

---

### 7. 環境変数確認（デバッグ用）

#### `GET /api/debug/env`

環境変数の設定状態を確認します（開発環境のみ）。

**レスポンス例:**
```json
{
  "hasSupabaseUrl": true,
  "hasSupabaseKey": true,
  "supabaseUrlPrefix": "https://xxxxx.supabase...",
  "environment": "development",
  "abuseGuard": "true"
}
```

## 🔐 認証・認可

### シークレットキー認証

CSVエクスポートなど一部のエンドポイントではシークレットキー認証が必要です。

```bash
# 環境変数設定
echo "your-secret-key" | npx wrangler secret put EXPORT_SECRET_KEY
```

### CORS設定

すべてのエンドポイントでCORSが有効になっています：
- すべてのオリジンを許可（本番環境では制限推奨）
- プリフライトリクエスト対応

## 🛡️ セキュリティ

### レート制限

| エンドポイント | 制限 | 期間 |
|---------------|------|------|
| POST /api/reports | 5回 | 10分 |
| GET /api/heatmap | 100回 | 1分 |
| GET /api/export/* | 10回 | 1時間 |

### 入力検証

すべての入力値は以下の検証を通過する必要があります：
- 型チェック
- 範囲チェック
- SQLインジェクション対策
- XSS対策

### データプライバシー

- IPアドレスはSHA-256でハッシュ化
- 個人を特定できる情報は保存しない
- 位置情報の精度調整オプション

## 🚀 パフォーマンス

### キャッシング

| リソース | TTL | 条件 |
|----------|-----|------|
| ヒートマップデータ | 5分 | 同一パラメータ |
| 統計情報 | 1時間 | 同一期間 |
| 静的レスポンス | 24時間 | health check |

### 最適化

- データベースインデックスの活用
- 地理空間クエリの最適化
- レスポンス圧縮（gzip）
- 並列処理の活用

## 📊 エラーコード一覧

| コード | 説明 | 対処法 |
|--------|------|--------|
| `INVALID_COORDINATES` | 座標が不正 | 日本国内の座標を指定 |
| `INVALID_CATEGORY` | カテゴリが不正 | walk_smoke/stand_smokeを使用 |
| `RATE_LIMIT_EXCEEDED` | レート制限超過 | 時間をおいて再試行 |
| `DATABASE_ERROR` | DB接続エラー | システム管理者に連絡 |
| `AUTH_FAILED` | 認証失敗 | シークレットキーを確認 |
| `INVALID_DATE_RANGE` | 日付範囲が不正 | 正しい日付形式を使用 |

## 🔄 バージョニング

現在のAPIバージョン: **v1**

将来的なバージョニング戦略：
- URLパス: `/api/v2/reports`
- ヘッダー: `API-Version: 2`

## 📝 使用例

### cURL

```bash
# ヘルスチェック
curl https://api.example.com/api/health

# 報告投稿
curl -X POST https://api.example.com/api/reports \
  -H "Content-Type: application/json" \
  -d '{"lat":34.6937,"lon":135.5023,"category":"walk_smoke"}'

# ヒートマップデータ取得
curl "https://api.example.com/api/heatmap?days=7&category=walk_smoke"
```

### JavaScript (Fetch API)

```javascript
// 報告投稿
async function submitReport(lat, lon, category) {
  const response = await fetch('https://api.example.com/api/reports', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ lat, lon, category })
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return await response.json();
}

// ヒートマップデータ取得
async function fetchHeatmapData(days = 30) {
  const response = await fetch(
    `https://api.example.com/api/heatmap?days=${days}`
  );
  return await response.json();
}
```

### Python

```python
import requests
import json

# 報告投稿
def submit_report(lat, lon, category):
    url = "https://api.example.com/api/reports"
    payload = {
        "lat": lat,
        "lon": lon,
        "category": category
    }
    headers = {"Content-Type": "application/json"}
    
    response = requests.post(url, json=payload, headers=headers)
    return response.json()

# CSVエクスポート
def export_csv(secret_key, days=30):
    url = f"https://api.example.com/api/export/csv"
    params = {
        "secret": secret_key,
        "days": days
    }
    
    response = requests.get(url, params=params)
    with open("reports.csv", "wb") as f:
        f.write(response.content)
```

## 📚 関連ドキュメント

- [アーキテクチャドキュメント](./ARCHITECTURE.md)
- [データベース設計書](./DATABASE_DESIGN.md)
- [デプロイ手順](./DEPLOYMENT_COMMANDS.md)

---

**最終更新:** 2025年11月9日  
**APIバージョン:** v1  
**ドキュメントバージョン:** 1.0
