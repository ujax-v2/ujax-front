import type { components } from '@ujax/api-spec/types';
import { authFetch } from './client';

type ApiWorkspace = components['schemas']['ApiResponse-WorkspaceResponse'];
export type WorkspaceResponse = ApiWorkspace['data'];

type ApiWorkspaceMyList = components['schemas']['ApiResponse-WorkspaceMyList'];
export type WorkspaceMyListResponse = ApiWorkspaceMyList['data'];

type ApiWorkspaceSettings = components['schemas']['ApiResponse-WorkspaceSettings'];
export type WorkspaceSettingsResponse = ApiWorkspaceSettings['data'];

type ApiWorkspaceMember = components['schemas']['ApiResponse-WorkspaceMemberResponse'];
export type WorkspaceMemberResponse = ApiWorkspaceMember['data'];

type ApiWorkspaceMemberPage = components['schemas']['ApiResponse-WorkspaceMemberPage'];
export type WorkspaceMemberPageResponse = ApiWorkspaceMemberPage['data'];

export type CreateWorkspaceRequest = components['schemas']['CreateWorkspaceRequest'];
export type UpdateWorkspaceRequest = components['schemas']['UpdateWorkspaceRequest'];

type ApiWorkspaceExplore = components['schemas']['ApiResponse-WorkspaceExplore'];
export type PageResponseWorkspaceResponse = ApiWorkspaceExplore['data'];

// ──── 워크스페이스 CRUD ────

export async function getWorkspaces(): Promise<WorkspaceMyListResponse> {
  const res = await authFetch(`/api/v1/workspaces/me`);
  return res.data;
}

export async function getWorkspace(workspaceId: number): Promise<WorkspaceResponse> {
  const res = await authFetch(`/api/v1/workspaces/${workspaceId}`);
  return res.data;
}

export async function createWorkspace(data: CreateWorkspaceRequest): Promise<WorkspaceResponse> {
  const res = await authFetch('/api/v1/workspaces', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function updateWorkspace(workspaceId: number, data: UpdateWorkspaceRequest): Promise<WorkspaceResponse> {
  const res = await authFetch(`/api/v1/workspaces/${workspaceId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function deleteWorkspace(workspaceId: number): Promise<void> {
  await authFetch(`/api/v1/workspaces/${workspaceId}`, {
    method: 'DELETE',
  });
}

// ──── 탐색 & 검색 ────

export async function exploreWorkspaces(page = 0, size = 20): Promise<PageResponseWorkspaceResponse> {
  const res = await authFetch(`/api/v1/workspaces/explore?page=${page}&size=${size}`);
  return res.data;
}

export async function searchWorkspaces(name: string, page = 0, size = 20): Promise<PageResponseWorkspaceResponse> {
  const res = await authFetch(`/api/v1/workspaces/search?name=${encodeURIComponent(name)}&page=${page}&size=${size}`);
  return res.data;
}

// ──── 이미지 ────

export async function getWorkspaceImagePresignedUrl(workspaceId: number, fileSize: number, contentType: string) {
  const res = await authFetch(`/api/v1/workspaces/${workspaceId}/image/presigned-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileSize, contentType }),
  });
  return res.data as { presignedUrl: string; imageUrl: string };
}

// ──── 설정 ────

export async function getWorkspaceSettings(workspaceId: number): Promise<WorkspaceSettingsResponse> {
  const res = await authFetch(`/api/v1/workspaces/${workspaceId}/settings`);
  return res.data;
}

// ──── 멤버 ────

export async function getWorkspaceMembers(workspaceId: number, page = 0, size = 10): Promise<WorkspaceMemberPageResponse> {
  const res = await authFetch(`/api/v1/workspaces/${workspaceId}/members?page=${page}&size=${size}`);
  return res.data;
}

export async function getMyMembership(workspaceId: number): Promise<WorkspaceMemberResponse> {
  const res = await authFetch(`/api/v1/workspaces/${workspaceId}/members/me`);
  return res.data;
}

export async function updateMyNickname(workspaceId: number, nickname: string): Promise<WorkspaceMemberResponse> {
  const res = await authFetch(`/api/v1/workspaces/${workspaceId}/members/me/nickname`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nickname }),
  });
  return res.data;
}

export async function inviteMember(workspaceId: number, email: string): Promise<void> {
  await authFetch(`/api/v1/workspaces/${workspaceId}/members/invite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
}

export async function updateMemberRole(workspaceId: number, memberId: number, role: 'OWNER' | 'ADMIN' | 'MEMBER'): Promise<void> {
  await authFetch(`/api/v1/workspaces/${workspaceId}/members/${memberId}/role`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role }),
  });
}

export async function removeMember(workspaceId: number, memberId: number): Promise<void> {
  await authFetch(`/api/v1/workspaces/${workspaceId}/members/${memberId}`, {
    method: 'DELETE',
  });
}

export async function leaveWorkspace(workspaceId: number): Promise<void> {
  await authFetch(`/api/v1/workspaces/${workspaceId}/members/me`, {
    method: 'DELETE',
  });
}
