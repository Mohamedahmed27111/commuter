'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { searchAddress, formatDisplayName, getPlaceDetails, type NominatimResult } from '@/lib/nominatim';
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

interface Props {
  from: LocationValue | null;
  to: LocationValue | null;
  onFromChange: (v: LocationValue | null) => void;
  onToChange: (v: LocationValue | null) => void;
  savedLocations?: SavedLocation[];
  onPickOnMap?: (field: 'from' | 'to') => void;
  onCurrentLocation?: (field: 'from' | 'to') => void;
  // Via stops
  viaStops?: LocationValue[];
  onViaStopsChange?: (stops: LocationValue[]) => void;
  onPickStopOnMap?: (index: number) => void;
}

export default function FloatingSearchBar({
  from,
  to,
  onFromChange,
  onToChange,
  savedLocations = [],
  onPickOnMap,
  onCurrentLocation,
  viaStops = [],
  onViaStopsChange,
  onPickStopOnMap,
}: Props) {
  const t = useTranslations('map');
  const [expanded, setExpanded] = useState(false);
  const [fromText, setFromText] = useState(from?.address ?? '');
  const [toText, setToText] = useState(to?.address ?? '');
  const [fromResults, setFromResults] = useState<NominatimResult[]>([]);
  const [toResults, setToResults] = useState<NominatimResult[]>([]);
  const [fromLoading, setFromLoading] = useState(false);
  const [toLoading, setToLoading] = useState(false);
  // activeField: 'from' | 'to' | number (stop index) | null
  const [activeField, setActiveField] = useState<'from' | 'to' | number | null>(null);
  const [recentRoutes, setRecentRoutes] = useState<RecentRoute[]>([]);

  // Via stop per-row state
  const [stopTexts, setStopTexts] = useState<string[]>(() => viaStops.map((s) => s.address));
  const [stopResults, setStopResults] = useState<NominatimResult[][]>(() => viaStops.map(() => []));
  const [stopLoadings, setStopLoadings] = useState<boolean[]>(() => viaStops.map(() => false));
  const stopTimers = useRef<(ReturnType<typeof setTimeout> | undefined)[]>([]);
  const stopInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Sync stop text arrays when viaStops length changes
  useEffect(() => {
    setStopTexts(viaStops.map((s) => s.address));
    setStopResults(viaStops.map(() => []));
    setStopLoadings(viaStops.map(() => false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viaStops.length]);

  const containerRef = useRef<HTMLDivElement>(null);
  const fromInputRef = useRef<HTMLInputElement>(null);
  const toInputRef = useRef<HTMLInputElement>(null);
  const fromTimer = useRef<ReturnType<typeof setTimeout>>();
  const toTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (expanded) setRecentRoutes(getRecentRoutes());
  }, [expanded]);

  useEffect(() => { setFromText(from?.address ?? ''); }, [from]);
  useEffect(() => { setToText(to?.address ?? ''); }, [to]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        if (!from && !to) setExpanded(false);
        setActiveField(null);
        setFromResults([]);
        setToResults([]);
        setStopResults(viaStops.map(() => []));
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [from, to, viaStops]);

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
    // Move focus to first stop or TO
    if (viaStops.length > 0) {
      setActiveField(0);
      setTimeout(() => stopInputRefs.current[0]?.focus(), 50);
    } else {
      setActiveField('to');
      setTimeout(() => toInputRef.current?.focus(), 50);
    }
  }

  function selectTo(loc: LocationValue) {
    setToText(loc.address);
    onToChange(loc);
    setToResults([]);
    setActiveField(null);
  }

  function selectStop(idx: number, loc: LocationValue) {
    const next = [...viaStops];
    next[idx] = loc;
    onViaStopsChange?.(next);
    const newTexts = [...stopTexts];
    newTexts[idx] = loc.address;
    setStopTexts(newTexts);
    const newResults = [...stopResults];
    newResults[idx] = [];
    setStopResults(newResults);
    // Advance focus to next stop or TO
    if (idx < viaStops.length - 1) {
      setActiveField(idx + 1);
      setTimeout(() => stopInputRefs.current[idx + 1]?.focus(), 50);
    } else {
      setActiveField('to');
      setTimeout(() => toInputRef.current?.focus(), 50);
    }
  }

  function debounceStop(idx: number, query: string) {
    clearTimeout(stopTimers.current[idx]);
    if (query.length < 3) {
      setStopResults((prev) => { const n = [...prev]; n[idx] = []; return n; });
      return;
    }
    stopTimers.current[idx] = setTimeout(async () => {
      setStopLoadings((prev) => { const n = [...prev]; n[idx] = true; return n; });
      try {
        const results = await searchAddress(query);
        setStopResults((prev) => { const n = [...prev]; n[idx] = results.slice(0, 5); return n; });
      } catch {
        setStopResults((prev) => { const n = [...prev]; n[idx] = []; return n; });
      } finally {
        setStopLoadings((prev) => { const n = [...prev]; n[idx] = false; return n; });
      }
    }, 500);
  }

  function swap() {
    const newFrom = to;
    const newTo = from;
    setFromText(newFrom?.address ?? '');
    setToText(newTo?.address ?? '');
    onFromChange(newFrom);
    onToChange(newTo);
  }

  function handleExpand() {
    setExpanded(true);
    setActiveField('from');
    setTimeout(() => fromInputRef.current?.focus(), 50);
  }

  const showFromDropdown = expanded && activeField === 'from';
  const showToDropdown = expanded && activeField === 'to';
  const activeStopIdx = expanded && typeof activeField === 'number' ? activeField : -1;
  const hasDropdown = showFromDropdown || showToDropdown || activeStopIdx >= 0;

  function DropdownList({ field }: { field: 'from' | 'to' }) {
    const results = field === 'from' ? fromResults : toResults;
    const loading = field === 'from' ? fromLoading : toLoading;
    const text = field === 'from' ? fromText : toText;
    const select = field === 'from' ? selectFrom : selectTo;
    const showSuggestions = text.length < 3;

    return (
      <div dir="ltr">
        <div style={{ padding: '6px 0' }}>
          <DropItem
            icon={<IconBox bg="#EFF7F6"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#00C2A8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg></IconBox>}
            title={t('current_location')}
            subtitle={t('current_location_sub')}
            onClick={() => { onCurrentLocation?.(field); setActiveField(null); setFromResults([]); setToResults([]); }}
          />
          <DropItem
            icon={<IconBox bg="#F0F4FF"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#4A6CF7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg></IconBox>}
            title={t('pick_on_map')}
            subtitle={t('pick_on_map_sub')}
            onClick={() => { onPickOnMap?.(field); setActiveField(null); setFromResults([]); setToResults([]); }}
          />
        </div>

        {(showSuggestions ? (recentRoutes.length > 0 || savedLocations.length > 0) : results.length > 0 || loading) && (
          <div style={{ height: 1, background: '#F3F4F6', margin: '0 14px' }} />
        )}

        {loading && (
          <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#5A6A7A' }}>
            <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid #00C2A8', borderTopColor: 'transparent', borderRadius: '50%', animation: 'fsb-spin 0.7s linear infinite', flexShrink: 0 }} />
            {t('searching')}
          </div>
        )}

        {!showSuggestions && !loading && results.length === 0 && text.length >= 3 && (
          <div style={{ padding: '12px 16px', fontSize: 13, color: '#A0AEC0' }}>
            {t('no_results')} &ldquo;{text}&rdquo;
          </div>
        )}

        {showSuggestions && recentRoutes.length > 0 && (
          <div style={{ padding: '8px 0' }}>
            <SectionHeader label={t('recent_label')} />
            {recentRoutes.map((r, i) => {
              const loc = field === 'from' ? r.from : r.to;
              return (
                <DropItem key={i}
                  icon={<IconBox bg="#F8F9FA"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5A6A7A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></IconBox>}
                  title={loc.address}
                  onClick={() => select(loc)}
                />
              );
            })}
          </div>
        )}

        {showSuggestions && savedLocations.length > 0 && (
          <div style={{ padding: '8px 0' }}>
            <SectionHeader label={t('saved_label')} />
            {savedLocations.map((s) => {
              const isHome = s.label === 'home';
              const isWork = s.label === 'work';
              const bg = isHome ? '#EFF7F6' : isWork ? '#F0F4FF' : '#FFFBEB';
              const stroke = isHome ? '#00C2A8' : isWork ? '#4A6CF7' : '#F59E0B';
              const svgPath = isHome
                ? <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>
                : isWork
                  ? <><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></>
                  : <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></>;
              return (
                <DropItem key={s.id}
                  icon={<IconBox bg={bg}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{svgPath}</svg></IconBox>}
                  title={s.name}
                  subtitle={s.address}
                  onClick={() => select({ address: s.address, lat: s.lat, lng: s.lng })}
                />
              );
            })}
          </div>
        )}

        {!showSuggestions && results.length > 0 && (
          <div style={{ padding: '8px 0' }}>
            {results.map((r) => (
              <DropItem key={r.place_id}
                icon={<IconBox bg="#F8F9FA"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5A6A7A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></IconBox>}
                title={formatDisplayName(r.display_name)}
                onClick={async () => {
                  try {
                    const details = await getPlaceDetails(r.place_id);
                    select({ address: formatDisplayName(r.display_name), lat: details.lat, lng: details.lng });
                  } catch { /* ignore */ }
                }}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  function StopDropdownList({ idx }: { idx: number }) {
    const results = stopResults[idx] ?? [];
    const loading = stopLoadings[idx] ?? false;
    const text = stopTexts[idx] ?? '';
    const showSuggestions = text.length < 3;
    return (
      <div dir="ltr">
        <div style={{ padding: '6px 0' }}>
          <DropItem
            icon={<IconBox bg="#F0F4FF"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#4A6CF7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg></IconBox>}
            title={t('pick_on_map')}
            subtitle={t('pick_on_map_sub')}
            onClick={() => { onPickStopOnMap?.(idx); setActiveField(null); }}
          />
          <DropItem
            icon={<IconBox bg="#EFF7F6"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#00C2A8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg></IconBox>}
            title={t('current_location')}
            subtitle={t('current_location_sub')}
            onClick={() => { onCurrentLocation?.('from'); setActiveField(null); }}
          />
        </div>
        {loading && (
          <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#5A6A7A' }}>
            <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid #00C2A8', borderTopColor: 'transparent', borderRadius: '50%', animation: 'fsb-spin 0.7s linear infinite', flexShrink: 0 }} />
            {t('searching')}
          </div>
        )}
        {!showSuggestions && !loading && results.length === 0 && text.length >= 3 && (
          <div style={{ padding: '12px 16px', fontSize: 13, color: '#A0AEC0' }}>{t('no_results')} &ldquo;{text}&rdquo;</div>
        )}
        {!showSuggestions && results.length > 0 && (
          <div style={{ padding: '8px 0' }}>
            {results.map((r) => (
              <DropItem key={r.place_id}
                icon={<IconBox bg="#F8F9FA"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5A6A7A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></IconBox>}
                title={formatDisplayName(r.display_name)}
                onClick={async () => {
                  try {
                    const details = await getPlaceDetails(r.place_id);
                    selectStop(idx, { address: formatDisplayName(r.display_name), lat: details.lat, lng: details.lng });
                  } catch { /* ignore */ }
                }}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes fsb-spin { to { transform: rotate(360deg); } }
        .fsb-input { outline: none !important; }
        .fsb-clear { opacity: 0; transition: opacity 0.15s; }
        .fsb-input-wrap:hover .fsb-clear,
        .fsb-input-wrap:focus-within .fsb-clear { opacity: 1; }
        .fsb-drop-item:hover { background: #F7FFFE !important; }
        .fsb-swap:hover { border-color: #00C2A8 !important; color: #00C2A8 !important; }
      `}</style>

      <div ref={containerRef} dir="ltr" style={{ position: 'absolute', top: 16, left: 16, zIndex: 1000, width: 'min(400px, calc(100vw - 32px))' }}>

        {/* ── Card ─────────────────────────────────────────────────── */}
        <div style={{ background: '#fff', borderRadius: expanded ? '16px 16px 0 0' : 16, boxShadow: '0 4px 24px rgba(0,0,0,0.14)', transition: 'border-radius 0.15s' }}>
          {!expanded ? (
            <button
              onClick={handleExpand}
              style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', height: 52, padding: '0 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
            >
              <IconBox bg="#EFF7F6">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00C2A8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
              </IconBox>
              <span style={{ fontSize: 14, color: '#A0AEC0' }}>{t('search_placeholder')}</span>
            </button>
          ) : (
            <div style={{ padding: '12px 14px' }}>
              {/* FROM */}
              <div className="fsb-input-wrap" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 10px', height: 46, borderRadius: 10, border: `1.5px solid ${activeField === 'from' ? '#00C2A8' : '#E2E8F0'}`, background: activeField === 'from' ? '#F9FFFE' : '#FAFAFA', transition: 'border-color 0.15s, background 0.15s' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#00C2A8', outline: '2.5px solid rgba(0,194,168,0.25)', flexShrink: 0 }} />
                <input ref={fromInputRef} className="fsb-input"
                  value={fromText}
                  onChange={(e) => { setFromText(e.target.value); onFromChange(null); debounce(e.target.value, setFromResults, setFromLoading, fromTimer); }}
                  onFocus={() => setActiveField('from')}
                  placeholder={t('from_placeholder')}
                  autoComplete="off"
                  style={{ flex: 1, height: '100%', border: 'none', background: 'transparent', fontSize: 14, color: '#0B1E3D', fontFamily: 'inherit' }}
                />
                {fromText && (
                  <button className="fsb-clear" onClick={() => { setFromText(''); onFromChange(null); setFromResults([]); fromInputRef.current?.focus(); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#A0AEC0', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                )}
              </div>

              {/* Connector + Via stops + Swap */}
              <div style={{ display: 'flex', alignItems: 'stretch', paddingLeft: 14, minHeight: 22 }}>
                {/* Left dashed line column */}
                <div style={{ position: 'relative', width: 9, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ flex: 1, width: 1, background: 'repeating-linear-gradient(to bottom,#CBD5E0 0,#CBD5E0 4px,transparent 4px,transparent 8px)' }} />
                </div>

                {/* Via stop rows + Add button */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 6, paddingBottom: 6, marginLeft: 6 }}>
                  {viaStops.map((_, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {/* teal dot */}
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#00C2A8', border: '2px solid #fff', boxShadow: '0 0 0 1.5px #00C2A8', flexShrink: 0 }} />
                      {/* input */}
                      <div className="fsb-input-wrap" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '0 8px', height: 38, borderRadius: 8, border: `1.5px solid ${activeField === idx ? '#00C2A8' : '#E2E8F0'}`, background: activeField === idx ? '#F9FFFE' : '#FAFAFA', transition: 'border-color 0.15s, background 0.15s' }}>
                        <input
                          ref={(el) => { stopInputRefs.current[idx] = el; }}
                          className="fsb-input"
                          value={stopTexts[idx] ?? ''}
                          onChange={(e) => {
                            const newTexts = [...stopTexts];
                            newTexts[idx] = e.target.value;
                            setStopTexts(newTexts);
                            // clear selection
                            const next = [...viaStops];
                            next[idx] = { ...next[idx], address: e.target.value };
                            onViaStopsChange?.(next);
                            debounceStop(idx, e.target.value);
                          }}
                          onFocus={() => setActiveField(idx)}
                          placeholder={`Via stop ${idx + 1}…`}
                          autoComplete="off"
                          style={{ flex: 1, height: '100%', border: 'none', background: 'transparent', fontSize: 13, color: '#0B1E3D', fontFamily: 'inherit' }}
                        />
                        {(stopTexts[idx] ?? '').length > 0 && (
                          <button className="fsb-clear" onClick={() => {
                            const newTexts = [...stopTexts];
                            newTexts[idx] = '';
                            setStopTexts(newTexts);
                            const newResults = [...stopResults];
                            newResults[idx] = [];
                            setStopResults(newResults);
                            stopInputRefs.current[idx]?.focus();
                          }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: '#A0AEC0', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          </button>
                        )}
                      </div>
                      {/* remove stop */}
                      <button onClick={() => {
                        const next = viaStops.filter((_, i) => i !== idx);
                        onViaStopsChange?.(next);
                        if (typeof activeField === 'number' && activeField >= next.length) setActiveField(null);
                      }}
                        style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A0AEC0', flexShrink: 0 }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                  ))}
                  {/* Add stop button */}
                  <button
                    onClick={() => {
                      if (viaStops.length >= 2) return;
                      const next = [...viaStops, { address: '', lat: 0, lng: 0 }];
                      onViaStopsChange?.(next);
                      setActiveField(next.length - 1);
                      setTimeout(() => stopInputRefs.current[next.length - 1]?.focus(), 50);
                    }}
                    style={{ alignSelf: 'flex-start', fontSize: 12, fontWeight: 600, color: viaStops.length >= 2 ? '#A0AEC0' : '#00C2A8', background: 'none', border: 'none', cursor: viaStops.length >= 2 ? 'not-allowed' : 'pointer', padding: '2px 0', fontFamily: 'inherit', opacity: viaStops.length >= 2 ? 0.5 : 1 }}
                  >
                    + Add stop point
                  </button>
                </div>

                {/* Swap button */}
                <button className="fsb-swap" onClick={swap}
                  style={{ alignSelf: 'flex-start', marginTop: 2, width: 28, height: 28, borderRadius: 6, border: '1.5px solid #E2E8F0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5A6A7A', flexShrink: 0, transition: 'border-color 0.15s, color 0.15s', marginLeft: 4 }}
                  title={t('swap')}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
                  </svg>
                </button>
              </div>

              {/* TO */}
              <div className="fsb-input-wrap" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 10px', height: 46, borderRadius: 10, border: `1.5px solid ${activeField === 'to' ? '#00C2A8' : '#E2E8F0'}`, background: activeField === 'to' ? '#F9FFFE' : '#FAFAFA', transition: 'border-color 0.15s, background 0.15s' }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: '#0B1E3D', flexShrink: 0 }} />
                <input ref={toInputRef} className="fsb-input"
                  value={toText}
                  onChange={(e) => { setToText(e.target.value); onToChange(null); debounce(e.target.value, setToResults, setToLoading, toTimer); }}
                  onFocus={() => setActiveField('to')}
                  placeholder={t('to_placeholder')}
                  autoComplete="off"
                  style={{ flex: 1, height: '100%', border: 'none', background: 'transparent', fontSize: 14, color: '#0B1E3D', fontFamily: 'inherit' }}
                />
                {toText && (
                  <button className="fsb-clear" onClick={() => { setToText(''); onToChange(null); setToResults([]); toInputRef.current?.focus(); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#A0AEC0', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Dropdown ─────────────────────────────────────────────── */}
        {hasDropdown && (
          <div style={{ background: '#fff', borderRadius: '0 0 16px 16px', borderTop: '1px solid #F3F4F6', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', maxHeight: 320, overflowY: 'auto' }}>
            {showFromDropdown && <DropdownList field="from" />}
            {showToDropdown && <DropdownList field="to" />}
            {activeStopIdx >= 0 && <StopDropdownList idx={activeStopIdx} />}
          </div>
        )}
      </div>
    </>
  );
}

// ── Shared primitives ────────────────────────────────────────────────────

function IconBox({ bg, children }: { bg: string; children: React.ReactNode }) {
  return (
    <div style={{ width: 32, height: 32, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {children}
    </div>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div style={{ padding: '4px 16px 2px', fontSize: 10, fontWeight: 700, color: '#A0AEC0', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
      {label}
    </div>
  );
}

function DropItem({ icon, title, subtitle, onClick }: { icon: React.ReactNode; title: string; subtitle?: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="fsb-drop-item"
      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', minHeight: 44, fontFamily: 'inherit' }}>
      {icon}
      <div style={{ overflow: 'hidden' }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: '#0B1E3D', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</div>
        {subtitle && <div style={{ fontSize: 11, color: '#5A6A7A', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{subtitle}</div>}
      </div>
    </button>
  );
}