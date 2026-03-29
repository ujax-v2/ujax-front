import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useT } from '@/i18n';
import { signupApi } from '@/api/auth';
import { Button, Card } from '@/components/ui/Base';
import { Mail, Lock, User, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export const SignUp = () => {
  const navigate = useNavigate();
  const t = useT();
  const { setAuthUser } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nickname: ''
  });
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordImeHint, setPasswordImeHint] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const imeHintTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (name: string, value: string) => {
    if (name === 'password') {
      return value.length < 8 ? '비밀번호는 8자 이상이어야 합니다' : '';
    }
    if (name === 'email') {
      return !value.includes('@') ? '유효하지 않은 이메일 주소입니다' : '';
    }
    return '';
  };

  const filterKorean = (value: string) => value.replace(/[ㄱ-ㅎㅏ-ㅣ가-힣]/g, '');

  const showImeHint = (raw: string, filtered: string) => {
    if (filtered !== raw) {
      if (imeHintTimer.current) clearTimeout(imeHintTimer.current);
      setPasswordImeHint(true);
      imeHintTimer.current = setTimeout(() => setPasswordImeHint(false), 2000);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let { name, value } = e.target;
    if (name === 'password') {
      const filtered = filterKorean(value);
      showImeHint(value, filtered);
      value = filtered;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
    const error = validate(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handlePasswordCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>) => {
    const raw = e.currentTarget.value;
    const filtered = filterKorean(raw);
    showImeHint(raw, filtered);
    setFormData(prev => ({ ...prev, password: filtered }));
    setErrors(prev => ({ ...prev, password: validate('password', filtered) }));
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (errors.email || errors.password || !formData.email || !formData.password || !formData.nickname) {
      return;
    }

    setApiError('');
    setLoading(true);

    try {
      const result = await signupApi(formData.email, formData.password, formData.nickname);
      const { accessToken, refreshToken } = result.data;
      await setAuthUser(accessToken, refreshToken);
      navigate('/');
    } catch (err: any) {
      console.error('Signup error', err);
      setApiError(err instanceof Error ? err.message : '회원가입에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-page p-4">
      <Card className="w-full max-w-md p-8 bg-surface border-border-default">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-text-primary mb-2">{t('auth.signup')}</h1>
          <p className="text-text-muted text-sm">{t('auth.joinCommunity')}</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-text-muted">{t('auth.email')}</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-faint" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full bg-input-bg border ${errors.email ? 'border-red-500' : 'border-border-default'} rounded-lg py-2.5 pl-10 pr-4 text-sm text-text-secondary focus:outline-none focus:border-emerald-500 transition-colors`}
                placeholder="name@example.com"
              />
            </div>
            {errors.email && <div className="text-xs text-red-500 flex items-center gap-1 mt-1"><AlertCircle className="w-3 h-3" /> {errors.email}</div>}
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
                placeholder="DevMaster"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-text-muted">{t('auth.password')}</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-faint" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                onCompositionEnd={handlePasswordCompositionEnd}
                onKeyDown={(e) => setCapsLock(e.getModifierState('CapsLock'))}
                onBlur={() => setCapsLock(false)}
                className={`w-full bg-input-bg border ${errors.password ? 'border-red-500' : 'border-border-default'} rounded-lg py-2.5 pl-10 pr-4 text-sm text-text-secondary focus:outline-none focus:border-emerald-500 transition-colors`}
                placeholder="••••••••"
              />
            </div>
            {capsLock && (
              <p className="text-xs text-amber-500 mt-1">⇪ Caps Lock이 켜져 있습니다</p>
            )}
            {passwordImeHint && (
              <p className="text-xs text-amber-500 mt-1">한/영 키를 눌러 영문 모드로 전환해주세요</p>
            )}

            {/* Password Validation Feedback Area */}
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className={`text-xs flex items-center gap-1 ${formData.password.length >= 8 ? 'text-emerald-500' : 'text-text-faint'}`}>
                <CheckCircle2 className="w-3 h-3" /> {t('auth.passwordMinLength')}
              </div>
              <div className={`text-xs flex items-center gap-1 ${/[0-9]/.test(formData.password) ? 'text-emerald-500' : 'text-text-faint'}`}>
                <CheckCircle2 className="w-3 h-3" /> {t('auth.passwordNumber')}
              </div>
            </div>
          </div>

          {apiError && <p className="text-sm text-red-400">{apiError}</p>}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 py-2.5 mt-2"
          >
            {loading ? t('auth.signupLoading') : t('auth.signupButton')}
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
