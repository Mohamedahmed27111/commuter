'use client';

import { useState } from 'react';

interface LocationState {
  lat: number | null;
  lng: number | null;
  loading: boolean;
  error: string | null;
}

export function useUserLocation() {
  const [state, setState] = useState<LocationState>({
    lat: null,
    lng: null,
    loading: false,
    error: null,
  });

  function locate() {
    if (!navigator.geolocation) {
      setState((s) => ({ ...s, error: 'Geolocation not supported' }));
      return;
    }
    setState((s) => ({ ...s, loading: true, error: null }));
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setState({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          loading: false,
          error: null,
        }),
      (err) =>
        setState((s) => ({
          ...s,
          loading: false,
          error:
            err.code === 1
              ? 'Location permission denied'
              : 'Could not get location',
        })),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  return { ...state, locate };
}
