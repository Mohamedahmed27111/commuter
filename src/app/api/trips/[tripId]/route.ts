import type { DailyTrip } from '@/types/trip';
import { getTrip, seedTrip, setTrip } from '@/lib/tripStore';
import { getMockTripById } from '@/lib/mockTrip';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ tripId: string }> },
) {
  const { tripId } = await params;
  let trip = getTrip(tripId);
  if (!trip) {
    const mock = getMockTripById(tripId);
    if (!mock) {
      return Response.json({ error: 'Trip not found' }, { status: 404 });
    }
    seedTrip(mock);
    trip = getTrip(tripId)!;
  }
  return Response.json(trip);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ tripId: string }> },
) {
  const { tripId } = await params;
  const body = (await req.json()) as Partial<DailyTrip>;

  let trip = getTrip(tripId);
  if (!trip) {
    const mock = getMockTripById(tripId);
    if (!mock) {
      return Response.json({ error: 'Trip not found' }, { status: 404 });
    }
    seedTrip(mock);
    trip = getTrip(tripId)!;
  }

  const next: DailyTrip = { ...trip, ...body, trip_id: tripId };
  if (body.stops) next.stops = body.stops;
  setTrip(next);
  return Response.json(next);
}
