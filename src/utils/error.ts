/**
 * authFetch 에러에서 백엔드 detail 메시지를 추출한다 (CLAUDE.md 규칙).
 *
 * authFetch는 `throw new Error(`Request failed: ${status} ${body}`)` 형태로 throw하므로
 * message 안에 포함된 JSON에서 detail 필드를 파싱한다.
 */
export function parseApiError(err: unknown, fallback = '요청에 실패했습니다.'): string {
  const msg = (err as any)?.message || '';
  const jsonMatch = msg.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]).detail || fallback;
    } catch { /* ignore */ }
  }
  return fallback;
}
