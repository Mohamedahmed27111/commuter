'use client';

import { useState, useEffect, useCallback } from 'react';
import type { UserRequest } from '@/types/user';
import BottomSheet from '@/components/shared/BottomSheet';

interface PriceRaisedBannerProps {
  request: UserRequest;
  onAccept: () => void;
  onDecline: () => void;
}

function formatCountdown(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function PriceRaisedModal({
  isOpen,
  onClose,
  request,
  onAccept,
  onDecline,
}: {
  isOpen: boolean;
  onClose: () => void;
  request: UserRequest;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const OFFER_DURATION = 24 * 60 * 60; // 24h in seconds
  const [secondsLeft, setSecondsLeft] = useState(OFFER_DURATION);

  const tick = useCallback(() => {
    setSecondsLeft((s) => {
      if (s <= 1) {
        onDecline();
        return 0;
      }
      return s - 1;
    });
  }, [onDecline]);

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [isOpen, tick]);

  const content = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div style={{ fontSize: 13, color: '#5A6A7A', marginBottom: 2 }}>Route</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#0B1E3D' }}>
          {request.origin.address} → {request.destination.address}
        </div>
        <div style={{ fontSize: 13, color: '#5A6A7A', marginTop: 4 }}>
          {request.days.join(', ')} · {request.departure_time} ·{' '}
          {request.trip_type === 'one_way' ? 'One way' : 'Round trip'}
        </div>
      </div>

      {/* Price comparison */}
      <div
        style={{
          background: '#F8F9FA',
          borderRadius: 10,
          padding: 14,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
          <span style={{ color: '#5A6A7A' }}>Original price</span>
          <span style={{ fontWeight: 600, color: '#0B1E3D' }}>
            EGP {request.base_price} / week
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15 }}>
          <span style={{ color: '#5A6A7A' }}>New price</span>
          <span style={{ fontWeight: 700, color: '#F57F17' }}>
            EGP {request.offered_price} / week
            <span style={{ fontSize: 12, marginLeft: 6, color: '#5A6A7A' }}>
              (+{Math.round(((request.offered_price! - request.base_price) / request.base_price) * 100)}%)
            </span>
          </span>
        </div>
      </div>

      {/* Driver info */}
      {request.driver_name && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 14px',
            background: '#EFF7F6',
            borderRadius: 10,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: '#0B1E3D',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#00C2A8',
              fontWeight: 700,
              fontSize: 14,
              flexShrink: 0,
            }}
          >
            {request.driver_name[0]}
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0B1E3D' }}>
              {request.driver_name}
            </div>
            {request.driver_rating && (
              <div style={{ fontSize: 12, color: '#5A6A7A' }}>
                ★ {request.driver_rating}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Countdown */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 14px',
          background: '#FFF8E1',
          borderRadius: 8,
          fontSize: 14,
        }}
      >
        <span>⏳</span>
        <span style={{ color: '#0B1E3D' }}>
          Offer expires in{' '}
          <strong style={{ fontVariantNumeric: 'tabular-nums' }}>
            {formatCountdown(secondsLeft)}
          </strong>
        </span>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button
          onClick={onDecline}
          style={{
            width: '100%',
            padding: '12px',
            border: '1.5px solid #E2E8F0',
            borderRadius: 10,
            background: '#fff',
            color: '#5A6A7A',
            fontWeight: 600,
            fontSize: 14,
            cursor: 'pointer',
            fontFamily: 'inherit',
            minHeight: 48,
          }}
        >
          Decline — find another driver
        </button>
        <button
          onClick={onAccept}
          style={{
            width: '100%',
            padding: '12px',
            border: 'none',
            borderRadius: 10,
            background: '#00C2A8',
            color: '#0B1E3D',
            fontWeight: 700,
            fontSize: 14,
            cursor: 'pointer',
            fontFamily: 'inherit',
            minHeight: 48,
          }}
        >
          Accept new price
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div className="hidden md:block">
        {isOpen && (
          <>
            <div
              onClick={onClose}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.45)',
                zIndex: 200,
              }}
            />
            <div
              style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%,-50%)',
                zIndex: 201,
                background: '#fff',
                borderRadius: 16,
                padding: 28,
                width: 480,
                maxWidth: '90vw',
                boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0B1E3D' }}>
                  Driver&apos;s new price offer
                </h3>
                <button
                  onClick={onClose}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, color: '#5A6A7A', minWidth: 44, minHeight: 44 }}
                >
                  ✕
                </button>
              </div>
              {content}
            </div>
          </>
        )}
      </div>
      <div className="md:hidden">
        <BottomSheet isOpen={isOpen} onClose={onClose} title="Driver's new price offer">
          {content}
        </BottomSheet>
      </div>
    </>
  );
}

export default function PriceRaisedBanner({
  request,
  onAccept,
  onDecline,
}: PriceRaisedBannerProps) {
  const [modalOpen, setModalOpen] = useState(false);

  function handleAccept() {
    setModalOpen(false);
    onAccept();
  }

  function handleDecline() {
    setModalOpen(false);
    onDecline();
  }

  return (
    <>
      <div
        style={{
          background: '#FFF8E1',
          borderLeft: '4px solid #F57F17',
          borderRadius: 8,
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          marginBottom: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <span style={{ fontSize: 18 }}>⚠️</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#0B1E3D' }}>
              A driver has offered a new price for one of your rides
            </div>
            <div style={{ fontSize: 13, color: '#5A6A7A', marginTop: 2 }}>
              {request.origin.address} → {request.destination.address} ·{' '}
              <strong style={{ color: '#F57F17' }}>EGP {request.offered_price}/week</strong>
              {' '}(was EGP {request.base_price})
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={() => setModalOpen(true)}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: 8,
              background: '#F57F17',
              color: '#fff',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              fontFamily: 'inherit',
              minHeight: 40,
            }}
          >
            Review offer
          </button>
        </div>
      </div>

      <PriceRaisedModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        request={request}
        onAccept={handleAccept}
        onDecline={handleDecline}
      />
    </>
  );
}
