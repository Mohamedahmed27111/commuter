'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import PickupMap from '@/components/driver/PickupMap';
import type { DriverCycleRequest } from '@/types/driver';
import { addMinutes, formatDate, formatTimeWindow } from '@/lib/timeUtils';

interface RequestDetailDrawerProps {
  request:      DriverCycleRequest | null;
  driverGender: 'male' | 'female';
  onClose:      () => void;
  onAccept:     (id: string) => void;
  onReject:     (id: string) => void;
  onRaise:      (id: string) => void;
  readOnly?:    boolean;
  variant?:     'drawer' | 'modal';
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
      <div style={{ width: 4, height: 22, background: '#00C2A8', borderRadius: 2, flexShrink: 0 }} />
      <h3 style={{ fontSize: 11, fontWeight: 600, color: '#0B1E3D', margin: 0, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
        {children}
      </h3>
    </div>
  );
}

interface DetailRowProps {
  label:    string;
  value:    React.ReactNode;
  emphasis?: boolean;
}
function DetailRow({ label, value, emphasis }: DetailRowProps) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 14px', borderBottom: '1px solid #F1F3F4', fontSize: 13 }}>
      <span style={{ color: '#5A6A7A' }}>{label}</span>
      <span style={{ color: emphasis ? '#F5A623' : '#0B1E3D', fontWeight: 600 }}>{value}</span>
    </div>
  );
}

