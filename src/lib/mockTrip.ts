import type { DailyTrip, TripStop } from '@/types/trip';
import {
  computeUnlockAt,
  computeDemoFirstPickup,
  staggerPickupTimes,
  todayDateString,
} from '@/lib/tripUtils';

const TODAY     = todayDateString();
const YESTERDAY = new Date(Date.now() - 86_400_000).toISOString().split('T')[0];
const FIRST_PICKUP = '07:30';

// ── Shared driver metadata ─────────────────────────────────────────────────────

const DRIVER = {
  driver_id:        'd-001',
  driver_name:      'Ahmed Hassan',
  driver_car_model: 'Toyota Corolla 2020',
  driver_plate:     'أ ب ج 1234',
  driver_rating:    4.8,
};

// ── 1. Locked trip — too early to start ───────────────────────────────────────
//    Use tripId: "trip-locked"

export const mockLockedTrip: DailyTrip = {
  trip_id:            'trip-locked',
  cycle_id:           'cycle-001',
  date:               TODAY,
  status:             'locked',
  ...DRIVER,
  driver_lat:         30.0660,
  driver_lng:         31.3450,
  driver_heading:     270,
  location_updated_at: undefined,
  current_stop_index: 0,
  first_pickup_time:  FIRST_PICKUP,
  unlock_at:          computeUnlockAt(TODAY, FIRST_PICKUP),
  stops: [
    {
      stop_id:          's-001',
      stop_number:      1,
      passenger_id:     'u-001',
      passenger_name:   'Sara A.',
      passenger_code:   '8421',
      pickup_lat:       30.0626, pickup_lng: 31.3417,
      pickup_address:   '15 El-Nasr St, Nasr City',
      dropoff_lat:      30.0444, dropoff_lng: 31.2357,
      dropoff_address:  'Downtown Cairo, Tahrir',
      scheduled_pickup:  '07:30',
      scheduled_dropoff: '08:30',
      status:           'pending',
      chat_unlocked:    false,
    },
    {
      stop_id:          's-002',
      stop_number:      2,
      passenger_id:     'u-002',
      passenger_name:   'Nour M.',
      passenger_code:   '3756',
      pickup_lat:       30.0897, pickup_lng: 31.3222,
      pickup_address:   '22 Hegaz St, Heliopolis',
      dropoff_lat:      29.9602, dropoff_lng: 31.2569,
      dropoff_address:  'Maadi Corniche',
      scheduled_pickup:  '07:45',
      scheduled_dropoff: '08:45',
      status:           'pending',
      chat_unlocked:    false,
    },
    {
      stop_id:          's-003',
      stop_number:      3,
      passenger_id:     'u-003',
      passenger_name:   'Karim N.',
      passenger_code:   '6193',
      pickup_lat:       30.0710, pickup_lng: 30.9937,
      pickup_address:   'Smart Village, 6 October',
      dropoff_lat:      30.0580, dropoff_lng: 31.2300,
      dropoff_address:  'New Cairo, 5th Settlement',
      scheduled_pickup:  '08:00',
      scheduled_dropoff: '09:00',
      status:           'pending',
      chat_unlocked:    false,
    },
  ],
};

// ── 2. Unlocked trip — within 5 min of first pickup, button enabled ───────────
//    Use tripId: "trip-unlocked"

export const mockActiveTrip: DailyTrip = {
  trip_id:            'trip-unlocked',
  cycle_id:           'cycle-001',
  date:               TODAY,
  status:             'unlocked',
  ...DRIVER,
  driver_lat:         30.0660,
  driver_lng:         31.3450,
  driver_heading:     270,
  location_updated_at: new Date().toISOString(),
  current_stop_index: 0,
  first_pickup_time:  FIRST_PICKUP,
  unlock_at:          computeUnlockAt(TODAY, FIRST_PICKUP),
  stops: [
    {
      stop_id:          's-001',
      stop_number:      1,
      passenger_id:     'u-001',
      passenger_name:   'Sara A.',
      passenger_code:   '8421',
      pickup_lat:       30.0626, pickup_lng: 31.3417,
      pickup_address:   '15 El-Nasr St, Nasr City',
      dropoff_lat:      30.0444, dropoff_lng: 31.2357,
      dropoff_address:  'Downtown Cairo, Tahrir',
      scheduled_pickup:  '07:30',
      scheduled_dropoff: '08:30',
      status:           'pending',
      chat_unlocked:    false,
    },
    {
      stop_id:          's-002',
      stop_number:      2,
      passenger_id:     'u-002',
      passenger_name:   'Nour M.',
      passenger_code:   '3756',
      pickup_lat:       30.0897, pickup_lng: 31.3222,
      pickup_address:   '22 Hegaz St, Heliopolis',
      dropoff_lat:      29.9602, dropoff_lng: 31.2569,
      dropoff_address:  'Maadi Corniche',
      scheduled_pickup:  '07:45',
      scheduled_dropoff: '08:45',
      status:           'pending',
      chat_unlocked:    false,
    },
    {
      stop_id:          's-003',
      stop_number:      3,
      passenger_id:     'u-003',
      passenger_name:   'Karim N.',
      passenger_code:   '6193',
      pickup_lat:       30.0710, pickup_lng: 30.9937,
      pickup_address:   'Smart Village, 6 October',
      dropoff_lat:      30.0580, dropoff_lng: 31.2300,
      dropoff_address:  'New Cairo, 5th Settlement',
      scheduled_pickup:  '08:00',
      scheduled_dropoff: '09:00',
      status:           'pending',
      chat_unlocked:    false,
    },
  ],
};

