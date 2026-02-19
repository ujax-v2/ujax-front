# 시스템 개요 (System Overview)

UJAX 프론트엔드는 확장성과 성능을 고려하여 설계된 현대적인 웹 애플리케이션입니다.
알고리즘 학습과 지식 공유를 위한 다양한 기능을 제공합니다.

## 기술 스택 (Tech Stack)

- **프레임워크**: `React` + `TypeScript`
- **빌드 도구**: `Vite` (빠른 HMR 및 최적화된 빌드)
- **스타일링**: `Tailwind CSS` + `clsx` + `tailwind-merge`
- **상태 관리**: `Recoil` (Atomic State)
- **라우팅**: `React Router v7`
- **UI 컴포넌트**: `Lucide React` (아이콘), `Radix UI` (버튼/모달 등의 Headless Primitives)
  - 레거시 UI: `Base.tsx` (커스텀 구현)
  - 최신 UI: `Shadcn UI` (개별 파일 컴포넌트)

## 핵심 기능 (Key Features)

1. **워크스페이스 시스템 (Workspace System)**: 단일 앱 내 다중 테넌트(Multi-tenant) 아키텍처. 각 사용자는 여러 워크스페이스를 가질 수 있습니다.
2. **알고리즘 IDE (Algorithm IDE)**: Monaco Editor 통합, 문제 해결 환경 제공.
3. **문제 은행 (Problem Bank)**: 문제 탐색, 풀이, 등록 기능.
4. **커뮤니티 (Community)**: 질의응답 및 풀이 공유.
5. **게이미피케이션 (Gamification)**: 챌린지, 배지, 기여도 그래프(Contribution Graph).

## 아키텍처 결정 사항 (Architectural Decisions)

### 1. 기능 기반 아키텍처 (Feature-Sliced Architecture)
기술 계층(Layer)이 아닌 도메인(기능)별로 코드를 구성합니다. 이는 관련된 로직을 한곳에 모아 코드 탐색과 유지보수를 용이하게 합니다.

### 2. Recoil을 이용한 상태 관리 (Recoil for State Management)
세밀한 업데이트(예: 특정 워크스페이스 상태, 사용자 세션)가 필요한 요구사항에 적합한 아토믹(Atomic) 모델을 제공하는 Recoil을 사용합니다. 상태(Atoms)는 `src/store/atoms.ts`에 정의되어 있습니다.

### 3. Tailwind CSS 스타일링
빠른 개발과 일관성을 위해 유틸리티 우선(Utility-first) CSS를 사용합니다.
