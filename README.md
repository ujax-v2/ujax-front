# 📘 BOJ-IDE (Algorithm Sharing Platform)

React와 Recoil을 활용한 **알고리즘 문제 풀이 및 공유 플랫폼**입니다.
최신 웹 기술 스택을 기반으로 빠르고 직관적인 IDE 경험과 커뮤니티 기능을 제공합니다.

## 1. 🛠️ 기술 스택 (Tech Stack)

* **Core:** React 18, Vite, TypeScript
* **State & Routing:** Recoil (전역 상태 기반의 커스텀 페이지 라우팅 구현)
* **Styling:** Tailwind CSS, Radix UI (Headless UI), Lucide React (Icons)
* **Editor:** @monaco-editor/react (VS Code 기반 웹 에디터)
* **Visualization:** Recharts (데이터 시각화)

## 2. 🗂️ 프로젝트 구조 (Project Structure)

유지보수성과 확장성을 고려하여 **기능(Feature) 단위**로 디렉토리를 구조화했습니다.

```bash
src/
├── features/        # 핵심 기능 단위 컴포넌트
│   ├── ide/         # 웹 IDE (Monaco Editor 연동)
│   ├── dashboard/   # 대시보드 (통계 차트 및 활동 로그)
│   ├── community/   # 풀이 공유 및 토론 게시판
│   ├── problems/    # 문제 탐색 및 필터링
│   └── user/        # 사용자 프로필 및 설정
├── components/      # 공통 UI 컴포넌트
│   ├── ui/          # 버튼, 모달, 카드 등 (Radix UI 기반)
│   └── layout/      # 사이드바 등 레이아웃 컴포넌트
├── store/           # Recoil Atoms (네비게이션 및 전역 상태 관리)
└── App.tsx          # 메인 로직 및 Recoil 기반 라우팅 진입점
```

## 3. ✨ 주요 기능 (Key Features)
* 웹 통합 개발 환경 (Web IDE):

* * Monaco Editor를 내장하여 브라우저에서 실시간 코드 작성 및 실행

* * 문제 설명과 코드 에디터를 동시에 볼 수 있는 분할 뷰 제공

* * 대시보드 (Dashboard):

* * 사용자의 문제 풀이 현황, 티어(Tier), 경험치 시각화

* * 최근 활동 내역(Activity Log) 제공

* * 커뮤니티 (Community):

* * 다른 사용자들과 자신의 풀이 코드를 공유

* * 코드 리뷰 및 피드백을 주고받을 수 있는 댓글 시스템

* * 문제 탐색 (Problem Explorer):

* * 난이도, 태그, 해결 여부에 따른 문제 필터링 및 검색 기능

* * 반응형 레이아웃 (Responsive Layout):

* * 모바일 및 데스크톱 환경에 최적화된 사이드바 네비게이션