// ── 3. Active trip — driver is approaching stop 2; stop 1 already picked up ───
//    Use tripId: "trip-active"

export const mockActiveTripInProgress: DailyTrip = {
  trip_id:            'trip-active',
  cycle_id:           'cycle-001',
  date:               TODAY,
  status:             'active',
  ...DRIVER,
  driver_lat:         30.0860,
  driver_lng:         31.3200,
  driver_heading:     15,
  location_updated_at: new Date().toISOString(),
  current_stop_index: 1,
  first_pickup_time:  FIRST_PICKUP,
  unlock_at:          computeUnlockAt(TODAY, FIRST_PICKUP),
  trip_started_at:    new Date(Date.now() - 12 * 60_000).toISOString(), // started 12 min ago
  stops: [
    {
      stop_id:          's-001',
      stop_number:      1,
      passenger_id:     'u-001',
      passenger_name:   'Sara A.',
      passenger_code:   '8421',
      pickup_lat:       30.0626, pickup_lng: 31.3417,
      pickup_address:   '15 El-Nasr St, Nasr City',
      dropoff_lat:      30.0444, dropoff_lng: 31.2357,
      dropoff_address:  'Downtown Cairo, Tahrir',
      scheduled_pickup:  '07:30',
      scheduled_dropoff: '08:30',
      actual_pickup:    '07:32',
      status:           'picked_up',
      chat_unlocked:    true,          // ← chat enabled after code confirmed
    },
    {
      stop_id:          's-002',
      stop_number:      2,
      passenger_id:     'u-002',
      passenger_name:   'Nour M.',
      passenger_code:   '3756',
      pickup_lat:       30.0897, pickup_lng: 31.3222,
      pickup_address:   '22 Hegaz St, Heliopolis',
      dropoff_lat:      29.9602, dropoff_lng: 31.2569,
      dropoff_address:  'Maadi Corniche',
      scheduled_pickup:  '07:45',
      scheduled_dropoff: '08:45',
      status:           'arriving',    // ← driver within 500m
      chat_unlocked:    false,
    },
    {
      stop_id:          's-003',
      stop_number:      3,
      passenger_id:     'u-003',
      passenger_name:   'Karim N.',
      passenger_code:   '6193',
      pickup_lat:       30.0710, pickup_lng: 30.9937,
      pickup_address:   'Smart Village, 6 October',
      dropoff_lat:      30.0580, dropoff_lng: 31.2300,
      dropoff_address:  'New Cairo, 5th Settlement',
      scheduled_pickup:  '08:00',
      scheduled_dropoff: '09:00',
      status:           'pending',
      chat_unlocked:    false,
    },
  ],
};

// ── 4. Waiting trip — driver is at stop 2, 3-min timer running ────────────────
//    Use tripId: "trip-waiting"

