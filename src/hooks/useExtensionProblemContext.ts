import { useEffect, useRef } from 'react';

export function useExtensionProblemContext(
  problemNum: number | null,
  workspaceProblemId: number | null,
) {
  useEffect(() => {
    if (!problemNum || !workspaceProblemId) return;
    window.postMessage(
      { type: 'ujaxProblemContext', problemNum, workspaceProblemId },
      '*',
    );
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

    problems.forEach(p => {
      window.postMessage(
        { type: 'ujaxProblemContext', problemNum: p.problemNumber, workspaceProblemId: p.workspaceProblemId },
        '*',
      );
    });
  }, [problems]);
}
