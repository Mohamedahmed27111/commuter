'use client';

import { useEffect, useRef, useState } from 'react';
import type { DriverCycleRequest } from '@/types/driver';
import PickupMap from './PickupMap';
import { X } from 'lucide-react';
import { formatDate } from '@/lib/timeUtils';

interface RequestDetailModalProps {
  request: DriverCycleRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onRaise: (id: string) => void;
  readOnly?: boolean;
}

const STATUS_CONFIG: Record<string, { label: string; classes: string }> = {
  available:      { label: 'Available',     classes: 'bg-green-100 text-green-700' },
  submitted:      { label: 'Submitted',     classes: 'bg-amber-100 text-amber-700' },
  matching:       { label: 'Matching',      classes: 'bg-amber-100 text-amber-700' },
  driver_offered: { label: 'Offer sent',    classes: 'bg-secondary-lt text-secondary' },
  price_raised:   { label: 'Price raised',  classes: 'bg-amber-100 text-amber-700' },
  confirmed:      { label: 'Confirmed',     classes: 'bg-secondary-lt text-secondary' },
  active:         { label: 'Active',        classes: 'bg-secondary-lt text-secondary' },
  completed:      { label: 'Completed',     classes: 'bg-primary/10 text-primary' },
  cancelled:      { label: 'Cancelled',     classes: 'bg-red-50 text-danger' },
};

export default function RequestDetailModal({
  request,
  isOpen,
  onClose,
  onAccept,
  onReject,
  onRaise,
  readOnly = false,
}: RequestDetailModalProps) {
  const [loading, setLoading] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Focus trap
  useEffect(() => {
    if (isOpen) {
      closeRef.current?.focus();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen || !request) return null;

  const {
    id, status,
    cycle_start_date, cycle_end_date,
    origin, destination,
    distance_km, trip_type, passenger_count,
    base_price, offered_price,
    duration_minutes, pickup_points,
    departure_from,
  } = request;

  const statusCfg = STATUS_CONFIG[status] ?? { label: status, classes: 'bg-gray-100 text-gray-600' };

  async function handleAction(action: 'accept' | 'reject' | 'raise') {
    setLoading(true);
    try {
      if (action === 'accept') await Promise.resolve(onAccept(id));
      else if (action === 'reject') await Promise.resolve(onReject(id));
      else await Promise.resolve(onRaise(id));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-label={`Request detail: ${origin.address} to ${destination.address}`}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="bg-white w-full sm:max-w-[680px] sm:rounded-lg max-h-[96vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-primary font-bold text-lg">Request Detail</h2>
            <p className="text-text-muted text-xs mt-0.5">
              Cycle · {formatDate(cycle_start_date)} – {formatDate(cycle_end_date)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusCfg.classes}`}>
              {statusCfg.label}
            </span>
            <button
              ref={closeRef}
              onClick={onClose}
              className="text-text-muted hover:text-primary rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary p-1"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
          {/* Section A — Trip summary */}
          <section aria-labelledby="modal-summary-heading">
            <h3 id="modal-summary-heading" className="text-sm font-semibold text-primary mb-3 uppercase tracking-wider">
              Trip Summary
            </h3>
            <div className="bg-secondary-lt rounded-md p-4 space-y-3">
              <div className="flex items-center gap-2 text-primary font-semibold">
                <span aria-hidden="true">📍</span>
                <span>{origin.address}</span>
                <span className="text-text-muted font-normal">→</span>
                <span>{destination.address}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div>
                  <p className="text-text-muted text-xs">Distance</p>
                  <p className="font-semibold text-primary">{distance_km} km</p>
                </div>
                <div>
                  <p className="text-text-muted text-xs">Trip type</p>
                  <p className="font-semibold text-primary capitalize">{trip_type === 'round_trip' ? 'Round trip' : 'One way'}</p>
                </div>
                <div>
                  <p className="text-text-muted text-xs">Passengers</p>
                  <p className="font-semibold text-primary">{passenger_count}</p>
                </div>
                <div>
                  <p className="text-text-muted text-xs">Duration</p>
                  <p className="font-semibold text-primary">{duration_minutes} min</p>
                </div>
              </div>
              <div className="flex gap-6 text-sm">
                <div>
                  <p className="text-text-muted text-xs">Base price</p>
                  <p className="font-bold text-primary">EGP {base_price}</p>
                </div>
                {offered_price != null && (
                  <div>
                    <p className="text-text-muted text-xs">Offered price</p>
                    <p className="font-bold text-accent">EGP {offered_price}</p>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Section B — Passenger breakdown */}
          <section aria-labelledby="modal-passengers-heading">
            <h3 id="modal-passengers-heading" className="text-sm font-semibold text-primary mb-3 uppercase tracking-wider">
              Passenger Breakdown
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[500px]">
                <thead>
                  <tr className="text-left border-b border-gray-100">
                    <th className="pb-2 text-text-muted font-medium text-xs">Passenger</th>
                    <th className="pb-2 text-text-muted font-medium text-xs">Pickup address</th>
                    <th className="pb-2 text-text-muted font-medium text-xs">Pickup time</th>
                    <th className="pb-2 text-text-muted font-medium text-xs">Offset</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {pickup_points.map((pt, i) => (
                    <tr key={pt.passenger_id}>
                      <td className="py-2.5 pr-3">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-secondary text-white text-xs font-bold flex items-center justify-center flex-shrink-0" aria-hidden="true">
                            {i + 1}
                          </span>
                          <span className="font-medium text-primary">{pt.passenger_name}</span>
                        </div>
                      </td>
                      <td className="py-2.5 pr-3 text-text-muted">{pt.address}</td>
                      <td className="py-2.5 pr-3 text-primary font-medium">
                        {departure_from ?? '—'}
                      </td>
                      <td className="py-2.5 text-text-muted text-xs">
                        {i === 0 ? '— first stop' : `+${pt.pickup_time_offset} min`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Section C — Pickup map */}
          <section aria-labelledby="modal-map-heading">
            <h3 id="modal-map-heading" className="text-sm font-semibold text-primary mb-3 uppercase tracking-wider">
              Pickup Map
            </h3>
            <PickupMap pickupPoints={pickup_points} destination={destination} />
          </section>
        </div>

        {/* Section D — Sticky action bar */}
        {!readOnly && (
          <div className="px-5 py-4 border-t border-gray-100 bg-white flex flex-col sm:flex-row gap-2 sm:justify-end">
            <button
              onClick={() => handleAction('reject')}
              disabled={loading}
              className="px-4 py-2 rounded-md border border-danger text-danger text-sm font-medium hover:bg-red-50 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-danger transition-colors"
              aria-label="Reject request"
            >
              Reject
            </button>
            <button
              onClick={() => handleAction('raise')}
              disabled={loading}
              className="px-4 py-2 rounded-md border border-accent text-accent text-sm font-medium hover:bg-amber-50 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-colors"
              aria-label="Raise price"
            >
              Raise price
            </button>
            <button
              onClick={() => handleAction('accept')}
              disabled={loading}
              className="px-4 py-2 rounded-md bg-secondary text-primary text-sm font-semibold hover:bg-secondary/90 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary transition-colors"
              aria-label="Accept request"
            >
              {loading ? 'Processing…' : 'Accept'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
