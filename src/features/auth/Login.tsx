import React, { useState } from 'react';
import { useSetRecoilState } from 'recoil';
import { useNavigate } from 'react-router-dom';
import { userState, workspacesState, currentWorkspaceState } from '@/store/atoms';
import { loginApi } from '@/api/auth';
import { Button, Card } from '@/components/ui/Base';
import { Mail, Lock, MessageCircle } from 'lucide-react';

interface LoginProps {
  oauthError?: string;
  onClearError?: () => void;
}

export const Login = ({ oauthError, onClearError }: LoginProps) => {
  const navigate = useNavigate();
  const setUser = useSetRecoilState(userState);
  const setWorkspaces = useSetRecoilState(workspacesState);
  const setCurrentWsId = useSetRecoilState(currentWorkspaceState);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

      // Decode JWT to get user info fallback
      let name = email;
      try {
        const base64 = accessToken!.split('.')[1];
        const binaryStr = atob(base64);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }
        const payload = JSON.parse(new TextDecoder().decode(bytes));
        name = payload.name || email;
      } catch (e) {
        // ignore jwt parse error if any
      }

      const userData = {
        isLoggedIn: true,
        name,
        email,
        avatar: '',
        profileImageUrl: '',
        baekjoonId: '',
        accessToken: accessToken!,
        refreshToken: refreshToken!,
      };

      // Save to local storage
      localStorage.setItem('auth', JSON.stringify(userData));

      // 이전 세션 워크스페이스 초기화 후 유저 상태 설정
      setWorkspaces([]);
      setCurrentWsId(0);
      setUser(userData);

      setLoading(false);
      navigate('/');
    } catch (err: any) {
      console.error('Login error', err);
      setError(err.message || '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F1117] p-4">
      <Card className="w-full max-w-md p-8 bg-[#141820] border-slate-800">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-100 mb-2">Welcome Back</h1>
          <p className="text-slate-400 text-sm">알고리즘 문제 풀이 플랫폼에 오신 것을 환영합니다.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-400">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); clearOauthError(); }}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="name@example.com"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-400">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); clearOauthError(); }}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="••••••••"
              />
            </div>
          </div>

          {(error || oauthError) && (
            <p className="text-sm text-red-400">{error || oauthError}</p>
          )}

          <Button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 py-2.5">
            {loading ? '로그인 중...' : 'Log In'}
          </Button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800"></div></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-[#141820] px-2 text-slate-500">Or continue with</span></div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <a
            href="/oauth2/authorization/google"
            className="flex items-center justify-center gap-2 bg-slate-900 border border-slate-800 rounded-lg py-2 text-sm text-slate-300 hover:bg-slate-800 transition-colors"
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

        <div className="mt-6 text-center text-sm text-slate-400">
          Don't have an account?{' '}
          <button onClick={() => navigate('/signup')} className="text-emerald-500 hover:text-emerald-400 font-medium">
            Sign Up
          </button>
        </div>
      </Card>
    </div>
  );
};
