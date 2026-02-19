import type { components } from '@ujax/api-spec/types';
import { apiFetch } from './client';

export type AuthTokenResponse = components['schemas']['AuthTokenResponse'];
export type SignupRequest = components['schemas']['SignupRequest'];
export type LoginRequest = components['schemas']['LoginRequest'];

interface ApiAuthResponse {
  data: AuthTokenResponse;
}

export async function loginApi(email: string, password: string): Promise<ApiAuthResponse> {
  const res = await apiFetch('/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(error?.detail || '로그인에 실패했습니다.');
  }
  return res.json();
}

export async function signupApi(email: string, password: string, name: string): Promise<ApiAuthResponse> {
  const res = await apiFetch('/api/v1/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(error?.detail || '회원가입에 실패했습니다.');
  }
  return res.json();
}

export async function logoutApi(refreshToken: string): Promise<void> {
  const res = await apiFetch('/api/v1/auth/logout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) {
    throw new Error('로그아웃에 실패했습니다.');
  }
}
