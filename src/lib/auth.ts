import type { AuthResponse, UserRole } from '@/types/auth';

export function saveSession(response: AuthResponse): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('commuter_token', response.token);
  localStorage.setItem('commuter_role', response.role);
  localStorage.setItem('commuter_name', response.name);
  // Also persist token as a cookie so the middleware (server-side) can read it
  document.cookie = `commuter_token=${response.token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('commuter_token');
}

export function getRole(): UserRole | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('commuter_role') as UserRole | null;
}

export function getName(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('commuter_name');
}

export function clearSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('commuter_token');
  localStorage.removeItem('commuter_role');
  localStorage.removeItem('commuter_name');
  // Clear the middleware cookie too
  document.cookie = 'commuter_token=; path=/; max-age=0; SameSite=Lax';
}

// Legacy aliases used by older driver portal code
export const setToken = (token: string) => localStorage.setItem('commuter_token', token);
export const clearToken = clearSession;
