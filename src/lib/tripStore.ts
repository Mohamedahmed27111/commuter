import type { DailyTrip } from '@/types/trip';

/** In-memory trip state — shared by mock API routes (replace with DB in production). */
const tripStore = new Map<string, DailyTrip>();

export function getTrip(tripId: string): DailyTrip | undefined {
  return tripStore.get(tripId);
}

export function setTrip(trip: DailyTrip): void {
  tripStore.set(trip.trip_id, trip);
}

export function seedTrip(trip: DailyTrip): void {
  if (!tripStore.has(trip.trip_id)) {
    tripStore.set(trip.trip_id, structuredClone(trip));
  }
}

export function updateTrip(tripId: string, patch: Partial<DailyTrip>): DailyTrip | undefined {
  const current = tripStore.get(tripId);
  if (!current) return undefined;
  const next = { ...current, ...patch };
  tripStore.set(tripId, next);
  return next;
}

export function resetTripStore(): void {
  tripStore.clear();
}
