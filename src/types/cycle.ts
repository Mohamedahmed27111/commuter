export interface DriverCycleSchedule {
  cycle_id:         string;
  status:           'confirmed' | 'active' | 'completed';
  cycle_start_date: string;   // "YYYY-MM-DD" — always a Saturday
  cycle_end_date:   string;   // "YYYY-MM-DD" — always a Friday
  days:             CycleDay[];
}

export interface CycleDay {
  date:      string;          // "YYYY-MM-DD"
  day_name:  string;          // "Saturday" | "Sunday" | etc.
  day_short: string;          // "Sat" | "Sun" | etc.
  is_today:  boolean;
  status:    'upcoming' | 'active' | 'completed' | 'cancelled';
  runs:      DayRun[];
}

export interface DayRun {
  run_id:             string;
  departure_time:     string;  // "HH:MM" — when driver leaves for first pickup
  first_pickup_time:  string;  // "HH:MM" — scheduled time at stop 1
  unlock_at:          string;  // ISO — 5 min before first_pickup_time
  estimated_end_time: string;  // "HH:MM" — last dropoff estimated time
  total_distance_km:  number;  // full route distance for this run
  status:             RunStatus;
  passengers:         RunPassenger[];
}

export type RunStatus =
  | 'upcoming'   // not today or future
  | 'locked'     // today, but start button not unlocked yet
  | 'unlocked'   // today, 5 min before first pickup — can start
  | 'active'     // driver pressed start
  | 'completed'
  | 'cancelled';

export interface RunPassenger {
  stop_order:       number;    // 1, 2, 3 — pickup order
  passenger_id:     string;
  passenger_name:   string;    // first name + last initial
  passenger_code:   string;    // 4-digit daily code
  pickup_address:   string;
  pickup_area:      string;    // short area name, e.g. "Nasr City"
  pickup_lat:       number;
  pickup_lng:       number;
  scheduled_pickup: string;    // "HH:MM"
  dropoff_address:  string;
  dropoff_area:     string;    // e.g. "Future City"
  dropoff_lat:      number;
  dropoff_lng:      number;
  scheduled_dropoff: string;   // "HH:MM"
  pickup_status:    'pending' | 'picked_up' | 'no_show';
  dropoff_status:   'pending' | 'dropped_off';
  chat_unlocked:    boolean;   // true after picked_up
}
