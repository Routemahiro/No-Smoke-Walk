# 📊 データベース設計書 - No-Smoke Walk Osaka

## 🎯 概要

本ドキュメントは、No-Smoke Walk Osakaのデータベース設計を詳細に記述します。
データベースはSupabase（PostgreSQL + PostGIS）を使用し、地理空間データの効率的な処理を実現しています。

---

## 🗄️ データベース基本情報

### プラットフォーム
- **サービス**: Supabase
- **データベース**: PostgreSQL 15.x
- **拡張機能**: PostGIS 3.x（地理空間データ処理）
- **ホスティング**: Supabase Cloud

### 接続情報
| 環境 | 用途 |
|------|------|
| 開発環境 | ローカルSupabase または開発用プロジェクト |
| ステージング | ステージング用Supabaseプロジェクト |
| 本番環境 | 本番用Supabaseプロジェクト |

---

## 📋 テーブル設計

### 1. reports テーブル（メインテーブル）

市民からの報告データを格納する中心的なテーブルです。

```sql
CREATE TABLE reports (
    -- 主キー
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- タイムスタンプ
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 位置情報
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    altitude DECIMAL(10, 2),
    accuracy DECIMAL(10, 2),
    
    -- カテゴリ情報
    category VARCHAR(50) NOT NULL,
    sub_category VARCHAR(50),
    
    -- 地名情報（逆ジオコーディング結果）
    country VARCHAR(100) DEFAULT 'Japan',
    prefecture VARCHAR(255),
    city VARCHAR(255),
    ward VARCHAR(255),
    district VARCHAR(255),
    street VARCHAR(255),
    building VARCHAR(255),
    postal_code VARCHAR(20),
    
    -- プライバシー保護データ
    ip_hash VARCHAR(255),
    browser_hash VARCHAR(255),
    device_hash VARCHAR(255),
    session_hash VARCHAR(255),
    
    -- データ品質
    trust_score INTEGER DEFAULT 5 CHECK (trust_score >= 1 AND trust_score <= 10),
    is_verified BOOLEAN DEFAULT false,
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by UUID,
    
    -- メタデータ
    user_agent TEXT,
    referrer TEXT,
    viewport_width INTEGER,
    viewport_height INTEGER,
    screen_width INTEGER,
    screen_height INTEGER,
    
    -- 管理用
    notes TEXT,
    tags TEXT[],
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID,
    
    -- 制約
    CONSTRAINT valid_coordinates CHECK (
        latitude >= -90 AND latitude <= 90 AND
        longitude >= -180 AND longitude <= 180
    ),
    CONSTRAINT valid_japan_coordinates CHECK (
        latitude >= 24 AND latitude <= 46 AND
        longitude >= 122 AND longitude <= 154
    ),
    CONSTRAINT valid_category CHECK (
        category IN ('walk_smoke', 'stand_smoke', 'littering', 'other')
    )
);
```

### インデックス設計

```sql
-- 基本インデックス
CREATE INDEX idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX idx_reports_category ON reports(category);
CREATE INDEX idx_reports_trust_score ON reports(trust_score);
CREATE INDEX idx_reports_is_verified ON reports(is_verified);
CREATE INDEX idx_reports_is_deleted ON reports(is_deleted);

-- 複合インデックス
CREATE INDEX idx_reports_category_created ON reports(category, created_at DESC);
CREATE INDEX idx_reports_location ON reports(latitude, longitude);
CREATE INDEX idx_reports_prefecture_city ON reports(prefecture, city);

-- 地理空間インデックス（PostGIS）
CREATE INDEX idx_reports_geo ON reports USING GIST (
    ST_MakePoint(longitude, latitude)
);

-- 部分インデックス（削除されていないデータのみ）
CREATE INDEX idx_active_reports ON reports(created_at DESC) 
WHERE is_deleted = false;

-- テキスト検索インデックス
CREATE INDEX idx_reports_notes ON reports USING GIN (to_tsvector('japanese', notes));
```

### トリガー

```sql
-- updated_at 自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_reports_updated_at 
BEFORE UPDATE ON reports
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trust Score 自動計算トリガー
CREATE OR REPLACE FUNCTION calculate_trust_score()
RETURNS TRIGGER AS $$
BEGIN
    -- 基本スコア
    NEW.trust_score := 5;
    
    -- 位置精度による加点
    IF NEW.accuracy IS NOT NULL AND NEW.accuracy < 50 THEN
        NEW.trust_score := NEW.trust_score + 2;
    ELSIF NEW.accuracy IS NOT NULL AND NEW.accuracy < 100 THEN
        NEW.trust_score := NEW.trust_score + 1;
    END IF;
    
    -- デバイス情報の完全性による加点
    IF NEW.device_hash IS NOT NULL THEN
        NEW.trust_score := NEW.trust_score + 1;
    END IF;
    
    -- スコアの範囲制限
    IF NEW.trust_score > 10 THEN
        NEW.trust_score := 10;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER calculate_reports_trust_score 
BEFORE INSERT ON reports
FOR EACH ROW
EXECUTE FUNCTION calculate_trust_score();
```

