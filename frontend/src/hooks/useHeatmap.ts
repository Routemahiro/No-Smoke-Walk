'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/supabase';
import { HeatmapData } from '@/types';

interface HeatmapState {
  data: HeatmapData | null;
  loading: boolean;
  error: string | null;
}

interface HeatmapFilters {
  category?: 'walk_smoke' | 'stand_smoke' | 'litter';
  days?: number;
  minReports?: number;
}

export function useHeatmap(filters: HeatmapFilters = {}) {
  const [state, setState] = useState<HeatmapState>({
    data: null,
    loading: false,
    error: null,
  });

  const fetchHeatmapData = async (customFilters?: HeatmapFilters) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const params = { ...filters, ...customFilters };
      const response = await apiClient.getHeatmapData(params);
      
      if (response.success) {
        setState(prev => ({
          ...prev,
          data: response.data,
          loading: false,
        }));
      } else {
        throw new Error(response.error || 'Failed to fetch heatmap data');
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to fetch heatmap data',
        loading: false,
      }));
    }
  };

  const refreshData = () => {
    fetchHeatmapData();
  };

  const updateFilters = (newFilters: HeatmapFilters) => {
    fetchHeatmapData(newFilters);
  };

  const clearError = () => {
    setState(prev => ({ ...prev, error: null }));
  };

  // Auto-fetch on mount
  useEffect(() => {
    fetchHeatmapData();
  }, []);

  return {
    ...state,
    refreshData,
    updateFilters,
    clearError,
  };
}