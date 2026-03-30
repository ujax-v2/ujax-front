import type { components } from '@ujax/api-spec/types';
import { authFetch } from './client';

type ApiWsProblemList = components['schemas']['ApiResponse-WorkspaceProblemList'];
export type WorkspaceProblemListData = ApiWsProblemList['data'];

type ApiWsProblemResponse = components['schemas']['ApiResponse-WorkspaceProblemResponse'];
export type WorkspaceProblemResponse = ApiWsProblemResponse['data'];

export type CreateWorkspaceProblemRequest = components['schemas']['CreateWorkspaceProblemRequest'];
export type UpdateWorkspaceProblemRequest = components['schemas']['UpdateWorkspaceProblemRequest'];

// ──── 문제집 내 문제 CRUD ────

const base = (wsId: number, boxId: number) =>
  `/api/v1/workspaces/${wsId}/problem-boxes/${boxId}/problems`;

export async function getWorkspaceProblems(
  wsId: number,
  boxId: number,
  page = 0,
  size = 10,
  keyword?: string,
): Promise<WorkspaceProblemListData> {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (keyword) params.set('keyword', keyword);
  const res = await authFetch(`${base(wsId, boxId)}?${params}`);
  return res.data;
}

export async function createWorkspaceProblem(
  wsId: number,
  boxId: number,
  data: CreateWorkspaceProblemRequest,
): Promise<WorkspaceProblemResponse> {
  const res = await authFetch(base(wsId, boxId), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json;charset=UTF-8' },
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function updateWorkspaceProblem(
  wsId: number,
  boxId: number,
  problemId: number,
  data: UpdateWorkspaceProblemRequest,
): Promise<WorkspaceProblemResponse> {
  const res = await authFetch(`${base(wsId, boxId)}/${problemId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json;charset=UTF-8' },
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function deleteWorkspaceProblem(
  wsId: number,
  boxId: number,
  problemId: number,
): Promise<void> {
  await authFetch(`${base(wsId, boxId)}/${problemId}`, {
    method: 'DELETE',
  });
}
