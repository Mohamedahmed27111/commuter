import type { DriverCycleRequest, DriverProfile } from '@/types/driver';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

function getToken(): string {
  if (typeof window === 'undefined') return '';
  return sessionStorage.getItem('driver_token') ?? '';
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers ?? {}),
  };

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || `Request failed with status ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export async function fetchRequests(): Promise<DriverCycleRequest[]> {
  return request<DriverCycleRequest[]>('/api/driver/requests');
}

export async function fetchRequest(id: string): Promise<DriverCycleRequest> {
  return request<DriverCycleRequest>(`/api/driver/requests/${id}`);
}

export async function acceptRequest(id: string): Promise<void> {
  return request<void>(`/api/driver/requests/${id}/accept`, { method: 'POST' });
}

export async function rejectRequest(id: string): Promise<void> {
  return request<void>(`/api/driver/requests/${id}/reject`, { method: 'POST' });
}

export async function raiseRequestPrice(id: string, newPrice: number): Promise<void> {
  return request<void>(`/api/driver/requests/${id}/raise`, {
    method: 'POST',
    body: JSON.stringify({ newPrice }),
  });
}

export async function fetchProfile(): Promise<DriverProfile> {
  return request<DriverProfile>('/api/driver/profile');
}

export async function updateProfile(data: Partial<DriverProfile>): Promise<DriverProfile> {
  return request<DriverProfile>('/api/driver/profile', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function uploadDocument(fieldName: string, file: File): Promise<void> {
  const token = getToken();
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${BASE_URL}/api/driver/documents/${fieldName}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || `Upload failed with status ${res.status}`);
  }
}

export async function fetchWallet(): Promise<{ balance: number; transactions: unknown[] }> {
  return request<{ balance: number; transactions: unknown[] }>('/api/driver/wallet');
}
