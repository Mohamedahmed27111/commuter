'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import type { UserRequest, RequestStatus } from '@/types/user';
import { mockRequests } from '@/lib/mockUser';
import RequestStatusCard from '@/components/user/my-requests/RequestStatusCard';
import PriceRaisedBanner from '@/components/user/request/PriceRaisedBanner';
import EmptyState from '@/components/shared/EmptyState';
import { useTranslations } from 'next-intl';

type Tab = 'active' | 'pending' | 'completed' | 'cancelled';

const ACTIVE_STATUSES: RequestStatus[] = [
  'submitted', 'matching', 'driver_offered', 'price_raised', 'confirmed', 'active',
];
const PENDING_STATUSES: RequestStatus[] = ['submitted', 'matching'];

function filterByTab(requests: UserRequest[], tab: Tab): UserRequest[] {
  switch (tab) {
    case 'active': return requests.filter((r) => ACTIVE_STATUSES.includes(r.status));
    case 'pending': return requests.filter((r) => PENDING_STATUSES.includes(r.status));
    case 'completed': return requests.filter((r) => r.status === 'completed');
    case 'cancelled': return requests.filter((r) => r.status === 'cancelled');
  }
}

export default function MyRequestsPage() {
  const t = useTranslations('my_requests');
  const [requests, setRequests] = useState<UserRequest[]>(mockRequests);
  const [activeTab, setActiveTab] = useState<Tab>('active');

  const priceRaisedRequests = requests.filter((r) => r.status === 'price_raised');
  const filtered = filterByTab(requests, activeTab);

  const tabCounts: Record<Tab, number> = {
    active: filterByTab(requests, 'active').length,
    pending: filterByTab(requests, 'pending').length,
    completed: filterByTab(requests, 'completed').length,
    cancelled: filterByTab(requests, 'cancelled').length,
  };

  function handleCancel(id: string) {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'cancelled' as RequestStatus } : r))
    );
    toast.success(t('toast_cancelled'));
  }

  function handleAcceptPrice(id: string) {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: 'confirmed' as RequestStatus, base_price: r.offered_price ?? r.base_price } : r
      )
    );
    toast.success(t('toast_confirmed'));
  }

  function handleDeclinePrice(id: string) {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: 'matching' as RequestStatus, offered_price: undefined } : r
      )
    );
    toast(t('toast_finding_driver'), { icon: '🔍' });
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: 'active',    label: t('tab_active') },
    { key: 'pending',   label: t('tab_pending') },
    { key: 'completed', label: t('tab_completed') },
    { key: 'cancelled', label: t('tab_cancelled') },
  ];

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <style>{`
        .req-tab { padding: 8px 14px; border: none; background: none; cursor: pointer; font-family: inherit; font-size: 14px; font-weight: 500; color: #5A6A7A; border-bottom: 2px solid transparent; transition: all 0.15s; white-space: nowrap; min-height: 44px; }
        .req-tab.active { color: #00C2A8; border-bottom-color: #00C2A8; font-weight: 700; }
        .req-tab:hover:not(.active) { color: #0B1E3D; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 24, fontWeight: 700, color: '#0B1E3D' }}>
          {t('page_title')}
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: '#5A6A7A' }}>
          {t('page_subtitle')}
        </p>
      </div>

      {/* Price raised banner — above tabs */}
      {priceRaisedRequests.map((r) => (
        <PriceRaisedBanner
          key={r.id}
          request={r}
          onAccept={() => handleAcceptPrice(r.id)}
          onDecline={() => handleDeclinePrice(r.id)}
        />
      ))}

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid #E2E8F0',
          overflowX: 'auto',
          marginBottom: 20,
          gap: 0,
        }}
      >
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            className={`req-tab${activeTab === key ? ' active' : ''}`}
            onClick={() => setActiveTab(key)}
          >
            {label}
            {tabCounts[key] > 0 && (
              <span
                style={{
                  marginLeft: 6,
                  background: activeTab === key ? '#00C2A8' : '#E2E8F0',
                  color: activeTab === key ? '#0B1E3D' : '#5A6A7A',
                  fontSize: 11,
                  fontWeight: 700,
                  borderRadius: 10,
                  padding: '1px 6px',
                }}
              >
                {tabCounts[key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Request list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.length === 0 ? (
          <EmptyState
            icon={activeTab === 'completed' ? '🏁' : activeTab === 'cancelled' ? '❌' : '📋'}
            title={
              activeTab === 'active'
                ? t('empty_active')
                : activeTab === 'pending'
                ? t('empty_pending')
                : activeTab === 'completed'
                ? t('empty_completed')
                : t('empty_cancelled')
            }
            description={
              activeTab === 'active' || activeTab === 'pending'
                ? t('empty_active_desc')
                : undefined
            }
          />
        ) : (
          filtered.map((r) => (
            <RequestStatusCard
              key={r.id}
              request={r}
              onCancel={handleCancel}
            />
          ))
        )}
      </div>
    </div>
  );
}
