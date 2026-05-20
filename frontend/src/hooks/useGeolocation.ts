'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Location } from '@/types';

const LAST_LOCATION_KEY = 'geolocation-last-location';
const PERMISSION_GRANTED_KEY = 'geolocation-permission-granted';
const WATCH_UPDATE_MIN_INTERVAL_MS = 15000;
const FRESH_LOCATION_TTL_MS = 2 * 60 * 1000;
const LAST_KNOWN_LOCATION_TTL_MS = 24 * 60 * 60 * 1000;

type GeolocationPermissionState = PermissionState | 'unknown';
type LocationSource = 'fresh' | 'watch' | 'manual' | null;

interface StoredLocation extends Location {
  ts?: number;
}

interface LoadedStoredLocation {
  location: Location;
  ageMs: number;
  isFresh: boolean;
}

interface GeolocationState {
  location: Location | null;
  lastKnownLocation: Location | null;
  lastLocationAgeMs: number | null;
  locationSource: LocationSource;
  permissionState: GeolocationPermissionState;
  error: string | null;
  loading: boolean;
  isWatching: boolean;
}

interface GetCurrentLocationOptions {
  silent?: boolean;
  forceFresh?: boolean;
}

const isValidJapanLocation = (location: Location) =>
  location.lat >= 24 && location.lat <= 46 && location.lon >= 123 && location.lon <= 146;

