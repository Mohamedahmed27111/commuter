'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Circle, OverlayView } from '@react-google-maps/api';
import { MAP_STYLE } from '@/lib/googleMapsStyle';
import { useMap } from '@/lib/MapContext';

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

const CAIRO = { lat: 30.0444, lng: 31.2357 };

// ── SVG marker icons ──────────────────────────────────────────────────────────

// Origin: navy circle, teal ring, teal centre dot + drop shadow
const originIconUrl = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48">` +
  `<circle cx="24" cy="24" r="21" fill="#0B1E3D" stroke="#00C2A8" stroke-width="3.5"/>` +
  `<circle cx="24" cy="24" r="6" fill="#00C2A8"/>` +
  `</svg>`
)}`;

// Destination: teal teardrop, white inner ring, navy dot + drop shadow
const destinationIconUrl = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="52">` +
  `<path d="M20 0C8.95 0 0 8.95 0 20c0 14.5 20 36 20 36S40 34.5 40 20C40 8.95 31.05 0 20 0z" fill="#00C2A8"/>` +
  `<circle cx="20" cy="20" r="9" fill="white"/>` +
  `<circle cx="20" cy="20" r="5" fill="#0B1E3D"/>` +
  `</svg>`
)}`;

interface UserMapProps {
  userLoc: { lat: number; lng: number } | null;
  userHeading?: number | null;
  userAccuracy?: number | null;
  liveTracking?: boolean;
  onLocateMe?: () => void;
  pickingField?: 'from' | 'to' | 'stop' | null;
  onMapPick?: (lat: number, lng: number) => void;
  walk_minutes?: 0 | 5 | 10;
}

export default function UserMap({
  userLoc,
  userHeading = null,
  userAccuracy = null,
  liveTracking = false,
  pickingField = null,
  onMapPick,
  walk_minutes = 0,
}: UserMapProps) {
  const { origin: from, destination: to, routes, stops } = useMap();
  const viaStops = stops.filter((s): s is NonNullable<typeof s> => s !== null);
  const { isLoaded } = useJsApiLoader({ id: 'google-map-script', googleMapsApiKey: API_KEY });
  const mapRef      = useRef<google.maps.Map | null>(null);
  const prevFrom    = useRef<typeof from>(null);
  const prevTo      = useRef<typeof to>(null);
  // Tracks all live Polyline instances so we can call .setMap(null) imperatively
  const polyRefs    = useRef<google.maps.Polyline[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [zoom, setZoom] = useState(13);

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    map.addListener('zoom_changed', () => setZoom(map.getZoom() ?? 13));
    setMapReady(true);
  }, []);

  // Smooth pan when origin changes
  useEffect(() => {
    if (from && from !== prevFrom.current && mapRef.current) {
      mapRef.current.panTo({ lat: from.lat, lng: from.lng });
      if ((mapRef.current.getZoom() ?? 0) < 14) mapRef.current.setZoom(14);
    }
    prevFrom.current = from;
  }, [from]);

  // Smooth pan when destination changes
  useEffect(() => {
    if (to && to !== prevTo.current && mapRef.current) {
      mapRef.current.panTo({ lat: to.lat, lng: to.lng });
      if ((mapRef.current.getZoom() ?? 0) < 14) mapRef.current.setZoom(14);
    }
    prevTo.current = to;
  }, [to]);

  // ── Imperative Polyline management ─────────────────────────────────────────
  // We intentionally avoid <Polyline> JSX because @react-google-maps/api does
  // NOT reliably call setMap(null) on unmount, leaving stale overlays on canvas.
  // Instead we create/destroy google.maps.Polyline instances directly so that
  // the overlay is ALWAYS removed when routes becomes empty.
  useEffect(() => {
    // Destroy every existing overlay unconditionally
    polyRefs.current.forEach(p => p.setMap(null));
    polyRefs.current = [];

    if (!mapReady || !mapRef.current || routes.length === 0) return;

    const map = mapRef.current;
    const newLines: google.maps.Polyline[] = [];
    const route = routes[0];

    if (route && route.coordinates.length > 1) {
      const path = route.coordinates.map(([lat, lng]) => ({ lat, lng }));

      // Outer glow halo
      newLines.push(new google.maps.Polyline({
        map, path, zIndex: 1,
        strokeColor: '#4361EE', strokeWeight: 16, strokeOpacity: 0.12,
      }));
      // Inner glow
      newLines.push(new google.maps.Polyline({
        map, path, zIndex: 2,
        strokeColor: '#4361EE', strokeWeight: 9, strokeOpacity: 0.2,
      }));
      // Solid line
      newLines.push(new google.maps.Polyline({
        map, path, zIndex: 3,
        strokeColor: '#4361EE', strokeWeight: 5, strokeOpacity: 1,
      }));
    }

    polyRefs.current = newLines;

    return () => {
      newLines.forEach(p => p.setMap(null));
      polyRefs.current = [];
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routes, mapReady]);

  // ── Fit viewport to primary route ──────────────────────────────────────────
  const primaryRoute = routes[0] ?? null;
  const primaryLen   = primaryRoute?.coordinates.length ?? 0;
  useEffect(() => {
    if (!mapRef.current || primaryLen === 0) return;
    const bounds = new google.maps.LatLngBounds();
    primaryRoute.coordinates.forEach(([lat, lng]) => bounds.extend({ lat, lng }));
    mapRef.current.fitBounds(bounds, 80);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [primaryLen]);

  const handleClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (pickingField && onMapPick && e.latLng) {
      onMapPick(e.latLng.lat(), e.latLng.lng());
    }
  }, [pickingField, onMapPick]);

  // Midpoint of primary route for the distance/time badge
  const midCoord = primaryRoute && primaryRoute.coordinates.length > 0
    ? primaryRoute.coordinates[Math.floor(primaryRoute.coordinates.length / 2)]
    : null;

  if (!isLoaded) {
    return (
      <div className="map-container" style={{ background: '#EFF7F6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5A6A7A', fontSize: 14 }}>
        Loading map…
      </div>
    );
  }

  // Scale markers with zoom level (doubles every 3 zoom steps, clamped)
  const zf = Math.max(0.5, Math.min(2.4, Math.pow(2, (zoom - 13) / 3)));
  const origS  = Math.round(48 * zf);
  const stopS  = Math.round(36 * zf);
  const destW  = Math.round(40 * zf);
  const destH  = Math.round(52 * zf);

  return (
    <div className="map-container" style={{ cursor: pickingField ? 'crosshair' : undefined }}>
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={CAIRO}
        zoom={13}
        onLoad={onLoad}
        onClick={handleClick}
        options={{
          styles: MAP_STYLE,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          scrollwheel: true,
          zoomControl: false,       // use our custom controls
          gestureHandling: 'greedy',
        }}
      >
        {/* ── Alternative routes & primary route are rendered imperatively ── */}
        {/* (via useEffect + google.maps.Polyline above; no JSX Polylines here) */}

        {/* ── Walk-radius circle around origin ────────────────── */}
        {from && walk_minutes > 0 && (
          <Circle
            center={{ lat: from.lat, lng: from.lng }}
            radius={walk_minutes === 10 ? 800 : 400}
            options={{
              strokeColor: '#4361EE', strokeOpacity: 0.55, strokeWeight: 1.5,
              fillColor: '#4361EE', fillOpacity: 0.07,
            }}
          />
        )}

        {/* ── Origin marker ────────────────────────────────────── */}
        {from && (
          <Marker
            position={{ lat: from.lat, lng: from.lng }}
            icon={{ url: originIconUrl, scaledSize: new google.maps.Size(origS, origS), anchor: new google.maps.Point(origS / 2, origS / 2) }}
            zIndex={20}
          />
        )}

        {/* ── Via stop markers (amber numbered) ─────────────── */}
        {viaStops.map((s, i) => (
          <Marker
            key={`stop-${i}`}
            position={{ lat: s.lat, lng: s.lng }}
            icon={{
              url: `data:image/svg+xml;utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36"><circle cx="18" cy="18" r="16" fill="%23F59E0B" stroke="%23fff" stroke-width="2.5"/><text x="18" y="23" text-anchor="middle" font-family="Arial,sans-serif" font-size="14" font-weight="700" fill="%23fff">${i + 1}</text></svg>`)}`,
              scaledSize: new google.maps.Size(stopS, stopS),
              anchor: new google.maps.Point(stopS / 2, stopS / 2),
            }}
            zIndex={15}
          />
        ))}

        {/* ── Destination marker ───────────────────────────────── */}
        {to && (
          <Marker
            position={{ lat: to.lat, lng: to.lng }}
            icon={{ url: destinationIconUrl, scaledSize: new google.maps.Size(destW, destH), anchor: new google.maps.Point(destW / 2, destH) }}
            zIndex={20}
          />
        )}

        {/* ── Accuracy circle ──────────────────────────────────── */}
        {userLoc && userAccuracy != null && userAccuracy < 500 && (
          <Circle
            center={{ lat: userLoc.lat, lng: userLoc.lng }}
            radius={userAccuracy}
            options={{
              strokeColor: '#4361EE', strokeOpacity: 0.35, strokeWeight: 1,
              fillColor: '#4361EE', fillOpacity: 0.06,
            }}
          />
        )}

        {/* ── Live GPS dot with optional heading cone ───────────── */}
        {userLoc && (
          <OverlayView
            position={{ lat: userLoc.lat, lng: userLoc.lng }}
            mapPaneName="floatPane"
            getPixelPositionOffset={() => ({ x: -20, y: -20 })}
          >
            <div className="gps-overlay">
              {/* Heading cone — only show when heading is available */}
              {userHeading != null && (
                <div
                  className="gps-heading-cone"
                  style={{ transform: `rotate(${userHeading}deg)` }}
                />
              )}
              {liveTracking && <div className="gps-ring" />}
              {liveTracking && <div className="gps-ring gps-ring-delay" />}
              <div className="gps-core" />
            </div>
          </OverlayView>
        )}

        {/* ── Route distance/time badge at midpoint ────────────── */}
        {midCoord && primaryRoute && (
          <OverlayView
            position={{ lat: midCoord[0], lng: midCoord[1] }}
            mapPaneName="overlayMouseTarget"
            getPixelPositionOffset={(w, h) => ({ x: -(w / 2), y: -(h + 10) })}
          >
            <div className="route-badge">
              <span className="route-badge-km">{primaryRoute.distance_km} km</span>
              <span className="route-badge-sep">·</span>
              <span>{primaryRoute.duration_minutes} min</span>
            </div>
          </OverlayView>
        )}
      </GoogleMap>

      {/* ── Custom brand-styled zoom controls ───────────────────── */}
      <div className="map-zoom-controls">
        <button
          className="map-zoom-btn"
          onClick={() => mapRef.current?.setZoom((mapRef.current.getZoom() ?? 13) + 1)}
          aria-label="Zoom in"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </button>
        <div className="map-zoom-divider" />
        <button
          className="map-zoom-btn"
          onClick={() => mapRef.current?.setZoom((mapRef.current.getZoom() ?? 13) - 1)}
          aria-label="Zoom out"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 8h10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}

