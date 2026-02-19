import type { components } from '@ujax/api-spec/types';
import { authFetch } from './client';

export type UserResponse = components['schemas']['UserResponse'];
export type UserUpdateRequest = components['schemas']['UserUpdateRequest'];

export async function getMe(): Promise<UserResponse> {
  const res = await authFetch('/api/v1/users/me');
  return res.data;
}

export async function updateMe(data: UserUpdateRequest): Promise<UserResponse> {
  const res = await authFetch('/api/v1/users/me', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function deleteMe(): Promise<void> {
  await authFetch('/api/v1/users/me', {
    method: 'DELETE',
  });
}
