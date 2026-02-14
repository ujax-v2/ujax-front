import { useRef, useEffect } from 'react';
import { useSetRecoilState } from 'recoil';
import { useNavigate } from 'react-router-dom';
import { userState } from '@/store/atoms';

interface Props {
  onComplete?: (error?: string) => void;
}

export const OAuthCallback = ({ onComplete }: Props) => {
  const setUser = useSetRecoilState(userState);
  const navigate = useNavigate();
  // Use a ref to prevent double execution in strict mode
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    const params = new URLSearchParams(window.location.search);

    // 백엔드에서 에러를 보낸 경우
    const error = params.get('error');
    const message = params.get('message');
    if (error) {
      if (onComplete) {
        onComplete(message ? decodeURIComponent(message) : error);
      } else {
        navigate('/login', { replace: true });
      }
      return;
    }

    // 토큰이 있는 경우 (성공)
    const accessToken = params.get('accessToken');
    const refreshToken = params.get('refreshToken');
    if (accessToken && refreshToken) {
      try {
        const payload = JSON.parse(atob(accessToken.split('.')[1]));
        const name = payload.name || '';
        const email = payload.email || '';
        localStorage.setItem('auth', JSON.stringify({ accessToken, refreshToken, name, email }));
        setUser({ isLoggedIn: true, name, email, avatar: name, accessToken, refreshToken });

        navigate('/', { replace: true });
        if (onComplete) onComplete();
      } catch {
        navigate('/login', { replace: true });
      }
    } else {
      navigate('/login', { replace: true });
    }
  }, []);

  return null;
};
