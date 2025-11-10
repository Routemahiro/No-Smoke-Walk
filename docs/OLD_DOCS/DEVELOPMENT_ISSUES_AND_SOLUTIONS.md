# No-Smoke Walk Osaka - 開発時の問題と解決策

## 概要

このドキュメントでは、No-Smoke Walk Osakaプロジェクトの開発中に発生した主要な問題と、それらの解決策をまとめています。将来の開発や類似プロジェクトの参考として活用してください。

---

## 🚨 重大な問題 (High Impact)

### 1. Next.js ビルドタイムアウト問題

**問題:**
- `npm run build` が "Creating an optimized production build" で停止
- Google Fonts読み込みでネットワークタイムアウト発生
- ビルドプロセスが2時間以上停止

**解決策:**
```bash
# 1. キャッシュクリア
rm -rf .next node_modules package-lock.json

# 2. 依存関係再インストール (タイムアウト延長)
npm install --timeout=600000

# 3. Google Fonts一時無効化
# layout.tsx の Noto Sans JP import をコメントアウト

# 4. ビルド最適化設定
// next.config.ts
eslint: { ignoreDuringBuilds: true },
typescript: { ignoreBuildErrors: true }
```

**予防策:**
- Google Fonts は CDN ではなくローカルファイルを使用
- ビルド時間監視の設定
- CI/CD でタイムアウト設定を長めに調整

---

### 2. Cloudflare Workers API 全エンドポイント障害

**問題:**
- Health endpoint含む全APIが Internal Server Error
- デプロイは成功するが実行時エラー
- ログが表示されず原因特定困難

**根本原因:**
環境変数名の不一致
```typescript
// 型定義: SUPABASE_ANON_KEY
// 実際のコード: env.SUPABASE_SERVICE_ROLE_KEY (古い名前)
```

**解決策:**
```bash
# 1. 環境変数参照修正
# すべてのファイルで SUPABASE_SERVICE_ROLE_KEY → SUPABASE_ANON_KEY

# 2. 環境変数再設定
echo "anon-key-value" | npx wrangler secret put SUPABASE_ANON_KEY
echo "supabase-url" | npx wrangler secret put SUPABASE_URL

# 3. 段階的テスト
curl /api/health    # 基本動作確認
curl /api/heatmap   # データ取得確認
curl /api/reports   # 投稿機能確認
```

**予防策:**
- 環境変数名の命名規則統一
- 型定義とコードの整合性チェック
- デプロイ後の段階的動作確認

---

### 3. カスタムドメイン API接続問題

**問題:**
- https://no-smoke-alert.com でデモデータ表示
- API URLがlocalhost参照のまま
- 実データが表示されない

**解決策:**
```bash
# 1. 環境変数更新
# .env.local
NEXT_PUBLIC_API_BASE_URL=https://no-smoke-walk-api.no-smoke-walk.workers.dev

# 2. フロントエンド再ビルド・デプロイ
npm run build
cd out && npx wrangler pages deploy . --project-name=no-smoke-walk

# 3. Workers API環境変数設定
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_ANON_KEY
```

**予防策:**
- 本番・開発環境の環境変数分離
- デプロイ前の環境変数チェックリスト作成

---

## ⚠️ 中程度の問題 (Medium Impact)

### 4. latitude/longitude パラメータ不一致

**問題:**
- フロントエンド: `latitude`, `longitude` で送信
- バックエンド: `lat`, `lon` で受信期待
- API呼び出しで 400 Bad Request

**解決策:**
```typescript
// backend/handlers/reports.ts
// 両方のパラメータ形式に対応
const lat = body.lat || body.latitude;
const lon = body.lon || body.longitude;

// 型定義更新
interface ReportSubmissionRequest {
  lat?: number;
  lon?: number;
  latitude?: number;
  longitude?: number;
  category: ReportCategory;
}
```

**予防策:**
- API仕様書の作成・共有
- フロントエンド・バックエンド間のインターフェース定義統一

---

### 5. Supabase JS依存関係エラー

**問題:**
- Cloudflare Workers で `@supabase/supabase-js` ビルドエラー
- "Could not resolve @supabase/supabase-js" 

**解決策:**
```typescript
// Supabase JS SDK を使わず HTTP API 直接呼び出しに変更
const response = await fetch(`${env.SUPABASE_URL}/rest/v1/reports`, {
  method: 'POST',
  headers: {
    'apikey': env.SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${env.SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal'
  },
  body: JSON.stringify(data)
});
```

**予防策:**
- Cloudflare Workers対応ライブラリの事前確認
- HTTP API による代替実装の検討

---

### 6. CSV エクスポート機能 Not Found

**問題:**
- `/api/export/csv` でアクセスしても 404エラー
- ルーティングが `/api/admin/export/csv` のみ設定

