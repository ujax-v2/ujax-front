# 라우팅 전략 (Routing Strategy)

UJAX는 `React Router`를 사용하여 클라이언트 사이드 라우팅을 처리합니다.
애플리케이션 라우팅은 **전역 스코프(Global Scope)**와 **워크스페이스 스코프(Workspace Scope)** 두 가지 주요 범위로 나뉩니다.

## 1. 전역 스코프 (`/`)
모든 사용자(로그인 또는 게스트)가 접근할 수 있거나, 특정 워크스페이스에 종속되지 않는 경로입니다.

- `/`: 랜딩 페이지 (Home)
- `/explore`: 공개 워크스페이스 탐색 (Public Workspace Explorer)
- `/login`, `/signup`: 사용자 인증 (Authentication)
- `/profile`: 사용자 프로필
- `/settings`: 전역 사용자 설정

## 2. 워크스페이스 스코프 (`/ws/:wsId/...`)
특정 워크스페이스 컨텍스트에 속하는 경로입니다.
`:wsId` 파라미터가 현재 워크스페이스를 결정합니다.

- `/ws/:wsId/dashboard`: 워크스페이스 대시보드
- `/ws/:wsId/problems`: 워크스페이스 내 문제 목록
- `/ws/:wsId/ide/:problemId`: 코딩 환경
- `/ws/:wsId/community`: 워크스페이스 전용 토론

### 구현 상세 (Implementation Details)
- **`src/App.tsx`**: 전체 라우트 트리를 정의합니다.
- **`WorkspaceScope` 컴포넌트**: URL에서 `:wsId`를 읽어 Recoil 아톰인 `currentWorkspaceState`와 동기화하는 래퍼 컴포넌트입니다.
- **`useWorkspaceNavigate` 훅**: 워크스페이스 내 네비게이션을 추상화한 커스텀 훅입니다. 개발자는 `/ws/${id}/path`를 수동으로 구성하는 대신 `toWs('path')`를 사용할 수 있습니다.

## 3. 리다이렉트 처리 (Redirect Handling)
- **인증 리다이렉트**: 사용자가 로그인하지 않은 경우, `ProtectedRoute`가 `/login`으로 리다이렉트합니다.
- **워크스페이스 검증**: `WorkspaceScope`는 사용자가 요청한 워크스페이스의 멤버인지 확인합니다. 멤버가 아니라면 접근이 거부됩니다(에러 페이지).
- **레거시 경로 지원**: 구버전 경로(예: `/dashboard`)는 `RedirectToWorkspace` 컴포넌트를 통해 사용자의 기본 워크스페이스로 리다이렉트됩니다.
