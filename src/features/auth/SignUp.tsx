import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSetRecoilState } from 'recoil';
import { userState } from '@/store/atoms';
import { signupApi } from '@/api/auth';
import { Button, Card } from '@/components/ui/Base';
import { Mail, Lock, User, AlertCircle, CheckCircle2 } from 'lucide-react';

export const SignUp = () => {
  const navigate = useNavigate();
  const setUser = useSetRecoilState(userState);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nickname: ''
  });
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (name: string, value: string) => {
    if (name === 'password') {
      return value.length < 8 ? 'Password must be at least 8 characters' : '';
    }
    if (name === 'email') {
      return !value.includes('@') ? 'Invalid email address' : '';
    }
    return '';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    const error = validate(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
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
      const { accessToken, refreshToken, user } = result.data;

      // Decode JWT to get user info fallback
      let name = formData.nickname;
      try {
        const payload = JSON.parse(atob(accessToken.split('.')[1]));
        name = payload.name || formData.nickname;
      } catch (e) {
        // ignore jwt parse error
      }

      const userData = {
        isLoggedIn: true,
        name: user?.name || name,
        email: user?.email || formData.email,
        avatar: user?.avatar || '',
        accessToken,
        refreshToken
      };

      // Save to local storage
      localStorage.setItem('auth', JSON.stringify(userData));

      // Update Recoil state immediately
      setUser(userData);

      navigate('/');
    } catch (err: any) {
      console.error('Signup error', err);
      setApiError(err.message || '회원가입에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F1117] p-4">
      <Card className="w-full max-w-md p-8 bg-[#141820] border-slate-800">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-100 mb-2">Create Account</h1>
          <p className="text-slate-400 text-sm">Join our community of developers.</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-400">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full bg-slate-900 border ${errors.email ? 'border-red-500' : 'border-slate-800'} rounded-lg py-2.5 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors`}
                placeholder="name@example.com"
              />
            </div>
            {errors.email && <div className="text-xs text-red-500 flex items-center gap-1 mt-1"><AlertCircle className="w-3 h-3" /> {errors.email}</div>}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-400">Nickname</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                name="nickname"
                value={formData.nickname}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="DevMaster"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-400">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full bg-slate-900 border ${errors.password ? 'border-red-500' : 'border-slate-800'} rounded-lg py-2.5 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors`}
                placeholder="••••••••"
              />
            </div>

            {/* Password Validation Feedback Area */}
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className={`text-xs flex items-center gap-1 ${formData.password.length >= 8 ? 'text-emerald-500' : 'text-slate-600'}`}>
                <CheckCircle2 className="w-3 h-3" /> 8+ Characters
              </div>
              <div className={`text-xs flex items-center gap-1 ${/[0-9]/.test(formData.password) ? 'text-emerald-500' : 'text-slate-600'}`}>
                <CheckCircle2 className="w-3 h-3" /> Number
              </div>
            </div>
          </div>

          {apiError && <p className="text-sm text-red-400">{apiError}</p>}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 py-2.5 mt-2"
          >
            {loading ? '가입 중...' : 'Sign Up'}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{' '}
          <button onClick={() => navigate('/login')} className="text-emerald-500 hover:text-emerald-400 font-medium">
            Log In
          </button>
        </div>
      </Card>
    </div>
  );
};
