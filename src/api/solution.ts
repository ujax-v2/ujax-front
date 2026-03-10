import type { components } from '@ujax/api-spec/types';
import { authFetch } from './client';

// ──────────────────────────────────────────────
// 실제 API (서버 현재 스펙 — 제출 1건 = SolutionItem)
// ──────────────────────────────────────────────

type ApiSolutionList = components['schemas']['ApiResponse-SolutionList'];
export type SolutionListData = ApiSolutionList['data'];
/** 제출 1건 (서버 현재 스펙) */
export type SolutionItem = SolutionListData['content'][number];

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
// Solution Summary API (백엔드 미구현 — 연동 대기)
//
// 확정된 흐름:
//   1. getSolutionSummaries()                 → 사람 N명 (사이드바)
//   2. getSolutionVersions(solutionId)        → 그 사람의 제출 N건, 페이징 (< >)
//   3. likeSolution(solutionId, submissionId) → 현재 코드에 좋아요
//   4. getSolutionComments(solutionId, submissionId) → 현재 코드의 댓글
//
// solutionId   = 사람 묶음 ID (사람 1명 × 문제 1개)
// submissionId = 개별 제출 ID (백준 제출 번호, 코드 1건)
//
// 좋아요/댓글 → submissionId 기준 (보고 있는 코드에 대한 반응)
// ══════════════════════════════════════════════════════════════

// ──── 타입 정의 ────

/** 페이징 래퍼 */
export interface PagedResult<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

/** 풀이 요약 — 사이드바 목록 1행 (사람 1명 × 문제 1개) */
export interface SolutionSummary {
  solutionId: number;
  memberName: string;
  title: string;
  tags: string[];
  /** 최신 제출 기준 */
  programmingLanguage: string;
  latestStatus: string;
  submissionCount: number;
  likes: number;
  views: number;
  updatedAt: string;
}

/** 제출 1건 — < > 네비게이션 단위 (좋아요·댓글은 submissionId 기준) */
export interface SolutionVersion {
  submissionId: number;
  code: string;
  status: string;
  time: string | null;
  memory: string | null;
  codeLength: string | null;
  createdAt: string;
  likes: number;
  isLiked: boolean;
  commentCount: number;
}

/** 댓글 */
export interface SolutionComment {
  id: number;
  authorName: string;
  content: string;
  createdAt: string;
}

/** 좋아요 상태 */
export interface SolutionLikeStatus {
  likes: number;
  isLiked: boolean;
}

/** 풀이 제목·태그 저장/수정 요청 */
export interface UpsertSolutionSummaryRequest {
  title: string;
  tags: string[];
}

// ──── API 함수 ────

const BASE = (wsId: number, boxId: number, wProblemId: number) =>
  `/api/v1/workspaces/${wsId}/problem-boxes/${boxId}/problems/${wProblemId}/solution-summaries`;

/**
 * 풀이 목록 — 사람 N명 반환 (사이드바)
 * GET /solution-summaries
 */
export async function getSolutionSummaries(
  wsId: number,
  boxId: number,
  workspaceProblemId: number,
): Promise<SolutionSummary[]> {
  const res = await authFetch(BASE(wsId, boxId, workspaceProblemId));
  return res.data;
}

/**
 * 풀이 제목·태그 등록 (최초 1회)
 * POST /solution-summaries
 */
