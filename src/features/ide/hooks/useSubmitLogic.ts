import { useState, useEffect, useRef, useCallback } from 'react';
import type { ProblemResponse } from '@/api/problem';
import type { SubmitStatus } from '@/features/ide/IDESubmitModal';

export function useSubmitLogic(problem: ProblemResponse | null) {
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>('idle');
  const [submitResult, setSubmitResult] = useState<string | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const submitTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const handleExtResult = (event: MessageEvent) => {
      if (event.source !== window) return;
      if (event.data?.type !== 'ujaxSubmissionResult') return;
      if (!problem || String(event.data.problemNum) !== String(problem.problemNumber)) return;

      const verdict = event.data.verdict || '';
      const ACCEPTED_KEYWORDS = ['맞았습니다', 'Accepted'];
      const isAccepted = ACCEPTED_KEYWORDS.some((kw) => verdict.includes(kw));

      if (isAccepted) {
        setSubmitStatus('accepted');
        setSubmitResult('맞았습니다!!');
      } else {
        setSubmitStatus('wrong');
        setSubmitResult(verdict);
      }

      if (submitTimeoutRef.current) {
        clearTimeout(submitTimeoutRef.current);
        submitTimeoutRef.current = null;
      }
    };

    window.addEventListener('message', handleExtResult);
    return () => window.removeEventListener('message', handleExtResult);
  }, [problem]);

  useEffect(() => {
    return () => {
      if (submitTimeoutRef.current) clearTimeout(submitTimeoutRef.current);
    };
  }, []);

  const handleSubmit = useCallback((code: string, language: string) => {
    if (!problem) return;

    window.postMessage({
      type: 'ujaxSubmitRequest',
      problemNum: problem.problemNumber,
      code,
      language,
    }, '*');

    setSubmitStatus('submitted');
    setSubmitResult(null);
    setShowSubmitModal(true);

    if (submitTimeoutRef.current) clearTimeout(submitTimeoutRef.current);
    submitTimeoutRef.current = window.setTimeout(() => {
      setSubmitStatus((prev) => prev === 'submitted' ? 'timeout' : prev);
    }, 60000);
  }, [problem]);

  const closeSubmitModal = useCallback(() => {
    setShowSubmitModal(false);
    setSubmitStatus('idle');
    setSubmitResult(null);
  }, []);

  return { submitStatus, submitResult, showSubmitModal, handleSubmit, closeSubmitModal };
}
