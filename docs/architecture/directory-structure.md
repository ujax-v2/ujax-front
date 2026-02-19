# 디렉토리 구조 개요 (Directory Structure Overview)

UJAX 프론트엔드 프로젝트는 **기능 우선 아키텍처 (Feature-First Architecture)**를 따릅니다.
이 구조는 파일 유형이 아닌 비즈니스 기능(Business Features)을 기준으로 코드를 구성하여 확장성과 유지보수성을 보장합니다.

## 1. 최상위 구조 (Top-Level Structure)

```
ujax-front/
├── dist/               # 프로덕션 빌드 결과물 (Production build output)
├── public/             # 정적 자산 (파비콘, 로고 등)
├── src/                # 메인 소스 코드
├── docs/               # 아키텍처, 가이드, API 문서
├── .gitignore          # Git 무시 설정
├── index.html          # 진입점 HTML 파일
├── package.json        # 의존성 및 스크립트
├── tsconfig.json       # TypeScript 설정 (경로 별칭 @/ 포함)
├── vite.config.ts      # Vite 설정
└── ...
```

## 2. 소스 코드 (`src/`)

### 2.1 핵심 디렉토리 (Core Directories)
- **`api/`**: API 연동 계층 (API integration layer). (현재 `mockData.ts` 포함)
  - Axios/Fetch 래퍼 및 엔드포인트 정의가 위치해야 합니다.
- **`components/`**: 재사용 가능한 UI 컴포넌트.
  - `ui/`: 디자인 시스템 컴포넌트 (버튼, 모달, 카드 등).
    - 레거시(`Base.tsx`)와 최신 Shadcn UI 개별 파일들이 공존.
  - `layout/`: 전역 레이아웃 컴포넌트 (`Sidebar`, `Navbar`).
  - `common/`: 비즈니스 로직과 무관한 공통 컴포넌트 (`ErrorBoundary`).
  - `modals/`: 전역 모달 (`CreateWorkspaceModal`).
- **`features/`**: 기능별 구현 (페이지 및 컴포넌트).
  - `auth/`: 인증 로직 (`Login`, `SignUp`).
  - `home/`: 랜딩 페이지 (`Home`).
  - `explore/`: 공개 워크스페이스 탐색 (`WorkspaceExplore`).
  - `dashboard/`: 워크스페이스 대시보드 (`Dashboard`).
  - `ide/`: 코드 에디터 환경 (`IDE`).
  - `problems/`: 문제 은행 및 제출 (`ProblemList`, `ProblemRegistration`).
  - `community/`: 질의응답 및 토론 (`Community`).
  - `challenges/`: 게이미피케이션 챌린지 (`ChallengeList` 등).
  - `user/`: 사용자 설정 (`Profile`, `Settings`).
- **`hooks/`**: 커스텀 React 훅.
  - `useWorkspaceNavigate.ts`: 워크스페이스 범위 내 라우팅 헬퍼.
- **`store/`**: 전역 상태 관리.
  - `atoms.ts`: Recoil 아톰(Atoms) 정의.
- **`utils/`**: 헬퍼 함수 및 유틸리티.

### 2.2 주요 파일 (Key Files)
- **`App.tsx`**: 메인 애플리케이션 컴포넌트, **라우팅 정의**.
- **`main.tsx`**: 애플리케이션 진입점, 프로바이더 설정 (`RecoilRoot`, `ErrorBoundary`).
- **`index.css`**: 전역 스타일 및 Tailwind 지시어.

## 3. 구성 원칙 (Organizational Principles)

### 기능 기반 구성 (`src/features`)
- 유형별 그룹화(`components/Page1`, `api/Page1`) 대신, 특정 기능과 관련된 모든 코드를 `src/features/<feature-name>`에 함께 배치합니다.
- 각 기능 폴더는 해당 기능 내에서만 사용되는 컴포넌트, 훅, 타입을 포함해야 합니다.

### 공유 UI (`src/components/ui`)
- 아토믹 디자인(Atomic Design) 컴포넌트가 이곳에 위치합니다.
- 이 컴포넌트들은 **특정 기능이나 비즈니스 로직에 의존성을 가져서는 안 됩니다**.

### 전역 상태 (`src/store`)
- 여러 기능 간에 공유되는 상태는 Recoil 아톰을 사용합니다.
- 아톰을 활용하여 불필요한 속성 전달(Prop Drilling)을 피합니다.
