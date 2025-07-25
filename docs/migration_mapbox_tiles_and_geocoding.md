# Mapbox への全面乗り換え手順書（タイル＋ジオコーディング）

> 最終更新: 2025-07-05

---

## 背景
広告掲載＝商用サイト扱いとなるため、OpenStreetMap 公式タイル／Nominatim は利用不可。Mapbox ならタイルもジオコーディングも商用 OK で、無料枠も十分。そこで **マップタイル ＆ Geocoding を両方とも Mapbox** へ統一する。

---

## 料金ざっくり
| API | 無料枠 | 超過 | 備考 |
|-----|-------|------|------|
| Map Load (タイル) | 50,000 load/月 | $5 / 1,000 load | 1 load＝初期描画＋スタイルロード。ズーム・パンでの追加タイルはカウント外。 |
| Geocoding | 50,000 req/月 | $0.005 / req | リバースも同じカウント。 |

※ 例：PV=30k/月 でも `map load ≒ PV` のため無料枠内に収まる見込み。

---

## 全体フロー
| ステージ | 担当 | 概要 |
|----------|------|------|
| 1 | Human | Mapbox アカウント作成 & Access Token 発行 |
| 2 | Human | （任意）独自スタイル作成 → Style ID 取得 |
| 3 | Human | `.env*` と GitHub Secrets に Token/StyleID を登録 |
| 4 | AI Dev | MapLibre 設定を Mapbox スタイル URL へ変更 |
| 5 | AI Dev | `/api/geocode` を Mapbox Geocoding に切替え |
| 6 | AI Dev | Attribution 更新・ドキュメント整備 |
| 7 | Human | ローカル動作確認 & Playwright MCP E2E テスト |

---

## 1. Mapbox アカウント＆トークン
### 1-A. Human 作業
1. https://account.mapbox.com/ でアカウント作成。
2. `Tokens` → `Create token` で **Public scopes: `styles:read`, `fonts:read`** に加え **`geocoding`** をチェックし発行。
3. 必要なら Mapbox Studio でカスタムスタイル作成 → **Style URL** ( `mapbox://styles/<username>/<style_id>` ) を控える。
4. `.env.local` / `.env.production` に追記。
   ```env
   NEXT_PUBLIC_MAPBOX_TOKEN=pk.xxxxx
   NEXT_PUBLIC_MAPBOX_STYLE_URL=https://api.mapbox.com/styles/v1/mapbox/streets-v12?access_token=${NEXT_PUBLIC_MAPBOX_TOKEN}
   # カスタムの場合
   # NEXT_PUBLIC_MAPBOX_STYLE_URL=https://api.mapbox.com/styles/v1/<username>/<style_id>?access_token=${NEXT_PUBLIC_MAPBOX_TOKEN}
   MAPBOX_TOKEN=${NEXT_PUBLIC_MAPBOX_TOKEN}   # サーバー側用
   ```
5. GitHub Secrets (`NEXT_PUBLIC_MAPBOX_TOKEN`, `NEXT_PUBLIC_MAPBOX_STYLE_URL`, `MAPBOX_TOKEN`) を追加。

---

## 2. フロントエンド：MapLibre 設定変更
### 2-A. AI Dev TODO
- [ ] `frontend/src/components/HeatmapView.tsx`
  - 既存の `style: {version:8, sources:{osm:..}}` ブロックを **外部 URL** に置換。
    ```ts
    style: process.env.NEXT_PUBLIC_MAPBOX_STYLE_URL,
    ```
- [ ] `frontend/src/components/MiniHeatmap.tsx` も同様。
- [ ] `AttributionControl` を
    ```ts
    "© Mapbox © OpenStreetMap"
    ```
    に変更。
- [ ] `next.config.ts` に `NEXT_PUBLIC_MAPBOX_*` を `runtimeEnv` / `publicRuntimeConfig` に加える（静的エクスポート対応）。

---

## 3. バックエンド：Geocoding ルート変更
### 3-A. AI Dev TODO
1. `frontend/src/app/api/geocode/route.ts` を新実装（無い場合は作成）。
   ```ts
   import { NextResponse } from 'next/server';

   export const runtime = 'edge';
   export const dynamic = 'force-dynamic';

   export async function GET(req: Request) {
     const { searchParams } = new URL(req.url);
     const lat = searchParams.get('lat');
     const lon = searchParams.get('lon');
     if (!lat || !lon) {
       return NextResponse.json({ error: 'lat / lon required' }, { status: 400 });
     }

     const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lon},${lat}.json?language=ja&limit=1&access_token=${process.env.MAPBOX_TOKEN}`;
     const res = await fetch(url);
     if (!res.ok) {
       return NextResponse.json({ error: 'Geocoding failed' }, { status: res.status });
     }
     const data = await res.json();
     const place = data.features?.[0]?.place_name ?? null;
     return NextResponse.json({ address: place });
   }
   ```
2. Jest テスト: fetch をモックして address が返ることを確認。

---

## 4. テスト & 検証
### 4-A. AI Dev TODO
- Playwright MCP を更新：
  1. ページロード後、`networkidle` で `api.mapbox.com/styles/v1` リクエストが成功しているか。
  2. 住所表示が `大阪府` 等を含むことを確認。

### 4-B. Human 手順
```powershell
cd E:\mega\No-Smoke-Walk\frontend
$env:NEXT_PUBLIC_MAPBOX_TOKEN="pk.xxx"
$env:NEXT_PUBLIC_MAPBOX_STYLE_URL="https://api.mapbox.com/styles/v1/mapbox/streets-v12?access_token=pk.xxx"
npm run dev
```
ブラウザで `localhost:3003` を開き、
1. タイルが Mapbox の CDN (`mapbox.com`) から配信されるか。
2. 位置取得→住所表示が成功するか。

---

## 5. ライセンス表記
フッター等に以下を追加（Mapbox 指定必須）。
```html
<small>© Mapbox © OpenStreetMap</small>
```
※ Mapbox ブランドロゴを入れる場合は SVG を `/public/` に置き `<img>` で表示しても OK。

---

## 6. 完了条件
- Mapbox タイル & Geocoding が両方とも 200 で動作。  
- 月間 50k map load / geocode を超過しない限り課金ゼロ。  
- E2E テスト PASS。  
- 本番デプロイ後も `mapbox.com` へのリクエストが成功し、住所が正しく表示。

---

## おまけ：スタイルを日本語地図にする
1. Mapbox Studio → `Japanese Streets` テンプレを選択。  
2. `Publish` して Style URL を取得。  
3. `.env*` の `NEXT_PUBLIC_MAPBOX_STYLE_URL` を差し替えるだけで OK。

---

### 🎉 これで Mapbox オールインワン体制の完成！
なにか詰まったら、いつでも "オレ" に声掛けてねっ♡ 