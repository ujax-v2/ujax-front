import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useT } from '@/i18n';
import { loginApi } from '@/api/auth';
import { Button, Card } from '@/components/ui/Base';
import { Mail, Lock, MessageCircle } from 'lucide-react';
import { parseApiError } from '@/utils/error';
import { useAuth } from '@/hooks/useAuth';

interface LoginProps {
  oauthError?: string;
  onClearError?: () => void;
}

export const Login = ({ oauthError: oauthErrorProp, onClearError }: LoginProps) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const t = useT();
  const { setAuthUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordImeHint, setPasswordImeHint] = useState(false);
  const imeHintTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const filterKorean = (value: string) => value.replace(/[ㄱ-ㅎㅏ-ㅣ가-힣]/g, '');

  const showImeHint = (raw: string, filtered: string) => {
    if (filtered !== raw) {
      if (imeHintTimer.current) clearTimeout(imeHintTimer.current);
      setPasswordImeHint(true);
      imeHintTimer.current = setTimeout(() => setPasswordImeHint(false), 2000);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const filtered = filterKorean(raw);
    showImeHint(raw, filtered);
    setPassword(filtered);
    clearOauthError();
  };

  // compositionEnd: 일부 브라우저에서 onChange가 조합 완료 후 한 번만 울리는 케이스 보완
  const handlePasswordCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>) => {
    const raw = e.currentTarget.value;
    const filtered = filterKorean(raw);
    showImeHint(raw, filtered);
    setPassword(filtered);
  };

  const oauthError = oauthErrorProp || searchParams.get('oauthError') || '';

  const clearOauthError = () => {
    if (oauthError && onClearError) onClearError();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    clearOauthError();
    setLoading(true);
    try {
      const result = await loginApi(email, password);
      const { accessToken, refreshToken } = result.data;
      await setAuthUser(accessToken, refreshToken);
      setLoading(false);
      navigate('/');
    } catch (err: any) {
      console.error('Login error', err);
      setError(err instanceof Error ? err.message : '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-page p-4">
      <Card className="w-full max-w-md p-8 bg-surface border-border-default">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-text-primary mb-2">{t('auth.login')}</h1>
          <p className="text-text-muted text-sm">{t('auth.joinCommunity')}</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-text-muted">{t('auth.email')}</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-faint" />
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); clearOauthError(); }}
                className="w-full bg-input-bg border border-border-default rounded-lg py-2.5 pl-10 pr-4 text-sm text-text-secondary focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="name@example.com"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-text-muted">{t('auth.password')}</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-faint" />
              <input
                type="password"
                value={password}
                onChange={handlePasswordChange}
                onCompositionEnd={handlePasswordCompositionEnd}
                className="w-full bg-input-bg border border-border-default rounded-lg py-2.5 pl-10 pr-4 text-sm text-text-secondary focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="••••••••"
              />
            </div>
            {passwordImeHint && (
              <p className="text-xs text-amber-500 mt-1">한/영 키를 눌러 영문 모드로 전환해주세요</p>
            )}
          </div>

          {(error || oauthError) && (
            <p className="text-sm text-red-400">{error || oauthError}</p>
          )}

          <Button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 py-2.5">
            {loading ? t('auth.loginLoading') : t('auth.login')}
          </Button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border-default"></div></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-surface px-2 text-text-faint">{t('auth.socialLogin')}</span></div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <a
            href="/oauth2/authorization/google"
            className="flex items-center justify-center gap-2 bg-input-bg border border-border-default rounded-lg py-2 text-sm text-text-secondary hover:bg-surface-subtle transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg> Google
          </a>
          <a
            href="/oauth2/authorization/kakao"
            className="flex items-center justify-center gap-2 bg-[#FEE500] border border-[#FEE500] rounded-lg py-2 text-sm text-black hover:opacity-90 transition-opacity"
          >
            <MessageCircle className="w-4 h-4 fill-current" /> Kakao
          </a>
        </div>

        <div className="mt-6 text-center text-sm text-text-muted">
          {t('auth.noAccount')}{' '}
          <button onClick={() => navigate('/signup')} className="text-emerald-500 hover:text-emerald-400 font-medium">
            {t('auth.signup')}
          </button>
        </div>
      </Card>
    </div>
  );
};
