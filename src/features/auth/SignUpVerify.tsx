import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button, Card } from '@/components/ui/Base';
import { ArrowLeft, MailCheck, RotateCcw } from 'lucide-react';
import { isApiTimeoutError, signupConfirmApi, signupResendApi, type SignupVerificationSession } from '@/api/auth';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useAuth } from '@/hooks/useAuth';
import { useT } from '@/i18n';
import { isMailSendFailure, parseApiProblem } from '@/utils/error';
import {
  SIGNUP_VERIFICATION_FAILED_EVENT,
  SIGNUP_VERIFICATION_READY_EVENT,
  clearPendingSignupVerification,
  clearSignupDraft,
  clearSignupTermsAgreement,
  clearSignupVerificationSession,
  getPendingSignupVerification,
  getSignupVerificationSession,
  type PendingSignupVerification,
  saveSignupVerificationSession,
} from './signupVerificationStorage';

const VERIFICATION_TTL_SECONDS = 300;

function isSignupVerificationSession(value: unknown): value is SignupVerificationSession {
  if (!value || typeof value !== 'object') return false;
  const session = value as SignupVerificationSession;
  return !!session.requestToken && !!session.email && !!session.expiresAt;
}

function isPendingSignupVerification(value: unknown): value is PendingSignupVerification {
  if (!value || typeof value !== 'object') return false;
  const session = value as PendingSignupVerification;
  return !!session.requestId && !!session.email && !!session.expiresAt;
}

