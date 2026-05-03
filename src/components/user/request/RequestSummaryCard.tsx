'use client';

import type { OSRMRoute } from '@/lib/osrm';
import type { RequestFormData } from './RequestForm';
import { formatTimeWindow } from '@/lib/timeUtils';
import { calculatePriceRange } from '@/lib/pricing';

interface LocationValue {
  address: string;
  lat: number;
  lng: number;
}

interface RequestSummaryCardProps {
  from: LocationValue;
  to: LocationValue;
  route: OSRMRoute;
  formData: RequestFormData;
  onEdit: () => void;
  onSubmit: () => void;
}

function formatDays(days: string[]) {
  return days.join(', ');
}

export default function RequestSummaryCard({
  from,
  to,
  route,
  formData,
  onEdit,
  onSubmit,
}: RequestSummaryCardProps) {
  const priceRange = calculatePriceRange({
    distanceKm: route.distance_km,
    ride_type:  formData.ride_type,
    seatCostEGP: formData.seat_preference === 'any' ? 0 : formData.seat_preference.extra_cost_egp,
    walkMinutes: 0,
    tripType:   formData.trip_type,
    days:       Math.max(formData.days.length, 1),
  });

  const seatLabel =
    formData.seat_preference === 'any'
      ? 'Any seat · Free'
      : `${formData.seat_preference.label} · +EGP ${formData.seat_preference.extra_cost_egp}/trip`;


  const rows: Array<[string, string]> = [
    ['Trip type', formData.ride_type === 'shared' ? '🧑‍🤝‍🧑 Shared ride' : '🚗 Private'],
    ['Seat preference', seatLabel],
    ['Trip type', formData.trip_type === 'one_way' ? 'One way' : 'Round trip'],
    ['Days', formatDays(formData.days)],
    ['Arrive between', (formData.arrival_from && formData.arrival_to) ? formatTimeWindow(formData.arrival_from, formData.arrival_to) : '—'],
    ...(formData.departure_from && formData.departure_to
      ? [['Depart between', formatTimeWindow(formData.departure_from, formData.departure_to)] as [string, string]]
      : []),
    ...(formData.trip_type === 'round_trip' && formData.return_arrival_from && formData.return_arrival_to
      ? [
          ['Arrive back between', formatTimeWindow(formData.return_arrival_from, formData.return_arrival_to)] as [string, string],
          ...(formData.return_departure_from && formData.return_departure_to
            ? [['Return depart between', formatTimeWindow(formData.return_departure_from, formData.return_departure_to)] as [string, string]]
            : []),
        ]
      : []),
    ...(formData.start_date
      ? [
          [
            'Cycle start',
            new Date(formData.start_date).toLocaleDateString('en-EG', {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            }),
          ] as [string, string],
        ]
      : []),
  ];
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 16,
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}
    >
      <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#0B1E3D' }}>
        Review your request
      </h2>

      {/* Route */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>📍</span>
          <span style={{ fontSize: 15, fontWeight: 600, color: '#0B1E3D' }}>{from.address}</span>
        </div>
        <div style={{ paddingLeft: 12, color: '#5A6A7A', fontSize: 20, lineHeight: 1 }}>↓</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>📍</span>
          <span style={{ fontSize: 15, fontWeight: 600, color: '#0B1E3D' }}>{to.address}</span>
        </div>
      </div>

      <div style={{ fontSize: 14, color: '#5A6A7A', fontWeight: 500 }}>
        {route.distance_km} km &nbsp;·&nbsp; ~{route.duration_minutes} min
      </div>

      {/* Details table */}
      <div
        style={{
          background: '#F8F9FA',
          borderRadius: 10,
          overflow: 'hidden',
          border: '1px solid #E2E8F0',
        }}
      >
        {rows.map(([label, value], i) => (
          <div
            key={label}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '10px 14px',
              borderBottom: i < rows.length - 1 ? '1px solid #E2E8F0' : 'none',
              gap: 12,
            }}
          >
            <span style={{ fontSize: 13, color: '#5A6A7A', fontWeight: 500 }}>{label}</span>
            <span style={{ fontSize: 13, color: '#0B1E3D', fontWeight: 600, textAlign: 'right' }}>
              {value}
            </span>
          </div>
        ))}
      </div>

      {/* Price estimate */}
      <div
        style={{
          background: '#0B1E3D',
          borderRadius: 10,
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
          💰 Your estimated cost
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>
          EGP {priceRange.min} – {priceRange.max} / week
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
          Confirmed after driver matches
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          type="button"
          onClick={onEdit}
          style={{
            flex: 1,
            padding: '12px',
            border: '1.5px solid #E2E8F0',
            borderRadius: 10,
            background: '#fff',
            color: '#0B1E3D',
            fontWeight: 600,
            fontSize: 14,
            cursor: 'pointer',
            fontFamily: 'inherit',
            minHeight: 48,
          }}
        >
          ← Edit
        </button>
        <button
          type="button"
          onClick={onSubmit}
          style={{
            flex: 2,
            padding: '12px',
            border: 'none',
            borderRadius: 10,
            background: '#00C2A8',
            color: '#0B1E3D',
            fontWeight: 700,
            fontSize: 14,
            cursor: 'pointer',
            fontFamily: 'inherit',
            minHeight: 48,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#00A896')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#00C2A8')}
        >
          Submit request ✓
        </button>
      </div>
    </div>
  );
}
