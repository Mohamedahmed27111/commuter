const ORS_URL =
  'https://api.openrouteservice.org/v2/directions/driving-car/geojson';

export interface ORSRoute {
  coordinates: [number, number][];
  distanceKm: number;
  durationMinutes: number;
}

export async function fetchRoute(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): Promise<ORSRoute> {
  const apiKey = process.env.NEXT_PUBLIC_ORS_API_KEY;
  if (!apiKey) throw new Error('ORS API key not set');

  const cacheKey = `ors:${from.lat},${from.lng}→${to.lat},${to.lng}`;
  if (typeof sessionStorage !== 'undefined') {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached);
  }

  const body = {
    coordinates: [
      [from.lng, from.lat],
      [to.lng, to.lat],
    ],
  };

  const res = await fetch(ORS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: apiKey,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`ORS error: ${res.status}`);
  const data = await res.json();

  const feature = data.features[0];
  const props = feature.properties.summary;

  const route: ORSRoute = {
    coordinates: feature.geometry.coordinates.map(
      ([lng, lat]: [number, number]) => [lat, lng]
    ),
    distanceKm: Math.round((props.distance / 1000) * 10) / 10,
    durationMinutes: Math.round(props.duration / 60),
  };

  if (typeof sessionStorage !== 'undefined') {
    try {
      sessionStorage.setItem(cacheKey, JSON.stringify(route));
    } catch {
      // sessionStorage quota exceeded — ignore
    }
  }

  return route;
}
