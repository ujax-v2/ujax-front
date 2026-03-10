import type { components } from '@ujax/api-spec/types';
import { authFetch } from './client';

// ──────────────────────────────────────────────
// 기존 제출 목록 API (서버 스펙 — 제출 1건 = SolutionItem)
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
// Solution Member API — 풀이 보기 기능
//
// workspaceMemberId = 사람 기준 식별자 (1인 × 1문제 번들)
// submissionId      = 개별 제출 ID (백준 제출 번호)
//
// 서버 스펙 스키마: @ujax/api-spec 의 ApiResponse-SolutionMemberSummaryList 등
// (ujax-api-spec에 추가 완료 — npm install 후 아래 타입을 import로 교체 가능)
// ══════════════════════════════════════════════════════════════

/** 페이지 메타 정보 — 서버 응답 구조 그대로 */
export interface PageInfo {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

/** 페이징 응답 래퍼 — data.content + data.page 중첩 구조 */
export interface PagedResult<T> {
  content: T[];
  page: PageInfo;
}

/** 풀이 요약 — 사람 1명 × 문제 1개 (ApiResponse-SolutionMemberSummaryList 아이템) */
export interface SolutionSummary {
  workspaceMemberId: number;
  memberName: string;
  programmingLanguage: string;
  latestStatus: string;
  submissionCount: number;
  /** 최신 제출 기준 좋아요 수 */
  likes: number;
  updatedAt: string;
}

/** 제출 1건 — < > 네비게이션 단위 (ApiResponse-SolutionVersionList content 아이템) */
export interface SolutionVersion {
  submissionId: number;
  code: string | null;
  status: string;
  time: string | null;
  memory: string | null;
  codeLength: string | null;
  createdAt: string;
  likes: number;
  isLiked: boolean;
  commentCount: number;
}

/** 댓글 (ApiResponse-SolutionCommentList 아이템) */
export interface SolutionComment {
  id: number;
  authorName: string;
  content: string;
  createdAt: string;
}

/** 좋아요 상태 (ApiResponse-SolutionLikeStatus) */
export interface SolutionLikeStatus {
  likes: number;
  isLiked: boolean;
}

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
): Promise<SolutionSummary[]> {
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
): Promise<PagedResult<SolutionVersion>> {
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
): Promise<SolutionComment[]> {
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
): Promise<SolutionComment> {
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
): Promise<SolutionLikeStatus> {
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
): Promise<SolutionLikeStatus> {
  const res = await authFetch(
    `${MEMBER_BASE(wsId, boxId, workspaceProblemId)}/${workspaceMemberId}/submissions/${submissionId}/likes`,
    { method: 'DELETE' },
  );
  return res.data;
}

// ══════════════════════════════════════════════════════════════
// Mock 데이터 (백엔드 연동 전 UI 개발용)
// ══════════════════════════════════════════════════════════════

export const MOCK_SOLUTION_SUMMARIES: SolutionSummary[] = [
  {
    workspaceMemberId: 11,
    memberName: '알고리즘마스터',
    programmingLanguage: 'JAVA',
    latestStatus: 'ACCEPTED',
    submissionCount: 2,
    likes: 42,
    updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    workspaceMemberId: 12,
    memberName: 'pythonista',
    programmingLanguage: 'PYTHON',
    latestStatus: 'ACCEPTED',
    submissionCount: 1,
    likes: 38,
    updatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    workspaceMemberId: 13,
    memberName: 'cppNinja',
    programmingLanguage: 'CPP',
    latestStatus: 'ACCEPTED',
    submissionCount: 3,
    likes: 29,
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
];

export const MOCK_SOLUTION_VERSIONS: Record<number, SolutionVersion[]> = {
  11: [
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
  12: [
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
  13: [
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
    { id: 4, authorName: 'beginner42', content: '한 줄로 되네요 신기하다', createdAt: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString() },
  ],
};
