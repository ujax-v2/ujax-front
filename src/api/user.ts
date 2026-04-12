import type { components } from '@ujax/api-spec/types';
import { authFetch } from './client';

type ApiUser = components['schemas']['ApiResponse-UserResponse'];
export type UserResponse = ApiUser['data'];
export type UserUpdateRequest = components['schemas']['UserUpdateRequest'];

type ApiPresignedUrl = components['schemas']['ApiResponse-PresignedUrlResponse'];
export type PresignedUrlResponse = ApiPresignedUrl['data'];

type ApiWorkspaceMemberProfile = components['schemas']['ApiResponse-WorkspaceMemberProfileResponse'];
export type WorkspaceMemberProfileResponse = ApiWorkspaceMemberProfile['data'];

type ApiWorkspaceMemberProfileActivity = components['schemas']['ApiResponse-WorkspaceMemberProfileActivityResponse'];
export type WorkspaceMemberProfileActivityResponse = ApiWorkspaceMemberProfileActivity['data'];

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

export async function getProfileImagePresignedUrl(fileSize: number, contentType: string) {
  const res = await authFetch('/api/v1/users/me/profile-image/presigned-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileSize, contentType }),
  });
  return res.data as PresignedUrlResponse;
}

export async function deleteMe(): Promise<void> {
  await authFetch('/api/v1/users/me', {
    method: 'DELETE',
  });
}

export async function getMyWorkspaceProfile(workspaceId: number): Promise<WorkspaceMemberProfileResponse> {
  const res = await authFetch(`/api/v1/workspaces/${workspaceId}/members/me/profile`);
  return res.data;
}

export async function getMyWorkspaceProfileActivity(workspaceId: number, year?: number): Promise<WorkspaceMemberProfileActivityResponse> {
  const url = year
    ? `/api/v1/workspaces/${workspaceId}/members/me/profile/activity?year=${year}`
    : `/api/v1/workspaces/${workspaceId}/members/me/profile/activity`;
  const res = await authFetch(url);
  return res.data;
}
