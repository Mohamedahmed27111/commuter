'use client';

import { useRouter } from 'next/navigation';
import { useIntent } from '@/lib/IntentContext';
import OnboardingCard from '@/components/user/onboarding/OnboardingCard';
import WizardProgress from '@/components/user/onboarding/WizardProgress';

export default function OnboardingPage() {
  const router = useRouter();
  const { setIntent, resetIntent } = useIntent();

  function choosePrivate() {
    resetIntent();
    setIntent({ ride_type: 'private' });
    router.push('/user/onboarding/private');
  }

  function chooseShared() {
    resetIntent();
    setIntent({ ride_type: 'shared' });
    router.push('/user/onboarding/shared');
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
      {/* Brand */}
      <div style={{ marginBottom: 48, textAlign: 'center' }}>
        <span style={{ fontSize: 28, fontWeight: 800, color: '#00C2A8', letterSpacing: '-0.5px' }}>
          [c] commuter
        </span>
      </div>

      <WizardProgress current={1} total={2} />

      {/* Heading */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h1 style={{ color: '#fff', fontSize: 28, fontWeight: 700, margin: 0, marginBottom: 8 }}>
          How would you like to travel?
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 16, margin: 0 }}>
          Choose the type of ride that fits your needs
        </p>
      </div>

      {/* Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 20,
        width: '100%',
        maxWidth: 680,
      }}>
        <OnboardingCard
          icon="🚗"
          title="Private ride"
          description="The whole car is yours. Bring up to 3 friends or travel alone."
          bullets={[
            'Up to 4 people total',
            'Add stop points',
            'Higher price',
          ]}
          ctaLabel="Choose Private"
          onClick={choosePrivate}
        />

        <OnboardingCard
          icon="🧑‍🤝‍🧑"
          title="Shared ride"
          description="Share the ride and split the cost with others."
          bullets={[
            'Up to 3 passengers',
            'Fixed route only',
            'Lower price',
          ]}
          ctaLabel="Choose Shared"
          onClick={chooseShared}
        />
      </div>
    </div>
  );
}
