'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
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
  timeMode:             'same',
  unifiedTimeFrom:      '07:30',
  unifiedTimeTo:        '09:00',
  perDayTimes:          {},
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
export default function MapPage() {
  const router = useRouter();
  const t = useTranslations('map');
  const [from, setFrom] = useState<LocationValue | null>(null);
  const [to, setTo] = useState<LocationValue | null>(null);
  const [viaStops, setViaStops] = useState<LocationValue[]>([]);
  const [pickingStopIdx, setPickingStopIdx] = useState(-1);
  const [routes, setRoutes] = useState<OSRMRoute[]>([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [routeLoading, setRouteLoading] = useState(false);
  const [formData, setFormData] = useState<RequestFormData>(defaultForm);
  const [step, setStep] = useState<'map' | 'form' | 'review'>('map');
  const [pickingField, setPickingField] = useState<'from' | 'to' | 'stop' | null>(null);
  const [pendingLocField, setPendingLocField] = useState<'from' | 'to' | null>(null);
  const routeRequestId = useRef(0);
  const { lat: userLat, lng: userLng, heading: userHeading, accuracy: userAccuracy, loading: locating, live: liveTracking, locate, startLive, stopLive } = useUserLocation();

  const userLocPoint = userLat && userLng ? { lat: userLat, lng: userLng } : null;

  // When GPS resolves and a pending field is waiting, fill it in
  useEffect(() => {
    if (pendingLocField && userLat && userLng) {
      reverseGeocode(userLat, userLng).then((address) => {
        const loc: LocationValue = { address, lat: userLat, lng: userLng };
        if (pendingLocField === 'from') setFrom(loc);
        else setTo(loc);
        setPendingLocField(null);
      });
    }
  }, [userLat, userLng, pendingLocField]);

  // ── Routing: single effect, all cases handled inline ────────────────────
  useEffect(() => {
    // No endpoints → clear immediately
    if (!from || !to) {
      routeRequestId.current++;
      setRoutes([]);
      setRouteLoading(false);
      setStep('map');
      return;
    }

    // Stops present but at least one not yet resolved → clear and wait
    const resolvedStops = viaStops.filter((s) => s.lat !== 0 || s.lng !== 0);
    if (viaStops.length > resolvedStops.length) {
      routeRequestId.current++;
      setRoutes([]);
      setRouteLoading(false);
      return;
    }

    // All waypoints valid — fire fetch
    const id = ++routeRequestId.current;
    setRoutes([]);
    setRouteLoading(true);

    fetchRoadRoutes([from, ...resolvedStops, to])
      .then((results) => {
        if (id !== routeRequestId.current) return;
        setRoutes(results.slice(0, 1));
        setSelectedRouteIndex(0);
      })
      .catch(() => {
        if (id !== routeRequestId.current) return;
        toast.error(t('route_error'));
      })
      .finally(() => {
        if (id === routeRequestId.current) setRouteLoading(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, viaStops]);

  // Auto-lock to private when stops are added
  useEffect(() => {
    if (viaStops.length > 0) {
      setFormData((prev) => prev.ride_type !== 'private' ? { ...prev, ride_type: 'private' } : prev);
    }
  }, [viaStops.length]);

  // Handle "Pick on map" — reverse geocode then set field
  async function handleMapPick(lat: number, lng: number) {
    const address = await reverseGeocode(lat, lng);
    const loc: LocationValue = { address, lat, lng };
    if (pickingStopIdx >= 0) {
      const next = [...viaStops];
      next[pickingStopIdx] = loc;
      setViaStops(next);
      setPickingStopIdx(-1);
    } else if (pickingField === 'from') {
      setFrom(loc);
    } else if (pickingField === 'to') {
      setTo(loc);
    }
    setPickingField(null);
  }

  // Handle "Current location" from search bar
  async function handleCurrentLocation(field: 'from' | 'to') {
    if (userLat && userLng) {
      const address = await reverseGeocode(userLat, userLng);
      const loc: LocationValue = { address, lat: userLat, lng: userLng };
      if (field === 'from') setFrom(loc);
      else setTo(loc);
    } else {
      setPendingLocField(field);
      locate();
      toast(t('getting_location'), { icon: '📡' });
    }
  }

  // Handle locate-me button: toggle live tracking + re-centre map
  const mapPanRef = useRef<((lat: number, lng: number) => void) | null>(null);

  function handleLocateMe() {
    if (liveTracking) {
      stopLive();
    } else {
      startLive();
    }
  }

  // Re-centre whenever live position updates
  useEffect(() => {
    if (liveTracking && userLat && userLng && mapPanRef.current) {
      mapPanRef.current(userLat, userLng);
    }
  }, [liveTracking, userLat, userLng]);

  function handleSubmit() {
    if (from && to) saveRecentRoute(from, to);
    toast.success(t('request_submitted'));
    router.push('/user/my-requests');
  }

  return (
    <div
      dir="ltr"
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
          userHeading={userHeading}
          userAccuracy={userAccuracy}
          liveTracking={liveTracking}
          onLocateMe={handleLocateMe}
          pickingField={pickingField}
          onMapPick={handleMapPick}
          walk_minutes={mockUser.walk_minutes}
          viaStops={viaStops}
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
        viaStops={viaStops}
        onViaStopsChange={(stops) => setViaStops(stops.slice(0, 2))}
        onPickStopOnMap={(idx) => { setPickingStopIdx(idx); setPickingField('stop'); }}
      />

      {/* Locate-me button */}
      <button
        onClick={handleLocateMe}
        title={t('locate_me')}
        style={{ position: 'absolute', top: 16, right: 16, zIndex: 1000, background: '#fff', border: 'none', borderRadius: 12, width: 44, height: 44, boxShadow: '0 2px 12px rgba(0,0,0,0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        {locating ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00C2A8" strokeWidth="2.5" style={{ animation: 'spin 1s linear infinite' }}>
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={liveTracking ? '#4361EE' : '#0B1E3D'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
            <circle cx="12" cy="12" r="7" strokeOpacity="0.3" />
          </svg>
        )}
      </button>

      {/* Pick-on-map instruction banner */}
      {(pickingField || pickingStopIdx >= 0) && (
        <div style={{ position: 'absolute', top: 80, left: '50%', transform: 'translateX(-50%)', zIndex: 1001, background: '#0B1E3D', color: '#fff', borderRadius: 20, padding: '10px 20px', fontSize: 13, fontWeight: 600, boxShadow: '0 2px 12px rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', gap: 10, whiteSpace: 'nowrap' }}>
          <span>🗺</span>
          {pickingStopIdx >= 0 ? t('pick_stop') : pickingField === 'from' ? t('pick_start') : t('pick_dest')}
          <button onClick={() => { setPickingField(null); setPickingStopIdx(-1); }} style={{ background: 'none', border: 'none', color: '#A0AEC0', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: 0 }}>{t('pick_banner_cancel')}</button>
        </div>
      )}

      {/* Route loading indicator */}
      {routeLoading && !pickingField && pickingStopIdx < 0 && (
        <div style={{ position: 'absolute', top: 80, left: '50%', transform: 'translateX(-50%)', zIndex: 1000, background: 'white', borderRadius: 20, padding: '8px 16px', fontSize: 13, color: '#5A6A7A', boxShadow: '0 2px 12px rgba(0,0,0,0.12)' }}>
          {t('calculating_route')}
        </div>
      )}

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
          hasStops={viaStops.length > 0}
        />

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
