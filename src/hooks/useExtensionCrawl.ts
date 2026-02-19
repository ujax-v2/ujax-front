import { useState, useEffect, useCallback, useRef } from 'react';

type CrawlStatus = 'idle' | 'crawling' | 'success' | 'error' | 'timeout';

const CRAWL_TIMEOUT_MS = 15_000;

export function useExtensionCrawl() {
  const [status, setStatus] = useState<CrawlStatus>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const problemNumRef = useRef<number | null>(null);

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.source !== window) return;
      if (event.data?.type !== 'ujaxCrawlComplete') return;
      if (event.data.problemNum !== problemNumRef.current) return;

      cleanup();
      setStatus(event.data.success ? 'success' : 'error');
    };

    window.addEventListener('message', handler);
    return () => {
      window.removeEventListener('message', handler);
      cleanup();
    };
  }, [cleanup]);

  const requestCrawl = useCallback((problemNum: number) => {
    cleanup();
    problemNumRef.current = problemNum;
    setStatus('crawling');

    window.postMessage({
      type: 'ujaxCrawlRequest',
      problemNum,
    }, '*');

    timerRef.current = setTimeout(() => {
      setStatus('timeout');
    }, CRAWL_TIMEOUT_MS);
  }, [cleanup]);

  const reset = useCallback(() => {
    cleanup();
    problemNumRef.current = null;
    setStatus('idle');
  }, [cleanup]);

  return { status, requestCrawl, reset };
}
