/**
 * Generate and validate group codes.
 * Format: 3 chars + dash + 3 chars  →  "XK9-4BT"
 * Characters: uppercase letters + digits, excluding 0, O, 1, I to avoid confusion.
 */

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateGroupCode(): string {
  const part = (len: number) =>
    Array.from({ length: len }, () =>
      CHARS[Math.floor(Math.random() * CHARS.length)]
    ).join('');
  return `${part(3)}-${part(3)}`;
}

/** Returns true if the string matches the 7-char "XXX-XXX" format. */
export function isValidGroupCode(code: string): boolean {
  return /^[A-Z0-9]{3}-[A-Z0-9]{3}$/.test(code.toUpperCase());
}
