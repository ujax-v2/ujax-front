import { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface Props {
  onComplete?: (error?: string) => void;
}

export const OAuthCallback = ({ onComplete }: Props) => {
  const { setAuthUser } = useAuth();
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
        const errorMsg = message ? decodeURIComponent(message) : error;
        navigate(`/login?oauthError=${encodeURIComponent(errorMsg)}`, { replace: true });
      }
      return;
    }

    // 토큰이 있는 경우 (성공)
    const accessToken = params.get('accessToken');
    const refreshToken = params.get('refreshToken');
    if (accessToken && refreshToken) {
      (async () => {
        try {
          await setAuthUser(accessToken, refreshToken);
          navigate('/', { replace: true });
          if (onComplete) onComplete();
        } catch {
          navigate('/login', { replace: true });
        }
      })();
    } else {
      navigate('/login', { replace: true });
    }
  }, []);

  return null;
};
