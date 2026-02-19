# 워크스페이스 스코프 아키텍처

> 작성일: 2026-02-14
> 상태: 구현 중

---

## 1. 배경

### 논의 과정
- 좌측 사이드바의 "워크스페이스, 문제, 커뮤니티"가 **워크스페이스별로 독립적**인지 논의
- 백엔드 코드를 분석한 결과, `Problem`은 현재 글로벌 (Workspace FK 없음)
- 하지만 `Workspace`와 `WorkspaceMember`는 완전히 구현되어 있음

### 결정
**"문제 자체는 글로벌이지만, 워크스페이스에서 다루는 문제 목록은 독립적"**

---

## 2. 도메인 모델

```
┌─ 글로벌 (모든 워크스페이스 공유) ─────────────────┐
│                                                   │
│  Problem (백준 문제 원본 데이터)                     │
│    - id, problemNumber, title, tier                │
│    - description, inputDesc, outputDesc            │
│    - samples, algorithmTags                        │
│                                                   │
│  User / Auth                                      │
│  Settings / Profile                               │
└───────────────────────────────────────────────────┘

┌─ 워크스페이스 스코프 (WS마다 독립) ──────────────┐
│                                                   │
│  WorkspaceProblem (WS에 등록된 문제)                │
│    - workspace_id → Workspace                     │
│    - problem_id → Problem (글로벌)                 │
│    - 상태, 우선순위 등 WS별 메타데이터               │
│                                                   │
│  Dashboard (WS의 현황)                             │
│  Community (WS의 게시판)                            │
│  Challenge (WS의 챌린지)                            │
└───────────────────────────────────────────────────┘
```

### 왜 이 구조인가?
- **Problem을 글로벌로 유지하는 이유**: 동일한 백준 문제를 여러 워크스페이스에서 중복 저장할 필요가 없음
- **WorkspaceProblem으로 연결하는 이유**: 각 스터디/팀마다 "우리가 다루는 문제"가 다름
- **커뮤니티가 WS 스코프인 이유**: 같은 팀 내에서만 의미있는 토론/질문이 가능

---

## 3. 라우트 구조

### Before (플랫)
```
/dashboard
/problems
/community
/challenges
/settings
/profile
/ide/:problemId
/problems/:id/solutions
```

### After (WS 스코프)
```
# 워크스페이스 스코프 (사이드바 있음)
/ws/:wsId/dashboard          → WS 대시보드
/ws/:wsId/problems           → WS 문제 목록
/ws/:wsId/problems/register  → 문제 등록 (글로벌 DB에서 가져와서 WS에 추가)
/ws/:wsId/community          → WS 커뮤니티
/ws/:wsId/challenges         → WS 챌린지

# 글로벌 (사이드바 있음)
/settings                    → 계정/WS 설정
/profile                     → 프로필

# 글로벌 (사이드바 없음, 전체화면)
/ide/:problemId              → IDE
/problems/:id/solutions      → 풀이 목록

# 공개 (사이드바 없음)
/                            → 홈
/login                       → 로그인
/signup                      → 회원가입
```

### 워크스페이스 전환 시 동작
1. 사이드바에서 다른 WS를 선택하면 → `/ws/:newWsId/dashboard`로 이동
2. 사이드바 메뉴 클릭 시 → 현재 wsId를 유지한 채 해당 페이지로 이동
3. URL의 wsId가 바뀌면 → 자동으로 `currentWorkspaceState`도 동기화

---

## 4. 프론트엔드 구현 계획

### Phase 1: 라우트 리팩터링 (현재)
- [ ] App.tsx 라우트를 `/ws/:wsId/...` 구조로 변경
- [ ] Sidebar.tsx 메뉴 링크에 wsId 포함
- [ ] 워크스페이스 전환 시 URL 이동 로직
- [ ] wsId를 URL에서 읽어 currentWorkspaceState와 동기화

### Phase 2: 데이터 스코프 적용
- [ ] mockData를 워크스페이스별로 분리
- [ ] Dashboard에서 현재 WS 데이터만 표시
- [ ] ProblemList에서 현재 WS 문제만 표시
- [ ] Community에서 현재 WS 게시글만 표시

### Phase 3: 백엔드 연동 (향후)
- [ ] BE에 WorkspaceProblem 엔티티/API 추가
- [ ] `GET /api/v1/workspaces/{wsId}/problems` 연동
- [ ] `POST /api/v1/workspaces/{wsId}/problems` (문제 추가) 연동

---

## 5. 백엔드 참고 (현재 상태)

### 구현 완료
- Workspace CRUD
- WorkspaceMember (OWNER/MANAGER/MEMBER 역할)
- 멤버 초대/추방/탈퇴/닉네임 변경
- Problem 글로벌 CRUD

### 미구현 (향후 필요)
- WorkspaceProblem (WS-Problem 연결 테이블)
- WS 스코프 커뮤니티, 챌린지
