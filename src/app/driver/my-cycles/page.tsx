'use client';

import { useState, useMemo, useCallback } from 'react';
import { format, differenceInDays, isWithinInterval, isBefore } from 'date-fns';
import { DriverCycleRequest } from '@/types/driver';
import { mockRequests, mockDriver } from '@/lib/mockDriver';
import RequestDetailDrawer from '@/components/driver/RequestDetailDrawer';
import RaisePriceModal from '@/components/driver/RaisePriceModal';
import { MapPin, Users, RotateCcw, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import toast from 'react-hot-toast';

type TabKey       = 'currently' | 'pending' | 'completed';
type SubFilter    = 'all' | 'nextweek' | 'nextmonth' | 'next3months';
type SortKey      = 'newest' | 'oldest' | 'highest-earnings' | 'most-passengers';

const COMPLETED_PAGE_SIZE = 15;
const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'newest',           label: 'Newest first' },
  { key: 'oldest',           label: 'Oldest first' },
  { key: 'highest-earnings', label: 'Highest earnings' },
  { key: 'most-passengers',  label: 'Most passengers' },
];

// ── Date helpers ────────────────────────────────────────────────────────
const today = () => new Date();

function isPendingCycle(r: DriverCycleRequest): boolean {
  return r.status === 'confirmed' && differenceInDays(new Date(r.cycle_start_date), today()) > 7;
}
function isCurrentCycle(r: DriverCycleRequest): boolean {
  const now = today();
  return (
    r.status === 'confirmed' &&
    isWithinInterval(now, { start: new Date(r.cycle_start_date), end: new Date(r.cycle_end_date) })
  );
}
function isCompletedCycle(r: DriverCycleRequest): boolean {
  return r.status === 'completed' && isBefore(new Date(r.cycle_end_date), today());
}

function daysUntilStart(r: DriverCycleRequest) {
  return Math.max(0, differenceInDays(new Date(r.cycle_start_date), today()));
}
function dayOfCycle(r: DriverCycleRequest) {
  return Math.max(1, differenceInDays(today(), new Date(r.cycle_start_date)) + 1);
}
function totalCycleDays(r: DriverCycleRequest) {
  return Math.max(1, differenceInDays(new Date(r.cycle_end_date), new Date(r.cycle_start_date)) + 1);
}
function pickupTimeToday(r: DriverCycleRequest): string {
  const d = new Date(r.cycle_start_date);
  return d.toLocaleTimeString('en-EG', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Cairo' });
}
function totalEarnings(r: DriverCycleRequest): number {
  return r.offered_price ?? r.base_price;
}

// ── Shared styles ────────────────────────────────────────────────────────
const CARD: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #E2E8F0',
  borderRadius: 12,
  padding: '20px 24px',
};
const SEL: React.CSSProperties = {
  fontSize: 13, border: '1px solid #E2E8F0', borderRadius: 8,
  padding: '7px 10px', color: '#0B1E3D', background: '#fff',
  outline: 'none', cursor: 'pointer',
};

// ── Sub-components ────────────────────────────────────────────────────────
function StatPill({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ fontSize: 13, color: '#5A6A7A', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      {children}
    </span>
  );
}

