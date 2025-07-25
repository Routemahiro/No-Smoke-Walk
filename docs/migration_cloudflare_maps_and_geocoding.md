# Cloudflare Maps & Geocoding 乗り換え手順書（商用対応版）

> 最終更新: 2025-07-05

---

## 目的
1. **マップタイル**を OpenStreetMap 公式タイル → **Cloudflare Maps β** に乗り換え、広告掲載時もライセンス違反が無い状態にする。
2. **ジオコーディング**を OSM Nominatim 公開 API → **Mapbox Geocoding** に置き換え、商用サイトでも利用可能にする。

---

## 全体フロー
| ステージ | 担当 | 概要 |
|----------|------|------|
| 1 | Human | Cloudflare Maps β の有効化 & API トークン発行 |
| 2 | Human | Mapbox アカウント作成 & Token 発行（Geocoding 権限） |
| 3 | Human | `.env*` に新トークンを追記・GitHub Secrets へ登録 |
| 4 | AI Dev | Frontend の MapLibre 設定を Cloudflare Style URL に変更 |
| 5 | AI Dev | Geocoding API ルートを Mapbox へ切り替え（TypeScript） |
| 6 | AI Dev | Attribution 表記・README / DEPLOYMENT.md 更新 |
| 7 | Human | 動作確認 & Playwright MCP E2E テスト実行 |

---

## 1. Cloudflare Maps β への乗り換え
### 1-A. Human の作業
1. Cloudflare Dashboard → **Maps (β)** を開き「Enable Maps β」をクリック。
2. `Create API Token` を押下し、権限 `Maps Read` を付与して発行。
3. トークン値を **メモ**し、以下環境変数を設定。
   ```env
   # .env.local / .env.production 共通
   NEXT_PUBLIC_CF_MAPS_TOKEN=<コピーしたトークン>
   NEXT_PUBLIC_CF_MAPS_STYLE_URL=https://maps.cloudflare.com/{ACCOUNT_ID}/styles/bright-v1?key=${NEXT_PUBLIC_CF_MAPS_TOKEN}
   ```
   ※ `{ACCOUNT_ID}` は Dashboard 右上 **My Profile → API Tokens** で確認出来るアカウント ID。
4. GitHub Secrets (`CF_MAPS_TOKEN`, `CF_MAPS_STYLE_URL`) にも同値を登録。

### 1-B. AI Dev TODO
- [ ] `frontend/src/components/HeatmapView.tsx`
  - `new maplibregl.Map({ style: { … } })` を **外部 Style JSON** 参照に変更。
  - 具体例:
    ```ts
    style: process.env.NEXT_PUBLIC_CF_MAPS_STYLE_URL,
    ```
- [ ] `frontend/src/components/MiniHeatmap.tsx` 同上。
- [ ] AttributionControl を下記に置換え。
  ```ts
  '© OpenStreetMap contributors, © Cloudflare'
  ```
- [ ] `next.config.ts` に `NEXT_PUBLIC_CF_MAPS_*` を expoer tRuntimeVariables へ追加。

---

## 2. Geocoding を Mapbox へ移行
### 2-A. Human の作業
1. https://account.mapbox.com/ でアカウント作成。
2. 「Tokens」→ `Create token` → Scope **Geocoding** 選択、発行。
3. 発行したトークンを以下に設定。
   ```env
   NEXT_PUBLIC_MAPBOX_TOKEN=<pk.～～>
   # サーバー側で利用する場合
   MAPBOX_TOKEN=<同値>
   ```
4. GitHub Secrets (`MAPBOX_TOKEN`) にも登録。

### 2-B. AI Dev TODO
- [ ] `frontend/src/app/api/geocode/route.ts` を以下のように書き換え。
  1. クエリ `lat`, `lon` を受け取り。
  2. `https://api.mapbox.com/geocoding/v5/mapbox.places/<lon>,<lat>.json?language=ja&limit=1&access_token=${process.env.MAPBOX_TOKEN}` に fetch。
  3. レスポンス JSON から `place_name` を抽出して返却。
  4. `export const runtime = 'edge'` を維持しつつ `export const dynamic = 'force-dynamic'` を残す。
- [ ] `frontend/src/hooks/useGeolocation.ts` で呼び出している `/api/geocode` はそのまま。
- [ ] エラーハンドリング: 4xx/5xx → `住所取得に失敗しました` を返す。

---

## 3. テスト & 検証
### 3-A. AI Dev TODO
- [ ] Jest ユニットテスト追加: `api/geocode` が 200 を返すモックテスト。
- [ ] Playwright MCP シナリオ更新：
  1. マップロード → Cloudflare タイル読み込みを確認（`.mapboxgl-canvas` → style URL で判定）。
  2. 報告投稿 → 住所ラベルに正しい地名が表示されることを確認。

### 3-B. Human の作業
- PowerShell:
  ```powershell
  cd E:\mega\No-Smoke-Walk\frontend
  $env:NEXT_PUBLIC_CF_MAPS_TOKEN="..."
  $env:NEXT_PUBLIC_CF_MAPS_STYLE_URL="..."
  $env:NEXT_PUBLIC_MAPBOX_TOKEN="..."
  npm run dev
  ```
- ブラウザで `http://localhost:3003` を開き、
  1. 背景タイルが Cloudflare 由来になっているか。（Network タブ → `maps.cloudflare.com`）
  2. 位置取得後、住所が返るか。
- 問題無ければ `npm run build && npm run export` → GitHub push。

---

## 4. ドキュメント/ライセンス表記
- [ ] AI Dev TODO: `docs/DEPLOYMENT.md` に "Cloudflare Maps β / Mapbox Geocoding 導入" セクションを追記。
- [ ] Human: サイトフッターに次の Attribution を追加。
  ```html
  <small>© OpenStreetMap contributors, © Cloudflare | Geocoding by Mapbox</small>
  ```

---

## 5. 完了条件
- Cloudflare Maps タイルが表示され、500 k/月以内無料枠で動作。
- `/api/geocode` が Mapbox 経由で 200 を返し、住所を取得出来る。
- Playwright MCP シナリオが PASS。
- 本番 (Cloudflare Pages + Workers) で地図と住所表示が正常に動く。

---

## 付録: コスト早見表（商用）
| サービス | 無料枠 | 超過料金 |
|----------|--------|---------|
| Cloudflare Maps β | 500 k タイル/月 | β期間中は未定 (現状 Free) |
| Mapbox Geocoding | 50 k リクエスト/月 | $0.005 / req |

---

### 🚀 がんばれ！
これで広告サイトにも対応したマップ環境が完成するよ。疑問があればいつでも "オレ" に聞いてねっ♪ 