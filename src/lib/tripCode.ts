/**
 * Generates a deterministic 4-digit daily pickup code for a passenger.
 * In production this would be generated server-side and stored in the DB.
 */
export function generateDailyCode(
  passengerId: string,
  tripDate: string,
  cycleId: string,
): string {
  const seed = `${passengerId}-${tripDate}-${cycleId}`;
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) % 9000;
  return String(hash + 1000); // always 4 digits, 1000–9999
}
