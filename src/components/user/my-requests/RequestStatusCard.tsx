'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { UserRequest } from '@/types/user';
import StatusPill from '@/components/shared/StatusPill';
import StatusTimeline from './StatusTimeline';
import CancelRequestModal from './CancelRequestModal';
import CycleDaysAccordion from './CycleDaysAccordion';
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
  const t = useTranslations('my_requests');
  const [expanded, setExpanded] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  const canCancel = !['completed', 'cancelled'].includes(request.status);
  const canViewDetails = ['confirmed', 'active', 'completed'].includes(request.status);

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
          <span>{request.trip_type === 'one_way' ? t('one_way') : t('round_trip')}</span>
          <span>·</span>
          {request.seat_preference !== 'any' && (
            <>
              <SeatBadge seat={request.seat_preference} />
              <span>·</span>
            </>
          )}
          <span>{request.days.join(' ')}</span>
          <span>·</span>
          <span>{formatTimeWindow(request.arrival_from ?? '', request.arrival_to ?? '')}</span>
        </div>

        {/* Status timeline */}
        <StatusTimeline status={request.status} />

        {/* Cycle days — shown in "View details" for confirmed / active / completed */}
        {expanded && canViewDetails && (
          <div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: '#5A6A7A',
                marginBottom: 8,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Trip Schedule
            </div>
            <CycleDaysAccordion
              days={request.cycle_days ?? []}
              driverName={request.driver_name}
            />
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          {request.today_trip_id && request.status === 'active' && (
            <Link
              href={`/user/trip/${request.today_trip_id}`}
              style={{
                padding: '8px 14px',
                border: 'none',
                borderRadius: 8,
                background: '#0B1E3D',
                color: '#fff',
                fontWeight: 700,
                fontSize: 13,
                textDecoration: 'none',
                minHeight: 36,
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              Live trip
            </Link>
          )}
          {canViewDetails && (
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
              {expanded ? t('hide_details') : t('view_details')}
            </button>
          )}
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
              {t('cancel_btn')}
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
