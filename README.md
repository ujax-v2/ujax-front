📘 BOJ-IDE (Algorithm Sharing Platform)
React와 Recoil을 활용한 알고리즘 문제 풀이 및 공유 플랫폼입니다.

1. 🛠️ 기술 스택 (Tech Stack)
Core: React 18, Vite, TypeScript

State & Routing: Recoil (전역 상태 기반 페이지 라우팅)

Styling: Tailwind CSS, Radix UI, Lucide React

Key Libs: @monaco-editor/react (웹 IDE), recharts (데이터 시각화)

2. 🗂️ 프로젝트 구조 (Project Structure)
프로젝트는 기능(Feature) 단위로 코드를 분리하는 Feature-based Folder Structure를 따르고 있으며, UI 컴포넌트와 비즈니스 로직이 명확히 분리되어 있습니다.

Bash
boj-ide/
├── public/              # 정적 에셋
├── src/
│   ├── assets/          # 이미지 및 미디어 파일
│   ├── components/      # 재사용 가능한 공통 컴포넌트
│   │   ├── layout/      # 레이아웃 컴포넌트 (Sidebar 등)
│   │   └── ui/          # Radix UI 기반의 기본 UI 요소 (Button, Card, Modal 등)
│   ├── features/        # 페이지/기능별 핵심 로직 및 컴포넌트
│   │   ├── community/   # 커뮤니티 및 솔루션 공유 기능
│   │   ├── dashboard/   # 대시보드 (통계, 차트)
│   │   ├── ide/         # 웹 IDE (Monaco Editor 연동)
│   │   ├── problems/    # 문제 목록 및 필터링
│   │   └── user/        # 사용자 프로필 및 설정
│   ├── store/           # 전역 상태 관리 (Recoil Atoms)
│   ├── styles/          # 전역 스타일 (Tailwind CSS 설정 등)
│   ├── App.tsx          # 메인 라우팅 로직 (Recoil 기반 Page Switching)
│   └── main.tsx         # 진입점 (Entry Point)
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts

3. ✨ 주요 기능 (Features)
웹 IDE: Monaco Editor를 내장하여 브라우저에서 직접 코드 작성 및 실행

대시보드: 문제 풀이 현황 및 티어/경험치 시각화

커뮤니티: 풀이 코드 공유 및 상호 피드백

문제 탐색: 난이도/태그별 문제 필터링 및 검색

반응형 레이아웃: 모바일/데스크톱 환경 지원 (Sidebar Toggle)