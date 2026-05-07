'use client';

import { useState, useMemo } from 'react';
import type { WeekDay, RideType } from '@/types/user';
import { computeDeparture, addHours, timeDiffMinutes, formatTimeWindow } from '@/lib/timeUtils';
import { calculatePriceRange } from '@/lib/pricing';
import DaysPicker from './DaysPicker';
import SeatSelector, { type SelectedSeat } from './SeatSelector';

export interface RequestFormData {
  trip_type:            'one_way' | 'round_trip';
  ride_type:            RideType;
  seat_preference:      SelectedSeat | 'any';
  start_date:           string;
  days:                 WeekDay[];
  // Per-day departure times
  timeMode:             'same' | 'per_day';
  unifiedTimeFrom:      string;              // departure window start (same-time mode)
  unifiedTimeTo:        string;              // departure window end (same-time mode)
  perDayTimes:          Partial<Record<WeekDay, { from: string; to: string }>>;
  arrival_from:         string;
  arrival_to:           string;
  return_arrival_from:  string;
  return_arrival_to:    string;
  departure_from:       string;   // computed
  departure_to:         string;   // computed
  return_departure_from: string;  // computed
  return_departure_to:  string;   // computed
}

interface RequestFormProps {
  data: RequestFormData;
  onChange: (data: RequestFormData) => void;
  onReview: () => void;
  showErrors?: boolean;
  distanceKm: number;
  durationMinutes: number;
  /** When true (via stops added), shared ride button is locked to private */
  lockedToPrivate?: boolean;
  /** Profile-level preferences (read-only, not shown in form) */
  walkMinutes?: 0 | 5 | 10;
}

