'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface LocationState {
  lat: number | null;
  lng: number | null;
  heading: number | null; // degrees, null if unavailable
  accuracy: number | null; // metres
  loading: boolean;
  error: string | null;
  live: boolean; // true while watchPosition is active
}

export function useUserLocation() {
  const [state, setState] = useState<LocationState>({
    lat: null,
    lng: null,
    heading: null,
    accuracy: null,
    loading: false,
    error: null,
    live: false,
  });

  const watchId = useRef<number | null>(null);

  function applyPosition(pos: GeolocationPosition) {
    setState({
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      heading: pos.coords.heading ?? null,
      accuracy: pos.coords.accuracy ?? null,
      loading: false,
      error: null,
      live: true,
    });
  }

  function handleError(err: GeolocationPositionError) {
    setState((s) => ({
      ...s,
      loading: false,
      live: false,
      error: err.code === 1 ? 'Location permission denied' : 'Could not get location',
    }));
  }

  /** One-shot fix (used when filling the search bar from GPS) */
  function locate() {
    if (!navigator.geolocation) {
      setState((s) => ({ ...s, error: 'Geolocation not supported' }));
      return;
    }
    setState((s) => ({ ...s, loading: true, error: null }));
    navigator.geolocation.getCurrentPosition(applyPosition, handleError, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,   // always a fresh fix
    });
  }

  /** Start live tracking. Calling again re-centres the map to current pos. */
  const startLive = useCallback(() => {
    if (!navigator.geolocation) {
      setState((s) => ({ ...s, error: 'Geolocation not supported' }));
      return;
    }
    // Already watching — just signal a re-centre by bumping state
    if (watchId.current !== null) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }
    setState((s) => ({ ...s, loading: true, error: null }));
    watchId.current = navigator.geolocation.watchPosition(applyPosition, handleError, {
      enableHighAccuracy: true,
      maximumAge: 2000,
    });
  }, []);

  /** Stop live tracking */
  const stopLive = useCallback(() => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    setState((s) => ({ ...s, live: false }));
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    };
  }, []);

  return { ...state, locate, startLive, stopLive };
}