---

### 2. abuse_log テーブル（レート制限管理）

不正利用防止のためのログテーブルです。

```sql
CREATE TABLE abuse_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- 識別情報
    ip_hash VARCHAR(255) NOT NULL,
    device_hash VARCHAR(255),
    session_hash VARCHAR(255),
    
    -- アクション情報
    action_type VARCHAR(50) NOT NULL,
    endpoint VARCHAR(255) NOT NULL,
    
    -- レート制限
    count INTEGER DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    window_end TIMESTAMP WITH TIME ZONE,
    
    -- ブロック情報
    is_blocked BOOLEAN DEFAULT false,
    blocked_until TIMESTAMP WITH TIME ZONE,
    block_reason TEXT,
    
    -- インデックス
    CONSTRAINT valid_action CHECK (
        action_type IN ('report_submission', 'api_call', 'export_request')
    )
);

-- インデックス
CREATE INDEX idx_abuse_log_ip_hash ON abuse_log(ip_hash);
CREATE INDEX idx_abuse_log_device_hash ON abuse_log(device_hash);
CREATE INDEX idx_abuse_log_window ON abuse_log(window_start, window_end);
CREATE INDEX idx_abuse_log_blocked ON abuse_log(is_blocked, blocked_until);
```

---

### 3. admin_users テーブル（管理者）

管理者アカウント管理用テーブルです。

```sql
CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 認証情報
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) DEFAULT 'viewer',
    
    -- プロフィール
    name VARCHAR(255),
    department VARCHAR(255),
    phone VARCHAR(50),
    
    -- アクセス制御
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP WITH TIME ZONE,
    login_count INTEGER DEFAULT 0,
    
    -- セキュリティ
    password_changed_at TIMESTAMP WITH TIME ZONE,
    two_factor_enabled BOOLEAN DEFAULT false,
    
    -- 制約
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'),
    CONSTRAINT valid_role CHECK (role IN ('super_admin', 'admin', 'editor', 'viewer'))
);

-- インデックス
CREATE INDEX idx_admin_users_email ON admin_users(email);
CREATE INDEX idx_admin_users_role ON admin_users(role);
CREATE INDEX idx_admin_users_active ON admin_users(is_active);
```

---

### 4. audit_log テーブル（監査ログ）

システムの重要な操作を記録する監査ログテーブルです。

```sql
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- アクター情報
    actor_id UUID,
    actor_type VARCHAR(50),
    actor_email VARCHAR(255),
    ip_address INET,
    
    -- アクション情報
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    
    -- 詳細
    old_values JSONB,
    new_values JSONB,
    metadata JSONB,
    
    -- 結果
    success BOOLEAN DEFAULT true,
    error_message TEXT
);

-- インデックス
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at DESC);
CREATE INDEX idx_audit_log_actor_id ON audit_log(actor_id);
CREATE INDEX idx_audit_log_action ON audit_log(action);
CREATE INDEX idx_audit_log_resource ON audit_log(resource_type, resource_id);
```

---

## 🔍 ビュー定義

### 1. reports_summary ビュー（統計サマリー）

```sql
CREATE VIEW reports_summary AS
SELECT 
    DATE(created_at) as report_date,
    category,
    prefecture,
    city,
    COUNT(*) as total_reports,
    AVG(trust_score) as avg_trust_score,
    SUM(CASE WHEN is_verified THEN 1 ELSE 0 END) as verified_count
FROM reports
WHERE is_deleted = false
GROUP BY DATE(created_at), category, prefecture, city;
```

### 2. hotspot_areas ビュー（ホットスポット）

```sql
CREATE VIEW hotspot_areas AS
SELECT 
    prefecture,
    city,
    ward,
    ST_AsGeoJSON(ST_Centroid(ST_Collect(ST_MakePoint(longitude, latitude)))) as center_point,
    COUNT(*) as report_count,
    array_agg(DISTINCT category) as categories
FROM reports
WHERE 
    is_deleted = false 
    AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY prefecture, city, ward
HAVING COUNT(*) >= 10
ORDER BY report_count DESC;
```

---

## 🔐 Row Level Security (RLS) ポリシー

### reports テーブルのRLSポリシー

```sql
-- RLSを有効化
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- 公開読み取りポリシー（削除されていないデータのみ）
CREATE POLICY "Public can view non-deleted reports" ON reports
    FOR SELECT
    USING (is_deleted = false);

-- 匿名ユーザーの投稿ポリシー
CREATE POLICY "Anyone can insert reports" ON reports
    FOR INSERT
    WITH CHECK (true);

-- 管理者の全権限ポリシー
CREATE POLICY "Admins can do everything" ON reports
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'admin');
```

