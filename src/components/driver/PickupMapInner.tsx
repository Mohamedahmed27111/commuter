'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { PickupPoint } from '@/types/driver';
import type { GeoLocation, WalkMinutes } from '@/types/shared';

// Fix default icon paths broken by webpack
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ── Icons ─────────────────────────────────────────────────────────────────────
function pickupIcon(index: number) {
  return L.divIcon({
    className: '',
    html: `<div style="background:#0B1E3D;color:#fff;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;border:2px solid #00C2A8;box-shadow:0 1px 4px rgba(0,0,0,0.35);">${index + 1}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

const destinationIcon = L.divIcon({
  className: '',
  html: `<div style="background:#F5A623;border-radius:50% 50% 50% 0;width:32px;height:32px;transform:rotate(-45deg);border:2px solid #0B1E3D;box-shadow:0 1px 4px rgba(0,0,0,0.35);"></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

// ── OSRM routing ──────────────────────────────────────────────────────────────
const OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving';

async function fetchRoute(waypoints: { lat: number; lng: number }[]): Promise<[number, number][]> {
  const coords = waypoints.map((p) => `${p.lng},${p.lat}`).join(';');
  const res  = await fetch(`${OSRM_BASE}/${coords}?overview=full&geometries=geojson`);
  const data = await res.json();
  if (data.code !== 'Ok') throw new Error('Routing failed');
  return (data.routes[0].geometry.coordinates as [number, number][]).map(
    ([lng, lat]) => [lat, lng]
  );
}

// ── Fit bounds after route loads ──────────────────────────────────────────────
function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length > 1) {
      map.fitBounds(positions, { padding: [40, 40] });
    }
  }, [map, positions]);
  return null;
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface PickupMapInnerProps {
  pickupPoints: PickupPoint[];
  destination:  GeoLocation;
  walkMinutes?: WalkMinutes;
  height?:      number;
}

export default function PickupMapInner({
  pickupPoints,
  destination,
  walkMinutes = 0,
  height = 320,
}: PickupMapInnerProps) {
  const [routeCoords, setRouteCoords]   = useState<[number, number][] | null>(null);
  const [routeError,  setRouteError]    = useState(false);
  const [loadingRoute, setLoadingRoute] = useState(true);

  const destPos = { lat: destination.lat, lng: destination.lng };

  useEffect(() => {
    const waypoints = [
      ...pickupPoints.map((p) => ({ lat: p.lat, lng: p.lng })),
      destPos,
    ];

    setLoadingRoute(true);
    setRouteError(false);

    fetchRoute(waypoints)
      .then((coords) => {
        setRouteCoords(coords);
      })
      .catch(() => {
        setRouteError(true);
        setRouteCoords([
          ...pickupPoints.map((p): [number, number] => [p.lat, p.lng]),
          [destPos.lat, destPos.lng],
        ]);
      })
      .finally(() => setLoadingRoute(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const allMarkerPositions: [number, number][] = [
    ...pickupPoints.map((p): [number, number] => [p.lat, p.lng]),
    [destPos.lat, destPos.lng],
  ];

  const walkRadius = walkMinutes === 10 ? 800 : walkMinutes === 5 ? 400 : 0;

  return (
    <div style={{ height, position: 'relative' }}>
      {/* Loading skeleton */}
      {loadingRoute && (
        <div
          className="absolute inset-0 z-10 bg-gray-100 animate-pulse rounded-md flex items-center justify-center"
          aria-label="Loading map route…"
        >
          <span className="text-xs text-text-muted">Loading route…</span>
        </div>
      )}

      {/* OSRM error banner */}
      {routeError && !loadingRoute && (
        <div className="absolute top-2 left-2 right-2 z-10 bg-warning/10 border border-warning/30 rounded text-xs text-warning px-2 py-1 flex items-center gap-1">
          <span aria-hidden="true">⚠️</span> Could not load road route — showing straight-line path
        </div>
      )}

      <MapContainer
        center={pickupPoints[0] ? [pickupPoints[0].lat, pickupPoints[0].lng] : [30.06, 31.23]}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        aria-hidden="true"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Auto-fit to route or markers */}
        {routeCoords && <FitBounds positions={routeCoords} />}
        {!routeCoords && <FitBounds positions={allMarkerPositions} />}

        {/* Walk-radius circles around each pickup point */}
        {walkRadius > 0 && pickupPoints.map((pt) => (
          <Circle
            key={`circle-${pt.passenger_id}`}
            center={[pt.lat, pt.lng]}
            radius={walkRadius}
            pathOptions={{
              color: '#00C2A8',
              fillColor: '#00C2A8',
              fillOpacity: 0.07,
              dashArray: '6 4',
              weight: 1.5,
            }}
          />
        ))}

        {/* Pickup markers */}
        {pickupPoints.map((pt, i) => (
          <Marker key={pt.passenger_id} position={[pt.lat, pt.lng]} icon={pickupIcon(i)}>
            <Popup>
              <strong>{i + 1}. {pt.passenger_name}</strong>
              <br />{pt.address}
              <br /><span style={{ color: '#5A6A7A', fontSize: 12 }}>+{pt.pickup_time_offset} min</span>
            </Popup>
          </Marker>
        ))}

        {/* Destination marker */}
        <Marker position={[destPos.lat, destPos.lng]} icon={destinationIcon}>
          <Popup><strong>Destination</strong><br />{destination.address}</Popup>
        </Marker>

        {/* Route polyline */}
        {routeCoords && (
          <Polyline
            positions={routeCoords}
            pathOptions={{
              color: '#00C2A8',
              weight: 4,
              opacity: 0.85,
              ...(routeError ? { dashArray: '6,4' } : {}),
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}
