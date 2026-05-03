'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import FloatingSearchBar, { type LocationValue, saveRecentRoute } from '@/components/user/map/FloatingSearchBar';
import MapBottomSheet from '@/components/user/map/MapBottomSheet';
import { type RequestFormData } from '@/components/user/request/RequestForm';
import { fetchRoadRoutes, type OSRMRoute } from '@/lib/osrm';
import { useUserLocation } from '@/lib/useUserLocation';
import { reverseGeocode } from '@/lib/nominatim';
import { mockUser } from '@/lib/mockUser';
import type { WeekDay } from '@/types/user';

const UserMap = dynamic(() => import('@/components/user/map/UserMap'), {
  ssr: false,
  loading: () => (
    <div style={{ width: '100%', height: '100%', background: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5A6A7A', fontSize: 14 }}>
      Loading map…
    </div>
  ),
});

const defaultForm: RequestFormData = {
  trip_type:            'one_way',
  ride_type:            'shared',
  seat_preference:      'any',
  start_date:           '',
  days:                 ['Sun', 'Mon', 'Tue', 'Wed', 'Thu'] as WeekDay[],
  arrival_from:         '08:30',
  arrival_to:           '09:30',
  departure_from:       '',
  departure_to:         '',
  return_arrival_from:  '17:30',
  return_arrival_to:    '18:30',
  return_departure_from: '',
  return_departure_to:  '',
};

// ── Draggable, closeable nearby-commuters chip ─────────────────────────────
function NearbyCommutersChip() {
  const [count, setCount] = useState<number | null>(null);
  const [visible, setVisible] = useState(false);
  const [closed, setClosed] = useState(false);
  const [showTip, setShowTip] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragStart = useRef<{ mx: number; my: number; ox: number; oy: number } | null>(null);
  const isDragging = useRef(false);

  useEffect(() => {
    setCount(Math.floor(Math.random() * 10) + 3);
    const t = setTimeout(() => setVisible(true), 600);
    return () => clearTimeout(t);
  }, []);

  if (closed) return null;

  function onPointerDown(e: React.PointerEvent) {
    isDragging.current = false;
    dragStart.current = { mx: e.clientX, my: e.clientY, ox: offset.x, oy: offset.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!dragStart.current) return;
    const dx = e.clientX - dragStart.current.mx;
    const dy = e.clientY - dragStart.current.my;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) isDragging.current = true;
    if (isDragging.current) setOffset({ x: dragStart.current.ox + dx, y: dragStart.current.oy + dy });
  }
  function onPointerUp() { dragStart.current = null; }

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{
        position: 'absolute', bottom: 280, left: 16, zIndex: 1000,
        opacity: visible && count !== null ? 1 : 0,
        transform: `translate(${offset.x}px, ${offset.y}px)`,
        transition: dragStart.current ? 'none' : 'opacity 400ms',
        touchAction: 'none', cursor: 'grab', userSelect: 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', background: 'white', border: '1px solid #E2E8F0', borderRadius: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.12)', overflow: 'hidden' }}>
        <button
          onClick={() => { if (!isDragging.current) setShowTip((s) => !s); }}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'none', border: 'none', cursor: 'grab', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, color: '#0B1E3D', minHeight: 40 }}
        >
          <span style={{ color: '#00C2A8' }}>{count}</span> commuters nearby
        </button>
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); setClosed(true); }}
          style={{ padding: '4px 10px', background: 'none', border: 'none', borderLeft: '1px solid #F0F0F0', cursor: 'pointer', color: '#A0AEC0', fontSize: 14, lineHeight: 1, minHeight: 40, fontFamily: 'inherit' }}
          title="Dismiss"
        >✕</button>
      </div>
      {showTip && count !== null && (
        <div style={{ position: 'absolute', bottom: '110%', left: 0, background: '#0B1E3D', color: '#fff', borderRadius: 10, padding: '8px 12px', fontSize: 12, whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
          {count} people commuting in your area this week
        </div>
      )}
    </div>
  );
}

