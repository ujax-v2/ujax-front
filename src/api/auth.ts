import { apiFetch } from './client';

interface ApiAuthTokenResponse {
  accessToken: string;
  refreshToken: string;
}

interface ApiSuccessResponse<T> {
  success: boolean;
  data: T;
  message: string | null;
}

interface ApiProblemResponse {
  title?: string;
  status?: number;
  detail?: string;
  fieldErrors?: Array<{ field?: string; message?: string }>;
}

interface SignupRequestResponse {
  requestToken: string;
  expiresAt: string;
}

interface ApiAuthResponse {
  data: ApiAuthTokenResponse;
}

export interface SignupVerificationSession {
  requestToken: string;
  email: string;
  expiresAt: string;
}

interface ApiSignupVerificationSessionResponse {
  data: SignupVerificationSession;
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
  detail?: string;
  fieldErrors?: Array<{ field?: string; message?: string }>;

  constructor(problem: ApiProblemResponse | null, fallback: string) {
    super(problem?.detail || fallback);
    this.name = 'ApiProblemError';
    this.title = problem?.title;
    this.status = problem?.status;
    this.detail = problem?.detail;
    this.fieldErrors = problem?.fieldErrors;
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

export async function signupRequestApi(email: string): Promise<ApiSignupVerificationSessionResponse> {
  const trimmedEmail = email.trim();
  const res = await apiFetchWithTimeout('/api/v1/auth/signup/request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: trimmedEmail }),
  }, 15000);

  if (!res.ok) {
    await throwApiProblem(res, '인증 코드 발송에 실패했습니다.');
  }

  const json = await res.json() as ApiSuccessResponse<SignupRequestResponse>;
  return {
    ...json,
    data: {
      ...json.data,
      email: trimmedEmail,
    },
  };
}

export async function signupConfirmApi(
  requestToken: string,
  code: string,
  email: string,
  password: string,
  name: string,
): Promise<ApiAuthResponse> {
  const res = await apiFetch('/api/v1/auth/signup/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requestToken, code, email, password, name }),
  });

  if (!res.ok) {
    await throwApiProblem(res, '회원가입에 실패했습니다.');
  }

  return res.json();
}

export async function signupResendApi(email: string): Promise<ApiSignupVerificationSessionResponse> {
  return signupRequestApi(email);
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
