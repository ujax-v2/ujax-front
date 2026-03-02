import type { components } from '@ujax/api-spec/types';
import { authFetch } from './client';

type ApiSolutionList = components['schemas']['ApiResponse-SolutionList'];
export type SolutionListData = ApiSolutionList['data'];
export type SolutionItem = SolutionListData['content'][number];

// ──── 풀이 목록 조회 ────

export async function getSolutions(
  wsId: number,
  boxId: number,
  problemId: number,
  page = 0,
  size = 20,
): Promise<SolutionListData> {
  const res = await authFetch(
    `/api/v1/workspaces/${wsId}/problem-boxes/${boxId}/problems/${problemId}/solutions?page=${page}&size=${size}`,
  );
  return res.data;
}
