# Frontend Style Guide & Conventions

이 문서는 UJAX 프론트엔드 프로젝트의 코드 스타일과 컨벤션을 정의합니다. 일관된 코드 품질을 유지하기 위해 모든 개발자는 이 가이드를 따라야 합니다.

## 1. Naming Conventions

### 1.1 Files & Directories
- **React Components**: PascalCase 사용 (e.g., `ProblemList.tsx`, `Sidebar.tsx`)
- **Hooks**: camelCase, `use` 접두사 사용 (e.g., `useWorkspaceNavigate.ts`)
- **Utilities/Helpers**: camelCase (e.g., `formatDate.ts`)
- **Constants/Types**: PascalCase 또는 camelCase (e.g., `types.ts`, `constants.ts`)

### 1.2 Variables & Functions
- **Variables**: camelCase (e.g., `isLoading`, `userData`)
- **Functions**: camelCase (e.g., `handleClick`, `fetchData`)
- **Components**: PascalCase (e.g., `function Button() {}`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_RETRY_COUNT`, `API_BASE_URL`)

### 1.3 Interface & Types
- **Interfaces**: PascalCase. `I` 접두사를 사용하지 않음 (e.g., `User`, `Problem`)
- **Props**: `[ComponentName]Props` 형식을 권장 (e.g., `ButtonProps`)

## 2. Directory Structure

프로젝트는 기능(Feature) 기반 구조를 따릅니다.

```
src/
├── api/            # API 호출 함수 및 Mock Data
├── components/     # 재사용 가능한 UI 컴포넌트
│   ├── ui/         # 기본 UI 요소 (Button, Input 등)
│   ├── layout/     # 레이아웃 관련 (Sidebar, Navbar)
│   ├── common/     # 도메인 무관 공통 컴포넌트 (ErrorBoundary 등)
│   └── modals/     # 전역 모달
├── features/       # 비즈니스 로직이 포함된 기능별 페이지 컴포넌트
│   ├── auth/       # 인증 (로그인, 회원가입)
│   ├── dashboard/  # 대시보드
│   ├── problems/   # 문제 은행
│   └── ...
├── hooks/          # 커스텀 훅
├── store/          # 전역 상태 (Recoil Atoms)
└── utils/          # 유틸리티 함수
```

## 3. Import & Export

### 3.1 Path Aliases (절대 경로)
상대 경로(`../../`) 대신 **절대 경로 별칭(`@/`)**을 사용해야 합니다.
- `tsconfig.json`과 `vite.config.ts`에 설정되어 있습니다.

**Bad:**
```tsx
import { Button } from '../../components/ui/Base';
```

**Good:**
```tsx
import { Button } from '@/components/ui/Base';
```

### 3.2 Exports
- 컴포넌트는 되도록 **Named Export**를 권장합니다. (`export const Component = ...` or `export function Component...`)
- 페이지 컴포넌트(Route Element)는 `export default`를 사용할 수 있습니다.

## 4. Component Structure

### 4.1 Single Responsibility
- 하나의 파일에는 하나의 컴포넌트만 정의하는 것을 원칙으로 합니다.
- 예외: 밀접하게 관련된 작은 하위 컴포넌트 (e.g. `Compound Pattern`)

### 4.2 Legacy Code (`components/ui/Base.tsx`)
- `components/ui/Base.tsx` 파일은 여러 UI 컴포넌트(`Button`, `Card`, `Badge` 등)가 뭉쳐 있는 레거시 파일입니다.
- **새로운 기능 개발 시**: `components/ui/` 폴더 내의 개별 Shadcn UI 파일(`button.tsx`, `card.tsx` 등)을 사용하는 것을 권장합니다.
- 점진적으로 `Base.tsx` 의존성을 제거할 예정입니다.

## 5. State Management (Recoil)
- 전역 상태는 `src/store/atoms.ts`에 정의합니다.
- 상태의 스코프(Scope)를 명확히 해야 합니다 (워크스페이스별 상태 vs 글로벌 사용자 상태).

## 6. CSS & Styling
- **Tailwind CSS**를 기본 스타일링 도구로 사용합니다.
- 복잡한 클래스 조합은 `clsx` 또는 `cn` 유틸리티를 사용하여 가독성을 높입니다.
