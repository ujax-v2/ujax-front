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

// ══════════════════════════════════════════════
// 아래는 백엔드 미구현 API에 대한 Mock 정의입니다.
// 실제 API 연동 시 authFetch로 교체하세요.
// ══════════════════════════════════════════════

// ──── 타입 정의 ────

/** 풀이 단일 제출 버전 (< > 네비게이션 단위) */
export interface SolutionVersion {
  /** 백준 제출 번호 */
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
}

/** 풀이 상세 메타데이터 (버전/코드 미포함 — 별도 API로 조회) */
export interface SolutionDetail extends SolutionItem {
  /** 풀이 제목 (작성자가 붙인 설명) */
  title: string;
  /** 태그 목록 */
  tags: string[];
  /** 좋아요 수 */
  likes: number;
  /** 조회 수 */
  views: number;
  /** 내가 좋아요를 눌렀는지 */
  isLiked: boolean;
}

/** 풀이 댓글 */
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

const MOCK_SOLUTIONS: SolutionDetail[] = [
  {
    id: 1,
    submissionId: 12003,
    problemNumber: 1000,
    memberName: '알고리즘마스터',
    status: 'ACCEPTED',
    time: '80 ms',
    memory: '11456 KB',
    programmingLanguage: 'JAVA',
    codeLength: '298 B',
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    title: 'BufferedReader를 활용한 빠른 입출력',
    tags: ['Math', 'IO'],
    likes: 42,
    views: 128,
    isLiked: false,
  },
  {
    id: 2,
    submissionId: 12005,
    problemNumber: 1000,
    memberName: 'pythonista',
    status: 'ACCEPTED',
    time: '68 ms',
    memory: '31256 KB',
    programmingLanguage: 'PYTHON',
    codeLength: '38 B',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    title: 'Python 한 줄 코딩 (Short coding)',
    tags: ['Short', 'Math'],
    likes: 38,
    views: 95,
    isLiked: true,
  },
  {
    id: 3,
    submissionId: 12010,
    problemNumber: 1000,
    memberName: 'cppNinja',
    status: 'ACCEPTED',
    time: '0 ms',
    memory: '2020 KB',
    programmingLanguage: 'CPP',
    codeLength: '152 B',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    title: 'C++ ios_base::sync_with_stdio 입출력 최적화',
    tags: ['Performance', 'IO'],
    likes: 29,
    views: 150,
    isLiked: false,
  },
];

// 풀이별 제출 버전 목록 (최신순, index 0 = 최신)
const MOCK_VERSIONS: Record<number, SolutionVersion[]> = {
  1: [
    {
      submissionId: 12003,
      status: 'ACCEPTED',
      time: '80 ms',
      memory: '11456 KB',
      codeLength: '298 B',
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
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
      code: `#include <iostream>

int main() {
    int a, b;
    cin >> a >> b;
    cout << a + b;
}`,
    },
  ],
};

const MOCK_COMMENTS: Record<number, SolutionComment[]> = {
  1: [
    { id: 1, authorName: 'user123', content: '깔끔한 풀이네요! 배웠습니다.', createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
    { id: 2, authorName: 'coder99', content: 'Scanner 대신 BufferedReader를 쓰면 더 빠르지 않을까요?', createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString() },
  ],
  2: [
    { id: 3, authorName: 'beginner42', content: '한 줄로 되네요 신기하다', createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
  ],
  3: [],
};

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));

// ──── Mock API 함수 ────

/**
 * [MOCK] 풀이 상세 조회 (메타데이터만, 코드/버전 제외)
 * TODO: GET /api/v1/workspaces/{wsId}/problem-boxes/{boxId}/problems/{problemId}/solutions/{solutionId}
 */
export async function getSolutionDetail(
  _wsId: number,
  _boxId: number,
  _problemId: number,
  solutionId: number,
): Promise<SolutionDetail> {
  await delay();
  const found = MOCK_SOLUTIONS.find((s) => s.id === solutionId);
  if (!found) throw new Error('풀이를 찾을 수 없습니다.');
  return { ...found };
}

/**
 * [MOCK] 풀이 제출 버전 목록 조회 (최신순)
 * 프론트가 currentVersionIndex 상태로 < > 네비게이션 관리
 * TODO: GET /api/v1/workspaces/{wsId}/problem-boxes/{boxId}/problems/{problemId}/solutions/{solutionId}/versions
 */
