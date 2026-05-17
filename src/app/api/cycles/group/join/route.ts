import { NextRequest, NextResponse } from 'next/server';

// Shared in-memory store (same module scope as the group route in dev)
// In production this would be a real database query.
const MOCK_GROUPS: Record<string, { origin: string; destination: string; memberCount: number }> = {
  DEMO12: { origin: 'Maadi, Cairo', destination: 'New Cairo, Cairo', memberCount: 1 },
};

export async function POST(req: NextRequest) {
  let body: { code?: unknown };
  try {
    body = await req.json() as { code?: unknown };
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const code = typeof body.code === 'string' ? body.code.toUpperCase().trim() : '';
  if (!code || code.length !== 6) {
    return NextResponse.json({ error: 'Code must be 6 characters' }, { status: 400 });
  }

  const group = MOCK_GROUPS[code];
  if (!group) {
    return NextResponse.json({ error: 'Code not found or expired' }, { status: 404 });
  }

  if (group.memberCount >= 3) {
    return NextResponse.json({ error: 'Group is full. Max 3 people per shared ride.' }, { status: 409 });
  }

  group.memberCount += 1;

  return NextResponse.json({
    code,
    origin:      { address: group.origin,      lat: 29.9626, lng: 31.2497 },
    destination: { address: group.destination, lat: 30.0131, lng: 31.4961 },
    viaStops:    [],
    rideType:    'shared',
  });
}
