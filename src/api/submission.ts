import type { components } from '@ujax/api-spec/types';
import { authFetch } from './client';

type ApiSubmissionResponse = components['schemas']['ApiResponse-SubmissionResponse'];
export type SubmissionResponse = ApiSubmissionResponse['data'];

type ApiSubmissionResultList = components['schemas']['ApiResponse-SubmissionResultList'];
export type SubmissionResultList = ApiSubmissionResultList['data'];
export type SubmissionResult = SubmissionResultList[number];

export type SubmissionRequest = components['schemas']['SubmissionRequest'];
export type TestCase = SubmissionRequest['testCases'][number];

// ──── 코드 제출 ────

export async function createSubmission(
  wsId: number,
  problemId: number,
  data: SubmissionRequest,
): Promise<SubmissionResponse> {
  const res = await authFetch(`/api/v1/workspaces/${wsId}/problems/${problemId}/submissions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json;charset=UTF-8' },
    body: JSON.stringify(data),
  });
  return res.data;
}

// ──── 제출 결과 조회 ────

export async function getSubmissionResults(submissionToken: string): Promise<SubmissionResultList> {
  const res = await authFetch(`/api/v1/submissions/${submissionToken}`);
  return res.data;
}
