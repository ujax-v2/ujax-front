import React, { useState } from 'react';
import { useSetRecoilState } from 'recoil';
import { navigationState, userState } from '../../store/atoms';
import { Button, Card } from '../../components/ui/Base';
import { Mail, Lock, Github, MessageCircle } from 'lucide-react';

export const Login = () => {
  const setPage = useSetRecoilState(navigationState);
  const setUser = useSetRecoilState(userState);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    // Simulate login
    setUser({
      isLoggedIn: true,
      name: '지훈 성',
      email: email,
      avatar: 'Felix',
    });
    setPage('dashboard');
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
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="name@example.com"
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between">
              <label className="text-xs font-medium text-slate-400">Password</label>
              <button type="button" className="text-xs text-emerald-500 hover:text-emerald-400">Forgot Password?</button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="••••••••"
              />
            </div>
          </div>

          <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 py-2.5">
            Log In
          </Button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800"></div></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-[#141820] px-2 text-slate-500">Or continue with</span></div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button className="flex items-center justify-center gap-2 bg-slate-900 border border-slate-800 rounded-lg py-2 text-sm text-slate-300 hover:bg-slate-800 transition-colors">
            <Github className="w-4 h-4" /> Google
          </button>
          <button className="flex items-center justify-center gap-2 bg-[#FEE500] border border-[#FEE500] rounded-lg py-2 text-sm text-black hover:opacity-90 transition-opacity">
            <MessageCircle className="w-4 h-4 fill-current" /> Kakao
          </button>
        </div>

        <div className="mt-6 text-center text-sm text-slate-400">
          Don't have an account?{' '}
          <button onClick={() => setPage('signup')} className="text-emerald-500 hover:text-emerald-400 font-medium">
            Sign Up
          </button>
        </div>
      </Card>
    </div>
  );
};
