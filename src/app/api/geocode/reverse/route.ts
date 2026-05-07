import { NextRequest, NextResponse } from 'next/server';

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export async function GET(req: NextRequest) {
  const lat = req.nextUrl.searchParams.get('lat');
  const lng = req.nextUrl.searchParams.get('lng');
  if (!lat || !lng) return NextResponse.json({ error: 'Missing coords' }, { status: 400 });
  if (!API_KEY) return NextResponse.json({ error: 'Maps API key not configured' }, { status: 500 });

  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
  url.searchParams.set('latlng', `${lat},${lng}`);
  url.searchParams.set('key', API_KEY);
  url.searchParams.set('result_type', 'street_address|route|neighborhood|sublocality|locality');

  const res = await fetch(url.toString(), { next: { revalidate: 0 } });
  if (!res.ok) return NextResponse.json({ address: `${lat}, ${lng}` });

  const data = await res.json();
  const address: string = data.results?.[0]?.formatted_address ?? `${lat}, ${lng}`;

  // Strip ", Egypt" / ", مصر" suffix
  return NextResponse.json({ address: address.replace(/, (Egypt|مصر)$/, '').trim() });
}
