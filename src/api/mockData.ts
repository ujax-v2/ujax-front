export const MOCK_USER = {
    id: 1,
    email: 'test@example.com',
    name: '테스트 유저',
    avatar: 'Avatar 1',
    role: 'USER',
};

// Basic base64 encoded JSON for JWT payload: {"name":"Test User","email":"test@example.com"}
// Using ASCII-only characters avoids 'atob' decoding issues in the frontend
const payload = JSON.stringify({ name: 'Test User', email: 'test@example.com', sub: '1' });
const MOCK_JWT_PAYLOAD = btoa(payload);
const MOCK_JWT = `header.${MOCK_JWT_PAYLOAD}.signature`;

export const MOCK_AUTH = {
    accessToken: MOCK_JWT,
    refreshToken: 'mock-refresh-token',
    user: MOCK_USER,
};

export const MOCK_WORKSPACES = [
    { id: 1, name: '알고리즘 스터디 A', description: '백준 실버~골드 문제 풀이', createdAt: '2024-01-01' },
    { id: 2, name: '삼성 역량테스트 대비', description: '기출문제 위주', createdAt: '2024-02-15' },
];

export const MOCK_PROBLEMS = [
    { id: 1000, title: 'A+B', difficulty: 'Bronze', tier: 5, tags: ['Math', 'Implementation'], solved: true },
    { id: 1001, title: 'A-B', difficulty: 'Bronze', tier: 5, tags: ['Math'], solved: false },
    { id: 1920, title: '수 찾기', difficulty: 'Silver', tier: 4, tags: ['Search', 'Binary Search'], solved: true },
];

export const MOCK_SOLUTIONS = [
    { id: 1, problemId: 1920, userId: 1, userName: '테스트 유저', code: 'print("hello")', language: 'Python', createdAt: '2024-03-01' },
];
