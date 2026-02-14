import React, { useState } from 'react';
import { useSetRecoilState } from 'recoil';
import { useNavigate } from 'react-router-dom';
import { userState } from '../../store/atoms';
import { loginApi } from '../../api/auth';
import { Button, Card } from '../../components/ui/Base';
import { Mail, Lock, Github, MessageCircle } from 'lucide-react';

interface LoginProps {
  oauthError?: string;
  onClearError?: () => void;
}

export const Login = ({ oauthError, onClearError }: LoginProps) => {
  const navigate = useNavigate();
  const setUser = useSetRecoilState(userState);
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
      const { accessToken, refreshToken, user } = result.data;

      // Decode JWT to get user info fallback
      let name = email;
      try {
        const payload = JSON.parse(atob(accessToken.split('.')[1]));
        name = payload.name || email;
      } catch (e) {
        // ignore jwt parse error if any
      }

      const userData = {
        isLoggedIn: true,
        name: user?.name || name,
        email: user?.email || email,
        avatar: user?.avatar || '',
        accessToken,
        refreshToken
      };

      // Save to local storage
      localStorage.setItem('auth', JSON.stringify(userData));

      // Update Recoil state immediately
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
            <Github className="w-4 h-4" /> Google
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
