export interface PricingOptions {
  distanceKm: number;
  ride_type: 'shared' | 'private';
  /** Direct seat surcharge in EGP (0 = any/free, 8 = rear-window, 10 = front) */
  seatCostEGP: number;
  walkMinutes: 0 | 5 | 10;
  tripType: 'one_way' | 'round_trip';
  days: number; // number of days per week selected
}

export interface PriceBreakdown {
  base: number;
  rideTypeMultiplier: number;
  seatFee: number;
  walkDiscount: number;
  roundTripMultiplier: number;
  perTrip: number;
  perWeek: number;
}

// Base rate: EGP 4 per km
const BASE_RATE = 4;

export function calculatePriceRange(opts: PricingOptions): {
  min: number;
  max: number;
  breakdown: PriceBreakdown;
} {
  const base = opts.distanceKm * BASE_RATE;

  const breakdown: PriceBreakdown = {
    base,
    rideTypeMultiplier: opts.ride_type === 'private' ? 2.2 : 1,
    seatFee: opts.seatCostEGP,
    walkDiscount:
      opts.walkMinutes === 10
        ? -0.15 // 15% off
        : opts.walkMinutes === 5
        ? -0.08 // 8% off
        : 0,
    roundTripMultiplier: opts.tripType === 'round_trip' ? 1.8 : 1,
    perTrip: 0,
    perWeek: 0,
  };

  const perTrip =
    (base * breakdown.rideTypeMultiplier + breakdown.seatFee) *
    (1 + breakdown.walkDiscount) *
    breakdown.roundTripMultiplier;

  breakdown.perTrip = Math.round(perTrip);
  breakdown.perWeek = Math.round(perTrip * opts.days);

  // Return a ±15% range (driver may raise or lower slightly)
  return {
    min: Math.round(breakdown.perWeek * 0.85),
    max: Math.round(breakdown.perWeek * 1.15),
    breakdown,
  };
}
