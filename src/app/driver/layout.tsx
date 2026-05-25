'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Toaster } from 'react-hot-toast';
import DriverNavbar from '@/components/layout/DriverNavbar';
import DriverBottomNav from '@/components/layout/DriverBottomNav';
import AuthGuard from '@/lib/auth/AuthGuard';
import driverApi from '@/lib/api/driver';

// Redirects to /driver/onboarding if the driver hasn't submitted their profile yet
function OnboardingGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    driverApi.getProfileMe()
      .then(() => setReady(true))
      .catch(() => router.replace('/driver/onboarding'));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!ready) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8F9FA' }}>
        <div style={{ width: 32, height: 32, border: '2px solid #00C2A8', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return <>{children}</>;
}

const shellStyle: React.CSSProperties = {
  minHeight: '100vh',
  background: '#F8F9FA',
  fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
};

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isAuthRoute =
    pathname === '/driver/sign-in' ||
    pathname === '/driver/sign-up' ||
    pathname.startsWith('/driver/sign-in/') ||
    pathname.startsWith('/driver/sign-up/');

  const isTripRoute = pathname.startsWith('/driver/trip/');
  const isOnboarding = pathname === '/driver/onboarding' || pathname.startsWith('/driver/onboarding/');

  // Auth routes never require a session
  if (isAuthRoute) return <>{children}</>;

  if (isTripRoute || isOnboarding) {
    return (
      <AuthGuard role="driver">
        <div style={shellStyle}>
          <Toaster position="top-right" />
          {children}
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard role="driver">
      <OnboardingGate>
        <div style={shellStyle}>
          <Toaster position="top-right" />
          <DriverNavbar />
          <main
            style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px', paddingBottom: 80 }}
            className="driver-main sm:pb-8"
          >
            {children}
          </main>
          <DriverBottomNav />
        </div>
      </OnboardingGate>
    </AuthGuard>
  );
}