export default function RequestForm({
  data,
  onChange,
  onReview,
  showErrors = false,
  distanceKm,
  durationMinutes,
  lockedToPrivate = false,
  walkMinutes = 0,
}: RequestFormProps) {
  const [shake, setShake] = useState(false);

  function update(partial: Partial<RequestFormData>) {
    const next = { ...data, ...partial };
    // Recompute departure window whenever arrival or type changes
    next.departure_from        = computeDeparture(next.arrival_from, durationMinutes);
    next.departure_to          = computeDeparture(next.arrival_to, durationMinutes);
    next.return_departure_from = computeDeparture(next.return_arrival_from, durationMinutes);
    next.return_departure_to   = computeDeparture(next.return_arrival_to, durationMinutes);
    onChange(next);
  }

  function handleArrivalWindowChange(from: string, to: string) {
    update({ arrival_from: from, arrival_to: to });
  }

  function handleReturnWindowChange(from: string, to: string) {
    update({ return_arrival_from: from, return_arrival_to: to });
  }

  const seatCostEGP =
    data.seat_preference === 'any' ? 0 : data.seat_preference.extra_cost_egp;

  const priceRange = useMemo(
    () =>
      calculatePriceRange({
        distanceKm,
        ride_type:   data.ride_type,
        seatCostEGP,
        walkMinutes,
        tripType:   data.trip_type,
        days:       Math.max(data.days.length, 1),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [distanceKm, data.ride_type, seatCostEGP, walkMinutes, data.trip_type, data.days]
  );

  function handleReview() {
    const hasErrors =
      !data.start_date ||
      data.days.length === 0 ||
      !data.arrival_from ||
      !data.arrival_to ||
      (data.trip_type === 'round_trip' && (!data.return_arrival_from || !data.return_arrival_to));

    if (hasErrors) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      onReview();
      return;
    }
    onReview();
  }

  const dateError        = showErrors && !data.start_date;
  const daysError        = showErrors && data.days.length === 0;
  const arrivalError     = showErrors && (!data.arrival_from || !data.arrival_to);
  const returnArrivalError =
    showErrors && data.trip_type === 'round_trip' && (!data.return_arrival_from || !data.return_arrival_to);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-6px); }
          40%, 80% { transform: translateX(6px); }
        }
        .shake { animation: shake 0.4s ease; }
        @keyframes pricePop {
          0%   { transform: scale(1); }
          50%  { transform: scale(1.08); }
          100% { transform: scale(1); }
        }
        .price-pop { animation: pricePop 0.25s ease; display: inline-block; }
        @media (max-width: 480px) {
          .trip-mode-cards { flex-direction: column !important; }
        }
      `}</style>

      {/* 1. Ride type */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#5A6A7A', marginBottom: 8 }}>
          Trip type
        </div>
        <RideTypeCards value={data.ride_type} onChange={(v) => update({ ride_type: v })} lockedToPrivate={lockedToPrivate} />
        {lockedToPrivate && (
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'flex-start', gap: 8, background: '#FAEEDA', border: '1px solid #F6D580', borderRadius: 8, padding: '10px 12px' }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>🔒</span>
            <span style={{ fontSize: 12, color: '#BA7517', lineHeight: 1.4 }}>Shared ride unavailable — stop points require a private car.</span>
          </div>
        )}
      </div>

      {/* 2. Seat preference — only for shared rides */}
      {data.ride_type === 'shared' && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#5A6A7A', marginBottom: 12 }}>
            Seat preference
          </div>
          <SeatSelector
            selectedSeat={data.seat_preference}
            onSeatSelect={(s) => update({ seat_preference: s })}
            takenSeats={[]}
          />
        </div>
      )}

      {/* 3. Trip type */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#5A6A7A', marginBottom: 8 }}>
          Trip type
        </div>
        <PillRadio<'one_way' | 'round_trip'>
          options={[
            { key: 'one_way', label: 'One way' },
            { key: 'round_trip', label: 'Round trip' },
          ]}
          value={data.trip_type}
          onChange={(v) => update({ trip_type: v })}
        />
      </div>

      {/* 4. Start date */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#5A6A7A', marginBottom: 8 }}>
          Start date
        </div>
        <input
          type="date"
          value={data.start_date}
          min={new Date().toISOString().split('T')[0]}
          onChange={(e) => update({ start_date: e.target.value })}
          style={{
            width: '100%',
            height: 44,
            boxSizing: 'border-box',
            border: `1.5px solid ${dateError ? '#EF4444' : '#E2E8F0'}`,
            borderRadius: 10,
            padding: '0 12px',
            fontSize: 14,
            color: data.start_date ? '#0B1E3D' : '#A0AEC0',
            background: '#fff',
            outline: 'none',
            fontFamily: 'inherit',
            cursor: 'pointer',
          }}
        />
        {dateError && (
          <div style={{ fontSize: 12, color: '#EF4444', marginTop: 4 }}>
            Please pick a start date
          </div>
        )}
      </div>

      {/* 5. Days of the week + departure time */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#5A6A7A' }}>Days of the week</div>
          {/* Mode toggle */}
          <div style={{ display: 'flex', border: '1.5px solid #E2E8F0', borderRadius: 8, overflow: 'hidden' }}>
            {(['same', 'per_day'] as const).map((mode) => (
              <button key={mode} type="button"
                onClick={() => {
                  if (mode === data.timeMode) return;
                  if (mode === 'per_day') {
                    const filled: Partial<Record<WeekDay, { from: string; to: string }>> = {};
                    data.days.forEach((d) => {
                      filled[d] = data.perDayTimes[d] || { from: data.unifiedTimeFrom || '07:30', to: data.unifiedTimeTo || '09:00' };
                    });
                    update({ timeMode: 'per_day', perDayTimes: filled });
                  } else {
                    const first = data.days[0];
                    const firstVal = first && data.perDayTimes[first];
                    update({
                      timeMode: 'same',
                      unifiedTimeFrom: firstVal?.from || data.unifiedTimeFrom || '07:30',
                      unifiedTimeTo:   firstVal?.to   || data.unifiedTimeTo   || '09:00',
                    });
                  }
                }}
                style={{ padding: '5px 12px', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: 'inherit', background: data.timeMode === mode ? '#0B1E3D' : '#fff', color: data.timeMode === mode ? '#fff' : '#5A6A7A', transition: 'all 0.15s' }}
              >
                {mode === 'same' ? 'Same time' : 'Per day'}
              </button>
            ))}
          </div>
        </div>
        <DaysPicker
          selected={data.days}
          onChange={(days) => {
            const filled: Partial<Record<WeekDay, { from: string; to: string }>> = {};
            days.forEach((d) => {
              filled[d] = data.perDayTimes[d] || { from: data.unifiedTimeFrom || '07:30', to: data.unifiedTimeTo || '09:00' };
            });
            update({ days, perDayTimes: filled });
          }}
          error={daysError}
          startDate={data.start_date}
        />
        {/* Time input(s) */}
        <div style={{ marginTop: 12 }}>
          {data.timeMode === 'same' ? (
            <div>
              <div style={{ fontSize: 12, color: '#5A6A7A', marginBottom: 6 }}>Departure window for all selected days</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: '#A0AEC0', marginBottom: 4 }}>From</div>
                  <input type="time" value={data.unifiedTimeFrom || '07:30'}
                    onChange={(e) => {
                      const from = e.target.value;
                      const filled: Partial<Record<WeekDay, { from: string; to: string }>> = {};
                      data.days.forEach((d) => { filled[d] = { from, to: data.perDayTimes[d]?.to || data.unifiedTimeTo || '09:00' }; });
                      update({ unifiedTimeFrom: from, perDayTimes: filled });
                    }}
                    style={{ width: '100%', height: 44, border: `1.5px solid ${daysError ? '#EF4444' : '#E2E8F0'}`, borderRadius: 10, padding: '0 12px', fontSize: 14, color: '#0B1E3D', background: '#fff', outline: 'none', fontFamily: 'inherit', cursor: 'pointer', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ color: '#CBD5E0', paddingBottom: 12, flexShrink: 0, fontSize: 16 }}>—</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: '#A0AEC0', marginBottom: 4 }}>To</div>
                  <input type="time" value={data.unifiedTimeTo || '09:00'}
                    onChange={(e) => {
                      const to = e.target.value;
                      const filled: Partial<Record<WeekDay, { from: string; to: string }>> = {};
                      data.days.forEach((d) => { filled[d] = { from: data.perDayTimes[d]?.from || data.unifiedTimeFrom || '07:30', to }; });
                      update({ unifiedTimeTo: to, perDayTimes: filled });
                    }}
                    style={{ width: '100%', height: 44, border: `1.5px solid ${daysError ? '#EF4444' : '#E2E8F0'}`, borderRadius: 10, padding: '0 12px', fontSize: 14, color: '#0B1E3D', background: '#fff', outline: 'none', fontFamily: 'inherit', cursor: 'pointer', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {data.days.map((day) => {
                const val = data.perDayTimes[day] || { from: '', to: '' };
                const hasErr = showErrors && (!val.from || !val.to);
                return (
                  <div key={day} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 32, fontSize: 12, fontWeight: 600, color: '#5A6A7A', flexShrink: 0 }}>{day}</div>
                    <input type="time" value={val.from}
                      onChange={(e) => {
                        const next = { ...data.perDayTimes, [day]: { from: e.target.value, to: val.to } };
                        update({ perDayTimes: next });
                      }}
                      style={{ flex: 1, height: 40, border: `1.5px solid ${hasErr && !val.from ? '#EF4444' : '#E2E8F0'}`, borderRadius: 8, padding: '0 8px', fontSize: 12, color: '#0B1E3D', background: '#fff', outline: 'none', fontFamily: 'inherit', cursor: 'pointer', boxSizing: 'border-box' }}
                    />
                    <div style={{ color: '#CBD5E0', fontSize: 13, flexShrink: 0 }}>—</div>
                    <input type="time" value={val.to}
                      onChange={(e) => {
                        const next = { ...data.perDayTimes, [day]: { from: val.from, to: e.target.value } };
                        update({ perDayTimes: next });
                      }}
                      style={{ flex: 1, height: 40, border: `1.5px solid ${hasErr && !val.to ? '#EF4444' : '#E2E8F0'}`, borderRadius: 8, padding: '0 8px', fontSize: 12, color: '#0B1E3D', background: '#fff', outline: 'none', fontFamily: 'inherit', cursor: 'pointer', boxSizing: 'border-box' }}
                    />
                    <button type="button"
                      onClick={() => {
                        const next: Partial<Record<WeekDay, { from: string; to: string }>> = {};
                        data.days.forEach((d) => { next[d] = { from: val.from, to: val.to }; });
                        update({ perDayTimes: next });
                      }}
                      style={{ fontSize: 10, color: '#00C2A8', background: 'none', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', padding: '0 2px', fontFamily: 'inherit', fontWeight: 600, flexShrink: 0 }}
                    >Copy all</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 7. Return arrival window — round trip only */}
      <div
        style={{
          overflow: 'hidden',
          maxHeight: data.trip_type === 'round_trip' ? 180 : 0,
          opacity: data.trip_type === 'round_trip' ? 1 : 0,
          transition: 'max-height 0.3s ease, opacity 0.25s ease',
        }}
      >
        <ArrivalWindowPicker
          label="When do you want to arrive back?"
          arrival_from={data.return_arrival_from}
          arrival_to={data.return_arrival_to}
          departure_from={data.return_departure_from}
          departure_to={data.return_departure_to}
          onChange={handleReturnWindowChange}
          error={returnArrivalError}
        />
      </div>

      {/* Live price estimate */}
      <PriceStrip
        min={priceRange.min}
        max={priceRange.max}
        breakdown={priceRange.breakdown}
        distanceKm={distanceKm}
        rideType={data.ride_type}
        selectedSeatLabel={
          data.seat_preference === 'any'
            ? 'Any'
            : data.seat_preference.label
        }
        walkMinutes={walkMinutes}
        tripType={data.trip_type}
        daysCount={Math.max(data.days.length, 1)}
      />

      {/* Submit */}
      <button
        type="button"
        onClick={handleReview}
        className={shake ? 'shake' : ''}
        style={{
          width: '100%',
          padding: '14px',
          borderRadius: 10,
          background: '#00C2A8',
          color: '#0B1E3D',
          fontWeight: 700,
          fontSize: 15,
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'inherit',
          minHeight: 48,
          transition: 'background 0.15s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = '#00A896')}
        onMouseLeave={(e) => (e.currentTarget.style.background = '#00C2A8')}
      >
        Review &amp; submit request
      </button>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────

function RideTypeCards({
  value,
  onChange,
  lockedToPrivate = false,
}: {
  value: RideType;
  onChange: (v: RideType) => void;
  lockedToPrivate?: boolean;
}) {
  const options: Array<{
    key: RideType;
    icon: string;
    label: string;
    sub: string;
    priceHint: string;
  }> = [
    { key: 'shared',  icon: '🧑‍🤝‍🧑', label: 'Shared ride', sub: 'Share with others',      priceHint: 'Lower price' },
    { key: 'private', icon: '🚗',       label: 'Private',     sub: 'You alone in the car', priceHint: 'Higher price' },
  ];

  return (
    <div className="trip-mode-cards" style={{ display: 'flex', gap: 10 }}>
      {options.map((opt) => {
        const active = value === opt.key;
        const locked = lockedToPrivate && opt.key === 'shared';
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => !locked && onChange(opt.key)}
            style={{
              flex: 1,
              minHeight: 100,
              border: active ? '2px solid #00C2A8' : '1.5px solid #E2E8F0',
              borderRadius: 10,
              background: active ? '#EFF7F6' : '#fff',
              cursor: locked ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              padding: '12px 10px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 4,
              transition: 'all 0.15s',
              opacity: locked ? 0.38 : 1,
              pointerEvents: locked ? 'none' : undefined,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: active ? '#00C2A8' : '#F1F5F9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                marginBottom: 4,
                transition: 'background 0.15s',
              }}
            >
              {opt.icon}
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: active ? '#0B1E3D' : '#374151' }}>
              {opt.label}
            </div>
            <div style={{ fontSize: 12, color: '#5A6A7A' }}>{opt.sub}</div>
            <div style={{ fontSize: 11, color: '#94A3B8', fontStyle: 'italic', marginTop: 2 }}>
              {opt.priceHint}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function PillRadio<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Array<{ key: T; label: string }>;
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {options.map((opt) => {
        const active = value === opt.key;
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => onChange(opt.key)}
            style={{
              flex: 1,
              padding: '10px 16px',
              border: `1.5px solid ${active ? '#00C2A8' : '#E2E8F0'}`,
              borderRadius: 8,
              background: active ? '#00C2A8' : '#fff',
              color: active ? '#0B1E3D' : '#5A6A7A',
              fontWeight: active ? 700 : 500,
              fontSize: 14,
              cursor: 'pointer',
              fontFamily: 'inherit',
              minHeight: 44,
              transition: 'all 0.15s',
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function ArrivalWindowPicker({
  label,
  arrival_from,
  arrival_to,
  departure_from,
  departure_to,
  onChange,
  error,
}: {
  label: string;
  arrival_from: string;
  arrival_to: string;
  departure_from: string;
  departure_to: string;
  onChange: (from: string, to: string) => void;
  error?: boolean;
}) {
  function handleFromChange(newFrom: string) {
    const minTo = addHours(newFrom, 1);
    const gap   = timeDiffMinutes(newFrom, arrival_to);
    onChange(newFrom, gap >= 60 ? arrival_to : minTo);
  }

  function handleToChange(newTo: string) {
    const minTo = addHours(arrival_from, 1);
    const gap   = timeDiffMinutes(arrival_from, newTo);
    onChange(arrival_from, gap < 60 ? minTo : newTo);
  }

  const inputStyle = (hasError?: boolean): React.CSSProperties => ({
    width: '100%',
    padding: '10px 12px',
    borderRadius: 8,
    border: `1.5px solid ${hasError ? '#E74C3C' : '#E2E8F0'}`,
    fontSize: 16,
    fontFamily: 'inherit',
    color: '#0B1E3D',
    background: hasError ? '#FFF5F5' : '#fff',
    outline: 'none',
    minHeight: 44,
    boxSizing: 'border-box' as const,
  });

  const windowMinutes = arrival_from && arrival_to ? timeDiffMinutes(arrival_from, arrival_to) : 0;

  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#5A6A7A', marginBottom: 8 }}>
        {label}
      </label>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, color: '#5A6A7A', marginBottom: 4 }}>Earliest</div>
          <input
            type="time"
            value={arrival_from}
            onChange={(e) => handleFromChange(e.target.value)}
            style={inputStyle(error)}
          />
        </div>
        <div>
          <div style={{ fontSize: 11, color: '#5A6A7A', marginBottom: 4 }}>Latest</div>
          <input
            type="time"
            value={arrival_to}
            onChange={(e) => handleToChange(e.target.value)}
            style={inputStyle(error)}
          />
        </div>
      </div>
      {arrival_from && arrival_to && (
        <div style={{ fontSize: 12, color: '#9AA0A6', marginTop: 6 }}>
          Window: {formatTimeWindow(arrival_from, arrival_to)}
          {' '}({(windowMinutes / 60).toFixed(1)}h) · Minimum 1 hour
        </div>
      )}
      {departure_from && departure_to && (
        <div style={{ fontSize: 12, color: '#5A6A7A', fontStyle: 'italic', marginTop: 4 }}>
          Estimated departure: {formatTimeWindow(departure_from, departure_to)}
        </div>
      )}
      {error && (
        <div style={{ fontSize: 12, color: '#EF4444', marginTop: 4 }}>
          Please set an arrival window
        </div>
      )}
    </div>
  );
}


function PriceStrip({
  min,
  max,
  breakdown,
  distanceKm,
  rideType,
  selectedSeatLabel,
  walkMinutes,
  tripType,
  daysCount,
}: {
  min: number;
  max: number;
  breakdown: ReturnType<typeof calculatePriceRange>['breakdown'];
  distanceKm: number;
  rideType: RideType;
  selectedSeatLabel: string;
  walkMinutes: 0 | 5 | 10;
  tripType: 'one_way' | 'round_trip';
  daysCount: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <div
        style={{
          background: '#0B1E3D',
          borderRadius: 10,
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
          💰 Estimated weekly cost
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span
            key={min}
            className="price-pop"
            style={{ color: '#fff', fontSize: 28, fontWeight: 700, lineHeight: 1 }}
          >
            EGP {min} – {max}
          </span>
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>/ week</span>
        </div>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          style={{
            background: 'none',
            border: 'none',
            color: '#00C2A8',
            fontSize: 13,
            cursor: 'pointer',
            fontFamily: 'inherit',
            padding: 0,
            textAlign: 'left',
            marginTop: 2,
          }}
        >
          {open ? 'Hide breakdown ▴' : 'See breakdown ▾'}
        </button>
      </div>

      {open && (
        <div
          style={{
            marginTop: 8,
            background: '#fff',
            border: '1px solid #E2E8F0',
            borderRadius: 10,
            padding: '16px',
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0B1E3D', marginBottom: 10 }}>
            Price breakdown
          </div>
          {[
            [
              `Base distance (${distanceKm.toFixed(1)} km)`,
              `EGP ${Math.round(breakdown.base)}`,
            ],
            [
              `Trip type (${rideType === 'shared' ? 'Shared ride' : 'Private'})`,
              `× ${breakdown.rideTypeMultiplier.toFixed(1)}`,
            ],
            [
              `Seat preference (${selectedSeatLabel})`,
              breakdown.seatFee > 0 ? `+ EGP ${breakdown.seatFee}` : 'No extra cost',
            ],
            ...(walkMinutes > 0
              ? [
                  [
                    `Walk discount (${walkMinutes} min)`,
                    `- ${Math.abs(breakdown.walkDiscount * 100)}%`,
                  ],
                ]
              : []),
            ...(tripType === 'round_trip'
              ? [[`Round trip`, `× ${breakdown.roundTripMultiplier}`]]
              : []),
            [`× ${daysCount} day${daysCount !== 1 ? 's' : ''}/week`, ''],
          ].map(([label, val], i, arr) => (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '7px 0',
                borderBottom: i < arr.length - 1 ? '1px solid #F1F5F9' : 'none',
              }}
            >
              <span style={{ fontSize: 13, color: '#5A6A7A' }}>{label}</span>
              <span style={{ fontSize: 13, color: '#0B1E3D', fontWeight: 600 }}>{val}</span>
            </div>
          ))}

          <div style={{ width: '100%', height: 1, background: '#E2E8F0', margin: '8px 0' }} />

          {[
            ['Per trip', `EGP ${breakdown.perTrip}`],
            ['Per week', `EGP ${breakdown.perWeek}`],
            ['Range (driver may adjust)', '± 15%'],
          ].map(([label, val]) => (
            <div
              key={label}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '4px 0',
              }}
            >
              <span style={{ fontSize: 13, color: '#5A6A7A' }}>{label}</span>
              <span style={{ fontSize: 13, color: '#0B1E3D', fontWeight: 600 }}>{val}</span>
            </div>
          ))}

          <div style={{ width: '100%', height: 1, background: '#E2E8F0', margin: '8px 0' }} />

          <div style={{ fontSize: 15, fontWeight: 700, color: '#0B1E3D', textAlign: 'right' }}>
            EGP {min} – {max} / week
          </div>
        </div>
      )}
    </div>
  );
}