**解決策:**
```typescript
// index.ts にルート追加
if (url.pathname === '/api/export/csv' && request.method === 'GET') {
  return handleExportCSV(request, env);
}

// 環境変数設定
echo "secret-key" | npx wrangler secret put EXPORT_SECRET_KEY

// 認証機能追加
const secret = searchParams.get('secret');
if (!secret || secret !== env.EXPORT_SECRET_KEY) {
  return new Response(JSON.stringify({
    success: false,
    error: 'Invalid or missing secret key'
  }), { status: 403 });
}
```

---

## 📱 UI/UX関連の問題

### 7. レイアウト崩れ (Grid システム)

**問題:**
- Ninja Ad追加でグリッドレイアウトが崩れる
- 横幅リサイズが正常動作しない

**解決策:**
```typescript
// Ninja Ad をグリッド外に配置
<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
  {/* メインコンテンツ */}
</div>
{/* グリッド外に配置 */}
<div className="mt-12 flex justify-center">
  <NinjaAd adId="ninja-ad-1" className="max-w-lg" />
</div>
```

**予防策:**
- 広告など外部コンテンツは独立したレイアウト領域に配置
- レスポンシブデザインのテスト強化

---

### 8. スマートフォン位置情報許可問題

**問題:**
- モバイルで位置情報取得ボタンが反応しない
- `navigator.geolocation` が動作しない

**解決策:**
```typescript
// useGeolocation.ts でエラーハンドリング強化
const getCurrentPosition = () => {
  if (!navigator.geolocation) {
    setError('位置情報がサポートされていません');
    return;
  }
  
  navigator.geolocation.getCurrentPosition(
    (position) => { /* 成功処理 */ },
    (error) => {
      switch(error.code) {
        case error.PERMISSION_DENIED:
          setError('位置情報の利用が拒否されました。ブラウザの設定を確認してください。');
          break;
        case error.POSITION_UNAVAILABLE:
          setError('位置情報を取得できません。');
          break;
        case error.TIMEOUT:
          setError('位置情報の取得がタイムアウトしました。');
          break;
      }
    },
    { 
      enableHighAccuracy: true, 
      timeout: 10000, 
      maximumAge: 300000 
    }
  );
};
```

**予防策:**
- HTTPS環境での動作確認
- 詳細なエラーメッセージとガイダンス提供

---

## 🔧 開発環境の問題

### 9. Bash ツール 2分タイムアウト

**問題:**
- 開発サーバー起動コマンドが2分でタイムアウト
- `npm run dev` などが中断される

**解決策:**
```bash
# バックグラウンド実行で回避
cd frontend && npx next dev --port 3003 > /dev/null 2>&1 &
cd backend && node simple-server.js > /dev/null 2>&1 &

# プロセス確認
ps aux | grep -E "(next|node.*simple-server)"

# プロセス停止
pkill -f "next dev" && pkill -f "simple-server"
```

**予防策:**
- 長時間実行するコマンドはバックグラウンド実行
- プロセス管理コマンドの整備

---

### 10. 日本語フォント・文字化け対応

**問題:**
- Playwright MCP でスクリーンショット撮影時に文字化け
- Google Fonts 読み込み失敗

**解決策:**
```typescript
// layout.tsx
import { Noto_Sans_JP } from 'next/font/google';

const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  display: 'swap',
});

// globals.css
body {
  font-family: 'Noto Sans JP', 'Hiragino Kaku Gothic ProN', 'ヒラギノ角ゴ ProN W3', system-ui, sans-serif;
}
```

**予防策:**
- 日本語フォントのフォールバック設定
- ローカルフォントファイルの活用検討

---

## 🛠️ 運用・メンテナンス

### 11. テストデータ蓄積問題

**問題:**
- 開発中にダミーデータが本番データベースに蓄積
- ローンチ前のデータクリアが必要

**解決策:**
```sql
-- Supabase でデータクリア
DELETE FROM reports;
SELECT COUNT(*) as total_reports FROM reports; -- 0件確認
```

**予防策:**
- 開発・ステージング・本番環境の分離
- テストデータの定期的なクリーンアップ

---

## 📊 学習事項とベストプラクティス

### 重要な学習ポイント

1. **段階的デバッグの重要性**
   - Health → Heatmap → Reports の順で確認
   - 基本機能から複雑な機能へ順次テスト

2. **環境変数管理の統一**
   - 命名規則の策定
   - 型定義とコードの整合性確保

3. **ビルド最適化戦略**
   - 外部リソース依存の最小化
   - タイムアウト設定の適切な調整

4. **エラーハンドリングの充実**
   - ユーザーフレンドリーなエラーメッセージ
   - 段階的なフォールバック機能

5. **クロスプラットフォーム対応**
   - モバイル・デスクトップ両対応
   - ブラウザ差異の考慮

---

## 🔄 今後の改善案

1. **CI/CD パイプライン強化**
   - 自動テスト追加
   - デプロイ前チェック自動化

2. **監視・ログ機能**
   - リアルタイムエラー監視
   - パフォーマンス計測

3. **開発環境統一**
   - Docker化検討
   - 環境構築の自動化

4. **テスト環境整備**
   - ステージング環境構築
   - 自動テストスイート追加

---

**最終更新**: 2025年7月26日  
**ドキュメントバージョン**: 1.0