export const mockWaitingTrip: DailyTrip = {
  trip_id:            'trip-waiting',
  cycle_id:           'cycle-001',
  date:               TODAY,
  status:             'active',
  ...DRIVER,
  driver_lat:         30.0897,
  driver_lng:         31.3222,
  driver_heading:     90,
  location_updated_at: new Date().toISOString(),
  current_stop_index: 1,
  first_pickup_time:  FIRST_PICKUP,
  unlock_at:          computeUnlockAt(TODAY, FIRST_PICKUP),
  trip_started_at:    new Date(Date.now() - 20 * 60_000).toISOString(),
  stops: [
    {
      stop_id:          's-001',
      stop_number:      1,
      passenger_id:     'u-001',
      passenger_name:   'Sara A.',
      passenger_code:   '8421',
      pickup_lat:       30.0626, pickup_lng: 31.3417,
      pickup_address:   '15 El-Nasr St, Nasr City',
      dropoff_lat:      30.0444, dropoff_lng: 31.2357,
      dropoff_address:  'Downtown Cairo, Tahrir',
      scheduled_pickup:  '07:30',
      scheduled_dropoff: '08:30',
      actual_pickup:    '07:32',
      status:           'picked_up',
      chat_unlocked:    true,
    },
    {
      stop_id:          's-002',
      stop_number:      2,
      passenger_id:     'u-002',
      passenger_name:   'Nour M.',
      passenger_code:   '3756',
      pickup_lat:       30.0897, pickup_lng: 31.3222,
      pickup_address:   '22 Hegaz St, Heliopolis',
      dropoff_lat:      29.9602, dropoff_lng: 31.2569,
      dropoff_address:  'Maadi Corniche',
      scheduled_pickup:  '07:45',
      scheduled_dropoff: '08:45',
      status:           'waiting',     // ← timer running, waiting for passenger code
      wait_started_at:  new Date(Date.now() - 90_000).toISOString(), // 90 s ago
      chat_unlocked:    false,
    },
    {
      stop_id:          's-003',
      stop_number:      3,
      passenger_id:     'u-003',
      passenger_name:   'Karim N.',
      passenger_code:   '6193',
      pickup_lat:       30.0710, pickup_lng: 30.9937,
      pickup_address:   'Smart Village, 6 October',
      dropoff_lat:      30.0580, dropoff_lng: 31.2300,
      dropoff_address:  'New Cairo, 5th Settlement',
      scheduled_pickup:  '08:00',
      scheduled_dropoff: '09:00',
      status:           'pending',
      chat_unlocked:    false,
    },
  ],
};

// ── 5. No-show scenario — stop 2 was a no-show, on stop 3 ────────────────────
//    Use tripId: "trip-noshow"

export const mockNoShowTrip: DailyTrip = {
  trip_id:            'trip-noshow',
  cycle_id:           'cycle-001',
  date:               TODAY,
  status:             'active',
  ...DRIVER,
  driver_lat:         30.0710,
  driver_lng:         30.9937,
  driver_heading:     220,
  location_updated_at: new Date().toISOString(),
  current_stop_index: 2,
  first_pickup_time:  FIRST_PICKUP,
  unlock_at:          computeUnlockAt(TODAY, FIRST_PICKUP),
  trip_started_at:    new Date(Date.now() - 35 * 60_000).toISOString(),
  stops: [
    {
      stop_id:          's-001',
      stop_number:      1,
      passenger_id:     'u-001',
      passenger_name:   'Sara A.',
      passenger_code:   '8421',
      pickup_lat:       30.0626, pickup_lng: 31.3417,
      pickup_address:   '15 El-Nasr St, Nasr City',
      dropoff_lat:      30.0444, dropoff_lng: 31.2357,
      dropoff_address:  'Downtown Cairo, Tahrir',
      scheduled_pickup:  '07:30',
      scheduled_dropoff: '08:30',
      actual_pickup:    '07:31',
      status:           'picked_up',
      chat_unlocked:    true,
    },
    {
      stop_id:          's-002',
      stop_number:      2,
      passenger_id:     'u-002',
      passenger_name:   'Nour M.',
      passenger_code:   '3756',
      pickup_lat:       30.0897, pickup_lng: 31.3222,
      pickup_address:   '22 Hegaz St, Heliopolis',
      dropoff_lat:      29.9602, dropoff_lng: 31.2569,
      dropoff_address:  'Maadi Corniche',
      scheduled_pickup:  '07:45',
      scheduled_dropoff: '08:45',
      status:           'no_show',     // ← 3-min timer expired
      chat_unlocked:    false,
    },
    {
      stop_id:          's-003',
      stop_number:      3,
      passenger_id:     'u-003',
      passenger_name:   'Karim N.',
      passenger_code:   '6193',
      pickup_lat:       30.0710, pickup_lng: 30.9937,
      pickup_address:   'Smart Village, 6 October',
      dropoff_lat:      30.0580, dropoff_lng: 31.2300,
      dropoff_address:  'New Cairo, 5th Settlement',
      scheduled_pickup:  '08:00',
      scheduled_dropoff: '09:00',
      status:           'arriving',
      chat_unlocked:    false,
    },
  ],
};

