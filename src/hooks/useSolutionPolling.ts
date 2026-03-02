import { useEffect, useRef, useState, useCallback } from 'react';
import { getSolutions } from '@/api/solution';

const POLL_INTERVAL = 15_000;
const PENDING_POLL_INTERVAL = 5_000;

export interface LatestSolution {
  id: number;
  status: string;
  problemNumber: number;
  memberName: string;
  createdAt: string;
}

export type NotifyFn = (message: string, type: 'info' | 'success' | 'error') => void;

export function useSolutionPolling(
  wsId: number | null,
  boxId: number | null,
  problems: Array<{ id: number; problemNumber: number }>,
  onNotify?: NotifyFn,
) {
  const [solutionMap, setSolutionMap] = useState<Map<number, LatestSolution>>(new Map());
  const [loading, setLoading] = useState(false);
  const [pendingProblems, setPendingProblems] = useState<Set<number>>(new Set());
  const [lastCheckedAt, setLastCheckedAt] = useState<Date | null>(null);

  const solutionMapRef = useRef<Map<number, LatestSolution>>(new Map());
  const prevIdsRef = useRef<Map<number, number>>(new Map());
  const pendingRef = useRef<Set<number>>(new Set());
  const isFirstFetchRef = useRef(true);
  const problemsRef = useRef(problems);
  const notifyRef = useRef(onNotify);

  problemsRef.current = problems;
  notifyRef.current = onNotify;

  const markPending = useCallback((workspaceProblemId: number) => {
    pendingRef.current = new Set(pendingRef.current).add(workspaceProblemId);
    setPendingProblems(new Set(pendingRef.current));
  }, []);

  // problemNumber → workspaceProblemId 매핑 (extension 메시지에서 사용)
  const problemNumToIdRef = useRef<Map<number, number>>(new Map());
  useEffect(() => {
    const m = new Map<number, number>();
    problems.forEach(p => m.set(p.problemNumber, p.id));
    problemNumToIdRef.current = m;
  }, [problems]);

  const doFetch = useCallback(async () => {
    if (!wsId || !boxId) return;
    const probs = problemsRef.current;
    if (probs.length === 0) return;

    const currentMap = solutionMapRef.current;
    const problemsToFetch = probs.filter(p => {
      const existing = currentMap.get(p.id);
      return !existing || existing.status !== 'ACCEPTED';
    });

    if (problemsToFetch.length === 0) {
      setLastCheckedAt(new Date());
      return;
    }

    const results = await Promise.allSettled(
      problemsToFetch.map(p =>
        getSolutions(wsId, boxId, p.id, 0, 1).then(data => ({
          workspaceProblemId: p.id,
          problemNumber: p.problemNumber,
          solution: data.content.length > 0 ? data.content[0] : null,
        })),
      ),
    );

    const newMap = new Map(currentMap);
    const prevIds = prevIdsRef.current;
    const isFirst = isFirstFetchRef.current;
    let pendingChanged = false;

    for (const result of results) {
      if (result.status !== 'fulfilled') continue;
      const { workspaceProblemId, problemNumber, solution } = result.value;

      if (solution) {
        newMap.set(workspaceProblemId, {
          id: solution.id,
          status: solution.status,
          problemNumber: solution.problemNumber ?? problemNumber,
          memberName: solution.memberName,
          createdAt: solution.createdAt,
        });

        const prevId = prevIds.get(workspaceProblemId);
        const isNewSolution = prevId !== undefined && prevId !== solution.id;

        if (!isFirst && isNewSolution && notifyRef.current) {
          const num = solution.problemNumber ?? problemNumber;
          if (solution.status === 'ACCEPTED') {
            notifyRef.current(`${num}번: 맞았습니다!!`, 'success');
          } else {
            notifyRef.current(`${num}번: 틀렸습니다`, 'error');
          }
        }

        if (isNewSolution && pendingRef.current.has(workspaceProblemId)) {
          pendingRef.current = new Set(pendingRef.current);
          pendingRef.current.delete(workspaceProblemId);
          pendingChanged = true;
        }

        prevIds.set(workspaceProblemId, solution.id);
      }
    }

    isFirstFetchRef.current = false;
    solutionMapRef.current = newMap;
    setSolutionMap(new Map(newMap));
    setLastCheckedAt(new Date());
    if (pendingChanged) {
      setPendingProblems(new Set(pendingRef.current));
    }
  }, [wsId, boxId]);

  // 수동 새로고침
  const refreshNow = useCallback(() => {
    doFetch();
  }, [doFetch]);

  // 초기 fetch
  const problemsKey = problems.map(p => p.id).join(',');

  useEffect(() => {
    if (!wsId || !boxId || problems.length === 0) return;

    isFirstFetchRef.current = true;
    prevIdsRef.current = new Map();
    solutionMapRef.current = new Map();
    pendingRef.current = new Set();
    setSolutionMap(new Map());
    setPendingProblems(new Set());
    setLastCheckedAt(null);
    setLoading(true);

    let cancelled = false;

    (async () => {
      const results = await Promise.allSettled(
        problems.map(p =>
          getSolutions(wsId, boxId, p.id, 0, 1).then(data => ({
            workspaceProblemId: p.id,
            problemNumber: p.problemNumber,
            solution: data.content.length > 0 ? data.content[0] : null,
          })),
        ),
      );

      if (cancelled) return;

      const map = new Map<number, LatestSolution>();
      const ids = new Map<number, number>();

      for (const result of results) {
        if (result.status !== 'fulfilled') continue;
        const { workspaceProblemId, problemNumber, solution } = result.value;
        if (solution) {
          map.set(workspaceProblemId, {
            id: solution.id,
            status: solution.status,
            problemNumber: solution.problemNumber ?? problemNumber,
            memberName: solution.memberName,
            createdAt: solution.createdAt,
          });
          ids.set(workspaceProblemId, solution.id);
        }
      }

      isFirstFetchRef.current = false;
      prevIdsRef.current = ids;
      solutionMapRef.current = map;
      setSolutionMap(new Map(map));
      setLastCheckedAt(new Date());
      setLoading(false);
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wsId, boxId, problemsKey]);

  // Polling interval
  useEffect(() => {
    if (!wsId || !boxId || problems.length === 0) return;

    const interval = pendingRef.current.size > 0 ? PENDING_POLL_INTERVAL : POLL_INTERVAL;
    const timer = setInterval(doFetch, interval);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wsId, boxId, problemsKey, doFetch, pendingProblems.size]);

  // Extension 메시지 리스너: extension이 제출 캡처 시 즉시 반영
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (!event.data || typeof event.data !== 'object') return;

      // extension이 제출을 캡처했을 때 보내는 메시지
      if (event.data.type === 'ujaxSubmissionCaptured') {
        const problemNum = event.data.problemNum;
        const wpId = problemNumToIdRef.current.get(problemNum);
        if (wpId) {
          // pending으로 마킹 + 즉시 polling
          markPending(wpId);
          if (notifyRef.current) {
            notifyRef.current(`${problemNum}번 제출이 감지되었습니다. 결과를 확인 중...`, 'info');
          }
          // 2초 후 즉시 fetch (backend 저장 대기)
          setTimeout(() => doFetch(), 2000);
        }
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [doFetch, markPending]);

  return { solutionMap, loading, pendingProblems, markPending, lastCheckedAt, refreshNow };
}
