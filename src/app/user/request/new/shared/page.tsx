'use client';

import { useRouter } from 'next/navigation';
import { useWizard } from '@/lib/RequestWizardContext';

export default function SharedTypePage() {
  const router = useRouter();
  const { setGroupType } = useWizard();

  function handleFriends() {
    setGroupType('friends');
    router.push('/user/request/new/friends');
  }

  function handleOpen() {
    setGroupType('open');
    router.push('/user/request/schedule');
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
          Shared ride
        </h1>
        <p style={{ fontSize: 15, color: '#5A6A7A' }}>
          Who do you want to travel with?
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          width: '100%',
          maxWidth: 400,
        }}
      >
        <button
          onClick={handleFriends}
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
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="18" cy="18" r="18" fill="#E6FAF8" />
              {/* Person 1 */}
              <circle cx="13" cy="14" r="3" fill="#00C2A8" />
              <path d="M7 24c0-3.314 2.686-5 6-5s6 1.686 6 5" stroke="#00C2A8" strokeWidth="1.8" strokeLinecap="round" fill="none" />
              {/* Person 2 */}
              <circle cx="23" cy="14" r="3" fill="#00C2A8" opacity="0.6" />
              <path d="M17 24c0-3.314 2.686-5 6-5s6 1.686 6 5" stroke="#00C2A8" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.6" />
              {/* Link dot */}
              <circle cx="18" cy="20" r="1.5" fill="#00C2A8" />
            </svg>
          </div>
          <div>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#0B1E3D', marginBottom: 4, marginTop: 0 }}>
              Friends group
            </p>
            <p style={{ fontSize: 13, color: '#5A6A7A', lineHeight: 1.55, margin: 0 }}>
              Create a private group and share a code with your friends.
            </p>
          </div>
        </button>

        <button
          onClick={handleOpen}
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
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="18" cy="18" r="18" fill="#EEF2FF" />
              {/* Globe outline */}
              <circle cx="18" cy="18" r="8" stroke="#4F6EF7" strokeWidth="1.8" fill="none" />
              {/* Latitude lines */}
              <path d="M10 18 Q14 15 18 18 Q22 21 26 18" stroke="#4F6EF7" strokeWidth="1.4" fill="none" strokeLinecap="round" />
              {/* Vertical axis */}
              <line x1="18" y1="10" x2="18" y2="26" stroke="#4F6EF7" strokeWidth="1.4" strokeLinecap="round" />
              {/* Route dot */}
              <circle cx="18" cy="18" r="2" fill="#4F6EF7" />
            </svg>
          </div>
          <div>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#0B1E3D', marginBottom: 4, marginTop: 0 }}>
              Open match
            </p>
            <p style={{ fontSize: 13, color: '#5A6A7A', lineHeight: 1.55, margin: 0 }}>
              Get matched with other commuters on your route automatically.
            </p>
          </div>
        </button>
      </div>
    </div>
  );
}
