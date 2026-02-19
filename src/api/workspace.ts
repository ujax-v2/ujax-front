import type { components } from '@ujax/api-spec/types';
import { authFetch } from './client';

export type WorkspaceResponse = components['schemas']['WorkspaceResponse'];
export type WorkspaceListResponse = components['schemas']['WorkspaceListResponse'];
export type WorkspaceSettingsResponse = components['schemas']['WorkspaceSettingsResponse'];
export type WorkspaceMemberResponse = components['schemas']['WorkspaceMemberResponse'];
export type WorkspaceMemberListResponse = components['schemas']['WorkspaceMemberListResponse'];
export type CreateWorkspaceRequest = components['schemas']['CreateWorkspaceRequest'];
export type UpdateWorkspaceRequest = components['schemas']['UpdateWorkspaceRequest'];
export type PageInfo = components['schemas']['PageInfo'];
export type PageResponseWorkspaceResponse = components['schemas']['PageResponseWorkspaceResponse'];

// ──── 워크스페이스 CRUD ────

export async function getWorkspaces(): Promise<WorkspaceListResponse> {
  const res = await authFetch('/api/v1/workspaces');
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

export async function exploreWorkspaces(page = 0, size = 12): Promise<PageResponseWorkspaceResponse> {
  const res = await authFetch(`/api/v1/workspaces/explore?page=${page}&size=${size}`);
  return res.data;
}

export async function searchWorkspaces(name: string, page = 0, size = 12): Promise<PageResponseWorkspaceResponse> {
  const res = await authFetch(`/api/v1/workspaces/search?name=${encodeURIComponent(name)}&page=${page}&size=${size}`);
  return res.data;
}

// ──── 설정 ────

export async function getWorkspaceSettings(workspaceId: number): Promise<WorkspaceSettingsResponse> {
  const res = await authFetch(`/api/v1/workspaces/${workspaceId}/settings`);
  return res.data;
}

// ──── 멤버 ────

export async function getWorkspaceMembers(workspaceId: number): Promise<WorkspaceMemberListResponse> {
  const res = await authFetch(`/api/v1/workspaces/${workspaceId}/members`);
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
