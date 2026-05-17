'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Legacy route — replaced by the new wizard at /user/request/*
export default function MapPageLegacy() {
  const router = useRouter();
  useEffect(() => { router.replace('/user/request/new'); }, [router]);
  return null;
}