// ── 6. Completed trip — all stops done ────────────────────────────────────────
//    Use tripId: "trip-completed"

export const mockCompletedTrip: DailyTrip = {
  trip_id:            'trip-completed',
  cycle_id:           'cycle-001',
  date:               TODAY,
  status:             'completed',
  ...DRIVER,
  driver_lat:         30.0580,
  driver_lng:         31.2300,
  driver_heading:     0,
  location_updated_at: new Date(Date.now() - 5 * 60_000).toISOString(),
  current_stop_index: 3,
  first_pickup_time:  FIRST_PICKUP,
  unlock_at:          computeUnlockAt(TODAY, FIRST_PICKUP),
  trip_started_at:    new Date(Date.now() - 90 * 60_000).toISOString(),  // 1.5 h ago
  trip_completed_at:  new Date(Date.now() - 5 * 60_000).toISOString(),   // 5 min ago
  stops: [
    {
      stop_id:          's-001',
      stop_number:      1,
      passenger_id:     'u-001',
      passenger_name:   'Sara A.',
      passenger_code:   '8421',
      pickup_lat:       30.0626, pickup_lng: 31.3417,
      pickup_address:   '15 El-Nasr St, Nasr City',
      dropoff_lat:      30.0444, dropoff_lng: 31.2357,
      dropoff_address:  'Downtown Cairo, Tahrir',
      scheduled_pickup:  '07:30',
      scheduled_dropoff: '08:30',
      actual_pickup:    '07:31',
      actual_dropoff:   '08:28',
      status:           'dropped_off',
      chat_unlocked:    true,
    },
    {
      stop_id:          's-002',
      stop_number:      2,
      passenger_id:     'u-002',
      passenger_name:   'Nour M.',
      passenger_code:   '3756',
      pickup_lat:       30.0897, pickup_lng: 31.3222,
      pickup_address:   '22 Hegaz St, Heliopolis',
      dropoff_lat:      29.9602, dropoff_lng: 31.2569,
      dropoff_address:  'Maadi Corniche',
      scheduled_pickup:  '07:45',
      scheduled_dropoff: '08:45',
      actual_pickup:    '07:48',
      actual_dropoff:   '08:40',
      status:           'dropped_off',
      chat_unlocked:    true,
    },
    {
      stop_id:          's-003',
      stop_number:      3,
      passenger_id:     'u-003',
      passenger_name:   'Karim N.',
      passenger_code:   '6193',
      pickup_lat:       30.0710, pickup_lng: 30.9937,
      pickup_address:   'Smart Village, 6 October',
      dropoff_lat:      30.0580, dropoff_lng: 31.2300,
      dropoff_address:  'New Cairo, 5th Settlement',
      scheduled_pickup:  '08:00',
      scheduled_dropoff: '09:00',
      actual_pickup:    '08:05',
      actual_dropoff:   '09:02',
      status:           'dropped_off',
      chat_unlocked:    true,
    },
  ],
};

// ── 7. Cancelled trip ─────────────────────────────────────────────────────────
//    Use tripId: "trip-cancelled"

export const mockCancelledTrip: DailyTrip = {
  ...mockLockedTrip,
  trip_id:   'trip-cancelled',
  date:      TODAY,
  status:    'cancelled',
};

// ── 8. Yesterday's completed trip — for history views ─────────────────────────
//    Use tripId: "trip-history-001"

export const mockHistoryTrip: DailyTrip = {
  ...mockCompletedTrip,
  trip_id:          'trip-history-001',
  date:             YESTERDAY,
  trip_started_at:  new Date(Date.now() - (24 * 60 + 90) * 60_000).toISOString(),
  trip_completed_at: new Date(Date.now() - (24 * 60 + 5) * 60_000).toISOString(),
};

// ── Today's live demo trip (always unlocked — use trip-today in URLs) ─────────

