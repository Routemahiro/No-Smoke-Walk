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
  
  async getHeatmapStats() {
    const response = await fetch(`${this.baseUrl}/api/heatmap/stats`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch statistics');
    }
    
    return response.json();
  },

  async exportCSV(params?: {
    category?: string;
    start_date?: string;
    end_date?: string;
    prefecture?: string;
    city?: string;
  }) {
    const searchParams = new URLSearchParams();
    
    if (params?.category) searchParams.set('category', params.category);
    if (params?.start_date) searchParams.set('start_date', params.start_date);
    if (params?.end_date) searchParams.set('end_date', params.end_date);
    if (params?.prefecture) searchParams.set('prefecture', params.prefecture);
    if (params?.city) searchParams.set('city', params.city);
    
    const url = `${this.baseUrl}/api/admin/export/csv${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to export CSV');
    }
    
    // Get filename from response headers
    const disposition = response.headers.get('Content-Disposition');
    const filename = disposition?.match(/filename="([^"]+)"/)?.[1] || 'reports.csv';
    
    // Create blob and download
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  },

  async exportExcel(params?: {
    category?: string;
    start_date?: string;
    end_date?: string;
    prefecture?: string;
    city?: string;
  }) {
    const searchParams = new URLSearchParams();
    
    if (params?.category) searchParams.set('category', params.category);
    if (params?.start_date) searchParams.set('start_date', params.start_date);
    if (params?.end_date) searchParams.set('end_date', params.end_date);
    if (params?.prefecture) searchParams.set('prefecture', params.prefecture);
    if (params?.city) searchParams.set('city', params.city);
    
    const url = `${this.baseUrl}/api/admin/export/excel${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to export Excel');
    }
    
    // Get filename from response headers
    const disposition = response.headers.get('Content-Disposition');
    const filename = disposition?.match(/filename="([^"]+)"/)?.[1] || 'reports.xlsx';
    
    // Create blob and download
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  }
};