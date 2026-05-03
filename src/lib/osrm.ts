// TODO: replace with self-hosted OSRM instance in production
const OSRM_URL = 'https://router.project-osrm.org/route/v1/driving';

export interface Waypoint {
  lat: number;
  lng: number;
  label?: string;
}

export interface OSRMRoute {
  coordinates:      [number, number][]; // [lat, lng] pairs for Leaflet
  distance_km:      number;
  duration_minutes: number;
}

function parseRoute(route: { geometry: { coordinates: [number, number][] }; distance: number; duration: number }): OSRMRoute {
  return {
    coordinates: route.geometry.coordinates.map(
      ([lng, lat]: [number, number]) => [lat, lng] as [number, number]
    ),
    distance_km:      Math.round((route.distance / 1000) * 10) / 10,
    duration_minutes: Math.round(route.duration / 60),
  };
}

function cacheKey(waypoints: Waypoint[]): string {
  return `osrm:${waypoints.map((w) => `${w.lat.toFixed(4)},${w.lng.toFixed(4)}`).join('→')}`;
}

export async function fetchRoadRoute(waypoints: Waypoint[]): Promise<OSRMRoute> {
  if (waypoints.length < 2) throw new Error('Need at least 2 waypoints');
  const routes = await fetchRoadRoutes(waypoints);
  return routes[0];
}

export async function fetchRoadRoutes(waypoints: Waypoint[]): Promise<OSRMRoute[]> {
  if (waypoints.length < 2) throw new Error('Need at least 2 waypoints');

  const key = cacheKey(waypoints);
  if (typeof sessionStorage !== 'undefined') {
    const cached = sessionStorage.getItem(key);
    if (cached) return JSON.parse(cached);
  }

  const coords = waypoints.map((w) => `${w.lng},${w.lat}`).join(';');
  const url = `${OSRM_URL}/${coords}?overview=full&geometries=geojson&steps=false&alternatives=true`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`OSRM request failed: ${res.status}`);

  const data = await res.json();
  if (data.code !== 'Ok' || !data.routes?.length) {
    throw new Error('No route found');
  }

  const result: OSRMRoute[] = (data.routes as typeof data.routes[0][]).map(parseRoute);

  if (typeof sessionStorage !== 'undefined') {
    try { sessionStorage.setItem(key, JSON.stringify(result)); } catch { /* quota */ }
  }

  return result;
}
