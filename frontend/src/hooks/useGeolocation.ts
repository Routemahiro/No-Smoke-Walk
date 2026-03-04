'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Location } from '@/types';

const AUTO_FETCH_KEY = 'geolocation-auto-fetch';
const LAST_LOCATION_KEY = 'geolocation-last-location';
const PERMISSION_GRANTED_KEY = 'geolocation-permission-granted';
const AUTO_REFRESH_INTERVAL_MS = 20000; // 20s
const WATCH_UPDATE_MIN_INTERVAL_MS = 15000; // 15s

export const GEOLOCATION_AUTO_FETCH_CHANGED_EVENT = 'geolocation-auto-fetch-changed';

interface GeolocationState {
  location: Location | null;
  error: string | null;
  loading: boolean;
  isWatching: boolean;
}

interface GetCurrentLocationOptions {
  silent?: boolean;
  forceFresh?: boolean;
}

export function useGeolocation(enableHighAccuracy = true) {
  const [state, setState] = useState<GeolocationState>({
    location: null,
    error: null,
    loading: false,
    isWatching: false,
  });
  const [autoFetchEnabled, setAutoFetchEnabled] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  const autoRefreshTimerRef = useRef<number | null>(null);
  const lastWatchUpdateRef = useRef(0);

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

  const markPermissionGranted = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(PERMISSION_GRANTED_KEY, 'true');
    } catch {
      // ignore storage errors
    }
  }, []);

  const clearPermissionGranted = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(PERMISSION_GRANTED_KEY);
    } catch {
      // ignore storage errors
    }
  }, []);

  const hasPermissionBeenGranted = useCallback((): boolean => {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem(PERMISSION_GRANTED_KEY) === 'true';
    } catch {
      return false;
    }
  }, []);

  const applyLocation = useCallback(
    (location: Location, silent = false) => {
      if (location.lat < 24 || location.lat > 46 || location.lon < 123 || location.lon > 146) {
        if (!silent) {
          setState(prev => ({
            ...prev,
            error: '日本国内の位置情報のみ対応しています',
            loading: false,
          }));
        }
        return false;
      }

      setState(prev => ({
        ...prev,
        location,
        loading: false,
        error: null,
      }));
      saveLastLocation(location);
      markPermissionGranted();
      return true;
    },
    [markPermissionGranted, saveLastLocation]
  );

  const getCurrentLocation = useCallback(
    (options: GetCurrentLocationOptions = {}) => {
      const { silent = false, forceFresh = false } = options;

      if (typeof window === 'undefined' || !navigator.geolocation) {
        if (!silent) {
          setState(prev => ({
            ...prev,
            error: 'このブラウザは位置情報に対応していません',
            loading: false,
          }));
        }
        return;
      }

      // HTTPS is required for geolocation on mobile browsers
      if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        if (!silent) {
          setState(prev => ({
            ...prev,
            error: '位置情報機能にはHTTPS接続が必要です',
            loading: false,
          }));
        }
        return;
      }

      if (!silent) {
        setState(prev => ({ ...prev, loading: true, error: null }));
      }

      const geolocationOptions: PositionOptions = {
        enableHighAccuracy,
        timeout: silent ? 10000 : 15000,
        maximumAge: forceFresh ? 0 : (silent ? 15000 : 30000),
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude: lat, longitude: lon, accuracy } = position.coords;
          applyLocation({ lat, lon, accuracy }, silent);
        },
        (geoError) => {
          if (geoError.code === geoError.PERMISSION_DENIED) {
            clearPermissionGranted();
          }

          if (silent) {
            return;
          }

          let errorMessage = '位置情報の取得に失敗しました';
          switch (geoError.code) {
            case geoError.PERMISSION_DENIED:
              errorMessage = '位置情報のアクセスが拒否されました。スマートフォンの場合は、ブラウザの設定で位置情報を許可してください。';
              break;
            case geoError.POSITION_UNAVAILABLE:
              errorMessage = '位置情報が利用できません。GPS機能を有効にしてください。';
              break;
            case geoError.TIMEOUT:
              errorMessage = '位置情報の取得がタイムアウトしました。屋外で再度お試しください。';
              break;
          }

          setState(prev => ({
            ...prev,
            error: errorMessage,
            loading: false,
          }));
        },
        geolocationOptions
      );
    },
    [applyLocation, clearPermissionGranted, enableHighAccuracy]
  );

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

    if (watchIdRef.current !== null) {
      return;
    }

    setState(prev => ({ ...prev, isWatching: true, error: null }));
    lastWatchUpdateRef.current = 0;

    const watchOptions: PositionOptions = {
      enableHighAccuracy,
      timeout: 12000,
      maximumAge: 10000,
    };

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const now = Date.now();
        if (now - lastWatchUpdateRef.current < WATCH_UPDATE_MIN_INTERVAL_MS) {
          return;
        }
        lastWatchUpdateRef.current = now;

        const { latitude: lat, longitude: lon, accuracy } = position.coords;
        applyLocation({ lat, lon, accuracy }, true);
      },
      (geoError) => {
        if (geoError.code === geoError.PERMISSION_DENIED) {
          clearPermissionGranted();
        }

        let errorMessage = 'リアルタイム位置追跡でエラーが発生しました';
        switch (geoError.code) {
          case geoError.PERMISSION_DENIED:
            errorMessage = '位置情報のアクセスが拒否されました';
            break;
          case geoError.POSITION_UNAVAILABLE:
            errorMessage = '位置情報が利用できません';
            break;
          case geoError.TIMEOUT:
            errorMessage = '位置情報の取得がタイムアウトしました';
            break;
        }

        watchIdRef.current = null;
        setState(prev => ({
          ...prev,
          error: errorMessage,
          isWatching: false,
        }));
      },
      watchOptions
    );

    watchIdRef.current = watchId;
  }, [applyLocation, clearPermissionGranted, enableHighAccuracy]);

  const stopWatching = useCallback((skipStateUpdate = false) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      return;
    }

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (!skipStateUpdate) {
      setState(prev => ({ ...prev, isWatching: false }));
    }
  }, []);

  const startAutoRefreshTimer = useCallback(() => {
    if (typeof window === 'undefined' || autoRefreshTimerRef.current !== null) {
      return;
    }

    autoRefreshTimerRef.current = window.setInterval(() => {
      getCurrentLocation({ silent: true, forceFresh: true });
    }, AUTO_REFRESH_INTERVAL_MS);
  }, [getCurrentLocation]);

  const stopAutoRefreshTimer = useCallback(() => {
    if (typeof window === 'undefined' || autoRefreshTimerRef.current === null) {
      return;
    }
    window.clearInterval(autoRefreshTimerRef.current);
    autoRefreshTimerRef.current = null;
  }, []);

  // Keep auto-fetch setting in sync across components/tabs.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const syncAutoFetchSetting = () => {
      setAutoFetchEnabled(localStorage.getItem(AUTO_FETCH_KEY) === 'true');
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === AUTO_FETCH_KEY) {
        syncAutoFetchSetting();
      }
    };

    const handleLocalEvent = (event: Event) => {
      const detail = (event as CustomEvent<{ enabled?: boolean }>).detail;
      if (typeof detail?.enabled === 'boolean') {
        setAutoFetchEnabled(detail.enabled);
      } else {
        syncAutoFetchSetting();
      }
    };

    syncAutoFetchSetting();
    window.addEventListener('storage', handleStorage);
    window.addEventListener(GEOLOCATION_AUTO_FETCH_CHANGED_EVENT, handleLocalEvent as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(GEOLOCATION_AUTO_FETCH_CHANGED_EVENT, handleLocalEvent as EventListener);
    };
  }, []);

  // Auto-fetch ON: load last location immediately + start realtime tracking only when permission is usable.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let cancelled = false;
    let permissionStatus: PermissionStatus | null = null;
    let permissionChangeListener: (() => void) | null = null;

    const stopRealtimeTracking = () => {
      stopAutoRefreshTimer();
      stopWatching();
    };

    const startRealtimeTracking = () => {
      if (cancelled) return;
      startWatching();
      startAutoRefreshTimer();
      getCurrentLocation({ silent: true, forceFresh: true });
    };

    const handlePermissionState = (state: PermissionState) => {
      if (state === 'granted') {
        startRealtimeTracking();
        return;
      }

      stopRealtimeTracking();
      if (state === 'denied') {
        clearPermissionGranted();
      }
    };

    const initialize = async () => {
      if (!autoFetchEnabled) {
        stopRealtimeTracking();
        return;
      }

      // Show last known location instantly (no prompt).
      const saved = loadLastLocation();
      if (saved) {
        setState(prev => ({
          ...prev,
          location: prev.location ?? saved,
          error: null,
        }));
      }

      if (!navigator.geolocation) {
        return;
      }

      const permissionsApi = (navigator as unknown as { permissions?: Permissions }).permissions ?? null;
      if (permissionsApi?.query) {
        try {
          permissionStatus = await permissionsApi.query({ name: 'geolocation' as PermissionName });
          if (cancelled || !permissionStatus) return;

          handlePermissionState(permissionStatus.state);
          permissionChangeListener = () => {
            if (!permissionStatus || cancelled) return;
            handlePermissionState(permissionStatus.state);
          };
          permissionStatus.addEventListener?.('change', permissionChangeListener);
          return;
        } catch {
          // Ignore Permissions API errors and fall back to stored grant state.
        }
      }

      // Fallback for browsers where Permissions API is unavailable.
      if (hasPermissionBeenGranted()) {
        startRealtimeTracking();
      } else {
        stopRealtimeTracking();
      }
    };

    initialize();

    return () => {
      cancelled = true;
      if (permissionStatus && permissionChangeListener) {
        permissionStatus.removeEventListener?.('change', permissionChangeListener);
      }
      stopAutoRefreshTimer();
      stopWatching(true);
    };
  }, [
    autoFetchEnabled,
    clearPermissionGranted,
    getCurrentLocation,
    hasPermissionBeenGranted,
    loadLastLocation,
    startAutoRefreshTimer,
    startWatching,
    stopAutoRefreshTimer,
    stopWatching,
  ]);

  return {
    ...state,
    getCurrentLocation,
    clearError,
    setManualLocation,
    startWatching,
    stopWatching,
    isSupported: typeof navigator !== 'undefined' && !!navigator.geolocation,
  };
}