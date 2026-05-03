'use client';

import { useState, useMemo } from 'react';
import type { WeekDay } from '@/types/user';
import { computeDeparture, addHours } from '@/lib/timeUtils';
import { calculatePriceRange } from '@/lib/pricing';

export type RideType      = 'shared' | 'private';
export type SeatPreference = 'window' | 'aisle' | 'any';
export type TripType      = 'one_way' | 'round_trip';
export type WalkMinutes   = 0 | 5 | 10;

export function useRequestForm(distanceKm: number, durationMinutes: number) {
  const [rideType,      setRideType]      = useState<RideType>('shared');
  const [seatPreference, setSeatPreference] = useState<SeatPreference>('any');
  const [tripType,      setTripType]      = useState<TripType>('one_way');
  const [days,          setDays]          = useState<WeekDay[]>([]);

  const [arrival_from, setArrivalFrom] = useState<string>('08:30');
  const [arrival_to,   setArrivalTo]   = useState<string>(addHours('08:30', 1));

  const [return_arrival_from, setReturnArrivalFrom] = useState<string>('18:00');
  const [return_arrival_to,   setReturnArrivalTo]   = useState<string>(addHours('18:00', 1));

  // Derived departure windows
  const departure_from = useMemo(
    () => computeDeparture(arrival_from, durationMinutes),
    [arrival_from, durationMinutes]
  );
  const departure_to = useMemo(
    () => computeDeparture(arrival_to, durationMinutes),
    [arrival_to, durationMinutes]
  );

  const return_departure_from = useMemo(
    () => computeDeparture(return_arrival_from, durationMinutes),
    [return_arrival_from, durationMinutes]
  );
  const return_departure_to = useMemo(
    () => computeDeparture(return_arrival_to, durationMinutes),
    [return_arrival_to, durationMinutes]
  );

  const priceRange = useMemo(
    () =>
      calculatePriceRange({
        distanceKm,
        ride_type:   rideType,
        seatCostEGP: seatPreference === 'any' ? 0 : seatPreference === 'window' ? 8 : 5,
        walkMinutes: 0,
        tripType,
        days: Math.max(days.length, 1),
      }),
    [distanceKm, rideType, seatPreference, tripType, days]
  );

  const isValid = days.length > 0 && !!arrival_from && !!arrival_to;

  return {
    rideType, setRideType,
    seatPreference, setSeatPreference,
    tripType, setTripType,
    days, setDays,
    arrival_from, setArrivalFrom,
    arrival_to, setArrivalTo,
    return_arrival_from, setReturnArrivalFrom,
    return_arrival_to, setReturnArrivalTo,
    departure_from,
    departure_to,
    return_departure_from,
    return_departure_to,
    priceRange,
    isValid,
  };
}
