'use client';

import { useLocale } from 'next-intl';

/** True when the active locale reads right-to-left (Arabic). */
export function useIsRtl(): boolean {
  const locale = useLocale();
  return locale === 'ar';
}
