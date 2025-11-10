# 📝 コーディング規約 - No-Smoke Walk Osaka

## 🎯 目的

このドキュメントは、No-Smoke Walk Osakaプロジェクトにおける一貫性のあるコード品質を維持するための規約を定義します。

---

## 📋 基本原則

### DRY (Don't Repeat Yourself)
- 同じコードを繰り返さない
- 共通処理は関数・コンポーネント化

### KISS (Keep It Simple, Stupid)
- シンプルで理解しやすいコードを書く
- 過度な抽象化を避ける

### YAGNI (You Aren't Gonna Need It)
- 現時点で必要ない機能は実装しない
- 将来の拡張性は考慮しつつ、過度な準備はしない

---

## 🗂️ プロジェクト構造

### ディレクトリ構成

```
No-Smoke-Walk/
├── frontend/                 # フロントエンド（Next.js）
│   ├── src/
│   │   ├── app/             # App Router ページ
│   │   ├── components/      # Reactコンポーネント
│   │   ├── hooks/           # カスタムフック
│   │   ├── lib/             # ユーティリティ関数
│   │   └── types/           # TypeScript型定義
├── backend/                  # バックエンド（Cloudflare Workers）
│   ├── src/
│   │   ├── handlers/        # APIハンドラー
│   │   ├── utils/           # ユーティリティ関数
│   │   └── types/           # TypeScript型定義
├── database/                 # データベース関連
│   └── migrations/          # マイグレーションファイル
└── docs/                     # ドキュメント
```

### ファイル命名規則

| 種類 | 命名規則 | 例 |
|------|---------|-----|
| React コンポーネント | PascalCase | `ReportForm.tsx` |
| カスタムフック | camelCase (use始まり) | `useGeolocation.ts` |
| ユーティリティ | camelCase | `formatDate.ts` |
| 定数ファイル | UPPER_SNAKE_CASE | `API_CONSTANTS.ts` |
| 型定義 | PascalCase | `ReportTypes.ts` |
| テストファイル | 元ファイル名.test | `ReportForm.test.tsx` |

---

## 💻 TypeScript/JavaScript

### 基本設定

```typescript
// tsconfig.json の推奨設定
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

### 変数・定数

```typescript
// ✅ Good: const/let を使用
const MAX_REPORTS = 100;
let currentCount = 0;

// ❌ Bad: var を使用
var count = 0;

// ✅ Good: 説明的な変数名
const userLocationData = await getUserLocation();

// ❌ Bad: 省略形や不明瞭な名前
const d = await getLoc();
```

### 関数

```typescript
// ✅ Good: アロー関数（単純な処理）
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  // 計算処理
  return distance;
};

// ✅ Good: 通常の関数（複雑な処理）
async function submitReport(data: ReportData): Promise<ReportResponse> {
  try {
    const response = await apiClient.post('/reports', data);
    return response.data;
  } catch (error) {
    handleError(error);
    throw error;
  }
}

// ✅ Good: デフォルトパラメータ
function fetchReports(days: number = 30): Promise<Report[]> {
  return api.get(`/reports?days=${days}`);
}
```

### 型定義

```typescript
// ✅ Good: インターフェース（オブジェクト型）
interface Report {
  id: string;
  latitude: number;
  longitude: number;
  category: ReportCategory;
  createdAt: Date;
}

// ✅ Good: 型エイリアス（ユニオン型、プリミティブ）
type ReportCategory = 'walk_smoke' | 'stand_smoke';
type Coordinate = [number, number];

// ✅ Good: Enum の代わりに const assertion
const REPORT_STATUS = {
  PENDING: 'pending',
  VERIFIED: 'verified',
  REJECTED: 'rejected'
} as const;

type ReportStatus = typeof REPORT_STATUS[keyof typeof REPORT_STATUS];
```

### 非同期処理

```typescript
// ✅ Good: async/await
async function fetchData(): Promise<Data> {
  try {
    const response = await fetch('/api/data');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch data:', error);
    throw error;
  }
}

// ❌ Bad: コールバック地獄
function fetchData(callback) {
  fetch('/api/data')
    .then(response => response.json())
    .then(data => callback(null, data))
    .catch(error => callback(error));
}
```

### エラーハンドリング

```typescript
// ✅ Good: 詳細なエラーハンドリング
class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'APIError';
  }
}

async function handleReportSubmission(data: ReportData): Promise<void> {
  try {
    await validateReportData(data);
    await submitToDatabase(data);
  } catch (error) {
    if (error instanceof ValidationError) {
      console.error('Validation failed:', error.message);
      throw new APIError('Invalid report data', 400, error.details);
    }
    
    if (error instanceof DatabaseError) {
      console.error('Database error:', error);
      throw new APIError('Failed to save report', 500);
    }
    
    console.error('Unexpected error:', error);
    throw new APIError('Internal server error', 500);
  }
}
```

---

## ⚛️ React/Next.js

### コンポーネント構造

```typescript
// ✅ Good: 機能的コンポーネント
interface ReportFormProps {
  onSubmit: (data: ReportData) => Promise<void>;
  initialData?: Partial<ReportData>;
}

