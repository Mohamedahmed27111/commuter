'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import type { DriverCycleRequest } from '@/types/driver';
import { mockRequests, mockDriver } from '@/lib/mockDriver';
import RequestCard from '@/components/driver/RequestCard';
import RequestDetailDrawer from '@/components/driver/RequestDetailDrawer';
import RaisePriceModal from '@/components/driver/RaisePriceModal';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslations } from 'next-intl';

type SortKey     = 'nearest-start' | 'farthest-start' | 'shortest-distance' | 'longest-distance' | 'most-passengers' | 'highest-price';
type RideTypeFlt = 'any' | 'shared' | 'private';
type GenderFlt   = 'any' | 'mixed' | 'same';
type WalkFlt     = 'any' | '0' | '5' | '10';

const DRIVER_GENDER = mockDriver.gender;

const PAGE_SIZE = 10;

const SEL: React.CSSProperties = {
  fontSize: 13, border: '1px solid #E2E8F0', borderRadius: 8,
  padding: '7px 10px', color: '#0B1E3D', background: '#fff',
  outline: 'none', cursor: 'pointer',
};

function pageBtn(active: boolean, disabled: boolean): React.CSSProperties {
  return {
    width: 32, height: 32, borderRadius: 8, fontSize: 13, fontWeight: 500,
    cursor: disabled ? 'default' : 'pointer',
    background: active ? '#00C2A8' : '#fff',
    color:      active ? '#fff'     : '#5A6A7A',
    border:     active ? 'none'     : '1px solid #E2E8F0',
    opacity: disabled ? 0.4 : 1,
  };
}