function addMinutesToTime(time: string, mins: number): string {
  const [h, m] = time.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m + mins, 0, 0);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function buildTodayStops(): TripStop[] {
  const pickups = staggerPickupTimes(computeDemoFirstPickup(), 3);
  return [
    {
      stop_id: 's-001', stop_number: 1, passenger_id: 'u-001', passenger_name: 'Sara A.',
      passenger_code: '8421',
      pickup_lat: 30.0626, pickup_lng: 31.3417,
      pickup_address: '15 El-Nasr St, Nasr City',
      dropoff_lat: 30.0444, dropoff_lng: 31.2357,
      dropoff_address: 'Downtown Cairo, Tahrir',
      scheduled_pickup: pickups[0], scheduled_dropoff: addMinutesToTime(pickups[0], 60),
      status: 'pending', chat_unlocked: false,
    },
    {
      stop_id: 's-002', stop_number: 2, passenger_id: 'u-002', passenger_name: 'Nour M.',
      passenger_code: '3756',
      pickup_lat: 30.0897, pickup_lng: 31.3222,
      pickup_address: '22 Hegaz St, Heliopolis',
      dropoff_lat: 29.9602, dropoff_lng: 31.2569,
      dropoff_address: 'Maadi Corniche',
      scheduled_pickup: pickups[1], scheduled_dropoff: addMinutesToTime(pickups[1], 60),
      status: 'pending', chat_unlocked: false,
    },
    {
      stop_id: 's-003', stop_number: 3, passenger_id: 'u-003', passenger_name: 'Karim N.',
      passenger_code: '6193',
      pickup_lat: 30.0710, pickup_lng: 30.9937,
      pickup_address: 'Smart Village, 6 October',
      dropoff_lat: 30.0580, dropoff_lng: 31.2300,
      dropoff_address: 'New Cairo, 5th Settlement',
      scheduled_pickup: pickups[2], scheduled_dropoff: addMinutesToTime(pickups[2], 60),
      status: 'pending', chat_unlocked: false,
    },
  ];
}

export function buildTodayTrip(): DailyTrip {
  const stops = buildTodayStops();
  const firstPickup = stops[0]!.scheduled_pickup;
  return {
    trip_id:            'trip-today',
    cycle_id:           'cycle-001',
    date:               TODAY,
    status:             'unlocked',
    ...DRIVER,
    driver_lat:         30.0660,
    driver_lng:         31.3450,
    driver_heading:     270,
    location_updated_at: new Date().toISOString(),
    current_stop_index: 0,
    first_pickup_time:  firstPickup,
    unlock_at:          computeUnlockAt(TODAY, firstPickup),
    stops,
  };
}

export const mockTodayTrip: DailyTrip = buildTodayTrip();

// ── Trip-ID → variant map ─────────────────────────────────────────────────────

const MOCK_TRIPS: Record<string, DailyTrip> = {
  'trip-today':     mockTodayTrip,
  'trip-locked':    mockLockedTrip,
  'trip-unlocked':  mockActiveTrip,
  'trip-active':    mockActiveTripInProgress,
  'trip-waiting':   mockWaitingTrip,
  'trip-noshow':    mockNoShowTrip,
  'trip-completed': mockCompletedTrip,
  'trip-cancelled': mockCancelledTrip,
  'trip-history-001': mockHistoryTrip,
};

export function getMockTripById(tripId: string): DailyTrip | undefined {
  if (tripId === 'trip-today') return buildTodayTrip();
  return MOCK_TRIPS[tripId];
}

/** Each passenger only gets their own stop */
export const mockPassengerTrip = {
  ...mockActiveTripInProgress,
  my_stop: mockActiveTripInProgress.stops[0],
};

/**
 * Returns a mock DailyTrip for a given tripId.
 *
 * Recognised IDs (use in URLs to test each state):
 *   trip-locked      → too early to start (all stops pending)
 *   trip-unlocked    → within 5 min of first pickup (default)
 *   trip-active      → driver on the way, stop 1 picked_up, stop 2 arriving
 *   trip-waiting     → driver waiting at stop 2 (3-min timer)
 *   trip-noshow      → stop 2 was a no-show, heading to stop 3
 *   trip-completed   → all stops dropped_off
 *   trip-cancelled   → trip cancelled
 *   trip-history-001 → yesterday's completed trip
 */
export async function fetchTripState(tripId: string): Promise<DailyTrip> {
  try {
    const res = await fetch(`/api/trips/${tripId}`, { cache: 'no-store' });
    if (res.ok) return res.json() as Promise<DailyTrip>;
  } catch {
    // offline / SSR — fall through to local mocks
  }
  await new Promise(r => setTimeout(r, 200));
  return getMockTripById(tripId) ?? { ...buildTodayTrip(), trip_id: tripId };
}

/** Persist trip mutations so the passenger view stays in sync. */
export async function saveTripState(trip: DailyTrip): Promise<DailyTrip> {
  try {
    const res = await fetch(`/api/trips/${trip.trip_id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(trip),
    });
    if (res.ok) return res.json() as Promise<DailyTrip>;
  } catch {
    // ignore
  }
  return trip;
}
