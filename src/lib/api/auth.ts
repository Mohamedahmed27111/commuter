import type { AuthResponse, SignInPayload, UserSignupPayload } from '@/types/auth';
import { getToken } from '@/lib/auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

function authHeaders(): HeadersInit {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function signIn(payload: SignInPayload, role: 'user' | 'driver' = 'user'): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Sign in failed' }));
    throw new Error(err.message ?? 'Sign in failed');
  }
  const data = await res.json();
  // Map backend response { token, user: { id, name, ... } } → AuthResponse
  return {
    token:      data.token       ?? data.access_token ?? '',
    role,
    userId:     String(data.user?.id ?? ''),
    name:       data.user?.name  ?? data.name ?? '',
    isVerified: true,
    isApproved: true,
  };
}

export async function signUpUser(payload: UserSignupPayload): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Signup failed' }));
    throw new Error(err.message ?? 'Signup failed');
  }
  return res.json();
}

export async function signUpDriver(formData: FormData): Promise<{ message: string; userId: string }> {
  const res = await fetch(`${API_BASE}/signup/driver`, {
    method: 'POST',
    body: formData, // multipart — do NOT set Content-Type manually
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Driver signup failed' }));
    throw new Error(err.message ?? 'Driver signup failed');
  }
  return res.json();
}

export async function forgotPassword(email: string): Promise<void> {
  const res = await fetch(`${API_BASE}/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(err.message ?? 'Request failed');
  }
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const res = await fetch(`${API_BASE}/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, newPassword }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Reset failed' }));
    throw new Error(err.message ?? 'Reset failed');
  }
}

export async function refreshToken(): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/refresh`, {
    method: 'POST',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Token refresh failed');
  return res.json();
}
