'use client';

import { useState } from 'react';
import type { UserRequest } from '@/types/user';
import StatusPill from '@/components/shared/StatusPill';
import StatusTimeline from './StatusTimeline';
import CoPassengerCard from './CoPassengerCard';
import CancelRequestModal from './CancelRequestModal';
import { formatTimeWindow } from '@/lib/timeUtils';

interface RequestStatusCardProps {
  request: UserRequest;
  onCancel: (id: string) => void;
  onViewDetails?: (id: string) => void;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-EG', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });
}

function SeatBadge({ seat }: { seat: UserRequest['seat_preference'] }) {
  if (seat === 'any') return null;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 11,
        background: '#FFF8E1',
        border: '1px solid #F9C74F',
        color: '#7a4d00',
        borderRadius: 20,
        padding: '1px 8px',
        fontWeight: 500,
      }}
    >
      🚺 {seat.label}
      <span style={{ color: '#9AA0A6' }}>+EGP {seat.extra_cost_egp}/trip</span>
    </span>
  );
}

export default function RequestStatusCard({
  request,
  onCancel,
  onViewDetails,
}: RequestStatusCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  const canCancel = !['completed', 'cancelled'].includes(request.status);
  const showCoPassengers =
    ['confirmed', 'active'].includes(request.status) && request.co_passengers?.length;

  return (
    <>
      <div
        style={{
          background: '#fff',
          borderRadius: 14,
          padding: '16px',
          border: '1px solid #E2E8F0',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <StatusPill status={request.status} />
          <span style={{ fontSize: 12, color: '#5A6A7A', flexShrink: 0 }}>
            {formatDate(request.created_at)}
          </span>
        </div>

        {/* Route */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#0B1E3D' }}>
            {request.origin.address}
          </span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5A6A7A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
          </svg>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#0B1E3D' }}>
            {request.destination.address}
          </span>
        </div>

        {/* Meta */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
            fontSize: 12,
            color: '#5A6A7A',
            alignItems: 'center',
          }}
        >
          <span>{request.distance_km} km</span>
          <span>·</span>
          <span>{request.trip_type === 'one_way' ? 'One way' : 'Round trip'}</span>
          <span>·</span>
          {request.seat_preference !== 'any' && (
            <>
              <SeatBadge seat={request.seat_preference} />
              <span>·</span>
            </>
          )}
          <span>{request.days.join(' ')}</span>
          <span>·</span>
          <span>{formatTimeWindow(request.arrival_from, request.arrival_to)}</span>
        </div>

        {/* Status timeline */}
        <StatusTimeline status={request.status} />

        {/* Driver info */}
        {request.driver_name && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 12px',
              background: '#F8F9FA',
              borderRadius: 8,
              fontSize: 13,
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: '#0B1E3D',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#00C2A8',
                fontWeight: 700,
                fontSize: 11,
                flexShrink: 0,
              }}
            >
              {request.driver_name[0]}
            </div>
            <span style={{ fontWeight: 600, color: '#0B1E3D' }}>{request.driver_name}</span>
            {request.driver_rating && (
              <span style={{ color: '#5A6A7A' }}>★ {request.driver_rating}</span>
            )}
          </div>
        )}

        {/* Co-passengers */}
        {expanded && showCoPassengers && (
          <CoPassengerCard passengers={request.co_passengers!} />
        )}

        {/* Preferences detail — shown when "View details" is expanded */}
        {expanded && (
          <div
            style={{
              background: '#F8F9FA',
              borderRadius: 10,
              overflow: 'hidden',
              border: '1px solid #E2E8F0',
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: '#5A6A7A', padding: '8px 14px 4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Your preferences
            </div>
            {[
              ['Trip type', request.ride_type === 'shared' ? '🧑‍🤝‍🧑 Shared ride' : '🚗 Private'],
              ['Gender preference', request.gender_pref === 'same' ? '♂♀ Same gender' : '♂♀ Mixed'],
              ['Walk to pickup',
                request.walk_minutes === 10 ? '🚶 10 min (~800 m) · -15%' :
                request.walk_minutes === 5  ? '🚶 5 min (~400 m) · -8%' :
                '🚶 No walk (door pickup)'],
            ].map(([label, value], i) => (
              <div
                key={label}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '9px 14px',
                  borderTop: i === 0 ? '1px solid #E2E8F0' : 'none',
                  borderBottom: '1px solid #F1F3F4',
                  fontSize: 13,
                }}
              >
                <span style={{ color: '#5A6A7A' }}>{label}</span>
                <span style={{ color: '#0B1E3D', fontWeight: 600 }}>{value}</span>
              </div>
            ))}
            {/* Seat preference row */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '9px 14px',
                borderBottom: '1px solid #F1F3F4',
                fontSize: 13,
              }}
            >
              <span style={{ color: '#5A6A7A' }}>Seat preference</span>
              {request.seat_preference === 'any' ? (
                <span style={{ color: '#0B1E3D', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                  💺 Any seat
                  <span style={{ fontSize: 11, color: '#166534', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 20, padding: '1px 8px' }}>
                    Free
                  </span>
                </span>
              ) : (
                <span style={{ color: '#0B1E3D', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                  💺 {request.seat_preference.label}
                  <span style={{ fontSize: 11, background: '#FFF8E1', border: '1px solid #F9C74F', color: '#7a4d00', borderRadius: 20, padding: '1px 8px' }}>
                    +EGP {request.seat_preference.extra_cost_egp}/trip
                  </span>
                </span>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          {showCoPassengers && (
            <button
              onClick={() => setExpanded((e) => !e)}
              style={{
                padding: '8px 14px',
                border: '1px solid #E2E8F0',
                borderRadius: 8,
                background: '#fff',
                color: '#00C2A8',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
                fontFamily: 'inherit',
                minHeight: 36,
              }}
            >
              {expanded ? 'Hide co-riders' : 'Co-riders'}
            </button>
          )}
          <button
            onClick={() => { setExpanded((e) => !e); onViewDetails?.(request.id); }}
            style={{
              padding: '8px 14px',
              border: '1px solid #E2E8F0',
              borderRadius: 8,
              background: '#fff',
              color: '#0B1E3D',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
              fontFamily: 'inherit',
              minHeight: 36,
            }}
          >
            {expanded ? 'Hide details' : 'View details'}
          </button>
          {canCancel && (
            <button
              onClick={() => setCancelOpen(true)}
              style={{
                padding: '8px 14px',
                border: '1px solid #FFEBEE',
                borderRadius: 8,
                background: '#FFEBEE',
                color: '#E74C3C',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
                fontFamily: 'inherit',
                minHeight: 36,
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      <CancelRequestModal
        isOpen={cancelOpen}
        onClose={() => setCancelOpen(false)}
        request={request}
        onConfirm={() => {
          setCancelOpen(false);
          onCancel(request.id);
        }}
      />
    </>
  );
}
