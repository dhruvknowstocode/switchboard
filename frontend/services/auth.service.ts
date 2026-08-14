import { apiFetch } from '@/lib/api-client';
import type { User } from '@/types';

interface LoginResponse {
  data: {
    accessToken: string;
    user: User;
  };
}

interface MeResponse {
  data: User;
}

export async function login(email: string, password: string) {
  const res = await apiFetch<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  return res.data;
}

export async function me() {
  const res = await apiFetch<MeResponse>('/auth/me');
  return res.data;
}