export async function getSolutionVersions(
  _wsId: number,
  _boxId: number,
  _problemId: number,
  solutionId: number,
): Promise<SolutionVersion[]> {
  await delay();
  return [...(MOCK_VERSIONS[solutionId] ?? [])];
}

/**
 * [MOCK] 풀이 댓글 목록 조회
 * TODO: GET /api/v1/workspaces/{wsId}/problem-boxes/{boxId}/problems/{problemId}/solutions/{solutionId}/comments
 */
export async function getSolutionComments(
  _wsId: number,
  _boxId: number,
  _problemId: number,
  solutionId: number,
): Promise<SolutionComment[]> {
  await delay();
  return [...(MOCK_COMMENTS[solutionId] ?? [])];
}

/**
 * [MOCK] 풀이 댓글 작성
 * TODO: POST /api/v1/workspaces/{wsId}/problem-boxes/{boxId}/problems/{problemId}/solutions/{solutionId}/comments
 */
export async function createSolutionComment(
  _wsId: number,
  _boxId: number,
  _problemId: number,
  solutionId: number,
  content: string,
): Promise<SolutionComment> {
  await delay(200);
  const newComment: SolutionComment = {
    id: Date.now(),
    authorName: '나',
    content,
    createdAt: new Date().toISOString(),
  };
  if (!MOCK_COMMENTS[solutionId]) MOCK_COMMENTS[solutionId] = [];
  MOCK_COMMENTS[solutionId].push(newComment);
  return newComment;
}

/**
 * [MOCK] 풀이 댓글 삭제
 * TODO: DELETE /api/v1/workspaces/{wsId}/problem-boxes/{boxId}/problems/{problemId}/solutions/{solutionId}/comments/{commentId}
 */
export async function deleteSolutionComment(
  _wsId: number,
  _boxId: number,
  _problemId: number,
  solutionId: number,
  commentId: number,
): Promise<void> {
  await delay(200);
  if (MOCK_COMMENTS[solutionId]) {
    MOCK_COMMENTS[solutionId] = MOCK_COMMENTS[solutionId].filter((c) => c.id !== commentId);
  }
}

/**
 * [MOCK] 풀이 좋아요 상태 조회
 * TODO: GET /api/v1/workspaces/{wsId}/problem-boxes/{boxId}/problems/{problemId}/solutions/{solutionId}/likes
 */
export async function getSolutionLikeStatus(
  _wsId: number,
  _boxId: number,
  _problemId: number,
  solutionId: number,
): Promise<SolutionLikeStatus> {
  await delay(150);
  const found = MOCK_SOLUTIONS.find((s) => s.id === solutionId);
  if (!found) throw new Error('풀이를 찾을 수 없습니다.');
  return { likes: found.likes, isLiked: found.isLiked };
}

/**
 * [MOCK] 풀이 좋아요
 * TODO: PUT /api/v1/workspaces/{wsId}/problem-boxes/{boxId}/problems/{problemId}/solutions/{solutionId}/likes
 */
export async function likeSolution(
  _wsId: number,
  _boxId: number,
  _problemId: number,
  solutionId: number,
): Promise<SolutionLikeStatus> {
  await delay(200);
  const sol = MOCK_SOLUTIONS.find((s) => s.id === solutionId);
  if (!sol) throw new Error('풀이를 찾을 수 없습니다.');
  if (!sol.isLiked) { sol.isLiked = true; sol.likes += 1; }
  return { likes: sol.likes, isLiked: sol.isLiked };
}

/**
 * [MOCK] 풀이 좋아요 취소
 * TODO: DELETE /api/v1/workspaces/{wsId}/problem-boxes/{boxId}/problems/{problemId}/solutions/{solutionId}/likes
 */
export async function unlikeSolution(
  _wsId: number,
  _boxId: number,
  _problemId: number,
  solutionId: number,
): Promise<SolutionLikeStatus> {
  await delay(200);
  const sol = MOCK_SOLUTIONS.find((s) => s.id === solutionId);
  if (!sol) throw new Error('풀이를 찾을 수 없습니다.');
  if (sol.isLiked) { sol.isLiked = false; sol.likes -= 1; }
  return { likes: sol.likes, isLiked: sol.isLiked };
}
