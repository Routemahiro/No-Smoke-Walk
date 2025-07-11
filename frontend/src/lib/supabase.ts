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
    category: 'walk_smoke' | 'stand_smoke';
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
    userLat?: number;
    userLon?: number;
  }) {
    const searchParams = new URLSearchParams();
    
    if (params?.category) searchParams.set('category', params.category);
    if (params?.days) searchParams.set('days', params.days.toString());
    if (params?.min_reports) searchParams.set('min_reports', params.min_reports.toString());
    if (params?.userLat) searchParams.set('userLat', params.userLat.toString());
    if (params?.userLon) searchParams.set('userLon', params.userLon.toString());
    
    const url = `${this.baseUrl}/api/heatmap${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(error.error || 'Failed to fetch heatmap data');
      }
      
      return response.json();
    } catch (fetchError) {
      // Specifically handle connection refused and network errors
      console.error('API fetch failed:', fetchError);
      throw new Error('CONNECTION_REFUSED');
    }
  },
  
};