function formatRemainingSeconds(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export const SignUpVerify = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const t = useT();
  const { setAuthUser } = useAuth();
  const locationSession = useMemo(
    () => isSignupVerificationSession(location.state) ? location.state : null,
    [location.state],
  );
  const locationPending = useMemo(
    () => isPendingSignupVerification(location.state) ? location.state : null,
    [location.state],
  );
  const [session, setSession] = useState<SignupVerificationSession | null>(
    () => locationSession || getSignupVerificationSession(),
  );
  const [pendingSignup, setPendingSignup] = useState<PendingSignupVerification | null>(
    () => locationPending || getPendingSignupVerification(),
  );
  const [code, setCode] = useState('');
  const [apiError, setApiError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  const getKnownAuthMessage = (err: unknown, fallback: string) => {
    if (isApiTimeoutError(err)) {
      return t('auth.signupRequestTimeoutError');
    }

    const problem = parseApiProblem(err);
    if (!problem) return fallback;
    if (isMailSendFailure(problem)) {
      return t('common.mailSendFailed');
    }

    switch (problem.title) {
      case 'C010':
        return t('auth.invalidVerificationCodeError');
      case 'C011':
        return t('auth.expiredVerificationCodeError');
      case 'D002':
        return t('auth.duplicateEmailError');
      case 'C009':
        return t('auth.invalidEmailError');
      default:
        if (problem.status === 404) {
          return t('auth.signupRequestMissingError');
        }
        return problem.detail || fallback;
    }
  };

  useEffect(() => {
    if (locationSession) {
      setSession(locationSession);
      setPendingSignup(null);
      clearPendingSignupVerification();
      saveSignupVerificationSession(locationSession);
      return;
    }

    const stored = getSignupVerificationSession();
    if (stored) {
      setSession(stored);
      setPendingSignup(null);
      clearPendingSignupVerification();
      return;
    }

    if (locationPending) {
      setPendingSignup(locationPending);
      return;
    }

    const pending = getPendingSignupVerification();
    if (pending) {
      setPendingSignup(pending);
      return;
    }

    navigate('/signup', { replace: true });
  }, [locationPending, locationSession, navigate]);

  useEffect(() => {
    const handleReady = (event: Event) => {
      const nextSession = (event as CustomEvent<SignupVerificationSession>).detail;
      clearPendingSignupVerification();
      saveSignupVerificationSession(nextSession);
      setPendingSignup(null);
      setSession(nextSession);
      setApiError('');
    };

    const handleFailed = (event: Event) => {
      const detail = (event as CustomEvent<{ message?: string }>).detail;
      clearPendingSignupVerification();
      clearSignupVerificationSession();
      setPendingSignup(null);
      setSession(null);
      navigate('/signup', {
        replace: true,
        state: { signupRequestError: detail?.message || t('auth.signupRequestFailed') },
      });
    };

    window.addEventListener(SIGNUP_VERIFICATION_READY_EVENT, handleReady);
    window.addEventListener(SIGNUP_VERIFICATION_FAILED_EVENT, handleFailed);

    return () => {
      window.removeEventListener(SIGNUP_VERIFICATION_READY_EVENT, handleReady);
      window.removeEventListener(SIGNUP_VERIFICATION_FAILED_EVENT, handleFailed);
    };
  }, [navigate, t]);

  useEffect(() => {
    if (resendCooldown <= 0) return;

    const timer = window.setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  useEffect(() => {
    const expiresAt = session?.expiresAt || pendingSignup?.expiresAt;
    if (!expiresAt) {
      setRemainingSeconds(0);
      return;
    }

    const updateRemainingSeconds = () => {
      const expiresAtMs = new Date(expiresAt).getTime();
      const diff = Math.max(0, Math.floor((expiresAtMs - Date.now()) / 1000));
      setRemainingSeconds(diff);
    };

    updateRemainingSeconds();
    const timer = window.setInterval(updateRemainingSeconds, 1000);

    return () => window.clearInterval(timer);
  }, [pendingSignup?.expiresAt, session?.expiresAt]);

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || code.length !== 6) return;

    setApiError('');
    setSubmitting(true);

    try {
      const result = await signupConfirmApi(session.requestToken, code);
      clearSignupDraft();
      clearSignupTermsAgreement();
      clearSignupVerificationSession();
      const { accessToken, refreshToken } = result.data;
      await setAuthUser(accessToken, refreshToken);
      navigate('/');
    } catch (err) {
      console.error('Signup confirm error', err);
      setApiError(getKnownAuthMessage(err, t('auth.signupConfirmFailed')));
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!session || resendCooldown > 0 || resending) return;

    setApiError('');
    setResendSuccess(true);
    setResendCooldown(30);
    setResending(true);
    const optimisticSession = {
      ...session,
      expiresAt: new Date(Date.now() + VERIFICATION_TTL_SECONDS * 1000).toISOString(),
    };
    setSession(optimisticSession);
    saveSignupVerificationSession(optimisticSession);

    try {
      const result = await signupResendApi(session.requestToken);
      setSession(result.data);
      saveSignupVerificationSession(result.data);
    } catch (err) {
      console.error('Signup resend error', err);
      setResendCooldown(0);
      setApiError(getKnownAuthMessage(err, t('auth.signupResendFailed')));
    } finally {
      setResending(false);
    }
  };

  const timerClassName = remainingSeconds <= 30
    ? 'text-red-500'
    : remainingSeconds <= 60
      ? 'text-amber-500'
      : 'text-emerald-500';

  const handleBackToSignUp = () => {
    clearPendingSignupVerification();
    clearSignupVerificationSession();
    navigate('/signup', { replace: true });
  };

  const displayEmail = session?.email || pendingSignup?.email || '';
  if (!session && !pendingSignup) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-page p-4">
      <Card className="relative w-full max-w-md p-8 bg-surface border-border-default">
        <button
          type="button"
          onClick={handleBackToSignUp}
          className="absolute left-4 top-4 p-2 rounded-lg text-text-faint hover:text-text-primary hover:bg-hover-bg transition-colors"
          aria-label={t('auth.editSignupInfoButton')}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <MailCheck className="w-7 h-7 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">{t('auth.verifyTitle')}</h1>
          <p className="text-text-muted text-sm">{t('auth.verifyDescription')}</p>
          <p className="text-sm text-text-secondary mt-3 font-medium break-all">{displayEmail}</p>
          <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
            <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-text-faint">
              {t('auth.verifyRemainingSecondsLabel')}
            </p>
            <p className={`mt-1 text-3xl font-extrabold tracking-[0.18em] ${timerClassName}`}>
              {formatRemainingSeconds(remainingSeconds)}
            </p>
          </div>
        </div>

        <form onSubmit={handleConfirm} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-text-muted">{t('auth.verificationCode')}</label>
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={code}
                onChange={(value) => {
                  setCode(value.replace(/\D/g, '').slice(0, 6));
                  setApiError('');
                }}
                autoFocus
                inputMode="numeric"
                autoComplete="one-time-code"
                containerClassName="justify-center"
              >
                <InputOTPGroup className="gap-2">
                  <InputOTPSlot index={0} className="h-12 w-12 rounded-lg border border-border-default bg-input-bg text-base font-semibold text-text-primary first:rounded-lg first:border last:rounded-lg" />
                  <InputOTPSlot index={1} className="h-12 w-12 rounded-lg border border-border-default bg-input-bg text-base font-semibold text-text-primary first:rounded-lg first:border last:rounded-lg" />
                  <InputOTPSlot index={2} className="h-12 w-12 rounded-lg border border-border-default bg-input-bg text-base font-semibold text-text-primary first:rounded-lg first:border last:rounded-lg" />
                  <InputOTPSlot index={3} className="h-12 w-12 rounded-lg border border-border-default bg-input-bg text-base font-semibold text-text-primary first:rounded-lg first:border last:rounded-lg" />
                  <InputOTPSlot index={4} className="h-12 w-12 rounded-lg border border-border-default bg-input-bg text-base font-semibold text-text-primary first:rounded-lg first:border last:rounded-lg" />
                  <InputOTPSlot index={5} className="h-12 w-12 rounded-lg border border-border-default bg-input-bg text-base font-semibold text-text-primary first:rounded-lg first:border last:rounded-lg" />
                </InputOTPGroup>
              </InputOTP>
            </div>
            <p className="text-xs text-text-faint">{t('auth.verificationCodeHint')}</p>
          </div>

          {apiError && <p className="text-sm text-red-400">{apiError}</p>}

          <Button
            type="submit"
            disabled={!session || code.length !== 6 || submitting}
            className="w-full bg-emerald-600 hover:bg-emerald-700 py-2.5"
          >
            {submitting ? t('auth.verifyCodeLoading') : t('auth.verifyCodeButton')}
          </Button>
        </form>

        <div className="mt-4 flex gap-3">
          <div className="w-full space-y-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handleResend}
              disabled={!session || resendCooldown > 0 || resending}
              className="w-full gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              {resendCooldown > 0
                ? `${t('auth.resendCodeButton')} (${resendCooldown}${t('auth.secondsSuffix')})`
                : t('auth.resendCodeButton')}
            </Button>
            {resendSuccess && (
              <p className="text-xs text-emerald-500 text-center">{t('auth.resendSuccessMessage')}</p>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};
