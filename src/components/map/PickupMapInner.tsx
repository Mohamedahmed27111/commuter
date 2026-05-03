'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { pickupIcon, destinationIcon } from './mapIcons';
import { useRouteOSRM } from './useRouteOSRM';
import type { PickupPoint } from '@/types/driver';

// Fix default icon paths broken by webpack
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function MapBoundsFitter({ coords }: { coords: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (coords.length > 0) {
      map.fitBounds(L.latLngBounds(coords), { padding: [40, 40] });
    }
  }, [coords, map]);
  return null;
}

interface PickupMapInnerProps {
  pickupPoints: PickupPoint[];
  destination: { lat: number; lng: number; label: string };
  height?: number;
}

export default function PickupMapInner({
  pickupPoints,
  destination,
  height = 320,
}: PickupMapInnerProps) {
  const waypoints = [
    ...pickupPoints.map((p) => ({ lat: p.lat, lng: p.lng })),
    { lat: destination.lat, lng: destination.lng },
  ];

  const { route, loading, error } = useRouteOSRM(waypoints);

  const centerLat = waypoints.reduce((s, w) => s + w.lat, 0) / waypoints.length;
  const centerLng = waypoints.reduce((s, w) => s + w.lng, 0) / waypoints.length;

  return (
    <div style={{ height, position: 'relative' }}>
      {loading && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1000,
          background: 'linear-gradient(90deg, #EFF7F6 25%, #d8f0ed 50%, #EFF7F6 75%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ color: '#5A6A7A', fontSize: 14 }}>Loading route…</span>
        </div>
      )}

      {error && !loading && (
        <div style={{
          position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)',
          zIndex: 1000, background: '#FFF3E0', border: '1px solid #F39C12',
          borderRadius: 6, padding: '4px 12px', fontSize: 12, color: '#7a4d00',
          whiteSpace: 'nowrap',
        }}>
          ⚠️ Road route unavailable — showing straight-line path
        </div>
      )}

      <MapContainer
        center={[centerLat, centerLng]}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        zoomControl
        scrollWheelZoom={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        {/* Real road route from OSRM */}
        {route && !error && (
          <>
            <Polyline
              positions={route.coordinates}
              pathOptions={{ color: '#00C2A8', weight: 5, opacity: 0.9 }}
            />
            <MapBoundsFitter coords={route.coordinates} />
          </>
        )}

        {/* Straight-line fallback if OSRM fails */}
        {error && (
          <Polyline
            positions={waypoints.map((w) => [w.lat, w.lng] as [number, number])}
            pathOptions={{ color: '#00C2A8', weight: 3, opacity: 0.6, dashArray: '8 6' }}
          />
        )}

        {/* Pickup markers */}
        {pickupPoints.map((point, i) => (
          <Marker key={point.passenger_id} position={[point.lat, point.lng]} icon={pickupIcon(i)}>
            <Popup>
              <strong>{point.passenger_name}</strong><br />
              {point.address}<br />
              <span style={{ color: '#5A6A7A', fontSize: 12 }}>
                Pickup: +{point.pickup_time_offset} min from start
              </span>
            </Popup>
          </Marker>
        ))}

        {/* Destination marker */}
        <Marker position={[destination.lat, destination.lng]} icon={destinationIcon}>
          <Popup>
            <strong>Destination</strong><br />
            {destination.label}
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
