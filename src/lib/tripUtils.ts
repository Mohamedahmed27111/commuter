import { parseISO, subMinutes, isAfter, format } from 'date-fns';

/**
 * Given a trip date ("YYYY-MM-DD") and first pickup time ("HH:MM"),
 * compute the ISO datetime when the Start button should unlock (5 min before).
 */
export function computeUnlockAt(tripDate: string, firstPickupTime: string): string {
  const [h, m] = firstPickupTime.split(':').map(Number);
  const pickupDateTime = new Date(tripDate);
  pickupDateTime.setHours(h, m, 0, 0);
  return subMinutes(pickupDateTime, 5).toISOString();
}

/** Is the start button currently unlocked? */
export function isStartUnlocked(unlockAt: string): boolean {
  return isAfter(new Date(), parseISO(unlockAt));
}

/** How many minutes/seconds until unlock? */
export function timeUntilUnlock(unlockAt: string): { minutes: number; seconds: number } {
  const diff = parseISO(unlockAt).getTime() - Date.now();
  if (diff <= 0) return { minutes: 0, seconds: 0 };
  const totalSeconds = Math.ceil(diff / 1000);
  return { minutes: Math.floor(totalSeconds / 60), seconds: totalSeconds % 60 };
}

/** Haversine distance in meters between two lat/lng points. */
export function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Format a date string "YYYY-MM-DD" as a readable label, e.g. "Saturday, 17 May 2026".
 */
export function formatTripDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return format(d, 'EEEE, d MMMM yyyy');
}

/**
 * Format "HH:MM" 24h time to 12h with AM/PM, e.g. "7:30 AM".
 */
export function formatTime12h(time24: string): string {
  const [h, m] = time24.split(':').map(Number);
  const period = h < 12 ? 'AM' : 'PM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

/**
 * Compute rough ETA from driver's current position to a pickup point.
 * Assumes 30 km/h average urban speed.
 */
export function computeETA(
  driverLat: number, driverLng: number,
  pickupLat: number, pickupLng: number
): string {
  const distMeters = haversineDistance(driverLat, driverLng, pickupLat, pickupLng);
  const minutes = Math.round((distMeters / 1000 / 30) * 60);
  if (minutes < 1) return 'less than 1 min';
  return `${minutes} min`;
}

/** Format a Date as "HH:MM" (24h) in local time. */
export function formatTimeHHMM(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** Today's date as "YYYY-MM-DD". */
export function todayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * First pickup a few minutes ahead so the Start button is already unlocked.
 * (Unlock = 5 min before pickup → pickup at now+4m ⇒ unlocked immediately.)
 */
export function computeDemoFirstPickup(): string {
  const pickup = new Date(Date.now() + 4 * 60_000);
  return formatTimeHHMM(pickup);
}

/** Staggered pickup times after the first stop. */
export function staggerPickupTimes(firstPickup: string, count: number): string[] {
  const [h, m] = firstPickup.split(':').map(Number);
  const base = new Date();
  base.setHours(h, m, 0, 0);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(base.getTime() + i * 15 * 60_000);
    return formatTimeHHMM(d);
  });
}