export async function createSolutionSummary(
  wsId: number,
  boxId: number,
  workspaceProblemId: number,
  body: UpsertSolutionSummaryRequest,
): Promise<SolutionSummary> {
  const res = await authFetch(BASE(wsId, boxId, workspaceProblemId), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.data;
}

/**
 * 풀이 제목·태그 수정
 * PATCH /solution-summaries/{solutionId}
 */
export async function updateSolutionSummary(
  wsId: number,
  boxId: number,
  workspaceProblemId: number,
  solutionId: number,
  body: UpsertSolutionSummaryRequest,
): Promise<SolutionSummary> {
  const res = await authFetch(`${BASE(wsId, boxId, workspaceProblemId)}/${solutionId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.data;
}

/**
 * 그 사람의 제출 목록 — 최신순, 페이징 (size=1 → 1페이지 = 코드 1건)
 * GET /solution-summaries/{solutionId}/submissions?page&size
 */
export async function getSolutionVersions(
  wsId: number,
  boxId: number,
  workspaceProblemId: number,
  solutionId: number,
  page = 0,
  size = 1,
): Promise<PagedResult<SolutionVersion>> {
  const res = await authFetch(
    `${BASE(wsId, boxId, workspaceProblemId)}/${solutionId}/submissions?page=${page}&size=${size}`,
  );
  return res.data;
}

/**
 * 댓글 목록 — 현재 보는 코드(submissionId) 기준
 * GET /solution-summaries/{solutionId}/submissions/{submissionId}/comments
 */
export async function getSolutionComments(
  wsId: number,
  boxId: number,
  workspaceProblemId: number,
  solutionId: number,
  submissionId: number,
): Promise<SolutionComment[]> {
  const res = await authFetch(
    `${BASE(wsId, boxId, workspaceProblemId)}/${solutionId}/submissions/${submissionId}/comments`,
  );
  return res.data;
}

/**
 * 댓글 작성
 * POST /solution-summaries/{solutionId}/submissions/{submissionId}/comments
 */
export async function createSolutionComment(
  wsId: number,
  boxId: number,
  workspaceProblemId: number,
  solutionId: number,
  submissionId: number,
  content: string,
): Promise<SolutionComment> {
  const res = await authFetch(
    `${BASE(wsId, boxId, workspaceProblemId)}/${solutionId}/submissions/${submissionId}/comments`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    },
  );
  return res.data;
}

/**
 * 댓글 삭제
 * DELETE /solution-summaries/{solutionId}/submissions/{submissionId}/comments/{commentId}
 */
export async function deleteSolutionComment(
  wsId: number,
  boxId: number,
  workspaceProblemId: number,
  solutionId: number,
  submissionId: number,
  commentId: number,
): Promise<void> {
  await authFetch(
    `${BASE(wsId, boxId, workspaceProblemId)}/${solutionId}/submissions/${submissionId}/comments/${commentId}`,
    { method: 'DELETE' },
  );
}

/**
 * 좋아요 — 현재 보는 코드(submissionId) 기준
 * PUT /solution-summaries/{solutionId}/submissions/{submissionId}/likes
 */
export async function likeSolution(
  wsId: number,
  boxId: number,
  workspaceProblemId: number,
  solutionId: number,
  submissionId: number,
): Promise<SolutionLikeStatus> {
  const res = await authFetch(
    `${BASE(wsId, boxId, workspaceProblemId)}/${solutionId}/submissions/${submissionId}/likes`,
    { method: 'PUT' },
  );
  return res.data;
}

/**
 * 좋아요 취소
 * DELETE /solution-summaries/{solutionId}/submissions/{submissionId}/likes
 */
export async function unlikeSolution(
  wsId: number,
  boxId: number,
  workspaceProblemId: number,
  solutionId: number,
  submissionId: number,
): Promise<SolutionLikeStatus> {
  const res = await authFetch(
    `${BASE(wsId, boxId, workspaceProblemId)}/${solutionId}/submissions/${submissionId}/likes`,
    { method: 'DELETE' },
  );
  return res.data;
}

// ══════════════════════════════════════════════════════════════
// Mock 데이터 (백엔드 연동 전 UI 개발용)
// 사용법: 위 함수 구현부를 아래 mock 함수로 교체하거나
//         별도 mockSolution.ts로 분리해서 import 교체
// ══════════════════════════════════════════════════════════════

export const MOCK_SOLUTION_SUMMARIES: SolutionSummary[] = [
  {
    solutionId: 1,
    memberName: '알고리즘마스터',
    title: 'BufferedReader를 활용한 빠른 입출력',
    tags: ['Math', 'IO'],
    programmingLanguage: 'JAVA',
    latestStatus: 'ACCEPTED',
    submissionCount: 2,
    likes: 42,
    views: 128,
    updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    solutionId: 2,
    memberName: 'pythonista',
    title: 'Python 한 줄 코딩 (Short coding)',
    tags: ['Short', 'Math'],
    programmingLanguage: 'PYTHON',
    latestStatus: 'ACCEPTED',
    submissionCount: 1,
    likes: 38,
    views: 95,
    updatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    solutionId: 3,
    memberName: 'cppNinja',
    title: 'C++ ios_base::sync_with_stdio 입출력 최적화',
    tags: ['Performance', 'IO'],
    programmingLanguage: 'CPP',
    latestStatus: 'ACCEPTED',
    submissionCount: 3,
    likes: 29,
    views: 150,
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
];

export const MOCK_SOLUTION_VERSIONS: Record<number, SolutionVersion[]> = {
  1: [
    {
      submissionId: 12003,
      status: 'ACCEPTED',
      time: '80 ms',
      memory: '11456 KB',
      codeLength: '298 B',
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      likes: 42,
      isLiked: false,
      commentCount: 2,
      code: `import java.io.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String[] tokens = br.readLine().split(" ");
        int a = Integer.parseInt(tokens[0]);
        int b = Integer.parseInt(tokens[1]);
        System.out.println(a + b);
    }
}`,
    },
    {
      submissionId: 12001,
      status: 'WRONG_ANSWER',
      time: null,
      memory: null,
      codeLength: '210 B',
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      likes: 1,
      isLiked: false,
      commentCount: 1,
      code: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int a = sc.nextInt();
        int b = sc.nextInt();
        System.out.print(a + b);
    }
}`,
    },
  ],
  2: [
    {
      submissionId: 12005,
      status: 'ACCEPTED',
      time: '68 ms',
      memory: '31256 KB',
      codeLength: '38 B',
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      likes: 38,
      isLiked: true,
      commentCount: 1,
      code: `print(sum(map(int, input().split())))`,
    },
  ],
  3: [
    {
      submissionId: 12010,
      status: 'ACCEPTED',
      time: '0 ms',
      memory: '2020 KB',
      codeLength: '152 B',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      likes: 29,
      isLiked: false,
      commentCount: 0,
      code: `#include <iostream>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    int a, b;
    cin >> a >> b;
    cout << a + b;
    return 0;
}`,
    },
    {
      submissionId: 12008,
      status: 'TIME_LIMIT_EXCEEDED',
      time: null,
      memory: null,
      codeLength: '130 B',
      createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
      likes: 0,
      isLiked: false,
      commentCount: 0,
      code: `#include <iostream>
using namespace std;

int main() {
    int a, b;
    cin >> a >> b;
    cout << a + b;
    return 0;
}`,
    },
    {
      submissionId: 12006,
      status: 'COMPILE_ERROR',
      time: null,
      memory: null,
      codeLength: '95 B',
      createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
      likes: 0,
      isLiked: false,
      commentCount: 0,
      code: `#include <iostream>

int main() {
    int a, b;
    cin >> a >> b;
    cout << a + b;
}`,
    },
  ],
};

export const MOCK_SOLUTION_COMMENTS: Record<number, SolutionComment[]> = {
  12003: [
    { id: 1, authorName: 'user123', content: '깔끔한 풀이네요! 배웠습니다.', createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
    { id: 2, authorName: 'coder99', content: 'Scanner 대신 BufferedReader를 쓰면 더 빠르지 않을까요?', createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString() },
  ],
  12001: [
    { id: 3, authorName: 'helper', content: 'println이 아니라 print를 쓰셔서 줄바꿈이 빠졌네요.', createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() },
  ],
  12005: [
    { id: 4, authorName: 'beginner42', content: '한 줄로 되네요 신기하다', createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
  ],
};
