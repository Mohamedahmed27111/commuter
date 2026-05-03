/**
 * Shared types — single source of truth for fields used by both user and driver portals.
 * All field names use snake_case to match the Laravel API response format directly.
 */

// ── Primitive unions ─────────────────────────────────────────────────────────

export type RideType    = 'shared' | 'private';
export type GenderPref  = 'same' | 'mixed';
export type WalkMinutes = 0 | 5 | 10;
export type TripType    = 'one_way' | 'round_trip';
export type WeekDay     = 'Sat' | 'Sun' | 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri';

export type RequestStatus =
  | 'available'       // driver portal: visible to drivers
  | 'submitted'       // user submitted, awaiting match
  | 'matching'        // system is searching
  | 'driver_offered'  // a driver was proposed
  | 'price_raised'    // driver proposed a higher price
  | 'confirmed'       // passenger accepted the match
  | 'active'          // cycle is running
  | 'completed'
  | 'cancelled';

// ── Seat types ────────────────────────────────────────────────────────────────

export type SeatId   = 'front-passenger' | 'rear-left' | 'rear-right';
export type SeatType = 'front' | 'rear-window';

export interface SelectedSeat {
  id:              SeatId;
  label:           string;
  type:            SeatType;
  extra_cost_egp:  number;
}

export type SeatPreference = 'any' | SelectedSeat;

export const SEAT_COSTS: Record<SeatType, number> = {
  'front':       10,
  'rear-window': 8,
};

export const SEAT_LABELS: Record<SeatId, string> = {
  'front-passenger': 'Front seat (Passenger side)',
  'rear-left':       'Rear seat (Left / Window)',
  'rear-right':      'Rear seat (Right / Window)',
};

// ── Location / geo ───────────────────────────────────────────────────────────

export interface GeoLocation {
  address: string;
  lat:     number;
  lng:     number;
}

export interface PickupPoint {
  passenger_id:       string;
  passenger_name:     string;
  passenger_gender:   'male' | 'female';
  lat:                number;
  lng:                number;
  address:            string;
  pickup_time_offset: number; // minutes after cycle departure_time
}

// ── Core request (shared between user and driver) ─────────────────────────────

export interface CycleRequestCore {
  id:                      string;
  status:                  RequestStatus;
  origin:                  GeoLocation;
  destination:             GeoLocation;
  distance_km:             number;
  duration_minutes:        number;
  route_coordinates?:      [number, number][];
  trip_type:               TripType;
  days:                    WeekDay[];
  arrival_from:            string;           // "HH:MM" — earliest acceptable arrival
  arrival_to:              string;           // "HH:MM" — latest acceptable arrival (min +1h from arrival_from)
  departure_from:          string;           // computed: arrival_from - duration_minutes
  departure_to:            string;           // computed: arrival_to - duration_minutes
  return_arrival_from?:    string;
  return_arrival_to?:      string;
  return_departure_from?:  string;
  return_departure_to?:    string;
  cycle_start_date:        string;           // ISO date string
  cycle_end_date:          string;
  ride_type:               RideType;
  gender_pref:             GenderPref;
  seat_preference:         SeatPreference;
  walk_minutes:            WalkMinutes;
  base_price:              number;           // EGP / week (driver's price)
  offered_price?:          number;           // driver counter-offer
  estimated_price_min:     number;           // EGP / week
  estimated_price_max:     number;
  passenger_count:         number;
  pickup_points:           PickupPoint[];
  created_at:              string;           // ISO datetime
}