export default function MapPage() {
  const router = useRouter();
  const [from, setFrom] = useState<LocationValue | null>(null);
  const [to, setTo] = useState<LocationValue | null>(null);
  const [routes, setRoutes] = useState<OSRMRoute[]>([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [routeLoading, setRouteLoading] = useState(false);
  const [formData, setFormData] = useState<RequestFormData>(defaultForm);
  const [step, setStep] = useState<'map' | 'form' | 'review'>('map');
  const [pickingField, setPickingField] = useState<'from' | 'to' | null>(null);
  const [pendingLocField, setPendingLocField] = useState<'from' | 'to' | null>(null);
  const { lat: userLat, lng: userLng, loading: locating, locate } = useUserLocation();

  const userLocPoint = userLat && userLng ? { lat: userLat, lng: userLng } : null;

  // When GPS resolves and a pending field is waiting, fill it in
  useEffect(() => {
    if (pendingLocField && userLat && userLng) {
      const loc: LocationValue = { address: 'Current location', lat: userLat, lng: userLng };
      if (pendingLocField === 'from') setFrom(loc);
      else setTo(loc);
      setPendingLocField(null);
    }
  }, [userLat, userLng, pendingLocField]);

  const loadRoutes = useCallback(async () => {
    if (!from || !to) return;
    setRouteLoading(true);
    try {
      const results = await fetchRoadRoutes([from, to]);
      setRoutes(results);
      setSelectedRouteIndex(0);
    } catch {
      toast.error('Could not calculate route. Try again.');
    } finally {
      setRouteLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    if (from && to) {
      loadRoutes();
    } else {
      setRoutes([]);
      setStep('map');
    }
  }, [from, to, loadRoutes]);

  // Handle "Pick on map" — reverse geocode then set field
  async function handleMapPick(lat: number, lng: number) {
    setPickingField(null);
    const address = await reverseGeocode(lat, lng);
    const loc: LocationValue = { address, lat, lng };
    if (pickingField === 'from') setFrom(loc);
    else if (pickingField === 'to') setTo(loc);
  }

  // Handle "Current location" from search bar
  function handleCurrentLocation(field: 'from' | 'to') {
    if (userLat && userLng) {
      const loc: LocationValue = { address: 'Current location', lat: userLat, lng: userLng };
      if (field === 'from') setFrom(loc);
      else setTo(loc);
    } else {
      setPendingLocField(field);
      locate();
      toast('Getting your location…', { icon: '📡' });
    }
  }

  function handleSubmit() {
    if (from && to) saveRecentRoute(from, to);
    toast.success('Request submitted! Finding you a driver…');
    router.push('/user/my-requests');
  }

  return (
    <div
      className="relative"
      style={{ width: '100vw', height: 'calc(100dvh - 64px)', overflow: 'hidden', marginLeft: 'calc(-50vw + 50%)', position: 'relative' }}
    >
      {/* Full-screen map */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <UserMap
          from={from}
          to={to}
          routes={routes}
          selectedRouteIndex={selectedRouteIndex}
          onRouteClick={setSelectedRouteIndex}
          userLoc={userLocPoint}
          pickingField={pickingField}
          onMapPick={handleMapPick}
          walk_minutes={mockUser.walk_minutes}
        />
      </div>

      {/* Floating search bar */}
      <FloatingSearchBar
        from={from}
        to={to}
        onFromChange={setFrom}
        onToChange={setTo}
        savedLocations={mockUser.saved_locations}
        onPickOnMap={(field) => { setPickingField(field); }}
        onCurrentLocation={handleCurrentLocation}
      />

      {/* Locate-me button */}
      <button
        onClick={locate}
        title="Use my location"
        style={{ position: 'absolute', top: 16, right: 16, zIndex: 1000, background: '#fff', border: 'none', borderRadius: 12, width: 44, height: 44, boxShadow: '0 2px 12px rgba(0,0,0,0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        {locating ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00C2A8" strokeWidth="2.5" style={{ animation: 'spin 1s linear infinite' }}>
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0B1E3D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
          </svg>
        )}
      </button>

      {/* Pick-on-map instruction banner */}
      {pickingField && (
        <div style={{ position: 'absolute', top: 80, left: '50%', transform: 'translateX(-50%)', zIndex: 1001, background: '#0B1E3D', color: '#fff', borderRadius: 20, padding: '10px 20px', fontSize: 13, fontWeight: 600, boxShadow: '0 2px 12px rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', gap: 10, whiteSpace: 'nowrap' }}>
          <span>🗺</span>
          Tap the map to pick your {pickingField === 'from' ? 'starting point' : 'destination'}
          <button onClick={() => setPickingField(null)} style={{ background: 'none', border: 'none', color: '#A0AEC0', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: 0 }}>✕</button>
        </div>
      )}

      {/* Route loading indicator */}
      {routeLoading && !pickingField && (
        <div style={{ position: 'absolute', top: 80, left: '50%', transform: 'translateX(-50%)', zIndex: 1000, background: 'white', borderRadius: 20, padding: '8px 16px', fontSize: 13, color: '#5A6A7A', boxShadow: '0 2px 12px rgba(0,0,0,0.12)' }}>
          Calculating route…
        </div>
      )}

      {/* Nearby commuters chip */}
      <NearbyCommutersChip />

      {/* ── Bottom sheet (all screen sizes) ─────────────────────── */}
      <MapBottomSheet
          routes={routes}
          selectedRouteIndex={selectedRouteIndex}
          onSelectRoute={setSelectedRouteIndex}
          from={from}
          to={to}
          onSetTo={setTo}
          formData={formData}
          onFormChange={setFormData}
          onSubmit={handleSubmit}
          step={step}
          onStepChange={setStep}
        />

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
