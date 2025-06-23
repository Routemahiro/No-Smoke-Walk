'use client';

import { useState, useEffect } from 'react';
import { Location } from '@/types';

interface GeolocationState {
  location: Location | null;
  error: string | null;
  loading: boolean;
}

export function useGeolocation(enableHighAccuracy = true) {
  const [state, setState] = useState<GeolocationState>({
    location: null,
    error: null,
    loading: false,
  });

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: 'このブラウザは位置情報に対応していません',
        loading: false,
      }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    const options: PositionOptions = {
      enableHighAccuracy,
      timeout: 10000,
      maximumAge: 60000, // Cache for 1 minute
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude: lat, longitude: lon, accuracy } = position.coords;
        
        // Validate coordinates are within Japan bounds
        if (lat < 24 || lat > 46 || lon < 123 || lon > 146) {
          setState(prev => ({
            ...prev,
            error: '日本国内の位置情報のみ対応しています',
            loading: false,
          }));
          return;
        }

        setState(prev => ({
          ...prev,
          location: { lat, lon, accuracy },
          loading: false,
          error: null,
        }));
      },
      (error) => {
        let errorMessage = '位置情報の取得に失敗しました';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = '位置情報のアクセスが拒否されました。ブラウザの設定を確認してください。';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = '位置情報が利用できません。';
            break;
          case error.TIMEOUT:
            errorMessage = '位置情報の取得がタイムアウトしました。再度お試しください。';
            break;
        }

        setState(prev => ({
          ...prev,
          error: errorMessage,
          loading: false,
        }));
      },
      options
    );
  };

  const clearError = () => {
    setState(prev => ({ ...prev, error: null }));
  };

  const setManualLocation = (location: Location) => {
    // Validate coordinates
    if (location.lat < 24 || location.lat > 46 || location.lon < 123 || location.lon > 146) {
      setState(prev => ({
        ...prev,
        error: '日本国内の座標を入力してください',
      }));
      return;
    }

    setState(prev => ({
      ...prev,
      location,
      error: null,
    }));
  };

  // Auto-get location on mount if supported
  useEffect(() => {
    if (navigator.geolocation) {
      getCurrentLocation();
    }
  }, []);

  return {
    ...state,
    getCurrentLocation,
    clearError,
    setManualLocation,
    isSupported: !!navigator.geolocation,
  };
}