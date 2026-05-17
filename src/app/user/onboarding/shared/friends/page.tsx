'use client';

import { useRouter } from 'next/navigation';
import { useIntent } from '@/lib/IntentContext';
import OnboardingCard from '@/components/user/onboarding/OnboardingCard';
import WizardProgress from '@/components/user/onboarding/WizardProgress';

export default function FriendsPage() {
  const router = useRouter();
  const { setIntent } = useIntent();

  function chooseCreate() {
    setIntent({ group_action: 'create' });
    router.push('/user/onboarding/shared/friends/create');
  }

  function chooseJoin() {
    setIntent({ group_action: 'join' });
    router.push('/user/onboarding/shared/friends/join');
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
      <div style={{ width: '100%', maxWidth: 680, display: 'flex', alignItems: 'center', marginBottom: 32 }}>
        <button
          onClick={() => router.push('/user/onboarding/shared')}
          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: 14, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6, padding: 0, marginRight: 'auto' }}
        >
          ← Back
        </button>
        <span style={{ fontSize: 18, fontWeight: 800, color: '#00C2A8' }}>[c] commuter</span>
        <div style={{ marginLeft: 'auto', width: 60 }} />
      </div>

      <div style={{ width: '100%', maxWidth: 680 }}>
        <WizardProgress current={3} total={4} />

        <div style={{ marginBottom: 36 }}>
          <h1 style={{ color: '#fff', fontSize: 26, fontWeight: 700, margin: 0, marginBottom: 8 }}>
            Create a group or join one
          </h1>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <OnboardingCard
            icon="🔑"
            title="Create a group"
            description="Start a new group for this cycle. You'll get a code to share with your friends so they can join."
            ctaLabel="Create group"
            onClick={chooseCreate}
          />

          <OnboardingCard
            icon="📩"
            title="Join a group"
            description="Someone already created a group for your cycle. Enter the code they sent you to join."
            ctaLabel="Enter group code"
            onClick={chooseJoin}
          />
        </div>
      </div>
    </div>
  );
}
