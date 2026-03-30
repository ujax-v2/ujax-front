export interface ApiProblemLike {
  title: string | null;
  status: number | null;
  detail: string | null;
}

function normalizeString(value: unknown) {
  return typeof value === 'string' ? value : null;
}

function normalizeNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function parseApiProblem(err: unknown): ApiProblemLike | null {
  if (err && typeof err === 'object') {
    const detail = normalizeString((err as { detail?: unknown }).detail);
    const title = normalizeString((err as { title?: unknown }).title);
    const status = normalizeNumber((err as { status?: unknown }).status);

    if (title || status !== null || detail) {
      return {
        detail: detail || normalizeString((err as { message?: unknown }).message),
        title,
        status,
      };
    }
  }

  const msg = (err as { message?: unknown })?.message;
  if (typeof msg !== 'string') return null;

  const jsonMatch = msg.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;

  try {
    const parsed = JSON.parse(jsonMatch[0]) as {
      title?: unknown;
      status?: unknown;
      detail?: unknown;
    };
    return {
      title: normalizeString(parsed.title),
      status: normalizeNumber(parsed.status),
      detail: normalizeString(parsed.detail),
    };
  } catch {
    return null;
  }
}

export function isMailSendFailure(problem: ApiProblemLike | null) {
  return problem?.status === 502 || problem?.title === 'E001';
}

/**
 * authFetch 에러에서 백엔드 detail 메시지를 추출한다 (CLAUDE.md 규칙).
 *
 * authFetch는 `throw new Error(`Request failed: ${status} ${body}`)` 형태로 throw하므로
 * message 안에 포함된 JSON에서 detail 필드를 파싱한다.
 */
export function parseApiError(err: unknown, fallback = '요청에 실패했습니다.'): string {
  return parseApiProblem(err)?.detail || fallback;
}
