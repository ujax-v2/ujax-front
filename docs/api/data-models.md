# API 및 데이터 모델 (API & Data Models)

이 문서는 프론트엔드 애플리케이션이 기대하는 데이터 구조를 설명합니다.
백엔드 API는 호환성을 보장하기 위해 이 JSON 스키마를 준수해야 합니다.

## 1. 핵심 엔티티 (Core Entities)

### 사용자 (`User`)
인증된 사용자를 나타냅니다.

```json
{
  "id": "u1",
  "name": "JiHoon",
  "email": "jihoon@example.com",
  "avatar": "https://...",
  "role": "admin", // 선택 사항
  "workspaces": ["ws-1", "ws-2"] // 선택 사항 (가입된 워크스페이스 ID 목록)
}
```

### 워크스페이스 (`Workspace`)
중앙 조직 단위입니다.

```json
{
  "id": "ws-1",
  "name": "알고리즘 스터디 5기",
  "role": "admin", // 이 워크스페이스에서의 현재 사용자 역할 (admin | member)
  "members": 15,
  "description": "매일 알고리즘 연습 모임."
}
```

### 문제 (`Problem`)
개별 코딩 문제입니다.

```json
{
  "id": 1,
  "title": "Two Sum",
  "difficulty": "Easy", // Easy | Medium | Hard
  "acceptanceRate": "85%",
  "tags": ["Array", "Hash Table"],
  "isSolved": true // 현재 사용자의 해결 여부
}
```

### 챌린지 (`Challenge`)
워크스페이스 내의 게이미피케이션 학습 활동입니다.

```json
{
  "id": 101,
  "title": "30일 연속 챌린지",
  "participants": 42,
  "duration": "30 Days",
  "startDate": "2024-03-01",
  "status": "active", // active | recruiting | ended
  "reward": "Gold Badge"
}
```

## 2. 예상 API 엔드포인트 (Expected API Endpoints)

### 인증 (Authentication)
- `POST /api/auth/login`: JWT 토큰 및 사용자 정보 반환.
- `GET /api/auth/me`: 세션 유효성 검사 및 현재 사용자 반환.

### 워크스페이스 (Workspaces)
- `GET /api/workspaces`: 사용자가 가입한 워크스페이스 목록.
- `GET /api/workspaces/:wsId`: 상세 워크스페이스 정보.
- `GET /api/workspaces/explore`: 공개 워크스페이스 목록 (`WorkspaceExplore`용).

### 기능 (Features)
- `GET /api/problems`: 문제 목록 (필터 포함).
- `POST /api/solutions`: 풀이 제출.
