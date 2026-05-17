'use client';

import { useRouter } from 'next/navigation';
import { useWizard } from '@/lib/RequestWizardContext';

// ── Custom SVG icons ──────────────────────────────────────────────────────────

function CreateGroupIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Background circle */}
      <circle cx="18" cy="18" r="18" fill="#E6FAF8" />
      {/* Person 1 (left) */}
      <circle cx="13" cy="14" r="3" fill="#00C2A8" />
      <path d="M7 24c0-3.314 2.686-5 6-5s6 1.686 6 5" stroke="#00C2A8" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      {/* Plus sign (right, teal) */}
      <circle cx="25" cy="14" r="5" fill="#00C2A8" />
      <line x1="25" y1="11" x2="25" y2="17" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="22" y1="14" x2="28" y2="14" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function JoinGroupIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Background circle */}
      <circle cx="18" cy="18" r="18" fill="#EEF2FF" />
      {/* Two people (group) */}
      <circle cx="14" cy="13" r="3" fill="#4F6EF7" />
      <path d="M8 23c0-3.314 2.686-5 6-5s6 1.686 6 5" stroke="#4F6EF7" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      {/* Arrow entering from right */}
      <line x1="22" y1="18" x2="29" y2="18" stroke="#4F6EF7" strokeWidth="1.8" strokeLinecap="round" />
      <polyline points="26,15 29,18 26,21" stroke="#4F6EF7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* Vertical door line */}
      <line x1="22" y1="13" x2="22" y2="23" stroke="#4F6EF7" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function FriendsGroupPage() {
  const router = useRouter();
  const { setGroupAction } = useWizard();

  function handleCreate() {
    setGroupAction('create');
    router.push('/user/request/new/friends/create');
  }

  function handleJoin() {
    setGroupAction('join');
    router.push('/user/request/new/friends/join');
  }

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 64px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        fontFamily: 'Inter, system-ui, sans-serif',
        position: 'relative',
      }}
    >
      <button
        onClick={() => router.back()}
        style={{
          position: 'absolute',
          top: 80,
          left: 24,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: '#5A6A7A',
          fontSize: 14,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontFamily: 'inherit',
        }}
      >
        ← Back
      </button>

      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#0B1E3D', marginBottom: 8 }}>
          Friends group
        </h1>
        <p style={{ fontSize: 15, color: '#5A6A7A' }}>
          Create a new group or join an existing one?
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          width: '100%',
          maxWidth: 480,
        }}
      >
        {/* ── Create a group ── */}
        <button
          onClick={handleCreate}
          style={{
            background: '#fff',
            border: '1.5px solid #E2E8F0',
            borderRadius: 16,
            padding: '20px 24px',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'border-color 0.2s, box-shadow 0.2s',
            fontFamily: 'inherit',
            display: 'flex',
            alignItems: 'center',
            gap: 18,
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = '#00C2A8';
            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 16px rgba(0,194,168,0.12)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = '#E2E8F0';
            (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
          }}
        >
          <div style={{ flexShrink: 0 }}>
            <CreateGroupIcon />
          </div>
          <div>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#0B1E3D', marginBottom: 4, marginTop: 0 }}>
              Create a group
            </p>
            <p style={{ fontSize: 13, color: '#5A6A7A', lineHeight: 1.55, margin: 0 }}>
              Start a new friends group and share the code so your friends can join your commute.
            </p>
          </div>
        </button>

        {/* ── Join a group ── */}
        <button
          onClick={handleJoin}
          style={{
            background: '#fff',
            border: '1.5px solid #E2E8F0',
            borderRadius: 16,
            padding: '20px 24px',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'border-color 0.2s, box-shadow 0.2s',
            fontFamily: 'inherit',
            display: 'flex',
            alignItems: 'center',
            gap: 18,
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = '#4F6EF7';
            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 16px rgba(79,110,247,0.10)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = '#E2E8F0';
            (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
          }}
        >
          <div style={{ flexShrink: 0 }}>
            <JoinGroupIcon />
          </div>
          <div>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#0B1E3D', marginBottom: 4, marginTop: 0 }}>
              Join a group
            </p>
            <p style={{ fontSize: 13, color: '#5A6A7A', lineHeight: 1.55, margin: 0 }}>
              Enter a code from a friend to join their existing commute group.
            </p>
          </div>
        </button>
      </div>
    </div>
  );
}
