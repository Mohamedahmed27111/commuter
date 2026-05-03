'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { searchAddress, formatDisplayName, type NominatimResult } from '@/lib/nominatim';
import type { SavedLocation } from '@/types/user';

export interface LocationValue {
  address: string;
  lat: number;
  lng: number;
}

interface RecentRoute {
  from: LocationValue;
  to: LocationValue;
}

function getRecentRoutes(): RecentRoute[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem('commuter:recent_routes') ?? '[]').slice(0, 3);
  } catch {
    return [];
  }
}

export function saveRecentRoute(from: LocationValue, to: LocationValue) {
  if (typeof localStorage === 'undefined') return;
  try {
    const routes: RecentRoute[] = getRecentRoutes();
    const updated = [{ from, to }, ...routes.filter(
      (r) => !(r.from.address === from.address && r.to.address === to.address)
    )].slice(0, 3);
    localStorage.setItem('commuter:recent_routes', JSON.stringify(updated));
  } catch { /* ignore */ }
}

const LABEL_ICONS: Record<string, string> = { home: '🏠', work: '🏢', custom: '📍' };

interface Props {
  from: LocationValue | null;
  to: LocationValue | null;
  onFromChange: (v: LocationValue | null) => void;
  onToChange: (v: LocationValue | null) => void;
  savedLocations?: SavedLocation[];
  onPickOnMap?: (field: 'from' | 'to') => void;
  onCurrentLocation?: (field: 'from' | 'to') => void;
}

