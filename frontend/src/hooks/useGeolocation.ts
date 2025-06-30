'use client';

import { useState, useEffect } from 'react';
import { Location } from '@/types';

interface GeolocationState {
  location: Location | null;
  error: string | null;
  loading: boolean;
  address: string | null;
  addressLoading: boolean;
  isWatching: boolean;
}

export function useGeolocation(enableHighAccuracy = true) {
  const [state, setState] = useState<GeolocationState>({
    location: null,
    error: null,
    loading: false,
    address: null,
    addressLoading: false,
    isWatching: false,
  });
  const [watchId, setWatchId] = useState<number | null>(null);

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

        // Get address for the location
        console.log('📍 Triggering address fetch...');
        getAddressFromCoordinates(lat, lon);
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

  const getAddressFromCoordinates = async (lat: number, lon: number) => {
    console.log('🏠 Starting address fetch for coordinates:', { lat, lon });
    setState(prev => ({ ...prev, addressLoading: true }));
    
    try {
      // Use our own API route to avoid CORS issues
      const url = `/api/geocode?lat=${lat}&lon=${lon}`;
      console.log('🏠 Fetching from API route:', url);
      
      const response = await fetch(url);
      console.log('🏠 Response status:', response.status, response.ok);
      
      if (!response.ok) {
        throw new Error('住所の取得に失敗しました');
      }
      
      const data = await response.json();
      console.log('🏠 API response data:', data);
      
      if (data.success && data.address) {
        console.log('🏠 Address received:', data.address);
        setState(prev => ({
          ...prev,
          address: data.address,
          addressLoading: false,
        }));
      } else {
        console.log('🏠 API returned error:', data.error);
        setState(prev => ({
          ...prev,
          address: data.error || '住所を取得できませんでした',
          addressLoading: false,
        }));
      }
    } catch (error) {
      console.error('🏠 Address fetch error:', error);
      setState(prev => ({
        ...prev,
        address: '住所の取得に失敗しました',
        addressLoading: false,
      }));
    }
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

  const startWatching = () => {
    if (!navigator.geolocation) {
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

        // Get address for the new location (throttled to avoid too many requests)
        getAddressFromCoordinates(lat, lon);
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
  };

  const stopWatching = () => {
    if (watchId) {
      console.log('📍 Stopping position watch');
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
      setState(prev => ({ ...prev, isWatching: false }));
    }
  };

  // Auto-get location on mount if supported
  useEffect(() => {
    console.log('📍 useGeolocation hook mounted, navigator.geolocation available:', !!navigator.geolocation);
    if (navigator.geolocation) {
      console.log('📍 Auto-triggering location fetch on mount');
      getCurrentLocation();
    }

    // Cleanup watch on unmount
    return () => {
      if (watchId) {
        console.log('📍 Cleaning up position watch on unmount');
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  // Debug log current state
  console.log('📍 useGeolocation current state:', {
    hasLocation: !!state.location,
    hasAddress: !!state.address,
    loading: state.loading,
    addressLoading: state.addressLoading,
    error: state.error
  });

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