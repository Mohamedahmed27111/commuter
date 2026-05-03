/**
 * Compute departure time given an arrival time and trip duration.
 * Both times are "HH:MM" 24-hour strings.
 */
export function computeDeparture(
  arrivalTime: string,
  durationMinutes: number
): string {
  const [hours, minutes] = arrivalTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes - durationMinutes;
  const h = Math.floor((((totalMinutes % 1440) + 1440) % 1440) / 60);
  const m = ((totalMinutes % 60) + 60) % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Format a "HH:MM" 24-hour string as "h:MM AM/PM".
 */
export function formatTime12h(time24: string): string {
  const [h, m] = time24.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

/**
 * Add minutes to a "HH:MM" 24-hour string and return a new "HH:MM" string.
 */
export function addMinutes(time24: string, minutes: number): string {
  const [h, m] = time24.split(':').map(Number);
  const total = h * 60 + m + minutes;
  const hh = Math.floor((total % 1440 + 1440) % 1440 / 60);
  const mm = ((total % 60) + 60) % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

/**
 * Add hours to a "HH:MM" 24-hour string and return a new "HH:MM" string.
 */
export function addHours(time24: string, hours: number): string {
  return addMinutes(time24, hours * 60);
}

/**
 * Compute the difference in minutes between two "HH:MM" strings (to - from).
 */
export function timeDiffMinutes(from: string, to: string): number {
  const [fh, fm] = from.split(':').map(Number);
  const [th, tm] = to.split(':').map(Number);
  return (th * 60 + tm) - (fh * 60 + fm);
}

/**
 * Format a time window as "h:MM AM/PM – h:MM AM/PM".
 */
export function formatTimeWindow(from: string, to: string): string {
  return `${formatTime12h(from)} – ${formatTime12h(to)}`;
}

/**
 * Format an ISO date or datetime string to a localised short date (e.g. "04 May 2026").
 */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-EG', {
    day:   '2-digit',
    month: 'short',
    year:  'numeric',
  });
}
