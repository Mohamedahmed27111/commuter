'use client';

import { useState, useMemo } from 'react';
import type { TimeSlot, WeekDay } from '@/types/shared';
import {
  ALL_DAYS,
  computeArrivalFrom,
  computeArrivalTo,
} from '@/lib/timeUtils';
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

  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([
    {
      id: crypto.randomUUID(),
      trip_type: 'one_way' as const,
      origin: null,
      stops: [],
      destination: null,
      route: null,
      route_set: false,
      return_origin: null,
      return_destination: null,
      return_route: null,
      return_customized: false,
      days: [],
      pickup_from: '07:00',
      pickup_to: '07:30',
      arrival_from: computeArrivalFrom('07:30', durationMinutes),
      arrival_to: computeArrivalTo('07:00', '07:30', durationMinutes),
    },
  ]);

  const assignedDays = useMemo(
    () => timeSlots.flatMap((slot) => slot.days),
    [timeSlots]
  );

  const availableDays = useMemo(
    () => ALL_DAYS.filter((day) => !assignedDays.includes(day)),
    [assignedDays]
  );

  const allDaysAssigned = availableDays.length === 0;

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

  const isValid = timeSlots.length > 0 && timeSlots.every((slot) => slot.days.length > 0);

  return {
    rideType, setRideType,
    seatPreference, setSeatPreference,
    tripType, setTripType,
    days, setDays,
    timeSlots,
    setTimeSlots,
    assignedDays,
    availableDays,
    allDaysAssigned,
    priceRange,
    isValid,
  };
}
