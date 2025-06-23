import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// API client for backend communication
export const apiClient = {
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8787',
  
  async submitReport(data: {
    lat: number;
    lon: number;
    category: 'walk_smoke' | 'stand_smoke' | 'litter';
  }) {
    const response = await fetch(`${this.baseUrl}/api/reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to submit report');
    }
    
    return response.json();
  },
  
  async getHeatmapData(params?: {
    category?: string;
    days?: number;
    min_reports?: number;
  }) {
    const searchParams = new URLSearchParams();
    
    if (params?.category) searchParams.set('category', params.category);
    if (params?.days) searchParams.set('days', params.days.toString());
    if (params?.min_reports) searchParams.set('min_reports', params.min_reports.toString());
    
    const url = `${this.baseUrl}/api/heatmap${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch heatmap data');
    }
    
    return response.json();
  },
  
  async getHeatmapStats() {
    const response = await fetch(`${this.baseUrl}/api/heatmap/stats`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch statistics');
    }
    
    return response.json();
  }
};