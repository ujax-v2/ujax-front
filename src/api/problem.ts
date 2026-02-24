import type { components } from '@ujax/api-spec/types';
import { authFetch } from './client';

type ApiProblem = components['schemas']['ApiResponseProblemResponse'];
export type ProblemResponse = NonNullable<ApiProblem['data']>;
export type SampleResponse = NonNullable<ProblemResponse['samples']>[number];
export type AlgorithmTagResponse = NonNullable<ProblemResponse['algorithmTags']>[number];

export async function getProblemById(problemId: number): Promise<ProblemResponse> {
  const res = await authFetch(`/api/v1/problems/${problemId}`);
  return res.data!;
}

export async function getProblemByNumber(problemNumber: number): Promise<ProblemResponse> {
  const res = await authFetch(`/api/v1/problems/number/${problemNumber}`);
  return res.data!;
}

export async function findProblemByNumber(problemNumber: number): Promise<ProblemResponse | null> {
  try {
    const res = await authFetch(`/api/v1/problems/number/${problemNumber}`);
    return res.data!;
  } catch {
    return null;
  }
}
