'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/supabase';
import { HeatmapData } from '@/types';

interface HeatmapState {
  data: HeatmapData | null;
  loading: boolean;
  error: string | null;
  isUsingFallbackData: boolean;
}

interface HeatmapFilters {
  category?: 'walk_smoke' | 'stand_smoke';
  days?: number;
  minReports?: number;
  userLocation?: {
    lat: number;
    lon: number;
  };
}

export function useHeatmap(filters: HeatmapFilters = {}) {
  const [state, setState] = useState<HeatmapState>({
    data: null,
    loading: false,
    error: null,
    isUsingFallbackData: false,
  });

  const fetchHeatmapData = useCallback(async (customFilters?: HeatmapFilters) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const mergedFilters = { ...filters, ...customFilters };
      // Convert minReports to min_reports to match API expectations
      const params = {
        category: mergedFilters.category,
        days: mergedFilters.days,
        min_reports: mergedFilters.minReports,
        userLat: mergedFilters.userLocation?.lat,
        userLon: mergedFilters.userLocation?.lon
      };
      
      console.log('🌍 Fetching heatmap data with params:', params);
      const response = await apiClient.getHeatmapData(params);
      console.log('🌍 Heatmap response received:', response);
      
      if (response.success) {
        console.log('🌍 Heatmap data set successfully:', response.data);
        setState(prev => ({
          ...prev,
          data: response.data,
          loading: false,
          isUsingFallbackData: false,
        }));
      } else {
        console.error('🌍 Heatmap API error:', response.error);
        throw new Error(response.error || 'Failed to fetch heatmap data');
      }
    } catch (error) {
      console.error('Heatmap fetch error:', error);
      
      // Check if it's a connection error and provide fallback data
      const isConnectionError = error instanceof Error && 
        (error.message.includes('CONNECTION_REFUSED') || error.message.includes('Failed to fetch'));
      
      if (isConnectionError) {
        console.warn('Backend connection failed, using fallback demo data');
        const fallbackData: HeatmapData = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [135.5023, 34.6937] // Osaka center
            },
            properties: {
              count: 5,
              category: 'walk_smoke'
            }
          },
          {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [135.5100, 34.6900] // Near Osaka
            },
            properties: {
              count: 2,
              category: 'stand_smoke'
            }
          },
          {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [135.4950, 34.6980] // Near Osaka
            },
            properties: {
              count: 3,
              category: 'walk_smoke'
            }
          }
        ]
      };
      
        setState(prev => ({
          ...prev,
          data: fallbackData,
          loading: false,
          error: null, // Clear error when using fallback
          isUsingFallbackData: true,
        }));
        return;
      }
      
      // For non-connection errors, show error message
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'ヒートマップデータの取得に失敗しました';
      
      setState(prev => ({
        ...prev,
        error: errorMessage,
        loading: false,
        isUsingFallbackData: false,
      }));
    }
  }, [filters]);

  const refreshData = () => {
    fetchHeatmapData();
  };

  const updateFilters = (newFilters: HeatmapFilters) => {
    fetchHeatmapData(newFilters);
  };

  const clearError = () => {
    setState(prev => ({ ...prev, error: null }));
  };

  // Auto-fetch on mount and when user location changes
  useEffect(() => {
    fetchHeatmapData();
  }, [filters.userLocation?.lat, filters.userLocation?.lon, fetchHeatmapData]);

  return {
    ...state,
    refreshData,
    updateFilters,
    clearError,
  };
}