export default function FloatingSearchBar({ from, to, onFromChange, onToChange, savedLocations = [], onPickOnMap, onCurrentLocation }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [fromText, setFromText] = useState(from?.address ?? '');
  const [toText, setToText] = useState(to?.address ?? '');
  const [fromResults, setFromResults] = useState<NominatimResult[]>([]);
  const [toResults, setToResults] = useState<NominatimResult[]>([]);
  const [fromLoading, setFromLoading] = useState(false);
  const [toLoading, setToLoading] = useState(false);
  const [activeField, setActiveField] = useState<'from' | 'to' | null>(null);
  const [recentRoutes, setRecentRoutes] = useState<RecentRoute[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const fromTimer = useRef<ReturnType<typeof setTimeout>>();
  const toTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    setRecentRoutes(getRecentRoutes());
  }, [expanded]);

  // Sync text when parent changes
  useEffect(() => { setFromText(from?.address ?? ''); }, [from]);
  useEffect(() => { setToText(to?.address ?? ''); }, [to]);

  // Click outside collapses if neither field is set
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        if (!from && !to) setExpanded(false);
        setActiveField(null);
        setFromResults([]);
        setToResults([]);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [from, to]);

  const debounce = useCallback((
    query: string,
    setResults: (r: NominatimResult[]) => void,
    setLoading: (b: boolean) => void,
    timer: React.MutableRefObject<ReturnType<typeof setTimeout> | undefined>
  ) => {
    clearTimeout(timer.current);
    if (query.length < 3) { setResults([]); return; }
    timer.current = setTimeout(async () => {
      setLoading(true);
      try { setResults(await searchAddress(query)); }
      catch { setResults([]); }
      finally { setLoading(false); }
    }, 500);
  }, []);

  function selectFrom(loc: LocationValue) {
    setFromText(loc.address);
    onFromChange(loc);
    setFromResults([]);
    setActiveField('to');
  }

  function selectTo(loc: LocationValue) {
    setToText(loc.address);
    onToChange(loc);
    setToResults([]);
    setActiveField(null);
  }

  function swap() {
    const newFrom = to;
    const newTo = from;
    setFromText(newFrom?.address ?? '');
    setToText(newTo?.address ?? '');
    onFromChange(newFrom);
    onToChange(newTo);
  }

  const showFromDropdown = activeField === 'from';
  const showToDropdown = activeField === 'to';

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: 44,
    border: '1.5px solid #E2E8F0',
    borderRadius: 10,
    padding: '0 40px 0 36px',
    fontSize: 14,
    color: '#0B1E3D',
    background: '#fff',
    outline: 'none',
    fontFamily: 'inherit',
  };

  function DropdownList({ field }: { field: 'from' | 'to' }) {
    const results = field === 'from' ? fromResults : toResults;
    const loading = field === 'from' ? fromLoading : toLoading;
    const text = field === 'from' ? fromText : toText;
    const select = field === 'from' ? selectFrom : selectTo;

    const showSaved = text.length < 3;

    const quickActionStyle: React.CSSProperties = {
      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
      width: '100%', background: 'none', border: 'none', cursor: 'pointer',
      textAlign: 'left', minHeight: 44, fontFamily: 'inherit',
    };

    if (!showSaved && results.length === 0 && !loading && text.length >= 3) {
      return (
        <div style={{ padding: '12px 16px', fontSize: 13, color: '#5A6A7A' }}>
          No places found for &ldquo;{text}&rdquo;
        </div>
      );
    }

    return (
      <>
        {/* Quick action buttons — always shown */}
        <button
          style={quickActionStyle}
          onClick={() => { onCurrentLocation?.(field); setActiveField(null); setFromResults([]); setToResults([]); }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#EFF7F6')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
        >
          <span style={{ fontSize: 16 }}>📡</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#0B1E3D' }}>Current location</div>
            <div style={{ fontSize: 11, color: '#5A6A7A' }}>Use your GPS position</div>
          </div>
        </button>
        <button
          style={quickActionStyle}
          onClick={() => { onPickOnMap?.(field); setActiveField(null); setFromResults([]); setToResults([]); }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#EFF7F6')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
        >
          <span style={{ fontSize: 16 }}>🗺</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#0B1E3D' }}>Pick on map</div>
            <div style={{ fontSize: 11, color: '#5A6A7A' }}>Tap a spot on the map</div>
          </div>
        </button>
        {text.length > 0 && <div style={{ height: 1, background: '#F0F0F0', margin: '0 14px' }} />}

        {loading && (
          <div style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#5A6A7A' }}>
            <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid #00C2A8', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            Searching…
          </div>
        )}

        {showSaved && (
          <>
            {recentRoutes.length > 0 && (
              <>
                <div style={{ padding: '6px 14px 2px', fontSize: 11, fontWeight: 700, color: '#A0AEC0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Recent</div>
                {recentRoutes.map((r, i) => {
                  const loc = field === 'from' ? r.from : r.to;
                  return (
                    <button key={i} onClick={() => select(loc)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', minHeight: 44, fontFamily: 'inherit' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#EFF7F6')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}>
                      <span style={{ fontSize: 16 }}>🕐</span>
                      <span style={{ fontSize: 13, color: '#0B1E3D' }}>{loc.address}</span>
                    </button>
                  );
                })}
              </>
            )}
            {savedLocations.length > 0 && (
              <>
                <div style={{ padding: '6px 14px 2px', fontSize: 11, fontWeight: 700, color: '#A0AEC0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Saved</div>
                {savedLocations.map((s) => (
                  <button key={s.id} onClick={() => select({ address: s.address, lat: s.lat, lng: s.lng })} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', minHeight: 44, fontFamily: 'inherit' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#EFF7F6')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}>
                    <span style={{ fontSize: 16 }}>{LABEL_ICONS[s.label] ?? '📍'}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#0B1E3D' }}>{s.name}</div>
                      <div style={{ fontSize: 11, color: '#5A6A7A' }}>{s.address}</div>
                    </div>
                  </button>
                ))}
              </>
            )}
          </>
        )}

        {!showSaved && results.map((r) => (
          <button key={r.place_id} onClick={() => select({ address: formatDisplayName(r.display_name), lat: parseFloat(r.lat), lng: parseFloat(r.lon) })} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', minHeight: 44, fontFamily: 'inherit' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#EFF7F6')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>📍</span>
            <span style={{ fontSize: 13, color: '#0B1E3D', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{formatDisplayName(r.display_name)}</span>
          </button>
        ))}
      </>
    );
  }

  const hasDropdown = (showFromDropdown && (fromText.length >= 3 || fromResults.length > 0 || savedLocations.length > 0 || recentRoutes.length > 0)) ||
    (showToDropdown && (toText.length >= 3 || toResults.length > 0 || savedLocations.length > 0 || recentRoutes.length > 0));

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        top: 16,
        left: 16,
        zIndex: 1000,
        width: 'min(380px, calc(100vw - 32px))',
        filter: 'drop-shadow(0 4px 20px rgba(0,0,0,0.18))',
      }}
    >
      {/* Main card */}
      <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden' }}>
        {!expanded ? (
          /* Collapsed — single row */
          <button
            onClick={() => { setExpanded(true); setActiveField('from'); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              width: '100%', height: 52, padding: '0 16px',
              background: '#fff', border: 'none', cursor: 'pointer',
              textAlign: 'left', fontFamily: 'inherit', borderRadius: 14,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00C2A8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <span style={{ fontSize: 14, color: '#A0AEC0' }}>Where are you going?</span>
          </button>
        ) : (
          /* Expanded — from + to inputs */
          <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {/* From */}
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 16, pointerEvents: 'none' }}>🔵</span>
              <input
                value={fromText}
                onChange={(e) => { setFromText(e.target.value); onFromChange(null); debounce(e.target.value, setFromResults, setFromLoading, fromTimer); }}
                onFocus={() => setActiveField('from')}
                placeholder="From…"
                autoComplete="off"
                autoFocus
                style={{ ...inputStyle, borderColor: activeField === 'from' ? '#00C2A8' : '#E2E8F0' }}
              />
              {fromText && (
                <button onClick={() => { setFromText(''); onFromChange(null); setFromResults([]); }} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#A0AEC0', fontSize: 16, padding: 4 }}>✕</button>
              )}
            </div>

            {/* Swap button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', margin: '-2px 0' }}>
              <button onClick={swap} style={{ background: 'none', border: '1px solid #E2E8F0', borderRadius: 6, cursor: 'pointer', padding: '2px 8px', fontSize: 12, color: '#5A6A7A', fontFamily: 'inherit' }}>↕ Swap</button>
            </div>

            {/* To */}
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 16, pointerEvents: 'none' }}>📍</span>
              <input
                value={toText}
                onChange={(e) => { setToText(e.target.value); onToChange(null); debounce(e.target.value, setToResults, setToLoading, toTimer); }}
                onFocus={() => setActiveField('to')}
                placeholder="To…"
                autoComplete="off"
                style={{ ...inputStyle, borderColor: activeField === 'to' ? '#00C2A8' : '#E2E8F0' }}
              />
              {toText && (
                <button onClick={() => { setToText(''); onToChange(null); setToResults([]); }} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#A0AEC0', fontSize: 16, padding: 4 }}>✕</button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Dropdown results */}
      {expanded && hasDropdown && (
        <div style={{ background: '#fff', borderRadius: '0 0 14px 14px', borderTop: '1px solid #F0F0F0', maxHeight: 280, overflowY: 'auto' }}>
          {showFromDropdown && <DropdownList field="from" />}
          {showToDropdown && <DropdownList field="to" />}
        </div>
      )}
    </div>
  );
}
