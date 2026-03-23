import type { components } from '@ujax/api-spec/types';
import { authFetch } from './client';

// ──── api-spec에서 가져올 수 있는 타입 ────

export type CreateBoardRequest = components['schemas']['CreateBoardRequest'];
export type UpdateBoardRequest = components['schemas']['UpdateBoardRequest'];
export type PinBoardRequest = components['schemas']['PinBoardRequest'];
export type CreateCommentRequest = components['schemas']['CreateCommentRequest'];

// BoardLikeStatus는 api-spec에 data 필드가 상세하게 정의되어 있음
type ApiBoardLikeStatus = components['schemas']['ApiResponse-BoardLikeStatus'];
export type BoardLikeStatusResponse = ApiBoardLikeStatus['data'];

// ──── 응답 data 내부 타입 (백엔드 subsectionWithPath 사용으로 api-spec에 미포함) ────

export type BoardType = 'FREE' | 'NOTICE' | 'QNA' | 'DATA';
export type MemberRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export interface BoardAuthorResponse {
  workspaceMemberId: number;
  nickname: string;
}

export interface BoardListItemResponse {
  boardId: number;
  workspaceId: number;
  type: BoardType;
  pinned: boolean;
  title: string;
  preview: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  myLike: boolean;
  author: BoardAuthorResponse;
  createdAt: string;
  updatedAt: string;
}

export interface BoardDetailResponse {
  boardId: number;
  workspaceId: number;
  type: BoardType;
  pinned: boolean;
  title: string;
  content: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  myLike: boolean;
  author: BoardAuthorResponse;
  createdAt: string;
  updatedAt: string;
}

export interface BoardListResponse {
  items: BoardListItemResponse[];
  page: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    first: boolean;
    last: boolean;
  };
}

export interface CommentResponse {
  boardCommentId: number;
  boardId: number;
  content: string;
  author: BoardAuthorResponse;
  createdAt: string;
}

export interface CommentListResponse {
  items: CommentResponse[];
  page: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    first: boolean;
    last: boolean;
  };
}

// ──── 태그 라벨 매핑 ────

export const BOARD_TYPE_LABEL: Record<BoardType, string> = {
  FREE: 'board.free',
  NOTICE: 'board.notice',
  QNA: 'board.qna',
  DATA: 'board.data',
};

export const LABEL_TO_BOARD_TYPE: Record<string, BoardType> = {
  'free': 'FREE',
  'notice': 'NOTICE',
  'question': 'QNA',
  'data': 'DATA',
};

// ──── 이미지 업로드 ────

export async function getBoardImagePresignedUrl(wsId: number, fileSize: number, contentType: string) {
  const res = await authFetch(`/api/v1/workspaces/${wsId}/boards/image/presigned-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileSize, contentType }),
  });
  return res.data as { presignedUrl: string; imageUrl: string };
}

// ──── 게시물 CRUD ────

function boardBase(wsId: number) {
  return `/api/v1/workspaces/${wsId}/boards`;
}

export async function getBoards(
  wsId: number,
  params?: {
    type?: BoardType;
    keyword?: string;
    page?: number;
    size?: number;
    sort?: string;
    pinnedFirst?: boolean;
  },
): Promise<BoardListResponse> {
  const q = new URLSearchParams();
  if (params?.type) q.set('type', params.type);
  if (params?.keyword) q.set('keyword', params.keyword);
  if (params?.page !== undefined) q.set('page', String(params.page));
  if (params?.size !== undefined) q.set('size', String(params.size));
  if (params?.sort) q.set('sort', params.sort);
  if (params?.pinnedFirst !== undefined) q.set('pinnedFirst', String(params.pinnedFirst));
  const qs = q.toString();
  const res = await authFetch(`${boardBase(wsId)}${qs ? `?${qs}` : ''}`);
  return res.data;
}

export async function getBoardDetail(wsId: number, boardId: number): Promise<BoardDetailResponse> {
  const res = await authFetch(`${boardBase(wsId)}/${boardId}`);
  return res.data;
}

export async function createBoard(wsId: number, data: CreateBoardRequest): Promise<BoardDetailResponse> {
  const res = await authFetch(boardBase(wsId), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function updateBoard(wsId: number, boardId: number, data: UpdateBoardRequest): Promise<BoardDetailResponse> {
  const res = await authFetch(`${boardBase(wsId)}/${boardId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function deleteBoard(wsId: number, boardId: number): Promise<void> {
  await authFetch(`${boardBase(wsId)}/${boardId}`, {
    method: 'DELETE',
  });
}

export async function pinBoard(wsId: number, boardId: number, pinned: boolean): Promise<void> {
  await authFetch(`${boardBase(wsId)}/${boardId}/pin`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pinned }),
  });
}

// ──── 좋아요 ────

export async function likeBoard(wsId: number, boardId: number): Promise<void> {
  await authFetch(`${boardBase(wsId)}/${boardId}/likes`, {
    method: 'PUT',
  });
}

export async function unlikeBoard(wsId: number, boardId: number): Promise<void> {
  await authFetch(`${boardBase(wsId)}/${boardId}/likes`, {
    method: 'DELETE',
  });
}

export async function getBoardLikeStatus(wsId: number, boardId: number): Promise<BoardLikeStatusResponse> {
  const res = await authFetch(`${boardBase(wsId)}/${boardId}/likes`);
  return res.data;
}

// ──── 댓글 ────

export async function getComments(
  wsId: number,
  boardId: number,
  params?: { page?: number; size?: number },
): Promise<CommentListResponse> {
  const q = new URLSearchParams();
  if (params?.page !== undefined) q.set('page', String(params.page));
  if (params?.size !== undefined) q.set('size', String(params.size));
  const qs = q.toString();
  const res = await authFetch(`${boardBase(wsId)}/${boardId}/comments${qs ? `?${qs}` : ''}`);
  return res.data;
}

export async function createComment(wsId: number, boardId: number, content: string): Promise<CommentResponse> {
  const res = await authFetch(`${boardBase(wsId)}/${boardId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  return res.data;
}

export async function deleteComment(wsId: number, boardId: number, commentId: number): Promise<void> {
  await authFetch(`${boardBase(wsId)}/${boardId}/comments/${commentId}`, {
    method: 'DELETE',
  });
}
