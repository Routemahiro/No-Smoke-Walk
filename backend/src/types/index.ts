// 報告カテゴリ
export type ReportCategory = 'walk_smoke' | 'stand_smoke' | 'litter';

// データベース報告テーブル
export interface DbReport {
  id: string;
  reported_at: string;
  lat: number;
  lon: number;
  prefecture: string;
  city: string;
  category: ReportCategory;
  ip_hash: string;
  fp_hash: string;
  confidence_score: number;
}

// 報告投稿リクエスト
export interface ReportSubmissionRequest {
  lat?: number;
  lon?: number;
  latitude?: number;
  longitude?: number;
  category: ReportCategory;
}

// ヒートマップレスポンス
export interface HeatmapResponse {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    geometry: {
      type: 'Point';
      coordinates: [number, number]; // [lng, lat]
    };
    properties: {
      count: number;
      category?: ReportCategory | null;
      categories?: Record<string, number>;
      intensity?: number;
    };
  }>;
}

// 不正対策データ
export interface AbuseGuardRecord {
  id: string;
  ip_hash: string;
  fp_hash: string;
  report_count: number;
  window_start: string;
  created_at: string;
}

// API レスポンス共通型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 環境変数型
export interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  EXPORT_SECRET_KEY?: string;
  CACHE?: KVNamespace;
  ABUSE_GUARD?: string;
  ENVIRONMENT?: string;
}
