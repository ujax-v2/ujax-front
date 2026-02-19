# 시작하기 가이드 (Getting Started Guide)

이 가이드는 UJAX 프론트엔드 프로젝트의 개발 환경 설정을 돕습니다.

## 1. 전제 조건 (Prerequisites)

시작하기 전에 다음이 설치되어 있는지 확인하세요:
- **Node.js**: v18.0.0 이상
- **npm**: v9.0.0 이상
- **Git**: 최신 버전

## 2. 설치 (Installation)

저장소를 복제하고 의존성을 설치하세요:

```bash
git clone https://github.com/ujax-v2/ujax-front.git
cd ujax-front
npm install
```

## 3. 개발 서버 (Development Server)

로컬 개발 서버를 시작하세요:

```bash
npm run dev
```

- 기본적으로 앱은 `http://localhost:5173`에서 실행됩니다.
- 외부 기기(예: 모바일 테스트)에서 접속하려면 다음 명령어를 사용하세요:
  ```bash
  npm run dev -- --host 0.0.0.0
  ```

### 문제 해결: 포트 사용 중 (Troubleshooting: Port In Use)
`Port 5173 is in use`와 같은 에러가 보이면, Vite는 자동으로 다음 사용 가능한 포트(예: 5174)를 시도합니다.
멈춰있는 프로세스를 정리하려면:

**Windows (PowerShell):**
```powershell
Stop-Process -Name node -Force
```

**Mac/Linux:**
```bash
pkill -f node
```

## 4. 프로젝트 설정 (Project Configuration)

### 경로 별칭 (`@/`)
이 프로젝트는 **경로 별칭(Path Aliases)**을 사용합니다. 상대 경로 대신 `@/`를 사용하여 컴포넌트를 가져와야 합니다.
- `@/components` -> `src/components`
- `@/features` -> `src/features`
- `@/store` -> `src/store`

**예시:**
```tsx
// ✅ 올바름
import { Button } from '@/components/ui/button';

// ❌ 피해야 함
import { Button } from '../../../../components/ui/button';
```

### 환경 변수 (Environment Variables)
로컬 설정을 위해 루트 디렉토리에 `.env` 파일을 생성하세요 (`.env.example` 참고):

```env
VITE_API_BASE_URL=http://localhost:8080/api
```
(현재 프로젝트는 `mockData.ts`를 사용하므로, 백엔드 연동 전까지는 선택 사항입니다.)
