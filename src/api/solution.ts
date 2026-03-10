import type { components } from '@ujax/api-spec/types';
import { authFetch } from './client';

// ──── 실제 API (서버 스펙 기반) ────
// 현재 서버는 제출 1건 = SolutionItem 1개 모델

type ApiSolutionList = components['schemas']['ApiResponse-SolutionList'];
export type SolutionListData = ApiSolutionList['data'];
/** 제출 1건 (서버 현재 스펙) */
export type SolutionItem = SolutionListData['content'][number];

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

// ══════════════════════════════════════════════════════════════
// Mock API (백엔드 미구현)
//
// 확정된 흐름:
//   1. getSolutionSummaries()              → 사람 N명 (사이드바 목록)
//   2. getSolutionVersions(solutionId)     → 그 사람의 제출 N건, 페이징 (< > 네비게이션)
//   3. likeSolution(submissionId)          → 현재 보는 코드에 좋아요
//   4. getSolutionComments(submissionId)   → 현재 보는 코드의 댓글
//
// solutionId  = 사람 묶음 ID  (사람 1명 × 문제 1개 = 1개)
// submissionId = 개별 제출 ID (백준 제출 번호, 코드 1건)
//
// 좋아요/댓글은 submissionId 기준:
//   → 보고 있는 코드에 대한 반응이므로 버전별로 분리
//   → 사이드바의 likes는 최신 제출 기준 표시용 (SolutionSummary.latestLikes)
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

/**
 * 풀이 요약 — 사이드바 목록 1행
 * solutionId 기준 (사람 1명 × 문제 1개)
 */
export interface SolutionSummary {
  /** 풀이(묶음) ID */
  solutionId: number;
  /** 작성자 이름 */
  memberName: string;
  /** 풀이 제목 */
  title: string;
  /** 태그 */
  tags: string[];
  /** 사용 언어 (최신 제출 기준) */
  programmingLanguage: string;
  /** 최신 제출 상태 */
  latestStatus: string;
  /** 총 제출 횟수 */
  submissionCount: number;
  /** 최신 제출의 좋아요 수 (사이드바 표시용) */
  latestLikes: number;
  /** 풀이 조회수 */
  views: number;
  /** 최신 제출 시각 */
  updatedAt: string;
}

/**
 * 제출 1건 — < > 네비게이션 단위
 * 좋아요/댓글은 이 submissionId 기준
 */
export interface SolutionVersion {
  /** 백준 제출 번호 (좋아요·댓글 API의 key) */
  submissionId: number;
  /** 소스 코드 */
  code: string;
  /** 채점 상태 */
  status: string;
  /** 실행 시간 */
  time: string | null;
  /** 메모리 */
  memory: string | null;
  /** 코드 길이 */
  codeLength: string | null;
  /** 제출 시각 */
  createdAt: string;
  /** 이 코드의 좋아요 수 */
  likes: number;
  /** 내가 이 코드에 좋아요 눌렀는지 */
  isLiked: boolean;
  /** 이 코드의 댓글 수 */
  commentCount: number;
}

/** 댓글 (submissionId 기준) */
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

// ──── Mock 데이터 ────

