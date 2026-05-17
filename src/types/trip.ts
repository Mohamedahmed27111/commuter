// ── Trip status ───────────────────────────────────────────────────────────────

export type TripStatus =
  | 'locked'          // too early — button not shown yet
  | 'unlocked'        // within 5 min of first pickup — button shown
  | 'active'          // driver pressed Start, location broadcasting
  | 'completed'
  | 'cancelled';

// ── Per-stop status ───────────────────────────────────────────────────────────

export type StopStatus =
  | 'pending'
  | 'arriving'        // driver within 500m of this pickup point
  | 'waiting'         // driver arrived, 3-min timer running
  | 'picked_up'       // code confirmed
  | 'no_show'         // 3-min timer expired, driver moved on
  | 'dropped_off';

// ── Stop ──────────────────────────────────────────────────────────────────────

export interface TripStop {
  stop_id:            string;
  stop_number:        number;       // 1, 2, 3 — display order
  passenger_id:       string;
  passenger_name:     string;       // first name + last initial only
  passenger_code:     string;       // 4-digit daily code
  pickup_lat:         number;
  pickup_lng:         number;
  pickup_address:     string;
  dropoff_lat:        number;
  dropoff_lng:        number;
  dropoff_address:    string;
  scheduled_pickup:   string;       // "HH:MM"
  scheduled_dropoff:  string;       // "HH:MM" estimated
  actual_pickup?:     string;
  actual_dropoff?:    string;
  status:             StopStatus;
  wait_started_at?:   string;       // ISO — when driver arrived at pickup point
  chat_unlocked:      boolean;      // true only after this passenger is picked_up
}

// ── Daily trip ────────────────────────────────────────────────────────────────

export interface DailyTrip {
  trip_id:              string;
  cycle_id:             string;
  date:                 string;       // "YYYY-MM-DD"
  status:               TripStatus;
  driver_id:            string;
  driver_name:          string;
  driver_car_model:     string;
  driver_plate:         string;
  driver_rating:        number;

  // Driver live location — updated by driver, read by passengers
  driver_lat?:          number;
  driver_lng?:          number;
  driver_heading?:      number;       // degrees 0–360
  location_updated_at?: string;       // ISO — last time location was sent

  stops:                TripStop[];
  current_stop_index:   number;       // which stop is next

  first_pickup_time:    string;       // "HH:MM" — used to compute unlock time
  unlock_at:            string;       // ISO — first_pickup_time minus 5 minutes
  trip_started_at?:     string;       // ISO — when driver pressed Start
  trip_completed_at?:   string;
}
