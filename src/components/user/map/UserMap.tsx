'use client';

import { useEffect, useRef, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Circle,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import type { OSRMRoute } from '@/lib/osrm';
import 'leaflet/dist/leaflet.css';

const CAIRO: [number, number] = [30.0444, 31.2357];

// ── Icons ─────────────────────────────────────────────────────────────────
const originIcon = L.divIcon({
  html: `<div style="width:36px;height:36px;background:#0B1E3D;border:3px solid #00C2A8;border-radius:50%;display:flex;align-items:center;justify-content:center;">
    <div style="width:10px;height:10px;background:#00C2A8;border-radius:50%;"></div>
  </div>`,
  className: '',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

const destinationIcon = L.divIcon({
  html: `<div style="width:32px;height:40px;position:relative;">
    <div style="width:32px;height:32px;background:#00C2A8;border:3px solid #0B1E3D;border-radius:50% 50% 50% 0;transform:rotate(-45deg);"></div>
  </div>`,
  className: '',
  iconSize: [32, 40],
  iconAnchor: [16, 40],
});

const userLocationIcon = L.divIcon({
  html: `<div style="width:20px;height:20px;background:#2563EB;border:3px solid white;border-radius:50%;box-shadow:0 0 0 6px rgba(37,99,235,0.25);"></div>`,
  className: '',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

function makeDotIcon() {
  return L.divIcon({
    html: `<div style="width:10px;height:10px;background:#0B1E3D;border:2px solid white;border-radius:50%;opacity:0.6;"></div>`,
    className: '',
    iconSize: [10, 10],
    iconAnchor: [5, 5],
  });
}

function FlyOnChange({ from, to }: {
  from: { lat: number; lng: number } | null;
  to: { lat: number; lng: number } | null;
}) {
  const map = useMap();
  const prevFrom = useRef<typeof from>(null);
  const prevTo = useRef<typeof to>(null);

  useEffect(() => {
    if (from && from !== prevFrom.current) {
      map.flyTo([from.lat, from.lng], Math.max(map.getZoom(), 14), { duration: 1 });
    }
    prevFrom.current = from;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from]);

  useEffect(() => {
    if (to && to !== prevTo.current) {
      map.flyTo([to.lat, to.lng], Math.max(map.getZoom(), 14), { duration: 1 });
    }
    prevTo.current = to;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [to]);

  return null;
}

function FitBounds({ coordinates }: { coordinates: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (coordinates.length > 1) {
      map.fitBounds(L.latLngBounds(coordinates), { padding: [80, 80] });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coordinates.length]);
  return null;
}

function ZoomControl() {
  const map = useMap();
  useEffect(() => {
    const ctrl = L.control.zoom({ position: 'bottomright' });
    ctrl.addTo(map);
    return () => { ctrl.remove(); };
  }, [map]);
  return null;
}

function MapClickHandler({ pickingField, onMapPick }: {
  pickingField: 'from' | 'to' | null;
  onMapPick?: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      if (pickingField && onMapPick) {
        onMapPick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

function generateNearbyDots(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    lat: CAIRO[0] + (Math.random() - 0.5) * 0.08,
    lng: CAIRO[1] + (Math.random() - 0.5) * 0.08,
  }));
}

interface UserMapProps {
  from: { lat: number; lng: number } | null;
  to: { lat: number; lng: number } | null;
  routes: OSRMRoute[];
  selectedRouteIndex: number;
  onRouteClick: (i: number) => void;
  userLoc: { lat: number; lng: number } | null;
  pickingField?: 'from' | 'to' | null;
  onMapPick?: (lat: number, lng: number) => void;
  walk_minutes?: 0 | 5 | 10;
}

export default function UserMap({
  from,
  to,
  routes,
  selectedRouteIndex,
  onRouteClick,
  userLoc,
  pickingField = null,
  onMapPick,
  walk_minutes = 0,
}: UserMapProps) {
  const [dots, setDots] = useState<{ id: number; lat: number; lng: number }[]>([]);
  const dotIcon = useRef(makeDotIcon());

  useEffect(() => {
    setDots(generateNearbyDots(Math.floor(Math.random() * 8) + 8));
  }, []);

  const primaryRoute = routes[selectedRouteIndex];
  const altRoutes = routes.filter((_, i) => i !== selectedRouteIndex);

  return (
    <div className="map-container" style={{ cursor: pickingField ? 'crosshair' : undefined }}>
      <MapContainer
        center={CAIRO}
        zoom={13}
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
        scrollWheelZoom
        className="z-0"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          maxZoom={19}
        />

        <ZoomControl />
        <MapClickHandler pickingField={pickingField} onMapPick={onMapPick} />
        <FlyOnChange from={from} to={to} />

        {/* Anonymous commuter dots */}
        {dots.map((d) => (
          <Marker key={d.id} position={[d.lat, d.lng]} icon={dotIcon.current} interactive={false} />
        ))}

        {/* Alternative routes — dashed grey */}
        {altRoutes.map((r, i) => (
          <Polyline
            key={`alt-${i}`}
            positions={r.coordinates}
            pathOptions={{ color: '#5A6A7A', weight: 4, opacity: 0.4, dashArray: '8 6' }}
            eventHandlers={{ click: () => onRouteClick(routes.indexOf(r)) }}
          />
        ))}

        {/* Primary route — solid teal */}
        {primaryRoute && (
          <Polyline
            positions={primaryRoute.coordinates}
            pathOptions={{ color: '#00C2A8', weight: 5, opacity: 0.9, lineJoin: 'round', lineCap: 'round' }}
          />
        )}

        {from && <Marker position={[from.lat, from.lng]} icon={originIcon} />}
        {from && walk_minutes > 0 && (
          <Circle
            center={[from.lat, from.lng]}
            radius={walk_minutes === 10 ? 800 : 400}
            pathOptions={{
              color: '#00C2A8',
              fillColor: '#00C2A8',
              fillOpacity: 0.08,
              weight: 1.5,
              dashArray: '6 4',
            }}
          />
        )}
        {to && <Marker position={[to.lat, to.lng]} icon={destinationIcon} />}
        {userLoc && <Marker position={[userLoc.lat, userLoc.lng]} icon={userLocationIcon} />}

        {primaryRoute && primaryRoute.coordinates.length > 0 && (
          <FitBounds coordinates={primaryRoute.coordinates} />
        )}
      </MapContainer>
    </div>
  );
}