export default function RequestDetailDrawer({
  request,
  driverGender,
  onClose,
  onAccept,
  onReject,
  onRaise,
  readOnly  = false,
  variant   = 'drawer',
}: RequestDetailDrawerProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (request) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => closeRef.current?.focus(), 50);
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [request]);

  useEffect(() => {
    const handle = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [onClose]);

  if (!request) return null;

  const {
    id, status,
    origin, destination,
    distance_km, duration_minutes,
    trip_type, ride_type, gender_pref,
    seat_preference, walk_minutes,
    arrival_from, arrival_to,
    departure_from, departure_to,
    return_arrival_from, return_arrival_to,
    return_departure_from, return_departure_to,
    days,
    cycle_start_date, cycle_end_date,
    passenger_count, pickup_points,
    base_price, offered_price,
    estimated_price_min, estimated_price_max,
  } = request;

  const genderOk =
    gender_pref === 'mixed' ||
    (gender_pref === 'same' && pickup_points[0]?.passenger_gender === driverGender);

  return (
    <>
      <style>{`
        @keyframes drawerIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes sheetUp  { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes modalIn  { from { opacity:0; transform: translate(-50%,-48%) scale(0.96); } to { opacity:1; transform: translate(-50%,-50%) scale(1); } }
        .rdd-drawer {
          position: fixed; right: 0; top: 0;
          width: 440px; height: 100vh;
          animation: drawerIn 0.28s cubic-bezier(0.4,0,0.2,1) both;
        }
        .rdd-modal {
          position: fixed; left: 50%; top: 50%;
          transform: translate(-50%,-50%);
          width: calc(100% - 32px); max-width: 640px; max-height: 88vh;
          border-radius: 16px;
          animation: modalIn 0.22s cubic-bezier(0.4,0,0.2,1) both;
        }
        @media (max-width: 640px) {
          .rdd-drawer {
            width: 100% !important; top: auto !important; bottom: 0 !important;
            height: 85vh !important; border-radius: 20px 20px 0 0 !important;
            animation: sheetUp 0.28s cubic-bezier(0.4,0,0.2,1) both !important;
          }
          .rdd-modal {
            top: auto !important; bottom: 0 !important;
            left: 0 !important; transform: none !important;
            width: 100% !important; max-width: 100% !important;
            border-radius: 20px 20px 0 0 !important;
            animation: sheetUp 0.28s cubic-bezier(0.4,0,0.2,1) both !important;
          }
        }
      `}</style>

      {/* Overlay */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(0,0,0,0.4)' }}
        aria-hidden="true"
      />

      {/* Panel */}
      <aside
        className={variant === 'modal' ? 'rdd-modal' : 'rdd-drawer'}
        role="dialog"
        aria-modal="true"
        aria-label={`Request detail: ${origin.address} to ${destination.address}`}
        style={{
          background: '#fff', zIndex: 50,
          display: 'flex', flexDirection: 'column',
          boxShadow: variant === 'modal'
            ? '0 20px 60px rgba(0,0,0,0.22)'
            : '-8px 0 32px rgba(0,0,0,0.12)',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: '1px solid #E2E8F0', flexShrink: 0,
        }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: '#0B1E3D', margin: 0 }}>Request Detail</h2>
            <p style={{ fontSize: 12, color: '#5A6A7A', margin: '2px 0 0' }}>
              Cycle · {formatDate(cycle_start_date)} – {formatDate(cycle_end_date)}
            </p>
          </div>
          <button
            ref={closeRef}
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5A6A7A', padding: 4, borderRadius: 6 }}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>

          {/* A. Trip Summary */}
          <SectionHeading>Trip Summary</SectionHeading>
          <div style={{ background: '#EFF7F6', borderRadius: 10, padding: 16, marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 14 }}>📍</span>
              <span style={{ fontWeight: 700, color: '#0B1E3D', fontSize: 15 }}>{origin.address}</span>
              <span style={{ color: '#00C2A8', fontWeight: 700, fontSize: 16 }}>→</span>
              <span style={{ fontWeight: 700, color: '#0B1E3D', fontSize: 15 }}>{destination.address}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                ['Distance',     `${distance_km} km`],
                ['Est. duration', `${duration_minutes} min`],
                ['Passengers',   String(passenger_count)],
                ['Trip type',    trip_type === 'round_trip' ? '↩ Round trip' : '→ One way'],
                ['Base price',   `EGP ${base_price}`],
                ['Est. range',   `EGP ${estimated_price_min} – ${estimated_price_max} / wk`],
              ].map(([lbl, val]) => (
                <div key={lbl}>
                  <p style={{ fontSize: 11, color: '#5A6A7A', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{lbl}</p>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#0B1E3D', margin: 0 }}>{val}</p>
                </div>
              ))}
              {offered_price != null && (
                <div>
                  <p style={{ fontSize: 11, color: '#5A6A7A', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Offered price</p>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#F5A623', margin: 0 }}>EGP {offered_price}</p>
                </div>
              )}
            </div>
          </div>

          {/* B. Passenger Preferences */}
          <SectionHeading>Passenger Preferences</SectionHeading>
          <div style={{ background: '#F8F9FA', borderRadius: 10, overflow: 'hidden', border: '1px solid #E2E8F0', marginBottom: 24 }}>
            <DetailRow label="Trip type"       value={ride_type === 'shared' ? '🧑‍🤝‍🧑 Shared ride' : '🚗 Private'} />
            <DetailRow
              label="Gender preference"
              value={gender_pref === 'same'
                ? `Same gender${!genderOk ? ' ⚠️ Mismatch' : ''}`
                : 'Mixed'}
              emphasis={gender_pref === 'same' && !genderOk}
            />
            <DetailRow
              label="Seat preference"
              value={seat_preference === 'any'
                ? '💺 Any seat'
                : `💺 ${seat_preference.label}${seat_preference.extra_cost_egp ? ` · +EGP ${seat_preference.extra_cost_egp}` : ''}`}
            />
            <DetailRow
              label="Walk to pickup"
              value={walk_minutes === 10 ? '🚶 10 min (~800 m)' : walk_minutes === 5 ? '🚶 5 min (~400 m)' : '🚪 Door pickup'}
            />
          </div>

          {/* C. Schedule */}
          <SectionHeading>Schedule</SectionHeading>
          <div style={{ background: '#F8F9FA', borderRadius: 10, overflow: 'hidden', border: '1px solid #E2E8F0', marginBottom: 24 }}>
            <DetailRow label="Days"              value={days.join(', ')} />
            <DetailRow label="Passenger arrives between" value={formatTimeWindow(arrival_from, arrival_to)} />
            {departure_from && departure_to && (
              <DetailRow label="⚡ Driver departs between" value={formatTimeWindow(departure_from, departure_to)} emphasis />
            )}
            {trip_type === 'round_trip' && return_arrival_from && return_arrival_to && (
              <DetailRow label="Return: arrives between" value={formatTimeWindow(return_arrival_from, return_arrival_to)} />
            )}
            {trip_type === 'round_trip' && return_departure_from && return_departure_to && (
              <DetailRow label="⚡ Return: departs between" value={formatTimeWindow(return_departure_from, return_departure_to)} emphasis />
            )}
          </div>

          {/* D. Pickup Stops */}
          {pickup_points.length > 0 && (
            <>
              <SectionHeading>Pickup Stops</SectionHeading>
              <div style={{ marginBottom: 24, overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                      {['#', 'Name', 'Address', 'Pickup time'].map((h) => (
                        <th key={h} style={{
                          textAlign: 'left', paddingBottom: 8, paddingRight: 8,
                          color: '#5A6A7A', fontWeight: 500, fontSize: 11,
                          textTransform: 'uppercase', letterSpacing: '0.04em',
                        }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pickup_points.map((pt, i) => (
                      <tr key={pt.passenger_id} style={{ borderBottom: '1px solid #F8F9FA' }}>
                        <td style={{ padding: '8px 8px 8px 0', verticalAlign: 'middle' }}>
                          <div style={{
                            width: 22, height: 22, borderRadius: '50%',
                            background: '#00C2A8', color: '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 11, fontWeight: 700,
                          }}>
                            {i + 1}
                          </div>
                        </td>
                        <td style={{ padding: '8px 8px 8px 0', fontWeight: 600, color: '#0B1E3D', whiteSpace: 'nowrap' }}>
                          {pt.passenger_name}
                        </td>
                        <td style={{ padding: '8px 8px 8px 0', color: '#5A6A7A', maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {pt.address}
                        </td>
                        <td style={{ padding: '8px 0', color: '#0B1E3D', whiteSpace: 'nowrap' }}>
                        {departure_from
            ? formatTimeWindow(addMinutes(departure_from, pt.pickup_time_offset), addMinutes(departure_to, pt.pickup_time_offset))
            : `+${pt.pickup_time_offset} min`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* E. Pickup Map */}
          <SectionHeading>Pickup Map</SectionHeading>
          <PickupMap
            pickupPoints={pickup_points}
            destination={destination}
            walkMinutes={walk_minutes}
            height={280}
          />
        </div>

        {/* Sticky action bar */}
        {status === 'available' && !readOnly && (
          <div style={{
            padding: '12px 16px', borderTop: '1px solid #E2E8F0',
            background: '#fff', display: 'flex', gap: 8, flexShrink: 0,
          }}>
            <button
              onClick={() => onReject(id)}
              style={{ flex: 1, height: 40, borderRadius: 8, border: '1.5px solid #E2E8F0', color: '#E74C3C', fontSize: 14, fontWeight: 500, background: 'transparent', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Reject
            </button>
            <button
              onClick={() => onRaise(id)}
              style={{ flex: 1, height: 40, borderRadius: 8, border: '1.5px solid #F5A623', color: '#F5A623', fontSize: 14, fontWeight: 500, background: 'transparent', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Raise price
            </button>
            <button
              onClick={() => onAccept(id)}
              disabled={!genderOk}
              style={{ flex: 1, height: 40, borderRadius: 8, background: genderOk ? '#00C2A8' : '#CBD5E1', color: genderOk ? '#0B1E3D' : '#94A3B8', fontSize: 14, fontWeight: 700, border: 'none', cursor: genderOk ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}
              title={!genderOk ? 'Gender preference mismatch' : undefined}
            >
              Accept
            </button>
          </div>
        )}
      </aside>
    </>
  );
}

