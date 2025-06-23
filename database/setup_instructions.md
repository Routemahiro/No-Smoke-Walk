# Supabase データベースセットアップ手順

## 1. Supabase プロジェクト作成

1. [supabase.com](https://supabase.com) でアカウント作成
2. 新しいプロジェクトを作成
   - プロジェクト名: `no-smoke-walk-osaka`
   - データベースパスワードを設定（強力なパスワード推奨）
   - リージョン: `Asia Pacific (Tokyo)`

## 2. データベーススキーマ実行

1. Supabase Dashboard → SQL Editor を開く
2. `supabase/migrations/001_initial_schema.sql` の内容をコピー&ペースト
3. 実行して基本テーブル作成

## 3. テストデータ投入

1. SQL Editor で `supabase/seed.sql` の内容を実行
2. データが正常に挿入されることを確認

## 4. 環境変数設定

作成されたプロジェクトから以下の情報を取得：

### Project Settings → API
- `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `anon/public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

### .env.local ファイル作成
```bash
# frontend/.env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_BASE_URL=https://your-workers.domain.workers.dev
```

### wrangler.toml 環境変数設定
```bash
# backend/wrangler.toml に追加
[vars]
SUPABASE_URL = "https://your-project.supabase.co"
SUPABASE_SERVICE_ROLE_KEY = "your-service-role-key"
```

## 5. データベース接続テスト

以下のSQLでテーブル作成とデータ確認：

```sql
-- テーブル確認
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- レポートデータ確認
SELECT COUNT(*) FROM reports;

-- ヒートマップビュー確認
SELECT * FROM heatmap_public LIMIT 5;

-- 管理者ユーザー確認
SELECT * FROM admin_users;
```

## 6. RLS (Row Level Security) 確認

```sql
-- RLS有効確認
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- ポリシー確認
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';
```

## トラブルシューティング

### PostGIS拡張が有効でない場合
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

### マイグレーションでエラーが発生した場合
1. テーブルを全削除
2. スキーマを再実行
3. データ型エラーの場合は PostgreSQL 17 互換性を確認