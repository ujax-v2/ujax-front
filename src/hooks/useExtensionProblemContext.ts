import { useEffect, useRef } from 'react';

const CONTEXT_RETRY_DELAYS_MS = [0, 300, 1_200];

function postProblemContext(problemNum: number, workspaceProblemId: number) {
  window.postMessage(
    { type: 'ujaxProblemContext', problemNum, workspaceProblemId },
    '*',
  );
}

export function useExtensionProblemContext(
  problemNum: number | null,
  workspaceProblemId: number | null,
) {
  useEffect(() => {
    if (!problemNum || !workspaceProblemId) return;

    const timers = CONTEXT_RETRY_DELAYS_MS.map((delay) =>
      window.setTimeout(() => {
        postProblemContext(problemNum, workspaceProblemId);
      }, delay),
    );

    return () => {
      timers.forEach((timerId) => window.clearTimeout(timerId));
    };
  }, [problemNum, workspaceProblemId]);
}

/**
 * 문제 목록 배열을 받아 각각 extension에 context를 전달한다.
 * ProblemList에서 사용: 사용자가 IDE를 거치지 않아도 extension이 제출을 캡처할 수 있도록.
 */
export function useExtensionBatchContext(
  problems: Array<{ problemNumber: number; workspaceProblemId: number }>,
) {
  const prevKey = useRef('');

  useEffect(() => {
    if (problems.length === 0) return;
    const key = problems.map(p => `${p.problemNumber}:${p.workspaceProblemId}`).join(',');
    if (key === prevKey.current) return;
    prevKey.current = key;

    const timers: number[] = [];
    problems.forEach(p => {
      CONTEXT_RETRY_DELAYS_MS.forEach((delay) => {
        const timerId = window.setTimeout(() => {
          postProblemContext(p.problemNumber, p.workspaceProblemId);
        }, delay);
        timers.push(timerId);
      });
    });

    return () => {
      timers.forEach((timerId) => window.clearTimeout(timerId));
    };
  }, [problems]);
}
