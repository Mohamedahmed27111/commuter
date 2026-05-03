'use client';

import { usePathname } from 'next/navigation';
import { Toaster } from 'react-hot-toast';
import DriverNavbar from '@/components/layout/DriverNavbar';

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isAuthRoute =
    pathname === '/driver/sign-in' ||
    pathname === '/driver/sign-up' ||
    pathname.startsWith('/driver/sign-in/') ||
    pathname.startsWith('/driver/sign-up/');

  if (isAuthRoute) return <>{children}</>;

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F8F9FA',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    }}>
      <Toaster position="top-right" />
      <DriverNavbar />
      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px' }} className="driver-main">
        {children}
      </main>
    </div>
  );
}
