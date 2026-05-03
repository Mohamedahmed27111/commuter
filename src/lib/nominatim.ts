const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

export interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

export async function searchAddress(query: string): Promise<NominatimResult[]> {
  if (!query || query.length < 3) return [];

  const params = new URLSearchParams({
    q: query + ', Egypt',
    format: 'json',
    addressdetails: '1',
    limit: '5',
    countrycodes: 'eg',
  });

  const res = await fetch(`${NOMINATIM_URL}?${params}`, {
    headers: {
      'Accept-Language': 'en',
      'User-Agent': 'Commuter-App/1.0 (contact@commuter.eg)',
    },
  });

  if (!res.ok) throw new Error('Nominatim search failed');
  return res.json();
}

export function formatDisplayName(displayName: string): string {
  const parts = displayName.split(', ');
  return parts.slice(0, 3).join(', ');
}

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const params = new URLSearchParams({ lat: String(lat), lon: String(lng), format: 'json' });
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`, {
      headers: { 'Accept-Language': 'en', 'User-Agent': 'Commuter-App/1.0 (contact@commuter.eg)' },
    });
    if (!res.ok) throw new Error();
    const data = await res.json();
    return formatDisplayName(data.display_name ?? '');
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}
