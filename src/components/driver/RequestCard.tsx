'use client';

import type { DriverCycleRequest } from '@/types/driver';
import { formatDate, formatTimeWindow } from '@/lib/timeUtils';
import { MapPin, Users, Clock, Footprints, RotateCcw, Armchair } from 'lucide-react';

// ── Helpers ───────────────────────────────────────────────────────────────────

function Dot() {
  return <span className="text-[#C8E8E4] mx-1">·</span>;
}

function RideTypeBadge({ ride_type }: { ride_type: 'shared' | 'private' }) {
  const isShared = ride_type === 'shared';
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
      isShared ? 'bg-[#EFF7F6] text-[#00A896]' : 'bg-[#FFF3E0] text-[#E65100]'
    }`}>
      {isShared ? (
        <>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          Shared ride
        </>
      ) : (
        <>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
          Private
        </>
      )}
    </span>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface RequestCardProps {
  request:      DriverCycleRequest;
  driverGender: 'male' | 'female';
  onAccept:     (id: string) => void;
  onReject:     (id: string) => void;
  onRaise:      (id: string) => void;
  onSeeDetails: (id: string) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function RequestCard({
  request,
  driverGender,
  onAccept,
  onReject,
  onRaise,
  onSeeDetails,
}: RequestCardProps) {
  const {
    id, status, origin, destination,
    distance_km, trip_type, ride_type, gender_pref,
    seat_preference, walk_minutes,
    arrival_from, arrival_to, departure_from, departure_to,
    cycle_start_date, cycle_end_date,
    base_price, estimated_price_min, estimated_price_max,
    passenger_count,
  } = request;

  const genderOk =
    gender_pref === 'mixed' ||
    (gender_pref === 'same' &&
      request.pickup_points[0]?.passenger_gender === driverGender);

  const seatLabel =
    seat_preference === 'any' ? 'Any seat' : seat_preference.label;

  const seatExtra =
    seat_preference !== 'any' && seat_preference.extra_cost_egp > 0
      ? `+EGP ${seat_preference.extra_cost_egp}`
      : null;

  return (
    <article
      className="bg-white border border-[#E2E8F0] rounded-xl p-5 flex flex-col gap-3"
      aria-label={`Cycle request from ${origin.address} to ${destination.address}`}
    >
      {/* Top row: dates + badges */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-medium text-[#5A6A7A]">
          {formatDate(cycle_start_date)} – {formatDate(cycle_end_date)}
        </span>
        <div className="flex flex-wrap items-center gap-1.5">
          <RideTypeBadge ride_type={ride_type} />
          {!genderOk && (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#FEF2F2] text-[#B91C1C]">
              Gender mismatch
            </span>
          )}
          {gender_pref === 'same' && genderOk && (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#FEF9C3] text-[#854D0E]">
              Same gender
            </span>
          )}
        </div>
      </div>

      {/* Route */}
      <div className="flex flex-wrap items-center gap-2 font-bold text-[15px] text-[#0B1E3D]">
        <MapPin size={15} className="text-[#00C2A8] flex-shrink-0" />
        <span>{origin.address}</span>
        <span className="text-[#00C2A8]">→</span>
        <span>{destination.address}</span>
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap items-center text-[13px] text-[#5A6A7A] gap-0.5">
        <span>{distance_km} km</span>
        <Dot />
        <span className="inline-flex items-center gap-1">
          <RotateCcw size={13} className="text-[#00C2A8]" />
          {trip_type === 'round_trip' ? 'Round trip' : 'One way'}
        </span>
        <Dot />
        <span className="inline-flex items-center gap-1">
          <Users size={13} className="text-[#00C2A8]" />
          {passenger_count} {passenger_count === 1 ? 'person' : 'people'}
        </span>
        <Dot />
        <span className="inline-flex items-center gap-1">
          <Clock size={13} className="text-[#00C2A8]" />
          Arrive <strong className="ml-0.5">{formatTimeWindow(arrival_from ?? '', arrival_to ?? '')}</strong>
        </span>
        {departure_from && departure_to && (
          <>
            <Dot />
            <span className="text-[12px] text-[#9AA0A6]">
              (depart {formatTimeWindow(departure_from, departure_to)})
            </span>
          </>
        )}
        {walk_minutes > 0 && (
          <>
            <Dot />
            <span className="inline-flex items-center gap-1">
              <Footprints size={13} className="text-[#00C2A8]" />
              {walk_minutes} min walk
            </span>
          </>
        )}
      </div>

      {/* Seat preference */}
      {seat_preference !== 'any' && (
        <div className="flex items-center gap-1.5">
          <span className="text-[12px] text-[#5A6A7A]">Seat:</span>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#FFF8E1] border border-[#F9C74F] text-[#7a4d00]">
            <Armchair size={11} />
            {seatLabel}{seatExtra && ` · ${seatExtra}`}
          </span>
        </div>
      )}

      {/* Price row */}
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className="text-[13px] text-[#5A6A7A]">Est. price:</span>
        <span className="font-bold text-base text-[#0B1E3D]">
          EGP {estimated_price_min} – {estimated_price_max}
        </span>
        <span className="text-xs text-[#5A6A7A]">/week</span>
        <span className="text-xs text-[#94A3B8]">(base EGP {base_price})</span>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between flex-wrap gap-2 pt-3 border-t border-[#F1F3F4]">
        <button
          onClick={() => onSeeDetails(id)}
          className="text-[13px] font-semibold text-[#00C2A8] bg-transparent border-none cursor-pointer py-1"
          aria-label={`See details for request from ${origin.address}`}
        >
          View details →
        </button>

        {status === 'available' && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onReject(id)}
              className="px-4 py-2 rounded-xl border border-[#E74C3C] text-[#E74C3C] bg-white text-[13px] font-medium cursor-pointer"
            >
              Reject
            </button>
            <button
              onClick={() => onRaise(id)}
              className="px-4 py-2 rounded-xl border border-[#F5A623] text-[#F5A623] bg-white text-[13px] font-medium cursor-pointer"
            >
              Counter price
            </button>
            <button
              onClick={() => onAccept(id)}
              disabled={!genderOk}
              className={`px-4 py-2 rounded-xl text-[13px] font-bold border-none cursor-pointer ${
                genderOk
                  ? 'bg-[#00C2A8] text-[#0B1E3D]'
                  : 'bg-[#CBD5E1] text-[#94A3B8] cursor-not-allowed'
              }`}
              title={!genderOk ? 'Gender preference mismatch' : undefined}
            >
              Accept
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

