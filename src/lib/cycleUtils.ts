import { addDays } from 'date-fns';

// Day numbers: 0=Sun 1=Mon 2=Tue 3=Wed 4=Thu 5=Fri 6=Sat
const CYCLE_DAY = 6; // Saturday — cycles always start here

// Cairo timezone identifier
const CAIRO_TZ = 'Africa/Cairo';

/**
 * Returns the current date components in Cairo (Egypt) timezone.
 */
function getCairoDateInfo(now: Date): { dayOfWeek: number; cairoDate: Date } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: CAIRO_TZ,
    year:     'numeric',
    month:    '2-digit',
    day:      '2-digit',
    weekday:  'long',
  }).formatToParts(now);

  const year    = parseInt(parts.find(p => p.type === 'year')!.value);
  const month   = parseInt(parts.find(p => p.type === 'month')!.value) - 1; // 0-indexed
  const day     = parseInt(parts.find(p => p.type === 'day')!.value);
  const weekday = parts.find(p => p.type === 'weekday')!.value;

  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayOfWeek = DAYS.indexOf(weekday);

  // Construct a local Date whose calendar date matches Cairo's today
  const cairoDate = new Date(year, month, day);
  return { dayOfWeek, cairoDate };
}

/**
 * Returns the next available cycle start date (always a Saturday).
 * All calculations are based on Cairo / Egypt time.
 *
 * Rules:
 *  - Sat / Sun / Mon / Tue / Wed → next Saturday
 *    (booking window for the coming week is still open)
 *  - Thu / Fri → Saturday after next
 *    (booking window closed Wednesday 23:59:59 Cairo time)
 */
export function getNextAvailableCycleStart(today: Date = new Date()): Date {
  const { dayOfWeek, cairoDate } = getCairoDateInfo(today);

  // Days until the coming Saturday (min 1 — today's Saturday still counts as "next")
  const daysUntilSat = ((CYCLE_DAY - dayOfWeek + 7) % 7) || 7;
  const thisSaturday = addDays(cairoDate, daysUntilSat);

  // Booking window closes Wednesday 23:59:59 Cairo → Thu (4) and Fri (5) go to the following week
  const cutoffReached = dayOfWeek === 4 || dayOfWeek === 5; // Thu or Fri

  return cutoffReached ? addDays(thisSaturday, 7) : thisSaturday;
}

/** Returns a human-readable date string for a cycle start date. */
export function formatCycleStartDate(date: Date, locale: string): string {
  return date.toLocaleDateString(
    locale === 'ar' ? 'ar-EG-u-nu-latn' : 'en-EG',
    { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' },
  );
}

/** Cycles always run Saturday–Friday (7 days). */
export function getCycleEndDate(startDate: Date): Date {
  return addDays(startDate, 6);
}

/**
 * Return the calendar date for a given day-of-week (Sun=0..Sat=6) within
 * a cycle week that starts on `cycleStart` (always a Saturday).
 */
export function cycleDateForDayOfWeek(cycleStart: Date, dayOfWeek: number): Date {
  // Saturday is index 6 in the API (Sun=0..Sat=6).
  // Cycle starts on Saturday → that's offset 0; Sunday → 1; Monday → 2; …; Friday → 6.
  const SAT = 6;
  const offset = (dayOfWeek - SAT + 7) % 7;
  return addDays(cycleStart, offset);
}

/** Format Date as YYYY-MM-DD (local time). */
export function toApiDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
