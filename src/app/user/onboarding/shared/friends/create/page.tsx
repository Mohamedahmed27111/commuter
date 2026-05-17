'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useIntent } from '@/lib/IntentContext';
import { generateGroupCode } from '@/lib/groupCode';
import WizardProgress from '@/components/user/onboarding/WizardProgress';

export default function CreateGroupPage() {
  const router = useRouter();
  const { setIntent } = useIntent();

  const [code, setCode] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const generated = generateGroupCode();
    setCode(generated);
    setIntent({ group_code: generated });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: select and copy
    }
  }

  async function handleShare() {
    if (navigator.share) {
      await navigator.share({
        title: 'Join my commuter group',
        text: `Use code ${code} to join my commuter group on Commuter.`,
      });
    } else {
      handleCopy();
    }
  }

  function handleContinue() {
    router.push('/user/onboarding/shared/friends/create/plan');
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0B1E3D',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      {/* Back + Brand */}
      <div style={{ width: '100%', maxWidth: 560, display: 'flex', alignItems: 'center', marginBottom: 32 }}>
        <button
          onClick={() => router.push('/user/onboarding/shared/friends')}
          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: 14, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6, padding: 0, marginRight: 'auto' }}
        >
          ← Back
        </button>
        <span style={{ fontSize: 18, fontWeight: 800, color: '#00C2A8' }}>[c] commuter</span>
        <div style={{ marginLeft: 'auto', width: 60 }} />
      </div>

      <div style={{ width: '100%', maxWidth: 560 }}>
        <WizardProgress current={4} total={4} />

        <h1 style={{ color: '#fff', fontSize: 26, fontWeight: 700, margin: 0, marginBottom: 8 }}>
          Your group code
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 15, margin: '0 0 28px' }}>
          Share this code with your friends so they can join your group.
        </p>

        {/* Code card */}
        <div style={{ background: '#1C3557', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 32 }}>
          {/* Code display */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{
              fontSize: 48,
              fontWeight: 800,
              color: '#00C2A8',
              letterSpacing: 8,
              lineHeight: 1,
              marginBottom: 8,
            }}>
              {code}
            </div>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, margin: 0 }}>
              7 characters · uppercase
            </p>
          </div>

          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14, margin: '0 0 20px', textAlign: 'center' }}>
            They enter it to join your group.
          </p>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 28 }}>
            <button
              onClick={handleCopy}
              style={{
                flex: 1, height: 44, borderRadius: 10, border: '1.5px solid rgba(255,255,255,0.2)',
                background: 'transparent', color: '#fff', fontWeight: 600, fontSize: 14,
                cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              {copied ? '✓ Copied!' : '📋 Copy code'}
            </button>
            <button
              onClick={handleShare}
              style={{
                flex: 1, height: 44, borderRadius: 10, border: '1.5px solid rgba(255,255,255,0.2)',
                background: 'transparent', color: '#fff', fontWeight: 600, fontSize: 14,
                cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              📤 Share
            </button>
          </div>

          {/* Member slots */}
          <div>
            <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
              Group members (1/3 joined)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Creator */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#00C2A8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
                  ✓
                </div>
                <span style={{ color: '#fff', fontSize: 14, fontWeight: 500 }}>You (group creator)</span>
              </div>
              {/* Empty slots */}
              {[0, 1].map((i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px dashed rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
                  <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14 }}>Waiting for friends…</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Continue CTA */}
        <button
          onClick={handleContinue}
          style={{
            width: '100%', marginTop: 20, height: 52, borderRadius: 12, border: 'none',
            background: '#00C2A8', color: '#0B1E3D', fontWeight: 700, fontSize: 16,
            cursor: 'pointer', fontFamily: 'inherit',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9'; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
        >
          Continue to plan the ride →
        </button>
      </div>
    </div>
  );
}
