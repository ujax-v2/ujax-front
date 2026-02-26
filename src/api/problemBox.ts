import type { components } from '@ujax/api-spec/types';
import { authFetch } from './client';

type ApiProblemBoxList = components['schemas']['ApiResponse-ProblemBoxList'];
export type ProblemBoxListData = ApiProblemBoxList['data'];

type ApiProblemBoxResponse = components['schemas']['ApiResponse-ProblemBoxResponse'];
export type ProblemBoxResponse = ApiProblemBoxResponse['data'];

export type CreateProblemBoxRequest = components['schemas']['CreateProblemBoxRequest'];
export type UpdateProblemBoxRequest = components['schemas']['UpdateProblemBoxRequest'];

// ──── 문제집 CRUD ────

export async function getProblemBoxes(workspaceId: number, page = 0, size = 9): Promise<ProblemBoxListData> {
  const res = await authFetch(`/api/v1/workspaces/${workspaceId}/problem-boxes?page=${page}&size=${size}`);
  return res.data;
}

export async function createProblemBox(workspaceId: number, data: CreateProblemBoxRequest): Promise<ProblemBoxResponse> {
  const res = await authFetch(`/api/v1/workspaces/${workspaceId}/problem-boxes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json;charset=UTF-8' },
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function getProblemBox(workspaceId: number, problemBoxId: number): Promise<ProblemBoxResponse> {
  const res = await authFetch(`/api/v1/workspaces/${workspaceId}/problem-boxes/${problemBoxId}`);
  return res.data;
}

export async function updateProblemBox(workspaceId: number, problemBoxId: number, data: UpdateProblemBoxRequest): Promise<ProblemBoxResponse> {
  const res = await authFetch(`/api/v1/workspaces/${workspaceId}/problem-boxes/${problemBoxId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json;charset=UTF-8' },
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function deleteProblemBox(workspaceId: number, problemBoxId: number): Promise<void> {
  await authFetch(`/api/v1/workspaces/${workspaceId}/problem-boxes/${problemBoxId}`, {
    method: 'DELETE',
  });
}