function PendingCard({ cycle, onViewDetails, onCancelRequest }: {
  cycle: DriverCycleRequest;
  onViewDetails: (id: string) => void;
  onCancelRequest: (id: string) => void;
}) {
  const days = daysUntilStart(cycle);
  return (
    <div style={CARD}>
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 999, background: '#FEF3CD', color: '#7A4A00' }}>
            ● Pending
          </span>
          <span style={{ fontSize: 13, color: '#5A6A7A' }}>
            Starts in {days} day{days !== 1 ? 's' : ''} · {format(new Date(cycle.cycle_start_date), 'dd MMM yyyy')}
          </span>
        </div>
      </div>
      {/* Route */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <MapPin size={16} style={{ color: '#00C2A8', flexShrink: 0 }} />
        <span style={{ fontWeight: 700, color: '#0B1E3D', fontSize: 15 }}>{cycle.origin.address}</span>
        <span style={{ color: '#00C2A8', fontWeight: 700, fontSize: 18 }}>→</span>
        <span style={{ fontWeight: 700, color: '#0B1E3D', fontSize: 15 }}>{cycle.destination.address}</span>
      </div>
      {/* Stats */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
        <StatPill><span style={{ color: '#00C2A8' }}>📏</span> {cycle.distance_km} km</StatPill>
        <StatPill>
          <RotateCcw size={13} style={{ color: '#00C2A8' }} />
          {cycle.trip_type === 'round_trip' ? 'Round trip' : 'One-way'}
        </StatPill>
        <StatPill><Users size={13} style={{ color: '#00C2A8' }} /> {cycle.passenger_count} passengers</StatPill>
        <StatPill>
          <span style={{ color: '#F5A623', fontWeight: 700 }}>EGP {(cycle.offered_price ?? cycle.base_price).toFixed(0)}</span>
          <span style={{ color: '#5A6A7A' }}> total</span>
        </StatPill>
      </div>
      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
        <button onClick={() => onViewDetails(cycle.id)} style={{
          padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer',
          background: '#EFF7F6', color: '#00C2A8', border: '1px solid #00C2A8',
        }}>
          View details
        </button>
        <button onClick={() => onCancelRequest(cycle.id)} style={{
          padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer',
          background: 'transparent', color: '#E74C3C', border: '1px solid #E2E8F0',
        }}>
          Cancel cycle
        </button>
      </div>
    </div>
  );
}

