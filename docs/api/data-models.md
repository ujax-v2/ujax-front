# API & Data Models (Frontend Specs)

This document outlines the data structures expected by the Frontend application.
Backend APIs should adhere to these JSON schemas to ensure compatibility.

## 1. Core Entities

### User (`User`)
Represents the authenticated user.

```json
{
  "id": "u1",
  "name": "JiHoon",
  "email": "jihoon@example.com",
  "avatar": "https://...",
  "role": "admin", // optional
  "workspaces": ["ws-1", "ws-2"] // optional (list of joined workspace IDs)
}
```

### Workspace (`Workspace`)
The central organizational unit.

```json
{
  "id": "ws-1",
  "name": "Algorithm Study 5th",
  "role": "admin", // current user's role in this workspace (admin | member)
  "members": 15,
  "description": "Daily algorithm practice group."
}
```

### Problem (`Problem`)
Individual coding problem.

```json
{
  "id": 1,
  "title": "Two Sum",
  "difficulty": "Easy", // Easy | Medium | Hard
  "acceptanceRate": "85%",
  "tags": ["Array", "Hash Table"],
  "isSolved": true // status for current user
}
```

### Challenge (`Challenge`)
Gamified learning activity within a workspace.

```json
{
  "id": 101,
  "title": "30-Day Streak",
  "participants": 42,
  "duration": "30 Days",
  "startDate": "2024-03-01",
  "status": "active", // active | recruiting | ended
  "reward": "Gold Badge"
}
```

## 2. Expected API Endpoints

### Authentication
- `POST /api/auth/login`: Returns JWT token & user info.
- `GET /api/auth/me`: Validates session & returns current user.

### Workspaces
- `GET /api/workspaces`: List user's joined workspaces.
- `GET /api/workspaces/:wsId`: Get detailed workspace info.
- `GET /api/workspaces/explore`: List public workspaces (for `WorkspaceExplore`).

### Features
- `GET /api/problems`: List problems (with filters).
- `POST /api/solutions`: Submit a solution.
