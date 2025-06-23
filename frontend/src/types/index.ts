// 報告カテゴリ
export type ReportCategory = 'walk_smoke' | 'stand_smoke' | 'litter';

// 報告データ
export interface Report {
  id: string;
  reported_at: string;
  lat: number;
  lon: number;
  prefecture: string;
  city: string;
  category: ReportCategory;
  confidence_score: number;
}

// 報告投稿リクエスト
export interface ReportSubmission {
  lat: number;
  lon: number;
  category: ReportCategory;
  ip_hash?: string;
  fp_hash?: string;
}

// ヒートマップデータ
export interface HeatmapData {
  type: 'FeatureCollection';
  features: HeatmapFeature[];
}

export interface HeatmapFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  properties: {
    count: number;
    category?: ReportCategory;
  };
}

// API レスポンス
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 位置情報
export interface Location {
  lat: number;
  lon: number;
  accuracy?: number;
}

// 管理者統計
export interface AdminStats {
  total_reports: number;
  daily_reports: number;
  weekly_reports: number;
  monthly_reports: number;
  category_breakdown: Record<ReportCategory, number>;
  top_locations: Array<{
    prefecture: string;
    city: string;
    count: number;
  }>;
}