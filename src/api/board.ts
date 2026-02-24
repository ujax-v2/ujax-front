import type { components } from '@ujax/api-spec/types';
import { authFetch } from './client';

// ──── api-spec 타입 re-export ────

export type PageInfo = components['schemas']['PageInfo'];
export type BoardType = components['schemas']['BoardType'];
export type BoardAuthorResponse = components['schemas']['BoardAuthorResponse'];
export type BoardListItemResponse = components['schemas']['BoardListItemResponse'];
export type BoardListResponse = components['schemas']['BoardListResponse'];
export type BoardDetailResponse = components['schemas']['BoardDetailResponse'];
export type BoardLikeStatusResponse = components['schemas']['BoardLikeStatusResponse'];
export type CreateBoardRequest = components['schemas']['CreateBoardRequest'];
export type UpdateBoardRequest = components['schemas']['UpdateBoardRequest'];
export type CommentResponse = components['schemas']['CommentResponse'];
export type CommentListResponse = components['schemas']['CommentListResponse'];

export type MemberRole = 'OWNER' | 'ADMIN' | 'MEMBER';

// ──── 태그 라벨 매핑 ────

export const BOARD_TYPE_LABEL: Record<BoardType, string> = {
  FREE: '자유',
  NOTICE: '공지',
  QNA: '질문',
  DATA: '자료',
};

export const LABEL_TO_BOARD_TYPE: Record<string, BoardType> = {
  '자유': 'FREE',
  '공지': 'NOTICE',
  '질문': 'QNA',
  '자료': 'DATA',
};

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
