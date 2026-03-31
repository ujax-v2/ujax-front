import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useT } from '@/i18n';
import { checkEmailAvailabilityApi, isApiTimeoutError, signupRequestApi } from '@/api/auth';
import { Button, Card } from '@/components/ui/Base';
import { Mail, Lock, User, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { isMailSendFailure, parseApiProblem } from '@/utils/error';
import {
  SIGNUP_VERIFICATION_FAILED_EVENT,
  SIGNUP_VERIFICATION_READY_EVENT,
  clearPendingSignupVerification,
  clearSignupVerificationSession,
  getPendingSignupVerification,
  getSignupDraft,
  hasAcceptedRequiredSignupTerms,
  saveSignupDraft,
  savePendingSignupVerification,
  saveSignupVerificationSession,
} from './signupVerificationStorage';

type EmailCheckState = 'idle' | 'checking' | 'valid' | 'invalid';

export const SignUp = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const t = useT();
  const initialDraft = getSignupDraft();
  const [termsAccepted, setTermsAccepted] = useState<boolean | null>(null);
  const [formData, setFormData] = useState({
    email: initialDraft?.email || '',
    password: '',
    passwordConfirm: '',
    nickname: initialDraft?.nickname || '',
  });
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordImeHint, setPasswordImeHint] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [emailCheckState, setEmailCheckState] = useState<EmailCheckState>(
    initialDraft?.checkedEmail && initialDraft.checkedEmail === initialDraft.email ? 'valid' : 'idle',
  );
  const [emailCheckMessage, setEmailCheckMessage] = useState(
    initialDraft?.checkedEmail && initialDraft.checkedEmail === initialDraft.email ? t('auth.emailAvailable') : '',
  );
  const [checkedEmail, setCheckedEmail] = useState(initialDraft?.checkedEmail || '');
  const imeHintTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const accepted = hasAcceptedRequiredSignupTerms();
    setTermsAccepted(accepted);

    if (!accepted) {
      navigate('/signup/terms', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    if (termsAccepted !== true) return;

    saveSignupDraft({
      email: formData.email,
      nickname: formData.nickname,
      checkedEmail,
    });
  }, [checkedEmail, formData.email, formData.nickname, termsAccepted]);

  useEffect(() => {
    const signupRequestError = (location.state as { signupRequestError?: string } | null)?.signupRequestError;
    if (signupRequestError) {
      setApiError(signupRequestError);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const validate = (name: string, value: string, nextFormData = formData) => {
    if (name === 'password') {
      return value.length < 8 ? t('auth.passwordLengthError') : '';
    }
    if (name === 'passwordConfirm') {
      return value !== nextFormData.password ? t('auth.passwordConfirmMismatchError') : '';
    }
    return '';
  };

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
      case 'C009':
        return t('auth.invalidEmailError');
      case 'D002':
        return t('auth.duplicateEmailError');
      default:
        return problem.detail || fallback;
    }
  };

  const filterKorean = (value: string) => value.replace(/[ㄱ-ㅎㅏ-ㅣ가-힣]/g, '');

  const showImeHint = (raw: string, filtered: string) => {
    if (filtered !== raw) {
      if (imeHintTimer.current) clearTimeout(imeHintTimer.current);
      setPasswordImeHint(true);
      imeHintTimer.current = setTimeout(() => setPasswordImeHint(false), 2000);
    }
  };

  const getPeekHandlers = (setVisible: React.Dispatch<React.SetStateAction<boolean>>) => ({
    onMouseDown: (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      setVisible(true);
    },
    onMouseUp: () => setVisible(false),
    onMouseLeave: () => setVisible(false),
    onTouchStart: (e: React.TouchEvent<HTMLButtonElement>) => {
      e.preventDefault();
      setVisible(true);
    },
    onTouchEnd: () => setVisible(false),
    onTouchCancel: () => setVisible(false),
    onKeyDown: (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        setVisible(true);
      }
    },
    onKeyUp: () => setVisible(false),
    onBlur: () => setVisible(false),
  });

  const resetEmailVerificationState = () => {
    setEmailCheckState('idle');
    setEmailCheckMessage('');
    setCheckedEmail('');
    clearPendingSignupVerification();
    clearSignupVerificationSession();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let { name, value } = e.target;
    if (name === 'password' || name === 'passwordConfirm') {
      const filtered = filterKorean(value);
      showImeHint(value, filtered);
      value = filtered;
    }

    if (name === 'email') {
      resetEmailVerificationState();
      setApiError('');
    }

    const nextFormData = { ...formData, [name]: value };
    setFormData(nextFormData);
    setErrors(prev => {
      const nextErrors = { ...prev, [name]: validate(name, value, nextFormData) };
      if (name === 'password' && nextFormData.passwordConfirm) {
        nextErrors.passwordConfirm = validate('passwordConfirm', nextFormData.passwordConfirm, nextFormData);
      }
      return nextErrors;
    });
  };

  const handlePasswordCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>) => {
    const { name } = e.currentTarget;
    const raw = e.currentTarget.value;
    const filtered = filterKorean(raw);
    showImeHint(raw, filtered);
    const nextFormData = { ...formData, [name]: filtered };
    setFormData(nextFormData);
    setErrors(prev => {
      const nextErrors = { ...prev, [name]: validate(name, filtered, nextFormData) };
      if (name === 'password' && nextFormData.passwordConfirm) {
        nextErrors.passwordConfirm = validate('passwordConfirm', nextFormData.passwordConfirm, nextFormData);
      }
      return nextErrors;
    });
  };

  const handleEmailCheck = async () => {
    if (!formData.email || emailCheckState === 'checking') return;

    setApiError('');
    setEmailCheckState('checking');
    setEmailCheckMessage('');

    try {
      await checkEmailAvailabilityApi(formData.email);
      setEmailCheckState('valid');
      setEmailCheckMessage(t('auth.emailAvailable'));
      setCheckedEmail(formData.email);
    } catch (err) {
      setEmailCheckState('invalid');
      setCheckedEmail('');
      setEmailCheckMessage(getKnownAuthMessage(err, t('auth.emailCheckFailed')));
    }
  };

  const handleSignupRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    const isEmailChecked = emailCheckState === 'valid' && checkedEmail === formData.email;

    if (!isEmailChecked) {
      setEmailCheckState('invalid');
      setEmailCheckMessage(t('auth.emailCheckRequired'));
      return;
    }

    if (errors.password || !formData.email.trim() || !formData.password || !formData.nickname.trim()) {
      return;
    }

    setApiError('');
    setLoading(true);
    const requestId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const optimisticExpiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    const pendingSignup = {
      email: formData.email.trim(),
      expiresAt: optimisticExpiresAt,
      requestId,
    };

    savePendingSignupVerification(pendingSignup);
    clearSignupVerificationSession();
    navigate('/signup/verify', { replace: true, state: pendingSignup });

    signupRequestApi(formData.email.trim(), formData.password, formData.nickname.trim())
      .then((result) => {
        const currentPending = getPendingSignupVerification();
        if (!currentPending || currentPending.requestId !== requestId) return;

        clearPendingSignupVerification();
        saveSignupVerificationSession(result.data);
        window.dispatchEvent(new CustomEvent(SIGNUP_VERIFICATION_READY_EVENT, {
          detail: result.data,
        }));
      })
      .catch((err) => {
        const currentPending = getPendingSignupVerification();
        if (!currentPending || currentPending.requestId !== requestId) return;

        const message = getKnownAuthMessage(err, t('auth.signupRequestFailed'));
        clearPendingSignupVerification();
        clearSignupVerificationSession();
        window.dispatchEvent(new CustomEvent(SIGNUP_VERIFICATION_FAILED_EVENT, {
          detail: { message },
        }));
      });
  };

  const isEmailChecked = emailCheckState === 'valid' && checkedEmail === formData.email;
  const canCheckEmail = Boolean(formData.email) && emailCheckState !== 'checking' && !loading;
  const canSubmit = isEmailChecked
    && !errors.password
    && !errors.passwordConfirm
    && !!formData.email.trim()
    && !!formData.password
    && !!formData.passwordConfirm
    && !!formData.nickname.trim()
    && !loading;
  const emailBorderClass = emailCheckState === 'invalid'
    ? 'border-red-500'
    : emailCheckState === 'valid'
      ? 'border-emerald-500'
      : 'border-border-default';
  const emailMessageClass = emailCheckState === 'valid' ? 'text-emerald-500' : 'text-red-500';
  const EmailMessageIcon = emailCheckState === 'valid' ? CheckCircle2 : AlertCircle;

  if (termsAccepted !== true) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-page p-4">
      <Card className="w-full max-w-md p-8 bg-surface border-border-default">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-text-primary mb-2">{t('auth.signup')}</h1>
          <p className="text-text-muted text-sm">{t('auth.signupRequestDescription')}</p>
        </div>

        <form onSubmit={handleSignupRequest} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-text-muted">{t('auth.email')}</label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-faint" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full bg-input-bg border ${emailBorderClass} rounded-lg py-2.5 pl-10 pr-4 text-sm text-text-secondary focus:outline-none focus:border-emerald-500 transition-colors`}
                  placeholder={t('auth.emailPlaceholder')}
                />
              </div>
              <Button
                type="button"
                variant="primary"
                disabled={!canCheckEmail}
                onClick={handleEmailCheck}
                className="shrink-0 min-w-[96px] py-2.5"
              >
                {emailCheckState === 'checking' ? t('auth.checkingDuplicate') : t('auth.checkDuplicate')}
              </Button>
            </div>
            {emailCheckMessage && (
              <div className={`text-xs flex items-center gap-1 mt-1 ${emailMessageClass}`}>
                <EmailMessageIcon className="w-3 h-3" /> {emailCheckMessage}
              </div>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-text-muted">{t('auth.nickname')}</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-faint" />
              <input
                type="text"
                name="nickname"
                value={formData.nickname}
                onChange={handleChange}
                className="w-full bg-input-bg border border-border-default rounded-lg py-2.5 pl-10 pr-4 text-sm text-text-secondary focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder={t('auth.nicknamePlaceholder')}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-text-muted">{t('auth.password')}</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-faint" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                onCompositionEnd={handlePasswordCompositionEnd}
                onKeyDown={(e) => setCapsLock(e.getModifierState('CapsLock'))}
                onBlur={() => setCapsLock(false)}
                className={`w-full bg-input-bg border ${errors.password ? 'border-red-500' : 'border-border-default'} rounded-lg py-2.5 pl-10 pr-12 text-sm text-text-secondary focus:outline-none focus:border-emerald-500 transition-colors`}
                placeholder="••••••••"
              />
              <button
                type="button"
                aria-label={t('auth.peekPassword')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-faint hover:text-text-secondary transition-colors"
                {...getPeekHandlers(setShowPassword)}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {capsLock && (
              <p className="text-xs text-amber-500 mt-1">{t('auth.capsLockHint')}</p>
            )}
            {passwordImeHint && (
              <p className="text-xs text-amber-500 mt-1">{t('auth.passwordImeHint')}</p>
            )}

            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className={`text-xs flex items-center gap-1 ${formData.password.length >= 8 ? 'text-emerald-500' : 'text-text-faint'}`}>
                <CheckCircle2 className="w-3 h-3" /> {t('auth.passwordMinLength')}
              </div>
              <div className={`text-xs flex items-center gap-1 ${/[0-9]/.test(formData.password) ? 'text-emerald-500' : 'text-text-faint'}`}>
                <CheckCircle2 className="w-3 h-3" /> {t('auth.passwordNumber')}
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-text-muted">{t('auth.passwordConfirm')}</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-faint" />
              <input
                type={showPasswordConfirm ? 'text' : 'password'}
                name="passwordConfirm"
                value={formData.passwordConfirm}
                onChange={handleChange}
                onCompositionEnd={handlePasswordCompositionEnd}
                onKeyDown={(e) => setCapsLock(e.getModifierState('CapsLock'))}
                onBlur={() => setCapsLock(false)}
                className={`w-full bg-input-bg border ${errors.passwordConfirm ? 'border-red-500' : 'border-border-default'} rounded-lg py-2.5 pl-10 pr-12 text-sm text-text-secondary focus:outline-none focus:border-emerald-500 transition-colors`}
                placeholder="••••••••"
              />
              <button
                type="button"
                aria-label={t('auth.peekPassword')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-faint hover:text-text-secondary transition-colors"
                {...getPeekHandlers(setShowPasswordConfirm)}
              >
                {showPasswordConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.passwordConfirm && (
              <p className="text-xs text-red-500 mt-1">{errors.passwordConfirm}</p>
            )}
          </div>

          {apiError && <p className="text-sm text-red-400">{apiError}</p>}

          <Button
            type="submit"
            disabled={!canSubmit}
            className="w-full bg-emerald-600 hover:bg-emerald-700 py-2.5 mt-2"
          >
            {loading ? t('auth.requestCodeLoading') : t('auth.requestCodeButton')}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-text-muted">
          {t('auth.hasAccount')}{' '}
          <button onClick={() => navigate('/login')} className="text-emerald-500 hover:text-emerald-400 font-medium">
            {t('auth.login')}
          </button>
        </div>
      </Card>
    </div>
  );
};