export function ReportForm({ onSubmit, initialData }: ReportFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleSubmit = async (data: ReportData) => {
    setLoading(true);
    setError(null);
    
    try {
      await onSubmit(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* フォーム内容 */}
    </form>
  );
}
```

### カスタムフック

```typescript
// ✅ Good: 再利用可能なカスタムフック
export function useGeolocation(options?: PositionOptions) {
  const [location, setLocation] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('位置情報がサポートされていません');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation(position);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
      options
    );
  }, [options]);
  
  return { location, error, loading, getCurrentLocation };
}
```

### コンポーネントの分割

```typescript
// ✅ Good: 単一責任の原則
// ReportList.tsx - リスト表示のみ
export function ReportList({ reports }: { reports: Report[] }) {
  return (
    <ul>
      {reports.map(report => (
        <ReportItem key={report.id} report={report} />
      ))}
    </ul>
  );
}

// ReportItem.tsx - 個別アイテム表示
export function ReportItem({ report }: { report: Report }) {
  return (
    <li>
      <span>{report.category}</span>
      <time>{formatDate(report.createdAt)}</time>
    </li>
  );
}

// ReportContainer.tsx - データ取得とステート管理
export function ReportContainer() {
  const { data: reports, loading, error } = useReports();
  
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  
  return <ReportList reports={reports} />;
}
```

### パフォーマンス最適化

```typescript
// ✅ Good: メモ化の適切な使用
const MemoizedExpensiveComponent = memo(({ data }: Props) => {
  // 重い計算処理
  const processedData = useMemo(
    () => expensiveCalculation(data),
    [data]
  );
  
  // コールバックのメモ化
  const handleClick = useCallback(
    (id: string) => {
      console.log('Clicked:', id);
    },
    []
  );
  
  return <div>{/* コンポーネント内容 */}</div>;
});

// ✅ Good: 動的インポート
const HeavyComponent = dynamic(
  () => import('./HeavyComponent'),
  { 
    loading: () => <LoadingSpinner />,
    ssr: false 
  }
);
```

---

## 🎨 CSS/スタイリング

### Tailwind CSS

```tsx
// ✅ Good: 一貫性のあるクラス順序
// 1. レイアウト → 2. スペーシング → 3. サイズ → 4. 見た目 → 5. 状態
<div className="
  flex flex-col items-center justify-center
  p-4 m-2
  w-full h-64
  bg-white rounded-lg shadow-md
  hover:shadow-xl transition-shadow
">

// ✅ Good: コンポーネント用のクラスをまとめる
const buttonStyles = {
  base: 'px-4 py-2 rounded-lg font-semibold transition-colors',
  primary: 'bg-blue-500 text-white hover:bg-blue-600',
  secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
  danger: 'bg-red-500 text-white hover:bg-red-600'
};

<button className={`${buttonStyles.base} ${buttonStyles.primary}`}>
  送信
</button>
```

### レスポンシブデザイン

```tsx
// ✅ Good: モバイルファースト
<div className="
  w-full         // モバイル: 全幅
  md:w-1/2       // タブレット: 半分
  lg:w-1/3       // デスクトップ: 1/3
  xl:w-1/4       // 大画面: 1/4
">
```

---

## 🔒 セキュリティ

### 入力検証

```typescript
// ✅ Good: サーバーサイドでの検証
function validateReportData(data: unknown): ReportData {
  // 型ガード
  if (!isReportData(data)) {
    throw new ValidationError('Invalid data format');
  }
  
  // 座標範囲チェック（日本国内）
  if (data.latitude < 24 || data.latitude > 46) {
    throw new ValidationError('Invalid latitude');
  }
  
  if (data.longitude < 122 || data.longitude > 154) {
    throw new ValidationError('Invalid longitude');
  }
  
  // カテゴリチェック
  const validCategories = ['walk_smoke', 'stand_smoke'];
  if (!validCategories.includes(data.category)) {
    throw new ValidationError('Invalid category');
  }
  
  return data;
}
```

### 機密情報の扱い

```typescript
// ✅ Good: 環境変数を使用
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// ❌ Bad: ハードコーディング
const apiKey = 'sk_live_1234567890abcdef';

