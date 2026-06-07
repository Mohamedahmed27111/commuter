import type { ReactNode } from 'react';
import { Toaster } from 'react-hot-toast';

// Demo section – completely public, no auth guards, no nav chrome
export default function DemoLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Toaster position="top-right" />
      {children}
    </>
  );
}
