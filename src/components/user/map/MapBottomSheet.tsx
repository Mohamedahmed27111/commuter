'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { differenceInDays, addDays } from 'date-fns';
import type { OSRMRoute } from '@/lib/osrm';
import type { LocationValue } from './FloatingSearchBar';
import RequestForm, { type RequestFormData } from '@/components/user/request/RequestForm';
import RequestSummaryCard from '@/components/user/request/RequestSummaryCard';
import { mockUser } from '@/lib/mockUser';

// ── Next cycle preview ────────────────────────────────────────────────────
function getNextCycleDate(): Date {
  const today = new Date();
  // Cycles start on Saturdays
  const day = today.getDay(); // 0=Sun
  const daysUntilSat = day === 6 ? 7 : (6 - day);
  return addDays(today, daysUntilSat);
}

function NextCycleCard() {
  const next = getNextCycleDate();
  const daysAway = differenceInDays(next, new Date());
  const [seats, setSeats] = useState<number | null>(null);

  useEffect(() => {
    setSeats(Math.floor(Math.random() * 5) + 2);
  }, []);

  return (
    <div style={{ background: '#EFF7F6', borderLeft: '3px solid #00C2A8', borderRadius: 8, padding: '12px 16px', flexShrink: 0 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#00C2A8', marginBottom: 2 }}>Next cycle available</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#0B1E3D' }}>
        {next.toLocaleDateString('en-EG', { weekday: 'short', month: 'short', day: 'numeric' })}
        <span style={{ color: '#5A6A7A', fontWeight: 400 }}> · in {daysAway} day{daysAway !== 1 ? 's' : ''}</span>
      </div>
      <div style={{ fontSize: 12, color: '#5A6A7A', marginTop: 2 }}>{seats !== null ? `${seats} seats remaining in this zone` : 'Checking availability…'}</div>
    </div>
  );
}

// ── Route selector ─────────────────────────────────────────────────────────
function RouteSelector({ routes, selected, onSelect }: {
  routes: OSRMRoute[];
  selected: number;
  onSelect: (i: number) => void;
}) {
  if (routes.length < 2) return null;
  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#5A6A7A', marginBottom: 8 }}>Choose route</div>
      <div style={{ display: 'flex', gap: 8 }}>
        {routes.map((r, i) => (
          <button key={i} onClick={() => onSelect(i)} style={{
            flex: 1, padding: '10px 12px', border: `1.5px solid ${selected === i ? '#00C2A8' : '#E2E8F0'}`,
            borderRadius: 10, background: selected === i ? '#EFF7F6' : '#fff',
            cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: selected === i ? '#00C2A8' : '#5A6A7A' }}>Route {String.fromCharCode(65 + i)}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#0B1E3D', marginTop: 2 }}>{r.distance_km} km · ~{r.duration_minutes} min</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Quick destination chips ────────────────────────────────────────────────
function QuickChips({ onSelect }: { onSelect: (loc: LocationValue) => void }) {
  const saved = mockUser.saved_locations;
  if (saved.length === 0) return null;
  return (
    <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }} className="no-scrollbar">
      {saved.map((s) => {
        const icon = s.label === 'home' ? '🏠' : s.label === 'work' ? '🏢' : '📍';
        return (
          <button key={s.id} onClick={() => onSelect({ address: s.address, lat: s.lat, lng: s.lng })}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#EFF7F6', border: '1px solid #C8E8E4', borderRadius: 20, padding: '8px 14px', fontSize: 13, fontWeight: 500, color: '#0B1E3D', whiteSpace: 'nowrap', flexShrink: 0, cursor: 'pointer', fontFamily: 'inherit', minHeight: 44 }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#00C2A8'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = '#00C2A8'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#EFF7F6'; e.currentTarget.style.color = '#0B1E3D'; e.currentTarget.style.borderColor = '#C8E8E4'; }}>
            <span>{icon}</span> {s.name}
          </button>
        );
      })}
    </div>
  );
}

// ── Main sheet ─────────────────────────────────────────────────────────────
interface MapBottomSheetProps {
  routes: OSRMRoute[];
  selectedRouteIndex: number;
  onSelectRoute: (i: number) => void;
  from: LocationValue | null;
  to: LocationValue | null;
  onSetTo: (loc: LocationValue) => void;
  formData: RequestFormData;
  onFormChange: (d: RequestFormData) => void;
  onSubmit: () => void;
  step: 'map' | 'form' | 'review';
  onStepChange: (s: 'map' | 'form' | 'review') => void;
}


export default function MapBottomSheet({
  routes,
  selectedRouteIndex,
  onSelectRoute,
  from,
  to,
  onSetTo,
  formData,
  onFormChange,
  onSubmit,
  step,
  onStepChange,
}: MapBottomSheetProps) {
  // hidden | half | full
  const [sheetState, setSheetState] = useState<'hidden' | 'half' | 'full'>('hidden');
  const [showErrors, setShowErrors] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef(0);
  const dragStartTranslate = useRef(0);
  const isDragging = useRef(false);

  const route = routes[selectedRouteIndex] ?? null;

  // Open/close based on route availability
  useEffect(() => {
    if (route) {
      setSheetState('half');
    } else {
      setSheetState('hidden');
    }
  }, [route]);

  // Drag handle logic
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    isDragging.current = true;
    dragStartY.current = e.clientY;
    dragStartTranslate.current = sheetState === 'full' ? 0 : 1;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, [sheetState]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const delta = e.clientY - dragStartY.current;
    if (sheetRef.current) {
      sheetRef.current.style.transition = 'none';
      sheetRef.current.style.transform = `translateY(${Math.max(0, delta)}px)`;
    }
  }, []);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const delta = e.clientY - dragStartY.current;
    const vh = window.innerHeight;
    if (sheetRef.current) {
      sheetRef.current.style.transition = '';
      sheetRef.current.style.transform = '';
    }
    if (delta > vh * 0.1) {
      // Drag down — close if half, go half if full
      if (sheetState === 'full') setSheetState('half');
      else setSheetState('hidden');
    } else if (delta < -(vh * 0.1)) {
      setSheetState('full');
    }
  }, [sheetState]);

  function handleReview() {
    const hasErrors = !formData.start_date || formData.days.length === 0 || !formData.arrival_from || !formData.arrival_to ||
      (formData.trip_type === 'round_trip' && (!formData.return_arrival_from || !formData.return_arrival_to));
    if (hasErrors) { setShowErrors(true); return; }
    setShowErrors(false);
    onStepChange('review');
    setSheetState('full');
  }

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const bottomOffset = isMobile ? 64 : 0;

  const translateMap: Record<typeof sheetState, string> = {
    hidden: 'translateY(100%)',
    half: 'translateY(0)',
    full: 'translateY(0)',
  };
  const maxHeightMap: Record<typeof sheetState, string> = {
    hidden: '0',
    half: '45vh',
    full: '85vh',
  };

  return (
    <>
      {/* Reopen tab — shown when sheet is dismissed but a route exists */}
      {sheetState === 'hidden' && route && (
        <button
          onClick={() => setSheetState('half')}
          style={{
            position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
            zIndex: 499, border: 'none', borderRadius: '12px 12px 0 0',
            background: '#00C2A8', padding: '10px 28px',
            display: 'flex', alignItems: 'center', gap: 8,
            cursor: 'pointer', fontFamily: 'inherit', fontSize: 13,
            fontWeight: 700, color: '#0B1E3D',
            boxShadow: '0 -2px 16px rgba(0,194,168,0.35)',
            whiteSpace: 'nowrap',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 15l-6-6-6 6" />
          </svg>
          {route.distance_km} km · ~{route.duration_minutes} min · Plan commute
        </button>
      )}

      <div
        ref={sheetRef}
        style={{
        position: 'fixed',
        bottom: bottomOffset,
        left: 0,
        right: 0,
        zIndex: 500,
        borderRadius: '20px 20px 0 0',
        background: 'white',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.12)',
        transform: translateMap[sheetState],
        maxHeight: maxHeightMap[sheetState],
        transition: 'transform 300ms ease-out, max-height 300ms ease-out',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Drag handle */}
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{ padding: '12px 0 8px', display: 'flex', justifyContent: 'center', cursor: 'grab', flexShrink: 0, touchAction: 'none' }}
      >
        <div style={{ width: 32, height: 4, background: '#D1D5DB', borderRadius: 2 }} />
      </div>

      {/* Scrollable content */}
      <div style={{ overflowY: 'auto', flex: 1, padding: '0 16px 20px' }} className="no-scrollbar">
        {route && (
          <>
            {/* Route summary row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ fontSize: 20 }}>🗺</div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#0B1E3D' }}>
                  {route.distance_km} km · ~{route.duration_minutes} min
                </div>
                {from && to && (
                  <div style={{ fontSize: 12, color: '#5A6A7A', marginTop: 1 }}>
                    {from.address.split(',')[0]} → {to.address.split(',')[0]}
                  </div>
                )}
              </div>
            </div>

            {step !== 'review' && (
              <>
                {/* Quick chips */}
                {!to && <div style={{ marginBottom: 12 }}><QuickChips onSelect={onSetTo} /></div>}

                {/* Next cycle */}
                <div style={{ marginBottom: 12 }}><NextCycleCard /></div>

                {/* CTA or form */}
                {step === 'map' && (
                  <button
                    onClick={() => { onStepChange('form'); setSheetState('full'); }}
                    style={{ width: '100%', padding: 14, border: 'none', borderRadius: 12, background: '#00C2A8', color: '#0B1E3D', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit', minHeight: 48 }}
                  >
                    Plan this commute →
                  </button>
                )}

                {step === 'form' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <RouteSelector routes={routes} selected={selectedRouteIndex} onSelect={onSelectRoute} />
                    <RequestForm
                      data={formData}
                      onChange={onFormChange}
                      onReview={handleReview}
                      showErrors={showErrors}
                      distanceKm={route.distance_km}
                      durationMinutes={route.duration_minutes}
                    />
                  </div>
                )}
              </>
            )}

            {step === 'review' && from && to && (
              <RequestSummaryCard
                from={from}
                to={to}
                route={route}
                formData={formData}
                onEdit={() => { onStepChange('form'); }}
                onSubmit={onSubmit}
              />
            )}
          </>
        )}
      </div>
    </div>
    </>
  );
}