function CurrentCard({ cycle, onViewDetails }: {
  cycle: DriverCycleRequest;
  onViewDetails: (id: string) => void;
}) {
  const day  = dayOfCycle(cycle);
  const total = totalCycleDays(cycle);
  const pickupTime = pickupTimeToday(cycle);

  return (
    <div style={{ ...CARD, borderLeft: '4px solid #00C2A8' }}>
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
        <span style={{
          fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 999,
          background: '#00C2A8', color: '#fff', display: 'inline-flex', alignItems: 'center', gap: 5,
        }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff', display: 'inline-block', animation: 'livePulse 1.5s infinite' }} />
          Live
        </span>
        <span style={{ fontSize: 13, color: '#5A6A7A' }}>
          Week of {format(new Date(cycle.cycle_start_date), 'dd MMM')} – {format(new Date(cycle.cycle_end_date), 'dd MMM yyyy')} · Day {day} of {total}
        </span>
      </div>
      {/* Route */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <MapPin size={16} style={{ color: '#00C2A8', flexShrink: 0 }} />
        <span style={{ fontWeight: 700, color: '#0B1E3D', fontSize: 15 }}>{cycle.origin.address}</span>
        <span style={{ color: '#00C2A8', fontWeight: 700, fontSize: 18 }}>→</span>
        <span style={{ fontWeight: 700, color: '#0B1E3D', fontSize: 15 }}>{cycle.destination.address}</span>
      </div>
      {/* Stats */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 8 }}>
        <StatPill><span style={{ color: '#00C2A8' }}>📏</span> {cycle.distance_km} km</StatPill>
        <StatPill>
          <RotateCcw size={13} style={{ color: '#00C2A8' }} />
          {cycle.trip_type === 'round_trip' ? 'Round trip' : 'One-way'}
        </StatPill>
        <StatPill><Users size={13} style={{ color: '#00C2A8' }} /> {cycle.passenger_count} passengers</StatPill>
        <StatPill>
          <span style={{ color: '#F5A623', fontWeight: 700 }}>EGP {(cycle.offered_price ?? cycle.base_price).toFixed(0)}</span>
          <span style={{ color: '#5A6A7A' }}> total</span>
        </StatPill>
      </div>
      <p style={{ fontSize: 13, color: '#5A6A7A', fontStyle: 'italic', margin: '8px 0 16px' }}>
        Today&apos;s pickup: {pickupTime}
      </p>
      {/* Action */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={() => onViewDetails(cycle.id)} style={{
          padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
          background: '#00C2A8', color: '#fff', border: 'none',
        }}>
          View details + map
        </button>
      </div>
    </div>
  );
}

// ── Cancel confirmation dialog ────────────────────────────────────────────
function CancelDialog({ cycle, onConfirm, onClose }: {
  cycle: DriverCycleRequest;
  onConfirm: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(0,0,0,0.4)' }} />
      <div style={{
        position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%,-50%)',
        zIndex: 50, background: '#fff', borderRadius: 16, padding: 32,
        width: '100%', maxWidth: 420,
        boxShadow: '0 16px 48px rgba(0,0,0,0.18)',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0B1E3D', margin: '0 0 10px' }}>
          Cancel this cycle?
        </h3>
        <p style={{ fontSize: 14, color: '#5A6A7A', margin: '0 0 8px' }}>
          {cycle.origin.address} → {cycle.destination.address} · {format(new Date(cycle.cycle_start_date), 'dd MMM')} – {format(new Date(cycle.cycle_end_date), 'dd MMM yyyy')}
        </p>
        <p style={{ fontSize: 14, color: '#E74C3C', margin: '0 0 24px' }}>
          {cycle.passenger_count} passenger{cycle.passenger_count !== 1 ? 's are' : ' is'} depending on this ride.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{
            padding: '9px 20px', borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer',
            background: '#EFF7F6', color: '#0B1E3D', border: '1px solid #E2E8F0',
          }}>
            Keep cycle
          </button>
          <button onClick={() => onConfirm(cycle.id)} style={{
            padding: '9px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer',
            background: '#E74C3C', color: '#fff', border: 'none',
          }}>
            Yes, cancel
          </button>
        </div>
      </div>
    </>
  );
}

// ── Main page ────────────────────────────────────────────────────────────
export default function MyCyclesPage() {
  const [cycles,        setCycles]        = useState<DriverCycleRequest[]>(mockRequests);
  const [activeTab,     setActiveTab]     = useState<TabKey>('currently');
  const [subFilter,     setSubFilter]     = useState<SubFilter>('all');
  const [search,        setSearch]        = useState('');
  const [sortKey,       setSortKey]       = useState<SortKey>('newest');
  const [page,          setPage]          = useState(1);
  const [detailRequest, setDetailRequest] = useState<DriverCycleRequest | null>(null);
  const [cancelTarget,  setCancelTarget]  = useState<DriverCycleRequest | null>(null);
  const [raiseRequest,  setRaiseRequest]  = useState<DriverCycleRequest | null>(null);

  const pending   = useMemo(() => cycles.filter(isPendingCycle),   [cycles]);
  const currently = useMemo(() => cycles.filter(isCurrentCycle),   [cycles]);
  const completed = useMemo(() => cycles.filter(isCompletedCycle), [cycles]);

  const counts = { pending: pending.length, currently: currently.length, completed: completed.length };

  // Pending sub-filter
  const filteredPending = useMemo(() => {
    if (subFilter === 'all') return pending;
    const t = today();
    return pending.filter((r) => {
      const days = differenceInDays(new Date(r.cycle_start_date), t);
      if (subFilter === 'nextweek')    return days >= 7  && days <= 14;
      if (subFilter === 'nextmonth')   return days >= 15 && days <= 30;
      if (subFilter === 'next3months') return days >= 31 && days <= 90;
      return true;
    });
  }, [pending, subFilter]);

  // Completed with search + sort + pagination
  const filteredCompleted = useMemo(() => {
    let list = [...completed];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((r) =>
        r.origin.address.toLowerCase().includes(q) ||
        r.destination.address.toLowerCase().includes(q) ||
        format(new Date(r.cycle_start_date), 'dd MMM yyyy').toLowerCase().includes(q)
      );
    }
    switch (sortKey) {
      case 'newest':           list.sort((a, b) => new Date(b.cycle_end_date).getTime() - new Date(a.cycle_end_date).getTime()); break;
      case 'oldest':           list.sort((a, b) => new Date(a.cycle_end_date).getTime() - new Date(b.cycle_end_date).getTime()); break;
      case 'highest-earnings': list.sort((a, b) => totalEarnings(b) - totalEarnings(a)); break;
      case 'most-passengers':  list.sort((a, b) => b.passenger_count - a.passenger_count); break;
    }
    return list;
  }, [completed, search, sortKey]);

  const totalPages  = Math.max(1, Math.ceil(filteredCompleted.length / COMPLETED_PAGE_SIZE));
  const pagedCompleted = filteredCompleted.slice((page - 1) * COMPLETED_PAGE_SIZE, page * COMPLETED_PAGE_SIZE);

  const handleViewDetails = useCallback((id: string) => {
    setDetailRequest(cycles.find((r) => r.id === id) ?? null);
  }, [cycles]);

  const handleCancelConfirm = useCallback((id: string) => {
    setCycles((p) => p.filter((r) => r.id !== id));
    setCancelTarget(null);
    toast.success('Cycle cancelled.');
  }, []);

  const handleRaiseOpen = useCallback((id: string) => {
    setRaiseRequest(cycles.find((r) => r.id === id) ?? null);
    setDetailRequest(null);
  }, [cycles]);

  const handleRaiseConfirm = useCallback((requestId: string, newPrice: number) => {
    setCycles((p) => p.map((r) => r.id === requestId ? { ...r, currentPrice: newPrice } : r));
    setRaiseRequest(null);
    toast.success(`Price updated to EGP ${newPrice.toFixed(0)}`);
  }, []);

  // ── Tab bar ──────────────────────────────────────────────────────────
  const TABS: { key: TabKey; label: string }[] = [
    { key: 'currently', label: 'Currently' },
    { key: 'pending',   label: 'Pending' },
    { key: 'completed', label: 'Completed' },
  ];

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <style>{`
        @keyframes livePulse { 0%,100% { opacity:1 } 50% { opacity:0.3 } }
      `}</style>

      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#0B1E3D', margin: 0 }}>My Cycles</h1>
        <p style={{ color: '#5A6A7A', fontSize: 14, margin: '4px 0 0' }}>
          Your accepted cycles — past, present and upcoming
        </p>
      </div>

      {/* Tab bar */}
      <div style={{ borderBottom: '1px solid #E2E8F0', display: 'flex', gap: 0, marginBottom: 28 }}>
        {TABS.map(({ key, label }) => {
          const active = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => { setActiveTab(key); setPage(1); setSubFilter('all'); setSearch(''); }}
              style={{
                padding: '10px 16px', fontSize: 14, fontFamily: 'inherit',
                fontWeight: active ? 600 : 400,
                color: active ? '#0B1E3D' : '#5A6A7A',
                background: 'none', border: 'none',
                borderBottom: active ? '2px solid #00C2A8' : '2px solid transparent',
                cursor: 'pointer', transition: 'color 0.15s',
                marginBottom: -1,
              }}
            >
              {label}
              <span style={{
                marginLeft: 6, fontSize: 11, fontWeight: 600,
                background: active ? '#00C2A8' : '#F8F9FA',
                color: active ? '#fff' : '#5A6A7A',
                borderRadius: 10, padding: '1px 6px',
              }}>
                {counts[key]}
              </span>
            </button>
          );
        })}
      </div>


 {/* ── CURRENTLY tab ─────────────────────────────────────────────────── */}
      {activeTab === 'currently' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {currently.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 24px', background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0' }}>
              <p style={{ fontSize: 16, fontWeight: 600, color: '#0B1E3D', margin: '0 0 6px' }}>No active cycles this week.</p>
              <p style={{ fontSize: 14, color: '#5A6A7A', margin: 0 }}>Check Pending for upcoming ones.</p>
            </div>
          ) : (
            currently.map((cycle) => (
              <CurrentCard
                key={cycle.id}
                cycle={cycle}
                onViewDetails={handleViewDetails}
              />
            ))
          )}
        </div>
      )}




      {/* ── PENDING tab ──────────────────────────────────────────────────── */}
      {activeTab === 'pending' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Sub-filter pills */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {([
              { key: 'all',          label: 'All pending' },
              { key: 'nextweek',     label: 'Next week' },
              { key: 'nextmonth',    label: 'Next month' },
              { key: 'next3months',  label: 'Next 3 months' },
            ] as { key: SubFilter; label: string }[]).map(({ key, label }) => {
              const active = subFilter === key;
              return (
                <button key={key} onClick={() => setSubFilter(key)} style={{
                  padding: '6px 14px', borderRadius: 999, fontSize: 13, fontWeight: 500, cursor: 'pointer',
                  background: active ? '#00C2A8' : 'transparent',
                  color: active ? '#fff' : '#00C2A8',
                  border: '1.5px solid #00C2A8',
                  fontFamily: 'inherit',
                }}>
                  {label}
                </button>
              );
            })}
          </div>

          {filteredPending.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 24px', background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0' }}>
              <p style={{ fontSize: 16, fontWeight: 600, color: '#0B1E3D', margin: '0 0 6px' }}>No pending cycles.</p>
              <p style={{ fontSize: 14, color: '#5A6A7A', margin: 0 }}>
                {subFilter !== 'all' ? 'Try changing the time filter.' : 'Accept a request to see it here.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filteredPending.map((cycle) => (
                <PendingCard
                  key={cycle.id}
                  cycle={cycle}
                  onViewDetails={handleViewDetails}
                  onCancelRequest={(id) => setCancelTarget(cycles.find((r) => r.id === id) ?? null)}
                />
              ))}
            </div>
          )}
        </div>
      )}

     
      {/* ── COMPLETED tab ─────────────────────────────────────────────────── */}
      {activeTab === 'completed' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Search + sort */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: '1 1 240px' }}>
              <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
              <input
                type="text"
                placeholder="Search by route or date…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                style={{
                  width: '100%', height: 38, paddingLeft: 36, paddingRight: 12,
                  border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13,
                  color: '#0B1E3D', background: '#fff', outline: 'none',
                }}
              />
            </div>
            <select value={sortKey} onChange={(e) => { setSortKey(e.target.value as SortKey); setPage(1); }} style={SEL}>
              {SORT_OPTIONS.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
            </select>
          </div>

          {filteredCompleted.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 24px', background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0' }}>
              <p style={{ fontSize: 16, fontWeight: 600, color: '#0B1E3D', margin: '0 0 6px' }}>No completed cycles found.</p>
              <p style={{ fontSize: 14, color: '#5A6A7A', margin: 0 }}>{search ? 'Try a different search term.' : 'Completed cycles will appear here.'}</p>
            </div>
          ) : (
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ background: '#EFF7F6', borderBottom: '1px solid #E2E8F0' }}>
                    {['Date range', 'Route', 'Passengers', 'Total earned'].map((h) => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#5A6A7A', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pagedCompleted.map((cycle) => (
                    <tr
                      key={cycle.id}
                      onClick={() => handleViewDetails(cycle.id)}
                      style={{ borderBottom: '1px solid #F8F9FA', cursor: 'pointer', transition: 'background 0.15s' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#EFF7F6')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                      tabIndex={0}
                      role="button"
                      aria-label={`View details for ${cycle.origin.address} → ${cycle.destination.address}`}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleViewDetails(cycle.id); }}
                    >
                      <td style={{ padding: '12px 16px', color: '#5A6A7A', fontSize: 13 }}>
                        {format(new Date(cycle.cycle_start_date), 'dd MMM')} – {format(new Date(cycle.cycle_end_date), 'dd MMM yyyy')}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#0B1E3D', fontWeight: 500 }}>
                        {cycle.origin.address} → {cycle.destination.address}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#5A6A7A' }}>
                        {cycle.passenger_count}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#F5A623', fontWeight: 700 }}>
                        EGP {totalEarnings(cycle).toFixed(0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }} aria-label="Pagination">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                style={{ padding: 8, borderRadius: 8, border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer', color: '#5A6A7A', opacity: page === 1 ? 0.4 : 1 }}
                aria-label="Previous page">
                <ChevronLeft size={15} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => setPage(p)} aria-current={p === page ? 'page' : undefined}
                  style={{ width: 32, height: 32, borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', background: p === page ? '#00C2A8' : '#fff', color: p === page ? '#fff' : '#5A6A7A', border: p === page ? 'none' : '1px solid #E2E8F0' }}>
                  {p}
                </button>
              ))}
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                style={{ padding: 8, borderRadius: 8, border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer', color: '#5A6A7A', opacity: page === totalPages ? 0.4 : 1 }}
                aria-label="Next page">
                <ChevronRight size={15} />
              </button>
            </nav>
          )}
        </div>
      )}

      {/* Cancel dialog */}
      {cancelTarget && (
        <CancelDialog
          cycle={cancelTarget}
          onConfirm={handleCancelConfirm}
          onClose={() => setCancelTarget(null)}
        />
      )}

      {/* Detail modal (read-only for my cycles) */}
      <RequestDetailDrawer
        request={detailRequest}
        driverGender={mockDriver.gender}
        onClose={() => setDetailRequest(null)}
        onAccept={() => {}}
        onReject={() => {}}
        onRaise={handleRaiseOpen}
        readOnly
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
