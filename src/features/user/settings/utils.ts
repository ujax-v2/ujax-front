/** authFetch 에러에서 detail 메시지를 추출한다 (CLAUDE.md 규칙) */
export const extractErrorDetail = (err: any, fallback: string): string => {
  const msg = err?.message || '';
  const jsonMatch = msg.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]).detail || fallback;
    } catch { /* ignore */ }
  }
  return fallback;
};
