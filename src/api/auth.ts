import type { components } from '@ujax/api-spec/types';
import { apiFetch } from './client';

type ApiAuthToken = components['schemas']['ApiResponse-AuthTokenResponse'];
export type AuthTokenResponse = ApiAuthToken['data'];
export type SignupRequest = components['schemas']['SignupRequest'];
export type LoginRequest = components['schemas']['LoginRequest'];

interface ApiAuthResponse {
  data: AuthTokenResponse;
}

export interface SignupVerificationSession {
  requestToken: string;
  email: string;
  expiresAt: string;
}

interface ApiSignupVerificationSessionResponse {
  data: SignupVerificationSession;
}

interface ApiProblemResponse {
  title?: string;
  status?: number;
  detail?: string;
}

class ApiTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiTimeoutError';
    Object.setPrototypeOf(this, ApiTimeoutError.prototype);
  }
}

export class ApiProblemError extends Error {
  title?: string;
  status?: number;

  constructor(problem: ApiProblemResponse | null, fallback: string) {
    super(problem?.detail || fallback);
    this.name = 'ApiProblemError';
    this.title = problem?.title;
    this.status = problem?.status;
    Object.setPrototypeOf(this, ApiProblemError.prototype);
  }
}

export function isApiProblemError(error: unknown): error is ApiProblemError {
  return error instanceof ApiProblemError;
}

export function isApiTimeoutError(error: unknown): error is ApiTimeoutError {
  return error instanceof ApiTimeoutError;
}

async function throwApiProblem(res: Response, fallback: string): Promise<never> {
  const problem = await res.json().catch(() => null);
  throw new ApiProblemError(problem, fallback);
}

async function apiFetchWithTimeout(url: string, options: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await apiFetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if ((error as DOMException)?.name === 'AbortError') {
      throw new ApiTimeoutError('요청 시간이 초과되었습니다.');
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export async function loginApi(email: string, password: string): Promise<ApiAuthResponse> {
  const res = await apiFetch('/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    await throwApiProblem(res, '로그인에 실패했습니다.');
  }
  return res.json();
}

export async function checkEmailAvailabilityApi(email: string): Promise<void> {
  const res = await apiFetch('/api/v1/auth/email-availability', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  if (!res.ok) {
    await throwApiProblem(res, '이메일 확인 중 오류가 발생했습니다.');
  }
}

export async function signupRequestApi(email: string, password: string, name: string): Promise<ApiSignupVerificationSessionResponse> {
  const res = await apiFetchWithTimeout('/api/v1/auth/signup/request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  }, 15000);
  if (!res.ok) {
    await throwApiProblem(res, '인증 코드 발송에 실패했습니다.');
  }
  return res.json();
}

export async function signupConfirmApi(requestToken: string, code: string): Promise<ApiAuthResponse> {
  const res = await apiFetch('/api/v1/auth/signup/confirm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requestToken, code }),
  });
  if (!res.ok) {
    await throwApiProblem(res, '회원가입에 실패했습니다.');
  }
  return res.json();
}

export async function signupResendApi(requestToken: string): Promise<ApiSignupVerificationSessionResponse> {
  const res = await apiFetchWithTimeout('/api/v1/auth/signup/resend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requestToken }),
  }, 15000);
  if (!res.ok) {
    await throwApiProblem(res, '인증 코드 재발송에 실패했습니다.');
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
