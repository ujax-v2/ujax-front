import type { components } from '@ujax/api-spec/types';
import { authFetch } from './client';

// ──────────────────────────────────────────────
// 기존 제출 목록 API (서버 스펙 — 제출 1건 = SolutionItem)
// ──────────────────────────────────────────────

type ApiSolutionList = components['schemas']['ApiResponse-SolutionList'];
export type SolutionListData = ApiSolutionList['data'];
/** 제출 1건 (서버 현재 스펙) */
export type SolutionItem = SolutionListData['content'][number];

// ──────────────────────────────────────────────
// Solution Member API 타입 — api-spec 기반
// ──────────────────────────────────────────────

type ApiSolutionMemberSummaryList = components['schemas']['ApiResponse-SolutionMemberSummaryList'];
type ApiSolutionVersionList = components['schemas']['ApiResponse-SolutionVersionList'];
type ApiSolutionCommentList = components['schemas']['ApiResponse-SolutionCommentList'];
type ApiSolutionCommentResponse = components['schemas']['ApiResponse-SolutionCommentResponse'];
type ApiSolutionLikeStatus = components['schemas']['ApiResponse-SolutionLikeStatus'];

export async function getSolutions(
  wsId: number,
  boxId: number,
  workspaceProblemId: number,
  page = 0,
  size = 20,
): Promise<SolutionListData> {
  const res = await authFetch(
    `/api/v1/workspaces/${wsId}/problem-boxes/${boxId}/problems/${workspaceProblemId}/solutions?page=${page}&size=${size}`,
  );
  return res.data;
}

// ══════════════════════════════════════════════════════════════
// Solution Member API — 풀이 보기 기능
//
// workspaceMemberId = 사람 기준 식별자 (1인 × 1문제 번들)
// submissionId      = 개별 제출 ID (백준 제출 번호)
// ══════════════════════════════════════════════════════════════

/** 풀이 요약 — 사람 1명 × 문제 1개 */
export type SolutionSummary = ApiSolutionMemberSummaryList['data'][number];

/** 제출 1건 — < > 네비게이션 단위 */
export type SolutionVersion = ApiSolutionVersionList['data']['content'][number];

/** 페이지 메타 정보 */
export type PageInfo = ApiSolutionVersionList['data']['page'];

/** 페이징 응답 래퍼 — data.content + data.page 중첩 구조 */
export interface PagedResult<T> {
  content: T[];
  page: PageInfo;
}

/** 댓글 */
export type SolutionComment = ApiSolutionCommentList['data'][number];

/** 좋아요 상태 */
export type SolutionLikeStatus = ApiSolutionLikeStatus['data'];

const MEMBER_BASE = (wsId: number, boxId: number, workspaceProblemId: number) =>
  `/api/v1/workspaces/${wsId}/problem-boxes/${boxId}/problems/${workspaceProblemId}/solution-members`;

/**
 * 사람 기준 풀이 요약 목록
 * GET /solution-members
 */
export async function getSolutionSummaries(
  wsId: number,
  boxId: number,
  workspaceProblemId: number,
): Promise<ApiSolutionMemberSummaryList['data']> {
  const res = await authFetch(MEMBER_BASE(wsId, boxId, workspaceProblemId));
  return res.data;
}

/**
 * 특정 사람의 제출 목록 — 최신순 페이징
 * GET /solution-members/{workspaceMemberId}/submissions?page&size
 */
export async function getSolutionVersions(
  wsId: number,
  boxId: number,
  workspaceProblemId: number,
  workspaceMemberId: number,
  page = 0,
  size = 1,
): Promise<ApiSolutionVersionList['data']> {
  const res = await authFetch(
    `${MEMBER_BASE(wsId, boxId, workspaceProblemId)}/${workspaceMemberId}/submissions?page=${page}&size=${size}`,
  );
  return res.data;
}

/**
 * 댓글 목록 — 현재 보는 코드(submissionId) 기준
 * GET /solution-members/{workspaceMemberId}/submissions/{submissionId}/comments
 */
export async function getSolutionComments(
  wsId: number,
  boxId: number,
  workspaceProblemId: number,
  workspaceMemberId: number,
  submissionId: number,
): Promise<ApiSolutionCommentList['data']> {
  const res = await authFetch(
    `${MEMBER_BASE(wsId, boxId, workspaceProblemId)}/${workspaceMemberId}/submissions/${submissionId}/comments`,
  );
  return res.data;
}

/**
 * 댓글 작성
 * POST /solution-members/{workspaceMemberId}/submissions/{submissionId}/comments
 */
export async function createSolutionComment(
  wsId: number,
  boxId: number,
  workspaceProblemId: number,
  workspaceMemberId: number,
  submissionId: number,
  content: string,
): Promise<ApiSolutionCommentResponse['data']> {
  const res = await authFetch(
    `${MEMBER_BASE(wsId, boxId, workspaceProblemId)}/${workspaceMemberId}/submissions/${submissionId}/comments`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      body: JSON.stringify({ content }),
    },
  );
  return res.data;
}

/**
 * 댓글 삭제
 * DELETE /solution-members/{workspaceMemberId}/submissions/{submissionId}/comments/{commentId}
 */
export async function deleteSolutionComment(
  wsId: number,
  boxId: number,
  workspaceProblemId: number,
  workspaceMemberId: number,
  submissionId: number,
  commentId: number,
): Promise<void> {
  await authFetch(
    `${MEMBER_BASE(wsId, boxId, workspaceProblemId)}/${workspaceMemberId}/submissions/${submissionId}/comments/${commentId}`,
    { method: 'DELETE' },
  );
}

/**
 * 좋아요 등록
 * PUT /solution-members/{workspaceMemberId}/submissions/{submissionId}/likes
 */
export async function likeSolution(
  wsId: number,
  boxId: number,
  workspaceProblemId: number,
  workspaceMemberId: number,
  submissionId: number,
): Promise<ApiSolutionLikeStatus['data']> {
  const res = await authFetch(
    `${MEMBER_BASE(wsId, boxId, workspaceProblemId)}/${workspaceMemberId}/submissions/${submissionId}/likes`,
    { method: 'PUT' },
  );
  return res.data;
}

/**
 * 좋아요 취소
 * DELETE /solution-members/{workspaceMemberId}/submissions/{submissionId}/likes
 */
export async function unlikeSolution(
  wsId: number,
  boxId: number,
  workspaceProblemId: number,
  workspaceMemberId: number,
  submissionId: number,
): Promise<ApiSolutionLikeStatus['data']> {
  const res = await authFetch(
    `${MEMBER_BASE(wsId, boxId, workspaceProblemId)}/${workspaceMemberId}/submissions/${submissionId}/likes`,
    { method: 'DELETE' },
  );
  return res.data;
}