// ✅ Good: サーバーサイドのみで使用
// バックエンド側
const secretKey = process.env.SUPABASE_SERVICE_KEY; // publicプレフィックスなし
```

---

## 🧪 テスト

### ユニットテスト

```typescript
// ✅ Good: 詳細なテストケース
describe('formatDate', () => {
  it('should format date in Japanese format', () => {
    const date = new Date('2025-01-15T10:30:00');
    expect(formatDate(date)).toBe('2025年1月15日 10:30');
  });
  
  it('should handle invalid date', () => {
    expect(formatDate(null)).toBe('--');
    expect(formatDate(undefined)).toBe('--');
  });
  
  it('should respect timezone', () => {
    // タイムゾーンを考慮したテスト
  });
});
```

### 統合テスト

```typescript
// ✅ Good: APIエンドポイントのテスト
describe('POST /api/reports', () => {
  it('should create a new report with valid data', async () => {
    const reportData = {
      latitude: 34.6937,
      longitude: 135.5023,
      category: 'walk_smoke'
    };
    
    const response = await request(app)
      .post('/api/reports')
      .send(reportData);
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.id).toBeDefined();
  });
  
  it('should reject invalid coordinates', async () => {
    const invalidData = {
      latitude: 100,  // 無効な緯度
      longitude: 135.5023,
      category: 'walk_smoke'
    };
    
    const response = await request(app)
      .post('/api/reports')
      .send(invalidData);
    
    expect(response.status).toBe(400);
    expect(response.body.error).toContain('Invalid coordinates');
  });
});
```

---

## 📝 コメント・ドキュメント

### コメントの書き方

```typescript
// ✅ Good: なぜそうするのかを説明
// 日本の座標範囲内かチェック
// 参考: https://ja.wikipedia.org/wiki/日本の地理
if (lat >= 24 && lat <= 46 && lon >= 122 && lon <= 154) {
  // 処理
}

// ❌ Bad: コードを読めばわかることをコメント
// latが24以上46以下、lonが122以上154以下かチェック
if (lat >= 24 && lat <= 46 && lon >= 122 && lon <= 154) {
  // 処理
}

// ✅ Good: 複雑なロジックの説明
/**
 * Trust Scoreの計算
 * 基本スコア: 5
 * GPS精度 < 50m: +2
 * デバイス情報あり: +1
 * 過去の報告実績: +1〜2
 */
function calculateTrustScore(report: Report): number {
  // 実装
}
```

### JSDoc

```typescript
/**
 * 報告データをCSV形式でエクスポート
 * @param filters - フィルタリング条件
 * @param filters.startDate - 開始日
 * @param filters.endDate - 終了日
 * @param filters.category - カテゴリ
 * @returns CSV文字列
 * @throws {ValidationError} フィルタが不正な場合
 * @example
 * const csv = await exportToCSV({
 *   startDate: new Date('2025-01-01'),
 *   endDate: new Date('2025-01-31'),
 *   category: 'walk_smoke'
 * });
 */
export async function exportToCSV(filters: ExportFilters): Promise<string> {
  // 実装
}
```

---

## 📦 Git コミット規約

### コミットメッセージ形式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type

| Type | 説明 | 例 |
|------|------|-----|
| feat | 新機能追加 | `feat: 報告フォームにカテゴリ選択を追加` |
| fix | バグ修正 | `fix: 位置情報取得エラーを修正` |
| docs | ドキュメント | `docs: API仕様書を更新` |
| style | コードスタイル | `style: インデントを修正` |
| refactor | リファクタリング | `refactor: API呼び出しロジックを整理` |
| perf | パフォーマンス改善 | `perf: ヒートマップの描画を最適化` |
| test | テスト | `test: 報告APIのテストを追加` |
| chore | その他 | `chore: 依存関係を更新` |

### コミット例

```bash
# ✅ Good
git commit -m "feat(report): 画像アップロード機能を追加"
git commit -m "fix(heatmap): マーカーが重複する問題を修正"
git commit -m "docs: セットアップガイドを更新"

# ❌ Bad
git commit -m "更新"
git commit -m "バグ修正"
git commit -m "WIP"
```

---

## 🔍 コードレビューチェックリスト

### 機能面
- [ ] 要件を満たしているか
- [ ] エッジケースを考慮しているか
- [ ] エラーハンドリングが適切か

### コード品質
- [ ] 命名規則に従っているか
- [ ] DRY原則に従っているか
- [ ] 適切にコメントされているか

### パフォーマンス
- [ ] 不要な再レンダリングはないか
- [ ] 重い処理は最適化されているか
- [ ] バンドルサイズへの影響は妥当か

### セキュリティ
- [ ] 入力値の検証があるか
- [ ] 機密情報が露出していないか
- [ ] XSS対策がされているか

### テスト
- [ ] テストが追加されているか
- [ ] 既存のテストが壊れていないか
- [ ] カバレッジは十分か

---

## 📚 参考リソース

- [TypeScript Style Guide](https://github.com/basarat/typescript-book/blob/master/docs/styleguide/styleguide.md)
- [React Best Practices](https://react.dev/learn)
- [Next.js Best Practices](https://nextjs.org/docs)
- [Tailwind CSS Best Practices](https://tailwindcss.com/docs)
- [Conventional Commits](https://www.conventionalcommits.org/)

---

**最終更新:** 2025年11月9日  
**ドキュメントバージョン:** 1.0
