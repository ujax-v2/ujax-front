# CLAUDE.md — ujax-front 프로젝트 컨벤션

## API 에러 처리 규칙

### 백엔드 에러 응답 형식 (RFC 7807 Problem Details)

백엔드는 에러 시 아래 JSON 형태로 응답한다:

```json
{
  "type": "/docs/index.html#error-code-list",
  "title": "U003",
  "status": 422,
  "detail": "워크스페이스 소유자는 탈퇴할 수 없습니다. 소유권을 양도하거나 워크스페이스를 삭제해 주세요.",
  "instance": "/api/v1/users/me",
  "exception": "BusinessRuleViolationException",
  "timestamp": "2026-02-19T20:07:59.012068"
}
```

### authFetch 에러 전달 방식

`src/api/client.ts`의 `authFetch`는 `!res.ok`일 때 아래 형태로 throw한다:

```ts
throw new Error(`Request failed: ${res.status} ${body}`);
// body는 위 JSON을 문자열화한 것
```

### UI에서의 에러 메시지 추출 규칙

**사용자에게 에러를 표시할 때는 반드시 `detail` 필드를 파싱하여 보여준다.**
raw 에러 메시지(`Request failed: 422 {...}`)를 그대로 노출하지 않는다.

표준 파싱 패턴:

```ts
} catch (err: any) {
  const msg = err?.message || '';
  const jsonMatch = msg.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      setError(parsed.detail || '요청에 실패했습니다.');
    } catch {
      setError('요청에 실패했습니다.');
    }
  } else {
    setError('요청에 실패했습니다.');
  }
}
```

- `parsed.detail` → 사용자에게 표시할 메시지
- `parsed.title` → 에러 코드 (e.g. `U003`), 로깅/디버깅용
- `parsed.status` → HTTP 상태 코드
- JSON 파싱 실패 시 → 일반 fallback 메시지 사용

### 적용 범위

이 규칙은 `authFetch`를 사용하는 **모든 API 호출의 catch 블록**에 적용한다:
- 폼 저장 실패
- 삭제 요청 실패
- 생성/수정 요청 실패
- 기타 모든 사용자 대면 에러 처리
