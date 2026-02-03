'use client';

import { useState, useEffect, useCallback } from 'react';
import { Location } from '@/types';

const AUTO_FETCH_KEY = 'geolocation-auto-fetch';
const LAST_LOCATION_KEY = 'geolocation-last-location';

interface GeolocationState {
  location: Location | null;
  error: string | null;
  loading: boolean;
  isWatching: boolean;
}

export function useGeolocation(enableHighAccuracy = true) {
  const [state, setState] = useState<GeolocationState>({
    location: null,
    error: null,
    loading: false,
    isWatching: false,
  });
  const [watchId, setWatchId] = useState<number | null>(null);

  const saveLastLocation = useCallback((location: Location) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(LAST_LOCATION_KEY, JSON.stringify({ ...location, ts: Date.now() }));
    } catch {
      // ignore storage errors (private mode, quota, etc.)
    }
  }, []);

  const loadLastLocation = useCallback((): Location | null => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(LAST_LOCATION_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Partial<Location> & { ts?: number };
      const lat = typeof parsed.lat === 'number' ? parsed.lat : null;
      const lon = typeof parsed.lon === 'number' ? parsed.lon : null;
      const accuracy = typeof parsed.accuracy === 'number' ? parsed.accuracy : undefined;
      if (lat === null || lon === null) return null;
      // Validate coordinates are within Japan bounds
      if (lat < 24 || lat > 46 || lon < 123 || lon > 146) return null;
      return { lat, lon, accuracy };
    } catch {
      return null;
    }
  }, []);

  const getCurrentLocation = useCallback(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: 'このブラウザは位置情報に対応していません',
        loading: false,
      }));
      return;
    }

    // Check if the site is running on HTTPS (required for geolocation on mobile)
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      setState(prev => ({
        ...prev,
        error: '位置情報機能にはHTTPS接続が必要です',
        loading: false,
      }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    const options: PositionOptions = {
      enableHighAccuracy,
      timeout: 15000, // Increased timeout for mobile
      maximumAge: 30000, // Reduced cache time for more accuracy
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude: lat, longitude: lon, accuracy } = position.coords;
        console.log('📍 Location obtained:', { lat, lon, accuracy });
        
        // Validate coordinates are within Japan bounds
        if (lat < 24 || lat > 46 || lon < 123 || lon > 146) {
          console.log('📍 Location outside Japan bounds');
          setState(prev => ({
            ...prev,
            error: '日本国内の位置情報のみ対応しています',
            loading: false,
          }));
          return;
        }

        const newLocation = { lat, lon, accuracy };
        console.log('📍 Setting location state:', newLocation);
        setState(prev => ({
          ...prev,
          location: newLocation,
          loading: false,
          error: null,
        }));
        saveLastLocation(newLocation);
      },
      (error) => {
        let errorMessage = '位置情報の取得に失敗しました';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = '位置情報のアクセスが拒否されました。スマートフォンの場合は、ブラウザの設定で位置情報を許可してください。';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = '位置情報が利用できません。GPS機能を有効にしてください。';
            break;
          case error.TIMEOUT:
            errorMessage = '位置情報の取得がタイムアウトしました。屋外で再度お試しください。';
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
  }, [enableHighAccuracy, saveLastLocation]);


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
    saveLastLocation(location);
  };

  const startWatching = useCallback(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: 'このブラウザは位置情報に対応していません',
      }));
      return;
    }

    if (watchId) {
      console.log('📍 Already watching position');
      return;
    }

    console.log('📍 Starting position watch');
    setState(prev => ({ ...prev, isWatching: true, error: null }));

    const options: PositionOptions = {
      enableHighAccuracy,
      timeout: 10000,
      maximumAge: 5000, // Update more frequently for real-time tracking
    };

    const id = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude: lat, longitude: lon, accuracy } = position.coords;
        console.log('📍 Position updated:', { lat, lon, accuracy });
        
        // Validate coordinates are within Japan bounds
        if (lat < 24 || lat > 46 || lon < 123 || lon > 146) {
          console.log('📍 Location outside Japan bounds');
          return;
        }

        const newLocation = { lat, lon, accuracy };
        setState(prev => ({
          ...prev,
          location: newLocation,
          error: null,
        }));
        saveLastLocation(newLocation);
      },
      (error) => {
        console.error('📍 Watch position error:', error);
        let errorMessage = 'リアルタイム位置追跡でエラーが発生しました';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = '位置情報のアクセスが拒否されました';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = '位置情報が利用できません';
            break;
          case error.TIMEOUT:
            errorMessage = '位置情報の取得がタイムアウトしました';
            break;
        }

        setState(prev => ({
          ...prev,
          error: errorMessage,
          isWatching: false,
        }));
        setWatchId(null);
      },
      options
    );

    setWatchId(id);
  }, [enableHighAccuracy, saveLastLocation, watchId]);

  const stopWatching = useCallback(() => {
    if (watchId && typeof window !== 'undefined') {
      console.log('📍 Stopping position watch');
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
      setState(prev => ({ ...prev, isWatching: false }));
    }
  }, [watchId]);

  // Auto-get location on mount if user has enabled auto-fetch
  useEffect(() => {
    // Check if we're in the browser environment
    if (typeof window === 'undefined') return;
    
    // Check localStorage for auto-fetch setting
    const autoFetchEnabled = localStorage.getItem(AUTO_FETCH_KEY) === 'true';
    
    console.log('📍 useGeolocation hook mounted, navigator.geolocation available:', !!navigator.geolocation);
    console.log('📍 Auto-fetch enabled:', autoFetchEnabled);
    let cancelled = false;

    if (autoFetchEnabled) {
      // 1) Immediately use last saved location (no permission prompt)
      const saved = loadLastLocation();
      if (saved) {
        setState(prev => ({
          ...prev,
          location: prev.location ?? saved,
          error: null,
        }));
      }

      // 2) Only auto-refresh location when permission is already granted
      //    (avoids re-triggering the permission prompt on some browsers/OS)
      const permissionsApi = (navigator as unknown as { permissions?: Permissions }).permissions ?? null;
      if (navigator.geolocation && permissionsApi) {
        (async () => {
          try {
            const status = await permissionsApi.query({ name: 'geolocation' as PermissionName });
            if (cancelled) return;
            if (status.state !== 'granted') return;

            const options: PositionOptions = {
              enableHighAccuracy,
              timeout: 8000,
              maximumAge: 5 * 60 * 1000, // allow cached position up to 5 minutes
            };

            navigator.geolocation.getCurrentPosition(
              (position) => {
                if (cancelled) return;
                const { latitude: lat, longitude: lon, accuracy } = position.coords;
                // Validate Japan bounds
                if (lat < 24 || lat > 46 || lon < 123 || lon > 146) return;
                const newLocation = { lat, lon, accuracy };
                setState(prev => ({
                  ...prev,
                  location: newLocation,
                  error: null,
                }));
                saveLastLocation(newLocation);
              },
              () => {
                // Silent fail: user can manually retry via button
              },
              options
            );
          } catch {
            // Permissions API errors: do nothing (avoid prompting)
          }
        })();
      }
    }

    // Cleanup watch on unmount
    return () => {
      cancelled = true;
      if (watchId && typeof window !== 'undefined') {
        console.log('📍 Cleaning up position watch on unmount');
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [enableHighAccuracy, loadLastLocation, saveLastLocation, watchId]);

  // Debug log current state (only in browser)
  if (typeof window !== 'undefined') {
    console.log('📍 useGeolocation current state:', {
      hasLocation: !!state.location,
      loading: state.loading,
      error: state.error
    });
  }

  return {
    ...state,
    getCurrentLocation,
    clearError,
    setManualLocation,
    startWatching,
    stopWatching,
    isSupported: !!navigator.geolocation,
  };
}