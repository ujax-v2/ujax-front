import { useState, useEffect, useRef, useCallback } from 'react';
import type { ProblemResponse } from '@/api/problem';
import type { SubmitStatus } from '@/features/ide/IDESubmitModal';

const REASON_MESSAGE_MAP: Record<string, string> = {
  MISSING_BOJ_ID: '프로필에 백준 아이디를 먼저 입력해주세요.',
  BOJ_ID_MISMATCH: 'BOJ 로그인 계정과 프로필 아이디가 달라요. 같은 계정으로 맞춘 뒤 다시 시도해주세요.',
  CONTEXT_DELAY: '문제 연결 준비가 조금 늦어지고 있어요. 잠시 후 다시 시도해주세요.',
  SUBMISSION_NOT_FOUND: '제출 내역을 아직 찾지 못했어요. 잠시 후 다시 시도해주세요.',
  SUBMIT_FLOW_BUSY: '이전 제출을 처리 중이에요. 잠시 후 다시 시도해주세요.',
  SUBMIT_REQUEST_INVALID: '제출 요청 정보가 올바르지 않아요. 코드를 확인한 뒤 다시 시도해주세요.',
  UNSUPPORTED_LANGUAGE: '현재 선택한 언어는 자동 제출을 지원하지 않아요.',
  SUBMIT_FLOW_ERROR: '제출 처리 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.',
  STATUS_USERNAME_MISSING: '백준 사용자 정보를 읽지 못했어요. 잠시 후 다시 시도해주세요.',
  PROBLEM_MISMATCH: '현재 문제와 다른 제출이 감지됐어요. 다시 제출해주세요.',
  AUTH_REQUIRED: '로그인 상태를 확인한 뒤 다시 시도해주세요.',
  BACKEND_RETRY_FAILED: '제출 결과 동기화 재시도에 실패했어요. 잠시 후 다시 시도해주세요.',
  SUBMISSION_INGEST_FAILED: '제출 결과 동기화에 실패했어요. 잠시 후 다시 시도해주세요.',
  NETWORK_ERROR: '네트워크 오류로 제출 결과를 동기화하지 못했어요. 잠시 후 다시 시도해주세요.',
};

function normalizeExtensionVerdict(verdict: string) {
  return String(verdict || '')
    .replace(/\[UJAX\]\s*/g, '')
    .replace(/^제출 확인 실패:\s*/g, '')
    .trim();
}

function extractBojMismatchMessage(verdict: string) {
  const cleaned = normalizeExtensionVerdict(verdict);
  const match = cleaned.match(/BOJ 로그인 계정\(([^)]+)\)과 설정 아이디\(([^)]+)\)가 다릅니다\.?/);
  if (!match) return '';
  return `BOJ 로그인 계정(${match[1]})과 설정 아이디(${match[2]})가 다릅니다.`;
}

function getSubmitErrorMessage(reasonCode: string, verdict: string) {
  const mismatchMessage = extractBojMismatchMessage(verdict);
  if (mismatchMessage) return mismatchMessage;

  if (reasonCode && REASON_MESSAGE_MAP[reasonCode]) {
    return REASON_MESSAGE_MAP[reasonCode];
  }

  const cleanedVerdict = normalizeExtensionVerdict(verdict);
  if (cleanedVerdict.includes('로그인 계정') && cleanedVerdict.includes('설정 아이디')) {
    return REASON_MESSAGE_MAP.BOJ_ID_MISMATCH;
  }
  if (cleanedVerdict.includes('백준 아이디')) {
    return REASON_MESSAGE_MAP.MISSING_BOJ_ID;
  }
  if (cleanedVerdict.includes('컨텍스트')) {
    return REASON_MESSAGE_MAP.CONTEXT_DELAY;
  }
  if (cleanedVerdict.includes('이전 제출 처리 중')) {
    return REASON_MESSAGE_MAP.SUBMIT_FLOW_BUSY;
  }
  if (cleanedVerdict.includes('제출 내역') || cleanedVerdict.includes('찾지 못')) {
    return REASON_MESSAGE_MAP.SUBMISSION_NOT_FOUND;
  }

  return cleanedVerdict || '제출 처리 중 오류가 발생했어요.';
}

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
      const reasonCode = String(event.data.reasonCode || '').trim();

      if (reasonCode) {
        setSubmitStatus('wrong');
        setSubmitResult(getSubmitErrorMessage(reasonCode, verdict));
        if (submitTimeoutRef.current) {
          clearTimeout(submitTimeoutRef.current);
          submitTimeoutRef.current = null;
        }
        return;
      }

      const ACCEPTED_KEYWORDS = ['맞았습니다', 'Accepted'];
      const isAccepted = ACCEPTED_KEYWORDS.some((kw) => verdict.includes(kw));

      if (isAccepted) {
        setSubmitStatus('accepted');
        setSubmitResult('맞았습니다!!');
        window.dispatchEvent(new CustomEvent('ujaxProblemAccepted'));
      } else {
        const normalizedMessage = getSubmitErrorMessage('', verdict);
        setSubmitStatus('wrong');
        setSubmitResult(normalizedMessage);
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

  const handleSubmit = useCallback((code: string, language: string, expectedBojId?: string | null) => {
    if (!problem) return;
    const normalizedBojId = String(expectedBojId || '').trim();
    if (!normalizedBojId) {
      if (submitTimeoutRef.current) {
        clearTimeout(submitTimeoutRef.current);
        submitTimeoutRef.current = null;
      }
      setSubmitStatus('wrong');
      setSubmitResult('백준 아이디가 설정되지 않았습니다. 설정 > 프로필에서 백준 아이디를 먼저 등록해주세요.');
      setShowSubmitModal(true);
      return;
    }

    window.postMessage({
      type: 'ujaxSubmitRequest',
      problemNum: problem.problemNumber,
      code,
      language,
      expectedBojId: normalizedBojId,
    }, '*');

    setSubmitStatus('submitted');
    setSubmitResult(null);
    setShowSubmitModal(true);

    if (submitTimeoutRef.current) clearTimeout(submitTimeoutRef.current);
    submitTimeoutRef.current = window.setTimeout(() => {
      setSubmitStatus((prev) => prev === 'submitted' ? 'timeout' : prev);
    }, 240000);
  }, [problem]);

  const closeSubmitModal = useCallback(() => {
    if (submitTimeoutRef.current) {
      clearTimeout(submitTimeoutRef.current);
      submitTimeoutRef.current = null;
    }
    setShowSubmitModal(false);
    setSubmitStatus('idle');
    setSubmitResult(null);
  }, []);

  return { submitStatus, submitResult, showSubmitModal, handleSubmit, closeSubmitModal };
}