export default function RequestsPage() {
  const t = useTranslations('driver_requests');

  const SORT_OPTIONS: { key: SortKey; label: string }[] = [
    { key: 'nearest-start',     label: t('sort_nearest') },
    { key: 'farthest-start',    label: t('sort_farthest') },
    { key: 'shortest-distance', label: t('sort_shortest') },
    { key: 'longest-distance',  label: t('sort_longest') },
    { key: 'most-passengers',   label: t('sort_most_passengers') },
    { key: 'highest-price',     label: t('sort_highest_price') },
  ];
  const [requests,      setRequests]      = useState<DriverCycleRequest[]>(
    () => mockRequests.filter((r) => r.status === 'available')
  );
  const [sortKey,       setSortKey]       = useState<SortKey>('nearest-start');
  const [rideTypeFilter, setRideTypeFilter] = useState<RideTypeFlt>('any');
  const [genderFilter,   setGenderFilter]  = useState<GenderFlt>('any');
  const [walkFilter,     setWalkFilter]    = useState<WalkFlt>('any');
  const [page,          setPage]          = useState(1);
  const [detailRequest, setDetailRequest] = useState<DriverCycleRequest | null>(null);
  const [raiseRequest,  setRaiseRequest]  = useState<DriverCycleRequest | null>(null);

  useEffect(() => {
    const id = setInterval(() => { /* production: fetchAvailableRequests().then(setRequests) */ }, 30_000);
    return () => clearInterval(id);
  }, []);

  const filtered = useMemo(() => {
    let list = [...requests];

    if (rideTypeFilter !== 'any') {
      list = list.filter((r) => r.ride_type === rideTypeFilter);
    }
    if (genderFilter !== 'any') {
      list = list.filter((r) => r.gender_pref === genderFilter);
    }
    if (walkFilter !== 'any') {
      list = list.filter((r) => String(r.walk_minutes) === walkFilter);
    }

    switch (sortKey) {
      case 'nearest-start':     list.sort((a, b) => new Date(a.cycle_start_date).getTime() - new Date(b.cycle_start_date).getTime()); break;
      case 'farthest-start':    list.sort((a, b) => new Date(b.cycle_start_date).getTime() - new Date(a.cycle_start_date).getTime()); break;
      case 'shortest-distance': list.sort((a, b) => a.distance_km - b.distance_km); break;
      case 'longest-distance':  list.sort((a, b) => b.distance_km - a.distance_km); break;
      case 'most-passengers':   list.sort((a, b) => b.passenger_count - a.passenger_count); break;
      case 'highest-price':     list.sort((a, b) => b.base_price - a.base_price); break;
    }
    return list;
  }, [requests, sortKey, rideTypeFilter, genderFilter, walkFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [sortKey, rideTypeFilter, genderFilter, walkFilter]);

  const handleAccept = useCallback((id: string) => {
    setRequests((p) => p.filter((r) => r.id !== id));
    setDetailRequest(null);
    toast.success('Request accepted! Added to My Cycles.');
  }, []);

  const handleReject = useCallback((id: string) => {
    setRequests((p) => p.filter((r) => r.id !== id));
    setDetailRequest(null);
    toast.success('Request declined.');
  }, []);

  const handleRaiseOpen = useCallback((id: string) => {
    setRaiseRequest(requests.find((r) => r.id === id) ?? null);
    setDetailRequest(null);
  }, [requests]);

  const handleRaiseConfirm = useCallback((requestId: string, newPrice: number) => {
    setRequests((p) => p.filter((r) => r.id !== requestId));
    setRaiseRequest(null);
    toast.success(`Counter-price of EGP ${newPrice.toFixed(0)} submitted.`);
  }, []);

  const handleSeeDetails = useCallback((id: string) => {
    setDetailRequest(requests.find((r) => r.id === id) ?? null);
  }, [requests]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Page header */}
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#0B1E3D', margin: 0 }}>{t('page_title')}</h1>
        <p style={{ color: '#5A6A7A', fontSize: 14, margin: '4px 0 0' }}>
          {t('page_subtitle')}
        </p>
      </div>

      {/* Filters row */}
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label htmlFor="sort-select" style={{ fontSize: 13, color: '#5A6A7A', fontWeight: 500, whiteSpace: 'nowrap' }}>
            Sort:
          </label>
          <select id="sort-select" value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)} style={SEL}>
            {SORT_OPTIONS.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
          </select>
        </div>

        <select value={rideTypeFilter} onChange={(e) => setRideTypeFilter(e.target.value as RideTypeFlt)} style={SEL}
          aria-label="Filter by ride type">
          <option value="any">Trip type: Any</option>
          <option value="shared">🧑‍🤝‍🧑 Shared ride</option>
          <option value="private">🚗 Private</option>
        </select>

        <select value={genderFilter} onChange={(e) => setGenderFilter(e.target.value as GenderFlt)} style={SEL}
          aria-label="Filter by gender preference">
          <option value="any">Gender pref: Any</option>
          <option value="mixed">Mixed</option>
          <option value="same">Same gender</option>
        </select>

        <select value={walkFilter} onChange={(e) => setWalkFilter(e.target.value as WalkFlt)} style={SEL}
          aria-label="Filter by walk minutes">
          <option value="any">Walk: Any</option>
          <option value="0">Door pickup</option>
          <option value="5">5 min walk</option>
          <option value="10">10 min walk</option>
        </select>
      </div>

      {/* Request list */}
      {paginated.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '64px 24px',
          background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0',
        }}>
          <Calendar size={40} style={{ color: '#00C2A8', margin: '0 auto 16px' }} />
          <p style={{ fontSize: 18, fontWeight: 600, color: '#0B1E3D', margin: '0 0 8px' }}>
            {t('empty_title')}
          </p>
          <p style={{ fontSize: 14, color: '#5A6A7A', margin: 0 }}>
            {t('empty_subtitle')}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }} role="list" aria-label="Available requests">
          {paginated.map((req) => (
            <div key={req.id} role="listitem">
              <RequestCard
                request={req}
                driverGender={DRIVER_GENDER}
                onAccept={handleAccept}
                onReject={handleReject}
                onRaise={handleRaiseOpen}
                onSeeDetails={handleSeeDetails}
              />
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }} aria-label="Pagination">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            style={pageBtn(false, page === 1)} aria-label="Previous page">
            <ChevronLeft size={16} />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)} aria-current={p === page ? 'page' : undefined}
              style={pageBtn(p === page, false)}>
              {p}
            </button>
          ))}
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            style={pageBtn(false, page === totalPages)} aria-label="Next page">
            <ChevronRight size={16} />
          </button>
        </nav>
      )}

      <RequestDetailDrawer
        request={detailRequest}
        driverGender={DRIVER_GENDER}
        onClose={() => setDetailRequest(null)}
        onAccept={handleAccept}
        onReject={handleReject}
        onRaise={handleRaiseOpen}
        variant="modal"
      />
      <RaisePriceModal
        request={raiseRequest}
        isOpen={!!raiseRequest}
        onClose={() => setRaiseRequest(null)}
        onConfirm={handleRaiseConfirm}
      />
    </div>
  );
}