export function useGeolocation(enableHighAccuracy = true) {
  const [state, setState] = useState<GeolocationState>({
    location: null,
    lastKnownLocation: null,
    lastLocationAgeMs: null,
    locationSource: null,
    permissionState: 'unknown',
    error: null,
    loading: false,
    isWatching: false,
  });
  const watchIdRef = useRef<number | null>(null);
  const lastWatchUpdateRef = useRef(0);

  const saveLastLocation = useCallback((location: Location) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(LAST_LOCATION_KEY, JSON.stringify({ ...location, ts: Date.now() }));
    } catch {
      // Storage may be unavailable in private browsing.
    }
  }, []);

  const removeStoredLocation = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(LAST_LOCATION_KEY);
    } catch {
      // Ignore storage errors.
    }
  }, []);

  const loadLastLocation = useCallback((): LoadedStoredLocation | null => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(LAST_LOCATION_KEY);
      if (!raw) return null;

      const parsed = JSON.parse(raw) as Partial<StoredLocation>;
      const lat = typeof parsed.lat === 'number' ? parsed.lat : null;
      const lon = typeof parsed.lon === 'number' ? parsed.lon : null;
      const accuracy = typeof parsed.accuracy === 'number' ? parsed.accuracy : undefined;
      const ts = typeof parsed.ts === 'number' ? parsed.ts : null;

      if (lat === null || lon === null || ts === null) {
        removeStoredLocation();
        return null;
      }

      const location = { lat, lon, accuracy };
      if (!isValidJapanLocation(location)) {
        removeStoredLocation();
        return null;
      }

      const ageMs = Date.now() - ts;
      if (ageMs < 0 || ageMs > LAST_KNOWN_LOCATION_TTL_MS) {
        removeStoredLocation();
        return null;
      }

      return {
        location,
        ageMs,
        isFresh: ageMs <= FRESH_LOCATION_TTL_MS,
      };
    } catch {
      return null;
    }
  }, [removeStoredLocation]);

  const markPermissionGranted = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(PERMISSION_GRANTED_KEY, 'true');
    } catch {
      // Ignore storage errors.
    }
  }, []);

  const clearPermissionGranted = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(PERMISSION_GRANTED_KEY);
    } catch {
      // Ignore storage errors.
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
    (location: Location, silent = false, source: LocationSource = 'fresh') => {
      if (!isValidJapanLocation(location)) {
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
        lastKnownLocation: location,
        lastLocationAgeMs: 0,
        locationSource: source,
        permissionState: 'granted',
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
    (options: GetCurrentLocationOptions = {}): Promise<Location | null> => {
      const { silent = false, forceFresh = false } = options;

      if (typeof window === 'undefined' || !navigator.geolocation) {
        if (!silent) {
          setState(prev => ({
            ...prev,
            error: 'このブラウザは位置情報に対応していません',
            loading: false,
          }));
        }
        return Promise.resolve(null);
      }

      if (!window.isSecureContext) {
        if (!silent) {
          setState(prev => ({
            ...prev,
            error: '位置情報機能にはHTTPS接続が必要です',
            loading: false,
          }));
        }
        return Promise.resolve(null);
      }

      if (!silent) {
        setState(prev => ({ ...prev, loading: true, error: null }));
      }

      const geolocationOptions: PositionOptions = {
        enableHighAccuracy,
        timeout: silent ? 10000 : 15000,
        maximumAge: forceFresh ? 0 : silent ? 15000 : 30000,
      };

      return new Promise(resolve => {
        navigator.geolocation.getCurrentPosition(
          position => {
            const { latitude: lat, longitude: lon, accuracy } = position.coords;
            const location = { lat, lon, accuracy };
            const applied = applyLocation(location, silent, 'fresh');
            resolve(applied ? location : null);
          },
          geoError => {
            if (geoError.code === geoError.PERMISSION_DENIED) {
              clearPermissionGranted();
              setState(prev => ({ ...prev, permissionState: 'denied' }));
            }

            if (silent) {
              resolve(null);
              return;
            }

            let errorMessage = '位置情報の取得に失敗しました';
            switch (geoError.code) {
              case geoError.PERMISSION_DENIED:
                errorMessage = '位置情報のアクセスが拒否されました。ブラウザの設定で位置情報を許可してください。';
                break;
              case geoError.POSITION_UNAVAILABLE:
                errorMessage = '位置情報が利用できません。GPSや端末の位置情報設定を確認してください。';
                break;
              case geoError.TIMEOUT:
                errorMessage = '位置情報の取得がタイムアウトしました。屋外など電波の届きやすい場所で再試行してください。';
                break;
            }

            setState(prev => ({
              ...prev,
              error: errorMessage,
              loading: false,
            }));
            resolve(null);
          },
          geolocationOptions
        );
      });
    },
    [applyLocation, clearPermissionGranted, enableHighAccuracy]
  );

  const clearError = () => {
    setState(prev => ({ ...prev, error: null }));
  };

  const setManualLocation = (location: Location) => {
    if (!isValidJapanLocation(location)) {
      setState(prev => ({
        ...prev,
        error: '日本国内の座標を入力してください',
      }));
      return;
    }

    setState(prev => ({
      ...prev,
      location,
      lastKnownLocation: location,
      lastLocationAgeMs: 0,
      locationSource: 'manual',
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
      position => {
        const now = Date.now();
        if (now - lastWatchUpdateRef.current < WATCH_UPDATE_MIN_INTERVAL_MS) {
          return;
        }
        lastWatchUpdateRef.current = now;

        const { latitude: lat, longitude: lon, accuracy } = position.coords;
        applyLocation({ lat, lon, accuracy }, true, 'watch');
      },
      geoError => {
        if (geoError.code === geoError.PERMISSION_DENIED) {
          clearPermissionGranted();
          setState(prev => ({ ...prev, permissionState: 'denied' }));
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

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let permissionStatus: PermissionStatus | null = null;
    let permissionChangeListener: (() => void) | null = null;

    const initialize = async () => {
      const saved = loadLastLocation();
      setState(prev => ({
        ...prev,
        lastKnownLocation: saved?.location ?? null,
        lastLocationAgeMs: saved?.ageMs ?? null,
      }));

      const permissionsApi = (navigator as unknown as { permissions?: Permissions }).permissions ?? null;
      if (permissionsApi?.query) {
        try {
          permissionStatus = await permissionsApi.query({ name: 'geolocation' as PermissionName });
          if (!permissionStatus) return;

          setState(prev => ({ ...prev, permissionState: permissionStatus!.state }));
          if (permissionStatus.state === 'denied') {
            clearPermissionGranted();
          }

          permissionChangeListener = () => {
            if (!permissionStatus) return;
            setState(prev => ({ ...prev, permissionState: permissionStatus!.state }));
            if (permissionStatus.state === 'denied') {
              clearPermissionGranted();
            }
          };
          permissionStatus.addEventListener?.('change', permissionChangeListener);
          return;
        } catch {
          // Fall through to the stored grant fallback.
        }
      }

      if (hasPermissionBeenGranted()) {
        setState(prev => ({ ...prev, permissionState: 'granted' }));
      } else {
        setState(prev => ({ ...prev, permissionState: 'prompt' }));
      }
    };

    void initialize();

    return () => {
      if (permissionStatus && permissionChangeListener) {
        permissionStatus.removeEventListener?.('change', permissionChangeListener);
      }
      stopWatching(true);
    };
  }, [
    clearPermissionGranted,
    hasPermissionBeenGranted,
    loadLastLocation,
    stopWatching,
  ]);

  return {
    ...state,
    needsPermission: state.permissionState === 'prompt' || state.permissionState === 'denied',
    getCurrentLocation,
    clearError,
    setManualLocation,
    startWatching,
    stopWatching,
    isSupported: typeof navigator !== 'undefined' && !!navigator.geolocation,
  };
}
