'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Polyline, Circle, InfoWindow } from '@react-google-maps/api';
import { MAP_STYLE } from '@/lib/googleMapsStyle';
import type { PickupPoint } from '@/types/driver';
import type { GeoLocation, WalkMinutes } from '@/types/shared';

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

const OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving';

async function fetchRoute(waypoints: { lat: number; lng: number }[]): Promise<[number, number][]> {
  const coords = waypoints.map((p) => `${p.lng},${p.lat}`).join(';');
  const res = await fetch(`${OSRM_BASE}/${coords}?overview=full&geometries=geojson`);
  const data = await res.json();
  if (data.code !== 'Ok') throw new Error('Routing failed');
  return (data.routes[0].geometry.coordinates as [number, number][]).map(
    ([lng, lat]) => [lat, lng] as [number, number]
  );
}

function pickupMarkerUrl(index: number) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">` +
    `<defs><filter id="s" x="-30%" y="-30%" width="160%" height="160%">` +
    `<feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#0B1E3D" flood-opacity="0.4"/></filter></defs>` +
    `<circle cx="16" cy="16" r="15" fill="#0B1E3D" stroke="#00C2A8" stroke-width="2.5" filter="url(#s)"/>` +
    `<text x="16" y="21" text-anchor="middle" fill="white" font-size="12" font-weight="700" font-family="Inter,sans-serif">${index + 1}</text>` +
    `</svg>`
  )}`;
}

const DEST_URL = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="38" height="50">` +
  `<defs><filter id="s" x="-30%" y="-20%" width="160%" height="160%">` +
  `<feDropShadow dx="0" dy="3" stdDeviation="3.5" flood-color="#0B1E3D" flood-opacity="0.35"/></filter></defs>` +
  `<path d="M19 0C8.5 0 0 8.5 0 19c0 13.7 19 34 19 34S38 32.7 38 19C38 8.5 29.5 0 19 0z" fill="#F5A623" filter="url(#s)"/>` +
  `<circle cx="19" cy="19" r="8" fill="white"/>` +
  `<circle cx="19" cy="19" r="4.5" fill="#0B1E3D"/>` +
  `</svg>`
)}`;

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
  const { isLoaded } = useJsApiLoader({ id: 'google-map-script', googleMapsApiKey: API_KEY });
  const mapRef = useRef<google.maps.Map | null>(null);
  const [routeCoords, setRouteCoords]   = useState<[number, number][] | null>(null);
  const [routeError,  setRouteError]    = useState(false);
  const [loadingRoute, setLoadingRoute] = useState(true);
  const [openInfoId, setOpenInfoId]     = useState<string | null>(null);

  const destPos = { lat: destination.lat, lng: destination.lng };

  useEffect(() => {
    const waypoints = [
      ...pickupPoints.map((p) => ({ lat: p.lat, lng: p.lng })),
      destPos,
    ];
    setLoadingRoute(true);
    setRouteError(false);
    fetchRoute(waypoints)
      .then(setRouteCoords)
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

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  useEffect(() => {
    if (!mapRef.current || !routeCoords) return;
    const bounds = new google.maps.LatLngBounds();
    routeCoords.forEach(([lat, lng]) => bounds.extend({ lat, lng }));
    mapRef.current.fitBounds(bounds, 40);
  }, [routeCoords]);

  const walkRadius = walkMinutes === 10 ? 800 : walkMinutes === 5 ? 400 : 0;
  const defaultCenter = pickupPoints[0]
    ? { lat: pickupPoints[0].lat, lng: pickupPoints[0].lng }
    : { lat: 30.06, lng: 31.23 };

  if (!isLoaded) {
    return (
      <div style={{ height, background: '#EFF7F6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5A6A7A', fontSize: 14 }}>
        Loading map…
      </div>
    );
  }

  const routePath = routeCoords?.map(([lat, lng]) => ({ lat, lng }));

  return (
    <div style={{ height, position: 'relative' }}>
      {loadingRoute && (
        <div
          className="absolute inset-0 z-10 bg-gray-100 animate-pulse rounded-md flex items-center justify-center"
          aria-label="Loading map route…"
        >
          <span className="text-xs text-text-muted">Loading route…</span>
        </div>
      )}

      {routeError && !loadingRoute && (
        <div className="absolute top-2 left-2 right-2 z-10 bg-warning/10 border border-warning/30 rounded text-xs text-warning px-2 py-1 flex items-center gap-1">
          <span aria-hidden="true">⚠️</span> Could not load road route — showing straight-line path
        </div>
      )}

      <GoogleMap
        mapContainerStyle={{ height: '100%', width: '100%' }}
        center={defaultCenter}
        zoom={13}
        onLoad={onLoad}
        options={{
          styles: MAP_STYLE,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControlOptions: { position: google.maps.ControlPosition.RIGHT_CENTER },
        }}
      >
        {/* Walk-radius circles around each pickup point */}
        {walkRadius > 0 && pickupPoints.map((pt) => (
          <Circle
            key={`circle-${pt.passenger_id}`}
            center={{ lat: pt.lat, lng: pt.lng }}
            radius={walkRadius}
            options={{
              strokeColor: '#4361EE',
              strokeOpacity: 1,
              strokeWeight: 1.5,
              fillColor: '#4361EE',
              fillOpacity: 0.07,
            }}
          />
        ))}

        {/* Route polyline — glow halo + solid line */}
        {routePath && !routeError && (
          <>
            <Polyline path={routePath} options={{ strokeColor: '#4361EE', strokeWeight: 14, strokeOpacity: 0.12 }} />
            <Polyline path={routePath} options={{ strokeColor: '#4361EE', strokeWeight: 8, strokeOpacity: 0.2 }} />
          </>
        )}
        {routePath && (
          <Polyline
            path={routePath}
            options={routeError ? {
              strokeColor: '#4361EE',
              strokeWeight: 3,
              strokeOpacity: 0,
              icons: [{
                icon: { path: 'M 0,-1 0,1', strokeOpacity: 0.6, scale: 3, strokeColor: '#4361EE' },
                offset: '0',
                repeat: '16px',
              }],
            } : {
              strokeColor: '#4361EE',
              strokeWeight: 4,
              strokeOpacity: 0.85,
            }}
          />
        )}

        {/* Pickup markers */}
        {pickupPoints.map((pt, i) => (
          <Marker
            key={pt.passenger_id}
            position={{ lat: pt.lat, lng: pt.lng }}
            icon={{
              url: pickupMarkerUrl(i),
              scaledSize: new google.maps.Size(28, 28),
              anchor: new google.maps.Point(14, 14),
            }}
            onClick={() => setOpenInfoId(pt.passenger_id)}
          >
            {openInfoId === pt.passenger_id && (
              <InfoWindow onCloseClick={() => setOpenInfoId(null)}>
                <div style={{ fontSize: 13, fontFamily: 'Inter, sans-serif' }}>
                  <strong style={{ color: '#0B1E3D' }}>{i + 1}. {pt.passenger_name}</strong><br />
                  <span style={{ color: '#5A6A7A' }}>{pt.address}</span><br />
                  <span style={{ color: '#00C2A8', fontSize: 12, fontWeight: 700 }}>+{pt.pickup_time_offset} min from start</span>
                </div>
              </InfoWindow>
            )}
          </Marker>
        ))}

        {/* Destination marker */}
        <Marker
          position={destPos}
          icon={{
            url: DEST_URL,
            scaledSize: new google.maps.Size(38, 50),
            anchor: new google.maps.Point(19, 50),
          }}
          onClick={() => setOpenInfoId('dest')}
        >
          {openInfoId === 'dest' && (
            <InfoWindow onCloseClick={() => setOpenInfoId(null)}>
              <div style={{ fontSize: 13 }}>
                <strong>Destination</strong><br />
                {destination.address}
              </div>
            </InfoWindow>
          )}
        </Marker>
      </GoogleMap>
    </div>
  );
}

