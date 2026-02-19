import type { components } from '@ujax/api-spec/types';
import { authFetch } from './client';

export type ProblemResponse = components['schemas']['ProblemResponse'];
export type SampleResponse = components['schemas']['SampleResponse'];
export type AlgorithmTagResponse = components['schemas']['AlgorithmTagResponse'];

export async function getProblemById(problemId: number): Promise<ProblemResponse> {
  const res = await authFetch(`/api/v1/problems/${problemId}`);
  return res.data;
}

export async function getProblemByNumber(problemNumber: number): Promise<ProblemResponse> {
  const res = await authFetch(`/api/v1/problems/number/${problemNumber}`);
  return res.data;
}
