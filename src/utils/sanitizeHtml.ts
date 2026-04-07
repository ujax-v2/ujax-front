const DANGEROUS_TAG_SELECTOR = [
  'script',
  'iframe',
  'object',
  'embed',
  'form',
  'style',
  'link',
  'meta',
  'base',
].join(',');

function isDangerousUrl(value: string) {
  const normalized = value.trim().toLowerCase();
  return normalized.startsWith('javascript:') || normalized.startsWith('data:text/html');
}

export function sanitizeProblemHtml(input: string | null | undefined): string {
  const rawHtml = String(input || '').trim();
  if (!rawHtml) return '';
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') return rawHtml;

  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${rawHtml}</div>`, 'text/html');
  const container = doc.body.firstElementChild;
  if (!container) return '';

  container.querySelectorAll(DANGEROUS_TAG_SELECTOR).forEach((el) => el.remove());

  container.querySelectorAll('*').forEach((el) => {
    for (const attr of [...el.attributes]) {
      const name = attr.name.toLowerCase();
      const value = String(attr.value || '');

      if (name.startsWith('on') || name === 'style') {
        el.removeAttribute(attr.name);
        continue;
      }

      if (
        (name === 'href' || name === 'src' || name === 'xlink:href' || name === 'formaction') &&
        isDangerousUrl(value)
      ) {
        el.removeAttribute(attr.name);
      }
    }
  });

  return container.innerHTML;
}
