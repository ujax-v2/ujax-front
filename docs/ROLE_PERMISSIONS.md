# 역할별 권한 정의 (Role-Based Access Control)

## 역할 종류

| 역할 | 설명 |
|------|------|
| `OWNER` | 워크스페이스 소유자. 모든 권한 보유 |
| `ADMIN` | 관리자. 콘텐츠 관리 권한 보유 |
| `MANAGER` | 문제집 관리 권한만 추가로 보유 |
| `MEMBER` | 일반 멤버. 조회 및 본인 콘텐츠만 관리 |

---

## 모듈별 권한 상세

### 워크스페이스 설정

| 기능 | OWNER | ADMIN | MANAGER | MEMBER |
|------|:-----:|:-----:|:-------:|:------:|
| 워크스페이스 이름/설명/이미지 수정 | ✅ | ❌ | ❌ | ❌ |
| Mattermost 웹훅 URL 수정 | ✅ | ❌ | ❌ | ❌ |
| 워크스페이스 삭제 | ✅ | ❌ | ❌ | ❌ |

**구현 위치:** `src/features/user/settings/WsGeneralTab.tsx`
**권한 변수:** `isOwner = myRole === 'OWNER'`

---

### 멤버 관리

| 기능 | OWNER | ADMIN | MANAGER | MEMBER |
|------|:-----:|:-----:|:-------:|:------:|
| 멤버 초대 | ✅ | ❌ | ❌ | ❌ |
| 멤버 역할 변경 | ✅ | ❌ | ❌ | ❌ |
| 멤버 추방 | ✅ | ❌ | ❌ | ❌ |

**구현 위치:** `src/features/user/settings/WsMembersTab.tsx`
**권한 조건:** `canManage = myRole === 'OWNER' && !isMe && role !== 'OWNER'`

> OWNER는 다른 OWNER의 역할은 변경/추방 불가.

---

### 커뮤니티 - 게시글

| 기능 | OWNER | ADMIN | MANAGER | MEMBER |
|------|:-----:|:-----:|:-------:|:------:|
| 자유/QNA/데이터 게시글 작성 | ✅ | ✅ | ✅ | ✅ |
| 본인 게시글 수정 | ✅ | ✅ | ✅ | ✅ |
| 본인 게시글 삭제 | ✅ | ✅ | ✅ | ✅ |
| 타인 게시글 삭제 | ✅ | ✅ | ❌ | ❌ |
| 공지(NOTICE) 게시글 작성 | ✅ | ❌ | ❌ | ❌ |
| 공지 게시글 고정(PIN) | ✅ | ❌ | ❌ | ❌ |

**구현 위치:**
- `src/features/community/PostCreate.tsx` — `availableTags` 조건
- `src/features/community/PostDetail.tsx` — `canManage`, `canDelete`, `canPin` 변수
- `src/features/community/PostEdit.tsx` — `availableTags` 조건

**권한 변수:**
```ts
const canManage = myRole === 'OWNER' || myRole === 'ADMIN';
const canDelete = isAuthor || canManage;
const canPin = myRole === 'OWNER' && post?.type === 'NOTICE';
```

---

### 커뮤니티 - 댓글

| 기능 | OWNER | ADMIN | MANAGER | MEMBER |
|------|:-----:|:-----:|:-------:|:------:|
| 댓글 작성 | ✅ | ✅ | ✅ | ✅ |
| 본인 댓글 삭제 | ✅ | ✅ | ✅ | ✅ |
| 타인 댓글 삭제 | ✅ | ✅ | ❌ | ❌ |

**구현 위치:** `src/features/community/PostDetail.tsx`

---

### 문제집 (Problems)

| 기능 | OWNER | ADMIN | MANAGER | MEMBER |
|------|:-----:|:-----:|:-------:|:------:|
| 문제집 목록 조회 | ✅ | ✅ | ✅ | ✅ |
| 문제 조회 | ✅ | ✅ | ✅ | ✅ |
| 문제집 생성 | ✅ | ✅ | ✅ | ❌ |
| 문제집 수정 | ✅ | ✅ | ✅ | ❌ |
| 문제집 삭제 | ✅ | ✅ | ✅ | ❌ |
| 문제 등록/수정/삭제 | ✅ | ✅ | ✅ | ❌ |
| "첫 문제집 만들기" 빈 상태 표시 | ✅ | ✅ | ✅ | ❌ |

**구현 위치:** `src/features/problems/ProblemList.tsx`
**권한 변수:** `canManage = myRole === 'OWNER' || myRole === 'ADMIN' || myRole === 'MANAGER'`

---

## 권한 확인 패턴

### 역할 조회

모든 컴포넌트에서 아래 API로 현재 유저의 역할을 가져온다:

```ts
// src/api/workspace.ts
getMyMembership(workspaceId) // → { role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'MEMBER' }
```

### 전역 상태

```ts
// src/store/atoms.ts
export const myWorkspaceRoleState = atom<string>({
  key: 'myWorkspaceRoleState',
  default: 'MEMBER',
});
```

### 권한 변수 패턴 (컴포넌트 로컬)

```ts
type MemberRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'MEMBER';
const [myRole, setMyRole] = useState<MemberRole>('MEMBER');

// 모듈에 따라 조합이 다름
const isOwner    = myRole === 'OWNER';
const canManage  = myRole === 'OWNER' || myRole === 'ADMIN';               // 커뮤니티
const canManage  = myRole === 'OWNER' || myRole === 'ADMIN' || myRole === 'MANAGER'; // 문제집
```

---

## 역할 위계 요약

```
OWNER
  └─ 워크스페이스 전체 제어 (설정, 멤버, 공지, 고정)
ADMIN
  └─ 콘텐츠 관리 (타인 게시글/댓글 삭제)
MANAGER
  └─ 문제집 관리 (문제집/문제 CRUD)
MEMBER
  └─ 조회, 본인 게시글/댓글 작성·삭제
```
