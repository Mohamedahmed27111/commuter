/**
 * Formatting utilities for currency, distance, and dates.
 * Always uses Western numerals (en-EG number format) in both locales.
 */

export function formatEGP(amount: number): string {
  // Always en-EG for number format — Western numerals in both modes
  return `EGP ${amount.toLocaleString('en-EG')}`;
}

export function formatDistance(km: number): string {
  return `${km} km`;
}

export function formatDuration(minutes: number): string {
  return `${minutes} min`;
}

export function formatDate(isoDate: string, locale: string): string {
  return new Date(isoDate).toLocaleDateString(
    locale === 'ar' ? 'ar-EG-u-nu-latn' : 'en-EG',
    // nu-latn extension forces Western numerals in Arabic locale
    { day: 'numeric', month: 'short', year: 'numeric' }
  );
}

export function formatTime(isoDate: string, locale: string): string {
  return new Date(isoDate).toLocaleTimeString(
    locale === 'ar' ? 'ar-EG-u-nu-latn' : 'en-EG',
    { hour: '2-digit', minute: '2-digit' }
  );
}
