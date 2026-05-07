'use client';

import { useTranslations } from 'next-intl';
import type { UserRequest } from '@/types/user';
import BottomSheet from '@/components/shared/BottomSheet';

interface CancelRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: UserRequest;
  onConfirm: () => void;
}

export default function CancelRequestModal({
  isOpen,
  onClose,
  request,
  onConfirm,
}: CancelRequestModalProps) {
  const t = useTranslations('my_requests');
  const hasDriver = ['confirmed', 'active', 'driver_offered', 'price_raised'].includes(request.status);

  const content = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#0B1E3D' }}>
        {t('cancel_modal_title')}
      </div>

      <div style={{ fontSize: 14, color: '#5A6A7A' }}>
        <strong style={{ color: '#0B1E3D' }}>{request.origin.address}</strong>
        {' → '}
        <strong style={{ color: '#0B1E3D' }}>{request.destination.address}</strong>
        <br />
        {request.days.join(', ')} · {request.departure_from ?? ''}
      </div>

      <div
        style={{
          background: '#FFF8E1',
          borderLeft: '4px solid #F57F17',
          borderRadius: 8,
          padding: '10px 14px',
          fontSize: 13,
          color: '#0B1E3D',
        }}
      >
        {hasDriver ? (
          <>
            <strong>⚠ {t('cancel_after_title')}</strong>
            <br />{t('cancel_after_body')}
          </>
        ) : (
          <>
            <strong>⚠ {t('cancel_before_title')}</strong>
            <br />{t('cancel_before_body')}
          </>
        )}
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={onClose}
          style={{
            flex: 1,
            padding: '12px',
            border: '1.5px solid #E2E8F0',
            borderRadius: 10,
            background: '#fff',
            color: '#0B1E3D',
            fontWeight: 600,
            fontSize: 14,
            cursor: 'pointer',
            fontFamily: 'inherit',
            minHeight: 48,
          }}
        >
          {t('cancel_keep_btn')}
        </button>
        <button
          onClick={onConfirm}
          style={{
            flex: 1,
            padding: '12px',
            border: 'none',
            borderRadius: 10,
            background: '#E74C3C',
            color: '#fff',
            fontWeight: 700,
            fontSize: 14,
            cursor: 'pointer',
            fontFamily: 'inherit',
            minHeight: 48,
          }}
        >
          {t('cancel_confirm_btn')}
        </button>
      </div>
    </div>
  );

  // Mobile: bottom sheet; Desktop: inline modal
  return (
    <>
      {/* Desktop modal */}
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
                width: 440,
                maxWidth: '90vw',
                boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
              }}
            >
              {content}
            </div>
          </>
        )}
      </div>

      {/* Mobile bottom sheet */}
      <div className="md:hidden">
        <BottomSheet isOpen={isOpen} onClose={onClose} title={t('cancel_sheet_title')}>
          {content}
        </BottomSheet>
      </div>
    </>
  );
}