---

## 🔄 マイグレーション戦略

### バージョン管理

```sql
-- マイグレーション履歴テーブル
CREATE TABLE schema_migrations (
    version VARCHAR(255) PRIMARY KEY,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT
);
```

### マイグレーションファイル命名規則

```
001_initial_schema.sql
002_add_trust_score.sql
003_add_geo_index.sql
004_add_audit_log.sql
```

---

## 📊 データ分析用クエリ

### 地域別集計

```sql
-- 市区町村別の報告数（過去30日）
SELECT 
    prefecture,
    city,
    ward,
    category,
    COUNT(*) as report_count,
    AVG(trust_score) as avg_trust_score
FROM reports
WHERE 
    created_at >= NOW() - INTERVAL '30 days'
    AND is_deleted = false
GROUP BY prefecture, city, ward, category
ORDER BY report_count DESC;
```

### 時系列分析

```sql
-- 日別・時間帯別の報告数
SELECT 
    DATE(created_at) as date,
    EXTRACT(HOUR FROM created_at) as hour,
    category,
    COUNT(*) as count
FROM reports
WHERE 
    created_at >= NOW() - INTERVAL '7 days'
    AND is_deleted = false
GROUP BY DATE(created_at), EXTRACT(HOUR FROM created_at), category
ORDER BY date DESC, hour;
```

### ホットスポット検出

```sql
-- 半径100m以内に10件以上の報告があるエリア
WITH clusters AS (
    SELECT 
        r1.id,
        r1.latitude,
        r1.longitude,
        COUNT(r2.id) as nearby_count
    FROM reports r1
    JOIN reports r2 ON 
        ST_DWithin(
            ST_MakePoint(r1.longitude, r1.latitude)::geography,
            ST_MakePoint(r2.longitude, r2.latitude)::geography,
            100  -- 100メートル
        )
    WHERE 
        r1.created_at >= NOW() - INTERVAL '7 days'
        AND r1.is_deleted = false
        AND r2.is_deleted = false
    GROUP BY r1.id, r1.latitude, r1.longitude
    HAVING COUNT(r2.id) >= 10
)
SELECT DISTINCT
    latitude,
    longitude,
    nearby_count
FROM clusters
ORDER BY nearby_count DESC;
```

---

## 🚀 パフォーマンス最適化

### 定期メンテナンス

```sql
-- 統計情報の更新
ANALYZE reports;

-- インデックスの再構築
REINDEX TABLE reports;

-- 不要な領域の回収
VACUUM ANALYZE reports;
```

### パーティショニング（将来の拡張）

```sql
-- 月別パーティショニング
CREATE TABLE reports_2025_01 PARTITION OF reports
FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE TABLE reports_2025_02 PARTITION OF reports
FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');
```

---

## 📈 容量見積もり

### データ容量予測

| 項目 | 値 |
|------|-----|
| 1レコードサイズ | 約2KB |
| 想定日次報告数 | 100-500件 |
| 年間データ量 | 約100-500MB |
| インデックスサイズ | データの約30% |
| バックアップ | 日次、30日保持 |

### スケーリング計画

1. **〜10万件**: 現行構成で対応
2. **10万〜100万件**: インデックス最適化
3. **100万件〜**: パーティショニング導入
4. **1000万件〜**: 読み取り専用レプリカ追加

---

## 🔄 バックアップとリカバリ

### バックアップポリシー

```bash
# 日次バックアップ
pg_dump -h [host] -U [user] -d [database] > backup_$(date +%Y%m%d).sql

# 週次フルバックアップ
pg_dumpall -h [host] -U [user] > full_backup_$(date +%Y%m%d).sql
```

### Point-in-Time Recovery (PITR)

Supabaseの自動バックアップ機能を利用：
- 日次自動バックアップ
- 7日間のPoint-in-Time Recovery
- 手動スナップショット

---

## 🔒 セキュリティ考慮事項

### データ暗号化

- **保存時**: Supabaseによる自動暗号化
- **転送時**: TLS/SSL必須
- **機密データ**: ハッシュ化して保存

### アクセス制御

```sql
-- 最小権限の原則
GRANT SELECT ON reports TO readonly_user;
GRANT INSERT ON reports TO app_user;
GRANT ALL ON reports TO admin_user;
```

### 個人情報保護

- IPアドレスは必ずハッシュ化
- 位置情報の精度調整オプション
- 定期的な古いデータの削除

---

## 📚 関連ドキュメント

- [アーキテクチャドキュメント](./ARCHITECTURE.md)
- [API仕様書](./API_SPECIFICATION.md)
- [セットアップガイド](./SETUP_GUIDE.md)

---

**最終更新:** 2025年11月9日  
**ドキュメントバージョン:** 1.0
