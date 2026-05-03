'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Toaster } from 'react-hot-toast';
import UserNavbar from '@/components/layout/UserNavbar';
import BottomNav from '@/components/layout/BottomNav';

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isMapPage = pathname === '/user/map';

  useEffect(() => {
    document.body.style.overflowX = 'hidden';
    return () => { document.body.style.overflowX = ''; };
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: isMapPage ? 'transparent' : '#F8F9FA', fontFamily: 'Inter, system-ui, sans-serif', overflowX: 'hidden' }}>
      <Toaster position="top-right" />
      <UserNavbar />
      {isMapPage ? (
        // Map page: no padding, no max-width — full-screen
        <main style={{ position: 'relative' }}>
          {children}
        </main>
      ) : (
        <main
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            paddingLeft: 16,
            paddingRight: 16,
            paddingTop: 16,
            paddingBottom: 80,
          }}
          className="sm:px-6 sm:pt-8 sm:pb-8"
        >
          {children}
        </main>
      )}
      <BottomNav />
    </div>
  );
}