const MOCK_SUMMARIES: SolutionSummary[] = [
  {
    solutionId: 1,
    memberName: '알고리즘마스터',
    title: 'BufferedReader를 활용한 빠른 입출력',
    tags: ['Math', 'IO'],
    programmingLanguage: 'JAVA',
    latestStatus: 'ACCEPTED',
    submissionCount: 2,
    latestLikes: 42,
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
    latestLikes: 38,
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
    latestLikes: 29,
    views: 150,
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
];

// solutionId → SolutionVersion[] (최신순)
const MOCK_VERSIONS: Record<number, SolutionVersion[]> = {
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

// submissionId → SolutionComment[]
const MOCK_COMMENTS: Record<number, SolutionComment[]> = {
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

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));

// ──── Mock API 함수 ────

/**
 * [MOCK] 풀이 목록 — 사람 N명 반환 (사이드바)
 * TODO: GET /api/v1/workspaces/{wsId}/problem-boxes/{boxId}/problems/{workspaceProblemId}/solutions
 */
export async function getSolutionSummaries(
  _wsId: number,
  _boxId: number,
  _problemId: number,
): Promise<SolutionSummary[]> {
  await delay();
  return MOCK_SUMMARIES.map((s) => ({ ...s }));
}

/**
 * [MOCK] 그 사람의 제출 목록 — 최신순, 페이징 (< > 네비게이션)
 * size=1로 호출하면 1페이지 = 제출 코드 1건
 * TODO: GET /api/v1/workspaces/{wsId}/problem-boxes/{boxId}/problems/{workspaceProblemId}/solutions/{solutionId}/submissions?page&size
 */
export async function getSolutionVersions(
  _wsId: number,
  _boxId: number,
  _problemId: number,
  solutionId: number,
  page = 0,
  size = 1,
): Promise<PagedResult<SolutionVersion>> {
  await delay();
  const all = MOCK_VERSIONS[solutionId] ?? [];
  const totalElements = all.length;
  const totalPages = Math.max(1, Math.ceil(totalElements / size));
  const content = all.slice(page * size, page * size + size);
  return {
    content,
    page,
    size,
    totalElements,
    totalPages,
    first: page === 0,
    last: page >= totalPages - 1,
  };
}

/**
 * [MOCK] 댓글 목록 — submissionId 기준 (현재 보는 코드의 댓글)
 * TODO: GET /api/v1/workspaces/{wsId}/problem-boxes/{boxId}/problems/{workspaceProblemId}/solutions/{solutionId}/submissions/{submissionId}/comments
 */
export async function getSolutionComments(
  _wsId: number,
  _boxId: number,
  _problemId: number,
  _solutionId: number,
  submissionId: number,
): Promise<SolutionComment[]> {
  await delay();
  return [...(MOCK_COMMENTS[submissionId] ?? [])];
}

/**
 * [MOCK] 댓글 작성 — submissionId 기준
 * TODO: POST /api/v1/workspaces/{wsId}/problem-boxes/{boxId}/problems/{workspaceProblemId}/solutions/{solutionId}/submissions/{submissionId}/comments
 */
export async function createSolutionComment(
  _wsId: number,
  _boxId: number,
  _problemId: number,
  _solutionId: number,
  submissionId: number,
  content: string,
): Promise<SolutionComment> {
  await delay(200);
  const newComment: SolutionComment = {
    id: Date.now(),
    authorName: '나',
    content,
    createdAt: new Date().toISOString(),
  };
  if (!MOCK_COMMENTS[submissionId]) MOCK_COMMENTS[submissionId] = [];
  MOCK_COMMENTS[submissionId].push(newComment);
  // commentCount 동기화
  for (const versions of Object.values(MOCK_VERSIONS)) {
    const v = versions.find((v) => v.submissionId === submissionId);
    if (v) { v.commentCount = MOCK_COMMENTS[submissionId].length; break; }
  }
  return newComment;
}

/**
 * [MOCK] 댓글 삭제 — submissionId 기준
 * TODO: DELETE /api/v1/workspaces/{wsId}/problem-boxes/{boxId}/problems/{workspaceProblemId}/solutions/{solutionId}/submissions/{submissionId}/comments/{commentId}
 */
export async function deleteSolutionComment(
  _wsId: number,
  _boxId: number,
  _problemId: number,
  _solutionId: number,
  submissionId: number,
  commentId: number,
): Promise<void> {
  await delay(200);
  if (MOCK_COMMENTS[submissionId]) {
    MOCK_COMMENTS[submissionId] = MOCK_COMMENTS[submissionId].filter((c) => c.id !== commentId);
    for (const versions of Object.values(MOCK_VERSIONS)) {
      const v = versions.find((v) => v.submissionId === submissionId);
      if (v) { v.commentCount = MOCK_COMMENTS[submissionId].length; break; }
    }
  }
}

/**
 * [MOCK] 좋아요 — submissionId 기준 (현재 보는 코드에 좋아요)
 * TODO: PUT /api/v1/workspaces/{wsId}/problem-boxes/{boxId}/problems/{workspaceProblemId}/solutions/{solutionId}/submissions/{submissionId}/likes
 */
export async function likeSolution(
  _wsId: number,
  _boxId: number,
  _problemId: number,
  _solutionId: number,
  submissionId: number,
): Promise<SolutionLikeStatus> {
  await delay(200);
  for (const versions of Object.values(MOCK_VERSIONS)) {
    const v = versions.find((v) => v.submissionId === submissionId);
    if (v) {
      if (!v.isLiked) { v.isLiked = true; v.likes += 1; }
      return { likes: v.likes, isLiked: v.isLiked };
    }
  }
  throw new Error('제출을 찾을 수 없습니다.');
}

/**
 * [MOCK] 좋아요 취소 — submissionId 기준
 * TODO: DELETE /api/v1/workspaces/{wsId}/problem-boxes/{boxId}/problems/{workspaceProblemId}/solutions/{solutionId}/submissions/{submissionId}/likes
 */
export async function unlikeSolution(
  _wsId: number,
  _boxId: number,
  _problemId: number,
  _solutionId: number,
  submissionId: number,
): Promise<SolutionLikeStatus> {
  await delay(200);
  for (const versions of Object.values(MOCK_VERSIONS)) {
    const v = versions.find((v) => v.submissionId === submissionId);
    if (v) {
      if (v.isLiked) { v.isLiked = false; v.likes -= 1; }
      return { likes: v.likes, isLiked: v.isLiked };
    }
  }
  throw new Error('제출을 찾을 수 없습니다.');
}
