const ORS_URL =
  'https://api.openrouteservice.org/v2/directions/driving-car/geojson';

export interface ORSRoute {
  coordinates:      [number, number][];
  distance_km:      number;
  duration_minutes: number;
  summary:          string;
}

// ── Safe sessionStorage helpers (no-ops on server) ────────────────────────
function getCached(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null; // private browsing mode blocks sessionStorage
  }
}

function setCached(key: string, value: string): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // sessionStorage full or blocked — fail silently
  }
}

export async function fetchRoute(
  waypoints: { lat: number; lng: number }[]
): Promise<ORSRoute[]> {
  // Validate every waypoint — reject null-island coords and out-of-range values
  const valid = waypoints.filter(
    w =>
      w &&
      typeof w.lat === 'number' && typeof w.lng === 'number' &&
      w.lat !== 0 && w.lng !== 0 &&
      w.lat >= -90  && w.lat <= 90 &&
      w.lng >= -180 && w.lng <= 180
  );

  if (valid.length < 2) {
    console.warn('[ORS] Not enough valid waypoints:', waypoints);
    return [];
  }

  const cacheKey = valid.map(w => `${w.lat.toFixed(4)},${w.lng.toFixed(4)}`).join('→');
  const cached = getCached(`ors:${cacheKey}`);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      // corrupted cache — fall through to re-fetch
    }
  }

  const apiKey = process.env.NEXT_PUBLIC_ORS_API_KEY;
  if (!apiKey) {
    console.error(
      '[ORS] NEXT_PUBLIC_ORS_API_KEY is not set in .env.local\n' +
      'Get a free key at https://openrouteservice.org/dev/#/signup'
    );
    return [];
  }

  try {
    const res = await fetch(ORS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: apiKey,
      },
      body: JSON.stringify({
        coordinates: valid.map(w => [w.lng, w.lat]),
        // No alternative_routes — always return the single shortest route
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`[ORS] HTTP ${res.status}:`, text);
      return [];
    }

    const data = await res.json();

    if (!data.features?.length) {
      console.error('[ORS] No features in response:', data);
      return [];
    }

    const routes: ORSRoute[] = [data.features[0]].map((feature: { geometry: { coordinates: [number, number][] }; properties: { summary: { distance: number; duration: number } } }) => ({
      coordinates: (feature.geometry.coordinates as [number, number][]).map(
        ([lng, lat]) => [lat, lng] as [number, number]
      ),
      distance_km:      Math.round((feature.properties.summary.distance / 1000) * 10) / 10,
      duration_minutes: Math.round(feature.properties.summary.duration / 60),
      summary:          'Shortest route',
    }));

    setCached(`ors:${cacheKey}`, JSON.stringify(routes));
    return routes;

  } catch (err) {
    console.error('[ORS] Fetch error:', err);
    return [];
  }
}
