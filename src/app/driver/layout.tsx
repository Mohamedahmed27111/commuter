'use client';

import { usePathname } from 'next/navigation';
import { Toaster } from 'react-hot-toast';
import DriverNavbar from '@/components/layout/DriverNavbar';

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

  if (isAuthRoute) return <>{children}</>;

  if (isTripRoute) {
    return (
      <div style={shellStyle}>
        <Toaster position="top-right" />
        {children}
      </div>
    );
  }

  return (
    <div style={shellStyle}>
      <Toaster position="top-right" />
      <DriverNavbar />
      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px' }} className="driver-main">
        {children}
      </main>
    </div>
  );
}
