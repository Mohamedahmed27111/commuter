'use client';

import type { DriverCycleRequest } from '@/types/driver';
import { formatDate, formatTimeWindow } from '@/lib/timeUtils';

// ── Helpers ───────────────────────────────────────────────────────────────────

function Dot() {
  return <span style={{ color: '#C8E8E4', margin: '0 4px' }}>·</span>;
}

function RideTypeBadge({ ride_type }: { ride_type: 'shared' | 'private' }) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99,
      background: ride_type === 'shared' ? '#EFF7F6' : '#FFF3E0',
      color:      ride_type === 'shared' ? '#00A896' : '#E65100',
    }}>
      {ride_type === 'shared' ? '🧑‍🤝‍🧑 Shared ride' : '🚗 Private'}
    </span>
  );
}

function GenderBadge({ pref }: { pref: 'same' | 'mixed' }) {
  if (pref === 'mixed') return null;
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99,
      background: '#FEF9C3', color: '#854D0E',
    }}>
      Same gender
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

  // Gender eligibility
  const genderOk =
    gender_pref === 'mixed' ||
    (gender_pref === 'same' &&
      request.pickup_points[0]?.passenger_gender === driverGender);

  const seatLabel =
    seat_preference === 'any'
      ? 'Any seat'
      : seat_preference.label;

  const seatExtra =
    seat_preference !== 'any' && seat_preference.extra_cost_egp > 0
      ? `+EGP ${seat_preference.extra_cost_egp}`
      : null;

  return (
    <article
      className="bg-secondary-lt border border-[#C8E8E4] rounded-lg p-4 md:p-5 space-y-3"
      aria-label={`Cycle request from ${origin.address} to ${destination.address}`}
    >
      {/* Top row: dates + trip mode badge */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontSize: 12, color: '#5A6A7A', fontWeight: 500 }}>
          {formatDate(cycle_start_date)} – {formatDate(cycle_end_date)}
        </span>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <RideTypeBadge ride_type={ride_type} />
          {!genderOk && (
            <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: '#FEF2F2', color: '#B91C1C' }}>
              Gender mismatch
            </span>
          )}
          {gender_pref === 'same' && genderOk && <GenderBadge pref={gender_pref} />}
        </div>
      </div>

      {/* Route */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 15, color: '#0B1E3D' }}>
        <span style={{ color: '#00C2A8' }}>📍</span>
        <span>{origin.address}</span>
        <span style={{ color: '#5A6A7A', fontWeight: 400 }}>→</span>
        <span>{destination.address}</span>
      </div>

      {/* Meta chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', fontSize: 13, color: '#5A6A7A', gap: 2 }}>
        <span>{distance_km} km</span>
        <Dot />
        <span>{trip_type === 'round_trip' ? '↩ Round trip' : '→ One way'}</span>
        <Dot />
        <span>👥 {passenger_count} {passenger_count === 1 ? 'person' : 'people'}</span>
        <Dot />
        <span>🕐 Arrive{' '}
          <strong>{formatTimeWindow(arrival_from, arrival_to)}</strong>
        </span>
        {departure_from && departure_to && (
          <>
            <Dot />
            <span className="text-[#9AA0A6] text-xs">(depart {formatTimeWindow(departure_from, departure_to)})</span>
          </>
        )}
        {walk_minutes > 0 && (
          <>
            <Dot />
            <span>🚶 {walk_minutes} min walk</span>
          </>
        )}
      </div>

      {/* Seat preference */}
      {seat_preference !== 'any' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, color: '#5A6A7A' }}>Seat:</span>
          <span style={{
            fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99,
            background: '#FFF8E1', border: '1px solid #F9C74F', color: '#7a4d00',
          }}>
            💺 {seatLabel} {seatExtra && `· ${seatExtra}`}
          </span>
        </div>
      )}

      {/* Price */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontSize: 13, color: '#5A6A7A' }}>Est. price:</span>
        <span style={{ fontWeight: 700, fontSize: 16, color: '#0B1E3D' }}>
          EGP {estimated_price_min} – {estimated_price_max}
        </span>
        <span style={{ fontSize: 12, color: '#5A6A7A' }}>/week</span>
        <span style={{ fontSize: 12, color: '#94A3B8' }}>
          (base EGP {base_price})
        </span>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap', paddingTop: 4 }}>
        <button
          onClick={() => onSeeDetails(id)}
          style={{ background: 'none', border: 'none', color: '#00C2A8', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 0 }}
          aria-label={`See details for request from ${origin.address}`}
        >
          See details ›
        </button>

        {status === 'available' && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={() => onReject(id)}
              style={{ padding: '8px 14px', borderRadius: 8, border: '1.5px solid #E74C3C', color: '#E74C3C', background: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Reject
            </button>
            <button
              onClick={() => onRaise(id)}
              style={{ padding: '8px 14px', borderRadius: 8, border: '1.5px solid #F5A623', color: '#F5A623', background: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Raise price
            </button>
            <button
              onClick={() => onAccept(id)}
              disabled={!genderOk}
              style={{ padding: '8px 14px', borderRadius: 8, background: genderOk ? '#00C2A8' : '#CBD5E1', color: genderOk ? '#0B1E3D' : '#94A3B8', fontSize: 13, fontWeight: 700, border: 'none', cursor: genderOk ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}
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

